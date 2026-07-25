import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { IconProvider, ThemeProvider } from '@momentum-design/components/react';
import { ThemeModeProvider, useThemeMode } from '../../app/ThemeContext';
import { publicAssetUrl } from '../../app/publicAsset';
import { AgentHeader } from '../../components/agents';
import { Badge, Banner, Button, Card, CardBody, CardHeader, Divider, MenuItem, MenuOverlay, Modal, ModalBody, ModalHeader, TextLink, useMenu } from '../../components/shared';
import Dropdown from '../../components/shared/Dropdown';
import ConfigurationCategoryIcon, { type ConfigurationCategory } from '../../components/shared/ConfigurationCategoryIcon';
import { useApp, type Agent } from '../../contexts/AppContext';
import { useDesignVariation } from '../../contexts/DesignVariationContext';
import { getElevenLabsConversationSignedUrl, getVoicePreviewErrorMessage } from '../../api/ciscoAi';
import { getCiscoLiveActionMetric, getCiscoLiveGuardrailTriggerCount, getCiscoLiveObservability, getCiscoLiveSessionLocator } from '../../demo/ciscoLiveDemo';
import {
  buildInstructionPrompt,
  buildWelcomeMessage,
  EVA_ADVANCED_GUARDRAIL_GROUPS,
  EVA_AUTO_START_VOICE_PREVIEW_KEY,
  EVA_SESSION_STORAGE_KEY,
  EVA_STANDARD_GUARDRAILS,
  readEvaSessionState,
  type EvaConversationStep,
} from '../../features/eva/evaFormConfig';
import { EVA_TEMPLATES } from '../../features/eva/evaTemplates';
import { clusKpiAgentObservabilityHashSegment } from '../../features/clus-kpi-dashboard/agentHashNavigation';
import { KPICard } from '../../features/clus-kpi-dashboard/components/KPICard';
import { KPIChart } from '../../features/clus-kpi-dashboard/components/KPIChart';
import { kpiData } from '../../features/clus-kpi-dashboard/components/kpiData';
import { kpiExpandedChartAxisProps } from '../../features/clus-kpi-dashboard/kpiChartAxis';
import { buildObservabilityKpiDataset } from '../../features/clus-kpi-dashboard/kpiThresholdPresentation';
import { loadObservabilityConfiguration } from '../../features/clus-kpi-dashboard/observabilityConfiguration';
import {
  FAMILY_METADATA,
  getActionableStoredRecommendations,
  getRankedRecommendations,
  type AgentDraft,
  type AgentCreationSection,
  type AgentFamily,
  type AgentLifecycle,
} from '../../features/agent-creation/agentCreationModel';
import { Icon } from '../../icons';
import { buildProjectPath } from '../../projects/project-routing';
import { useProjects } from '../../projects/useProjects';

type PreviewCallStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'paused' | 'ended' | 'error';

function EmbeddedObservabilityProviders({ children }: { children: ReactNode }) {
  const { themeClass } = useThemeMode();

  return (
    <ThemeProvider themeclass={themeClass}>
      <IconProvider
        iconSet="custom-icons"
        url={publicAssetUrl('icons').replace(/\/$/, '')}
        fileExtension="svg"
      >
        {children}
      </IconProvider>
    </ThemeProvider>
  );
}

type PreviewTranscriptEntry = {
  id: string;
  role: 'customer' | 'agent';
  text: string;
  timestamp: string;
  timeLabel: string;
};

type PreviewSocketMessage = {
  type?: string;
  audio_event?: { audio_base_64?: string };
  ping_event?: { event_id?: number };
  conversation_initiation_metadata_event?: {
    conversation_id?: string;
    agent_output_audio_format?: string;
  };
  agent_response_event?: {
    agent_response?: string;
  };
  agent_response_correction_event?: {
    corrected_agent_response?: string;
    agent_response?: string;
  };
  user_transcription_event?: {
    user_transcript?: string;
  };
};

type StudioStep = {
  id: string;
  title: string;
  description: string;
  section: string;
  guidedStep: EvaConversationStep;
  icon: 'bot-customer-assistant' | 'bookmark' | 'document' | 'files' | 'tools' | 'shield' | 'play' | 'phone';
};

const studioSteps: StudioStep[] = [
  {
    id: 'instructions',
    title: "Ground agent's behavior",
    description: 'Review the role, goals, tone, and escalation guidance before customers use it.',
    section: 'Instructions',
    guidedStep: 'instructions',
    icon: 'bot-customer-assistant',
  },
  {
    id: 'knowledge',
    title: 'Stay accurate with Knowledge',
    description: 'Check the sources the agent can use so responses stay accurate and on policy.',
    section: 'Knowledge',
    guidedStep: 'knowledge',
    icon: 'bookmark',
  },
  {
    id: 'actions',
    title: 'Execute with tools',
    description: 'Review the tools the agent can call when it needs to look up data or complete a task.',
    section: 'Action',
    guidedStep: 'actions',
    icon: 'tools',
  },
  {
    id: 'security',
    title: 'Add guardrails',
    description: 'Set boundaries for privacy, escalation, and safe behavior before publishing.',
    section: 'Security',
    guidedStep: 'security',
    icon: 'shield',
  },
  {
    id: 'testing',
    title: 'Evaluation agent performance',
    description: 'Run readiness checks and realistic scenarios to validate quality before launch.',
    section: 'Testing',
    guidedStep: 'testing',
    icon: 'play',
  },
];

const recommendationStepForSection = (section: AgentCreationSection): Pick<StudioStep, 'guidedStep' | 'icon' | 'section'> => {
  if (section === 'knowledge') return { guidedStep: 'knowledge', icon: 'bookmark', section: 'Knowledge' };
  if (section === 'actions') return { guidedStep: 'actions', icon: 'tools', section: 'Actions' };
  if (section === 'security' || section === 'audit') return { guidedStep: 'security', icon: 'shield', section: 'Security' };
  if (section === 'testing' || section === 'preview' || section === 'observability') {
    return { guidedStep: 'testing', icon: 'play', section: 'Testing' };
  }
  if (section === 'channels' || section === 'voice' || section === 'external' || section === 'deployment') {
    return { guidedStep: 'channels', icon: 'phone', section: section === 'external' || section === 'deployment' ? 'External' : 'Channels' };
  }
  if (section === 'instructions') return { guidedStep: 'instructions', icon: 'bot-customer-assistant', section: 'Instructions' };
  return { guidedStep: 'profile', icon: 'document', section: 'Profile' };
};

function getRecommendedStudioSteps(draft?: AgentDraft): StudioStep[] {
  if (!draft) return studioSteps.slice(0, 3);
  const recommendationSource = draft.recommendationsStale
    ? getActionableStoredRecommendations(draft)
    : getRankedRecommendations(draft);
  const recommendations = recommendationSource
    .filter(recommendation => !draft.dismissedRecommendationIds.includes(recommendation.id))
    .slice(0, 3);
  if (recommendations.length === 0) return studioSteps.slice(0, 3);

  return recommendations.map(recommendation => {
    const normalizedTargetSection =
      draft.family === 'contact_center' && recommendation.targetSection === 'handoff'
        ? 'actions'
        : recommendation.targetSection;
    const target = recommendationStepForSection(normalizedTargetSection);
    const requirement = recommendation.requirement === 'external' ? 'External' : 'Recommended';
    return {
      id: recommendation.id,
      title: recommendation.title,
      description: `${recommendation.reason} Benefit: ${recommendation.benefit}`,
      section: `${requirement} · ${target.section}`,
      guidedStep: target.guidedStep,
      icon: target.icon,
    };
  });
}

const familyBadgeVariant = (family: AgentFamily) => {
  if (family === 'calling') return 'warning' as const;
  if (family === 'contact_center') return 'success' as const;
  return 'info' as const;
};

const lifecycleLabel = (lifecycle: AgentLifecycle, version: number) => {
  if (lifecycle === 'draft') return 'Draft';
  if (lifecycle === 'published') return `Published version ${version}`;
  if (lifecycle === 'deployed') return `Version ${version} deployed`;
  return `Version ${version} live`;
};

const lifecycleStatusLabel = (lifecycle: AgentLifecycle) => {
  if (lifecycle === 'draft') return 'Draft';
  if (lifecycle === 'published') return 'Published';
  if (lifecycle === 'deployed') return 'Deployed';
  return 'Live';
};

const OPERATIONAL_KPI_IDS = [
  'ap-intent-success-rate',
  'aq-goal-completion-rate',
  'sec-policy-violation-guardrail-block-rate',
  'bi-autocsat-improvement',
] as const;

const operationalKpisForAgent = (agentName: string) => buildObservabilityKpiDataset(
  kpiData,
  '24h',
  loadObservabilityConfiguration(agentName),
)
  .filter(metric => OPERATIONAL_KPI_IDS.includes(metric.id as (typeof OPERATIONAL_KPI_IDS)[number]))
  .sort((left, right) => OPERATIONAL_KPI_IDS.indexOf(left.id as (typeof OPERATIONAL_KPI_IDS)[number])
    - OPERATIONAL_KPI_IDS.indexOf(right.id as (typeof OPERATIONAL_KPI_IDS)[number]));

const OPERATIONAL_HEALTH = {
  score: 92,
  target: 85,
  gap: 7,
  signals: 7,
} as const;

interface OperationalHealthMetric {
  id: string;
  label: string;
  value: string;
  change: string;
}

const HEALTH_GAUGE_RADIUS = 52;
const HEALTH_GAUGE_CIRCUMFERENCE = 2 * Math.PI * HEALTH_GAUGE_RADIUS;
const HEALTH_GAUGE_TRACK = HEALTH_GAUGE_CIRCUMFERENCE * 0.75;
const HEALTH_GAUGE_VALUE = HEALTH_GAUGE_TRACK * (OPERATIONAL_HEALTH.score / 100);

const OPERATIONAL_HEALTH_METRICS: OperationalHealthMetric[] = [
  { id: 'knowledge-coverage', label: 'Knowledge coverage', value: '94.8%', change: '+4.6%' },
  { id: 'guardrails-trigger-flag', label: 'Guardrails trigger flag', value: '0.8%', change: '-0.7%' },
  { id: 'containment-rate', label: 'Containment rate', value: '91.6%', change: '+5.2%' },
  { id: 'action-intent-success-rate', label: 'Action/intent success rate', value: '97.8%', change: '+2.4%' },
  { id: 'autocsat-improvement', label: 'AutoCSAT improvement', value: '8.6%', change: '+3.4%' },
  { id: 'csat-predictor', label: 'CSAT predictor (AutoCSAT)', value: '4.7/5', change: '+8.1%' },
  { id: 'fulfilment-latency-p95', label: 'Fulfilment latency P95', value: '1,240ms', change: '-18%' },
];

const capabilitySelectionLabels = (draft: AgentDraft | undefined, capabilityId: string): string[] => {
  const values = draft?.familyConfiguration[capabilityId]?.values;
  const selections = values?.selections;
  return Array.isArray(selections)
    ? selections.filter((selection): selection is string => typeof selection === 'string' && Boolean(selection.trim()))
    : [];
};

const configuredCapabilityLabels = (
  draft: AgentDraft | undefined,
  capabilityId: string,
  fallbackLabels: string[] = [],
): string[] => {
  const capability = draft?.familyConfiguration[capabilityId];
  if (capability?.progress !== 'configured') return [];
  const selections = capabilitySelectionLabels(draft, capabilityId);
  if (selections.length > 0) return selections;
  if (fallbackLabels.length > 0) return fallbackLabels;
  return [capability.label];
};

function getConfiguredSummary(agent: Agent, draft?: AgentDraft) {
  const knowledgeBases = agent.knowledgeBases ?? [];
  const actionSelections = draft?.familyConfiguration.actions?.values?.selections;
  const actions = Array.isArray(actionSelections)
    ? actionSelections.filter((selection): selection is string => typeof selection === 'string')
    : [];
  const connectedPhone = draft?.deploymentReferences.find(
    reference => reference.kind === 'phone_number' && reference.status === 'connected',
  );
  const isRetailReceptionist = agent.name.toLowerCase().includes('acme electronics');

  return {
    endpoint: draft ? connectedPhone?.label : '+1 629 263 5773',
    aiEngine: 'Webex AI Pro 1.0',
    actions: draft
      ? actions
      : isRetailReceptionist
      ? ['Inventory lookup', 'Create support case']
      : ['Starter action set'],
    knowledgeBases,
  };
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function downsampleTo16Khz(input: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === 16000) return input;
  const ratio = inputSampleRate / 16000;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), input.length);
    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j += 1) {
      sum += input[j];
      count += 1;
    }
    output[i] = count > 0 ? sum / count : 0;
  }
  return output;
}

function float32ToPcm16Base64(input: Float32Array): string {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return arrayBufferToBase64(buffer);
}

function getPreviewTimeLabel() {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date());
}

export default function AgentStudioLanding() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { currentProjectId } = useProjects();
  const {
    agents,
    agentDrafts,
    duplicateAgentAs,
    publishAgentVersion,
    selectAgent,
    showToast,
  } = useApp();
  const { setVariation } = useDesignVariation();
  const duplicateMenu = useMenu();
  const agent = agentId ? agents[agentId] : null;
  const [previewCallStatus, setPreviewCallStatus] = useState<PreviewCallStatus>('idle');
  const [previewCallError, setPreviewCallError] = useState('');
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [previewInteractionEnded, setPreviewInteractionEnded] = useState(false);
  const [previewWidgetOpen, setPreviewWidgetOpen] = useState(false);
  const [operationalTimeRange, setOperationalTimeRange] = useState('6h');
  const [previewSessionId, setPreviewSessionId] = useState('');
  const [previewTranscript, setPreviewTranscript] = useState<PreviewTranscriptEntry[]>([]);
  const [previewPaused, setPreviewPaused] = useState(false);
  const [activeObservabilityKpiId, setActiveObservabilityKpiId] = useState<string | null>(null);
  const previewCallStatusRef = useRef<PreviewCallStatus>('idle');
  const previewWsRef = useRef<WebSocket | null>(null);
  const previewAudioContextRef = useRef<AudioContext | null>(null);
  const previewInputAudioContextRef = useRef<AudioContext | null>(null);
  const previewInputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const previewScriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const previewMicStreamRef = useRef<MediaStream | null>(null);
  const previewOutputFormatRef = useRef('pcm_16000');
  const previewPlaybackTimeRef = useRef(0);
  const previewSpeakingTimerRef = useRef<number | null>(null);
  const previewGreetingFallbackTimerRef = useRef<number | null>(null);
  const previewTranscriptRef = useRef<HTMLDivElement | null>(null);
  const previewInteractionStartedRef = useRef(false);
  const previewConversationReadyRef = useRef(false);
  const previewInitialGreetingPendingRef = useRef(false);
  const previewMicStreamingEnabledRef = useRef(false);
  const previewPausedRef = useRef(false);
  const previewConnectionTimerRef = useRef<number | null>(null);

  if (!agentId || !agent) {
    return <Navigate to="/agents" replace />;
  }

  const agentDraft = agentDrafts[agent.id];
  const family = agentDraft?.family ?? agent.family;
  const lifecycle = agentDraft?.lifecycle ?? agent.lifecycle ?? 'draft';
  const version = agentDraft?.version ?? agent.version ?? 1;
  const familyName = family ? FAMILY_METADATA[family].label : 'Agent family not assigned';
  // The header chip shows the agent-type name; contact_center is presented as
  // "CX Concierge" to match the label used on the /agents cards.
  const familyBadgeLabel = family
    ? family === 'contact_center'
      ? 'CX Concierge'
      : FAMILY_METADATA[family].label
    : familyName;
  const summary = getConfiguredSummary(agent, agentDraft);
  const recommendedStudioSteps = getRecommendedStudioSteps(agentDraft);
  const existingEvaSession = readEvaSessionState();
  const phoneNumberDeferred = Boolean(
    existingEvaSession?.phoneNumberDeferred && existingEvaSession.agentName === agent.name,
  );
  const goToSection = (section: string) => {
    selectAgent(agent.id);
    navigate(`/agents/${agent.id}/configure?section=${section}`);
  };

  /* Overview "smarter" cards deep-link into the agent side navigation
     (configuration sections or the Testing monitor) rather than reopening the
     retired guided chat flow. Normalizes recommendation section names to the
     ?section= values ActionConfigureV2 understands. */
  const openStep = (step: StudioStep) => {
    selectAgent(agent.id);
    if (step.section === 'Testing') {
      navigate(`/agents/${agent.id}/analytics`);
      return;
    }
    const section =
      step.section === 'Actions'
        ? 'Action'
        : step.section === 'External'
          ? 'Channels'
          : step.section;
    navigate(`/agents/${agent.id}/configure?section=${section}`);
  };

  const openGuidedSetup = (targetStep?: EvaConversationStep, options: { autoStartPreview?: boolean } = {}) => {
    const baseDraft = EVA_TEMPLATES.find(template => template.id === 'customer-support')?.draft ?? EVA_TEMPLATES[0].draft;
    const nextDraft = {
      ...baseDraft,
      name: agent.name,
      description: agent.description,
      goals: [agent.description || `Help customers with ${agent.name.toLowerCase()}`],
    };
    const existing = readEvaSessionState();
    const sessionMatchesAgent = existing?.agentName === agent.name;
    const channelValues = agentDraft?.familyConfiguration.channels?.values;
    const storedChannels = Array.isArray(channelValues?.selectedChannels)
      ? channelValues.selectedChannels.filter(
          (channel): channel is 'voice' | 'digital' | 'video' =>
            channel === 'voice' || channel === 'digital' || channel === 'video',
        )
      : [];
    const configuredChannels = storedChannels.length > 0
      ? storedChannels
      : sessionMatchesAgent && existing?.selectedChannels?.length
        ? existing.selectedChannels
        : ['voice'];
    const primaryChannel = configuredChannels.includes('voice') ? 'voice' : 'digital';
    const storedGreetings = channelValues?.greetings && typeof channelValues.greetings === 'object'
      ? channelValues.greetings as Record<string, unknown>
      : {};
    const configuredGreeting = typeof storedGreetings[primaryChannel] === 'string'
      ? storedGreetings[primaryChannel]
      : typeof storedGreetings.voice === 'string'
        ? storedGreetings.voice
        : typeof storedGreetings.digital === 'string'
          ? storedGreetings.digital
          : '';
    const restoredWelcomeMessage = sessionMatchesAgent
      ? existing?.welcomeMessage
      : configuredGreeting || buildWelcomeMessage(nextDraft);
    const restoredInstructions = sessionMatchesAgent
      ? existing?.instructionPrompt
      : agentDraft?.instructions.content || buildInstructionPrompt(nextDraft);
    const restoredDigitalChannels = Array.isArray(channelValues?.digitalChannels)
      ? channelValues.digitalChannels.filter((channel): channel is 'chat' | 'email' | 'messaging' =>
          channel === 'chat' || channel === 'email' || channel === 'messaging')
      : [];

    try {
      window.sessionStorage.setItem(EVA_SESSION_STORAGE_KEY, JSON.stringify({
        ...existing,
        configurationMode: 'edit',
        landingMode: 'build',
        selectedTemplateId: existing?.selectedTemplateId ?? 'customer-support',
        draft: existing?.draft?.name === agent.name ? existing.draft : nextDraft,
        messages: existing?.messages ?? [],
        guidanceVisible: true,
        orchestrationSuggested: false,
        freeChatActive: false,
        conversationalOnboardingStep: 'idle',
        evaStep: targetStep ?? (sessionMatchesAgent ? existing?.evaStep : 'instructions'),
        agentName: agent.name,
        agentDescription: agent.description,
        avatarUrl: existing?.avatarUrl ?? 'https://us.webexbotbuilder.com/static/assets/i...',
        timezone: existing?.timezone ?? 'America/Los_Angeles',
        aiEngine: existing?.aiEngine ?? 'Webex AI Pro 1.0',
        welcomeMessage: restoredWelcomeMessage,
        instructionPrompt: restoredInstructions,
        selectedKnowledgeBases: agent.knowledgeBases ?? existing?.selectedKnowledgeBases ?? nextDraft.knowledgeBases.slice(0, 2).map(kb => kb.name),
        selectedActions: existing?.selectedActions ?? getConfiguredSummary(agent, agentDraft).actions,
        optimizeAccepted: existing?.optimizeAccepted ?? false,
        preOptimizeText: existing?.preOptimizeText ?? '',
        optimizeSummary: existing?.optimizeSummary ?? { changes: [], reasoning: [] },
        securityTier: existing?.securityTier ?? 'standard',
        channelType: sessionMatchesAgent ? existing?.channelType ?? primaryChannel : primaryChannel,
        selectedChannels: configuredChannels,
        digitalChannel: sessionMatchesAgent
          ? existing?.digitalChannel ?? restoredDigitalChannels[0] ?? 'chat'
          : restoredDigitalChannels[0] ?? 'chat',
        selectedDigitalChannels: sessionMatchesAgent
          ? existing?.selectedDigitalChannels ?? restoredDigitalChannels
          : restoredDigitalChannels,
        digitalChannelAddress: existing?.digitalChannelAddress ?? '',
        channelPhoneNumber: existing?.channelPhoneNumber ?? getConfiguredSummary(agent, agentDraft).endpoint ?? '',
        phoneNumberDeferred,
        standardGuardrails: existing?.standardGuardrails ?? EVA_STANDARD_GUARDRAILS,
        advancedGuardrailGroups: existing?.advancedGuardrailGroups ?? EVA_ADVANCED_GUARDRAIL_GROUPS,
        expandedAdvancedGroups: existing?.expandedAdvancedGroups ?? EVA_ADVANCED_GUARDRAIL_GROUPS.map(group => group.id),
        personality: existing?.personality ?? {
          llm: 'Webex AI Pro 1.0',
          voice: 'ava',
          language: 'en-US',
          gender: 'neutral',
        },
        customRules: existing?.customRules ?? [],
        selectedAgentFamily: family ?? existing?.selectedAgentFamily ?? null,
        familyIntakeAnswers: existing?.familyIntakeAnswers ?? {},
        familyProposal: agentDraft ? {
          name: agentDraft.basics.name,
          purpose: agentDraft.basics.purpose,
          description: agentDraft.basics.description,
          language: agentDraft.language.defaultLanguage,
          instructions: agentDraft.instructions.content,
          selectedChannels: configuredChannels,
          greeting: restoredWelcomeMessage,
          greetings: {
            voice: typeof storedGreetings.voice === 'string' ? storedGreetings.voice : restoredWelcomeMessage,
            digital: typeof storedGreetings.digital === 'string' ? storedGreetings.digital : restoredWelcomeMessage,
          },
        } : existing?.familyProposal ?? null,
        familyProposalApplied: Boolean(agentDraft) || existing?.familyProposalApplied,
        activeDraftAgentId: agentDraft?.id ?? existing?.activeDraftAgentId ?? null,
      }));
      if (options.autoStartPreview) {
        window.sessionStorage.setItem(EVA_AUTO_START_VOICE_PREVIEW_KEY, '1');
      }
    } catch {
      /* If storage is unavailable, still navigate to the guided setup shell. */
    }

    selectAgent(agent.id);
    setVariation('landing');
    navigate('/agents');
  };

  const handleDuplicateAs = (targetFamily: AgentFamily) => {
    duplicateMenu.close();
    const duplicatedAgent = duplicateAgentAs(agent.id, targetFamily);
    if (!duplicatedAgent) {
      showToast(`Could not duplicate as ${FAMILY_METADATA[targetFamily].label}.`, 'error');
      return;
    }
    showToast(
      `Created a separate ${FAMILY_METADATA[targetFamily].label} draft. Incompatible settings were reset.`,
      'success',
    );
    navigate(`/agents/${duplicatedAgent.id}/studio`);
  };

  const handlePublishVersion = () => {
    const publishedDraft = publishAgentVersion(agent.id);
    if (!publishedDraft) {
      showToast('Complete the required profile fields before publishing.', 'error');
      return;
    }

    showToast(
      `Published version ${publishedDraft.version}. Deployment and live traffic remain separate.`,
      'success',
    );
  };

  const stopPreviewCall = (nextStatus: PreviewCallStatus = 'ended') => {
    if (previewConnectionTimerRef.current) {
      window.clearTimeout(previewConnectionTimerRef.current);
      previewConnectionTimerRef.current = null;
    }
    if (previewSpeakingTimerRef.current) {
      window.clearTimeout(previewSpeakingTimerRef.current);
      previewSpeakingTimerRef.current = null;
    }
    if (previewGreetingFallbackTimerRef.current) {
      window.clearTimeout(previewGreetingFallbackTimerRef.current);
      previewGreetingFallbackTimerRef.current = null;
    }
    const ws = previewWsRef.current;
    previewWsRef.current = null;
    previewConversationReadyRef.current = false;
    previewInitialGreetingPendingRef.current = false;
    previewMicStreamingEnabledRef.current = false;
    previewPausedRef.current = false;
    setPreviewPaused(false);
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close();
    }
    previewScriptProcessorRef.current?.disconnect();
    previewScriptProcessorRef.current = null;
    previewInputSourceRef.current?.disconnect();
    previewInputSourceRef.current = null;
    previewMicStreamRef.current?.getTracks().forEach(track => track.stop());
    previewMicStreamRef.current = null;
    if (previewInputAudioContextRef.current && previewInputAudioContextRef.current.state !== 'closed') {
      void previewInputAudioContextRef.current.close();
    }
    previewInputAudioContextRef.current = null;
    if (previewAudioContextRef.current && previewAudioContextRef.current.state !== 'closed') {
      void previewAudioContextRef.current.close();
    }
    previewAudioContextRef.current = null;
    previewPlaybackTimeRef.current = 0;
    if ((nextStatus === 'ended' || nextStatus === 'error') && previewInteractionStartedRef.current) {
      setPreviewInteractionEnded(true);
    }
    previewCallStatusRef.current = nextStatus;
    setPreviewCallStatus(nextStatus);
  };

  const appendPreviewTranscript = (role: PreviewTranscriptEntry['role'], text?: string) => {
    const normalizedText = text?.trim();
    if (!normalizedText) return;

    setPreviewTranscript(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === role && last.text === normalizedText) {
        return prev;
      }

      return [
        ...prev,
        {
          id: `${role}-${Date.now()}-${prev.length}`,
          role,
          text: normalizedText,
          timestamp: new Date().toISOString(),
          timeLabel: getPreviewTimeLabel(),
        },
      ];
    });
  };

  const togglePreviewPause = () => {
    if (!previewWsRef.current || previewCallStatus === 'idle' || previewCallStatus === 'ended' || previewCallStatus === 'error') {
      return;
    }

    const nextPaused = !previewPausedRef.current;
    previewPausedRef.current = nextPaused;
    setPreviewPaused(nextPaused);

    if (nextPaused) {
      previewCallStatusRef.current = 'paused';
      setPreviewCallStatus('paused');
      return;
    }

    previewCallStatusRef.current = 'listening';
    setPreviewCallStatus('listening');
  };

  const playPreviewAudioChunk = (audioBase64: string) => {
    if (!audioBase64) return;

    const audioContext = previewAudioContextRef.current ?? new AudioContext();
    previewAudioContextRef.current = audioContext;
    const rawBuffer = base64ToArrayBuffer(audioBase64);
    const format = previewOutputFormatRef.current || 'pcm_16000';
    const sampleRateMatch = format.match(/_(\d+)/);
    const sampleRate = sampleRateMatch ? Number(sampleRateMatch[1]) : 16000;

    const scheduleAudioBuffer = (audioBuffer: AudioBuffer) => {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      const startTime = Math.max(audioContext.currentTime, previewPlaybackTimeRef.current);
      source.start(startTime);
      previewPlaybackTimeRef.current = startTime + audioBuffer.duration;
      previewCallStatusRef.current = 'speaking';
      setPreviewCallStatus('speaking');

      if (previewSpeakingTimerRef.current) {
        window.clearTimeout(previewSpeakingTimerRef.current);
      }
      const remainingMs = Math.max(0, (previewPlaybackTimeRef.current - audioContext.currentTime) * 1000);
      previewSpeakingTimerRef.current = window.setTimeout(() => {
        previewSpeakingTimerRef.current = null;
        if (previewWsRef.current) {
          if (previewInitialGreetingPendingRef.current) {
            previewInitialGreetingPendingRef.current = false;
            previewMicStreamingEnabledRef.current = true;
          }
          previewCallStatusRef.current = previewPausedRef.current ? 'paused' : 'listening';
          setPreviewCallStatus(previewPausedRef.current ? 'paused' : 'listening');
        }
      }, remainingMs + 160);
    };

    const playPcm = () => {
      const pcm = new Int16Array(rawBuffer);
      const audioBuffer = audioContext.createBuffer(1, pcm.length, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < pcm.length; i += 1) {
        channelData[i] = pcm[i] / 0x8000;
      }
      scheduleAudioBuffer(audioBuffer);
    };

    if (format.startsWith('pcm_')) {
      playPcm();
      return;
    }

    audioContext.decodeAudioData(rawBuffer.slice(0))
      .then(scheduleAudioBuffer)
      .catch(playPcm);
  };

  const startPreviewCall = async () => {
    if (previewCallStatus === 'connecting' || previewCallStatus === 'listening' || previewCallStatus === 'speaking') return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setPreviewCallError('Microphone is not available in this browser.');
      previewCallStatusRef.current = 'error';
      setPreviewCallStatus('error');
      return;
    }

    setPreviewCallError('');
    previewCallStatusRef.current = 'connecting';
    setPreviewCallStatus('connecting');
    setPreviewInteractionEnded(false);
    setPreviewTranscript([]);
    setPreviewSessionId('');
    previewInteractionStartedRef.current = false;
    previewConversationReadyRef.current = false;
    previewInitialGreetingPendingRef.current = true;
    previewMicStreamingEnabledRef.current = false;
    previewPausedRef.current = false;
    setPreviewPaused(false);

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const signedUrl = await getElevenLabsConversationSignedUrl();
      const ws = new WebSocket(signedUrl);
      previewWsRef.current = ws;
      previewMicStreamRef.current = micStream;
      previewConnectionTimerRef.current = window.setTimeout(() => {
        if (previewWsRef.current !== ws || previewCallStatusRef.current === 'error') return;
        setPreviewCallError('Voice preview could not connect to the voice websocket. Check network access to ElevenLabs and try again.');
        stopPreviewCall('error');
      }, 10000);

      ws.onopen = () => {
        if (previewWsRef.current !== ws) return;
        if (previewConnectionTimerRef.current) {
          window.clearTimeout(previewConnectionTimerRef.current);
          previewConnectionTimerRef.current = null;
        }
        previewConnectionTimerRef.current = window.setTimeout(() => {
          if (
            previewWsRef.current !== ws ||
            previewConversationReadyRef.current ||
            previewCallStatusRef.current === 'error'
          ) {
            return;
          }
          setPreviewCallError('Voice preview connected, but the voice agent did not become ready.');
          stopPreviewCall('error');
        }, 10000);
        previewInteractionStartedRef.current = true;
        ws.send(JSON.stringify({ type: 'conversation_initiation_client_data' }));

        const audioContext = new AudioContext();
        previewInputAudioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(micStream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        previewInputSourceRef.current = source;
        previewScriptProcessorRef.current = processor;

        processor.onaudioprocess = event => {
          if (
            ws.readyState !== WebSocket.OPEN ||
            !previewConversationReadyRef.current ||
            !previewMicStreamingEnabledRef.current ||
            previewPausedRef.current
          ) {
            return;
          }

          const input = event.inputBuffer.getChannelData(0);
          const downsampled = downsampleTo16Khz(input, audioContext.sampleRate);
          ws.send(JSON.stringify({ user_audio_chunk: float32ToPcm16Base64(downsampled) }));
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
      };

      ws.onmessage = event => {
        if (typeof event.data !== 'string') return;
        let data: PreviewSocketMessage;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        if (data.type === 'conversation_initiation_metadata') {
          if (previewConnectionTimerRef.current) {
            window.clearTimeout(previewConnectionTimerRef.current);
            previewConnectionTimerRef.current = null;
          }
          previewOutputFormatRef.current =
            data.conversation_initiation_metadata_event?.agent_output_audio_format || 'pcm_16000';
          previewConversationReadyRef.current = true;
          const conversationId = data.conversation_initiation_metadata_event?.conversation_id?.trim();
          if (conversationId) {
            setPreviewSessionId(conversationId);
          }
          previewGreetingFallbackTimerRef.current = window.setTimeout(() => {
            previewGreetingFallbackTimerRef.current = null;
            if (
              previewWsRef.current === ws &&
              previewInitialGreetingPendingRef.current &&
              previewCallStatusRef.current !== 'speaking'
            ) {
              previewInitialGreetingPendingRef.current = false;
              previewMicStreamingEnabledRef.current = true;
              previewCallStatusRef.current = previewPausedRef.current ? 'paused' : 'listening';
              setPreviewCallStatus(previewPausedRef.current ? 'paused' : 'listening');
            }
          }, 1800);
          return;
        }

        if (data.type === 'ping' && typeof data.ping_event?.event_id === 'number') {
          ws.send(JSON.stringify({ type: 'pong', event_id: data.ping_event.event_id }));
          return;
        }

        if (data.type === 'audio' && data.audio_event?.audio_base_64) {
          playPreviewAudioChunk(data.audio_event.audio_base_64);
          return;
        }

        if (data.type === 'agent_response') {
          appendPreviewTranscript('agent', data.agent_response_event?.agent_response);
          return;
        }

        if (data.type === 'agent_response_correction') {
          appendPreviewTranscript(
            'agent',
            data.agent_response_correction_event?.corrected_agent_response
              ?? data.agent_response_correction_event?.agent_response,
          );
          return;
        }

        if (data.type === 'user_transcript' || data.type === 'user_transcription') {
          appendPreviewTranscript('customer', data.user_transcription_event?.user_transcript);
        }
      };

      ws.onerror = () => {
        setPreviewCallError('Voice preview connection failed. Waiting for connection details...');
      };

      ws.onclose = event => {
        if (previewWsRef.current !== ws) return;
        if (event.code !== 1000 && previewCallStatusRef.current !== 'error') {
          const reason = event.reason ? `: ${event.reason}` : '';
          const guidance = event.code === 1002 || event.code === 1006
            ? ' Check that the ElevenLabs agent ID matches the API key and that this network allows wss://api.elevenlabs.io.'
            : '';
          setPreviewCallError(`Voice preview websocket closed (${event.code}${reason}).${guidance}`);
          stopPreviewCall('error');
          return;
        }
        stopPreviewCall('ended');
      };
    } catch (err) {
      setPreviewCallError(getVoicePreviewErrorMessage(err));
      stopPreviewCall('error');
    }
  };

  useEffect(() => () => {
    stopPreviewCall('ended');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!previewExpanded) return;
    const transcriptNode = previewTranscriptRef.current;
    if (!transcriptNode) return;
    transcriptNode.scrollTop = transcriptNode.scrollHeight;
  }, [previewExpanded, previewTranscript]);

  const headerStatus = (
    <div className="agent-studio-agent-metadata" aria-label={`${familyBadgeLabel}; ${lifecycleStatusLabel(lifecycle)}`}>
      {family && <Badge variant={familyBadgeVariant(family)}>{familyBadgeLabel}</Badge>}
      <span className={`agent-studio-lifecycle-status agent-studio-lifecycle-status--${lifecycle}`}>
        <span className="agent-studio-lifecycle-status__dot" aria-hidden="true" />
        <span>{lifecycleStatusLabel(lifecycle)}</span>
      </span>
    </div>
  );

  const headerActions = (
    <div
      className="agent-studio-header-actions"
      role="group"
      aria-label={`${familyName}; ${lifecycleLabel(lifecycle, version)}; version actions`}
    >
      <Button
        variant="secondary"
        aria-haspopup="dialog"
        aria-expanded={previewWidgetOpen}
        aria-pressed={previewWidgetOpen}
        onClick={() => setPreviewWidgetOpen(open => !open)}
      >
        <Icon name="play" weight="bold" size="xs" />
        Preview
      </Button>
      {lifecycle === 'draft' ? (
        <Button
          variant="secondary"
          aria-label={`Publish ${agent.name}`}
          onClick={handlePublishVersion}
        >
          Publish
        </Button>
      ) : family && (
        <span ref={duplicateMenu.anchorRef} style={{ display: 'inline-flex' }}>
          <Button
            variant="secondary"
            aria-haspopup="menu"
            aria-expanded={duplicateMenu.open}
            onClick={duplicateMenu.toggle}
          >
            Duplicate as…
            <Icon name="arrow-down" weight="bold" size="xs" />
          </Button>
          <MenuOverlay
            open={duplicateMenu.open}
            anchorRef={duplicateMenu.anchorRef}
            onClose={duplicateMenu.close}
            align="right"
          >
            {(Object.keys(FAMILY_METADATA) as AgentFamily[])
              .filter(targetFamily => targetFamily !== family)
              .map(targetFamily => (
                <MenuItem
                  key={targetFamily}
                  label={FAMILY_METADATA[targetFamily].label}
                  icon="copy"
                  onClick={() => handleDuplicateAs(targetFamily)}
                />
              ))}
          </MenuOverlay>
        </span>
      )}
    </div>
  );
  const sessionsDeepLink = previewSessionId
    ? `/agents/${agent.id}/sessions?sessionId=${encodeURIComponent(previewSessionId)}&source=preview`
    : `/agents/${agent.id}/sessions?source=preview`;
  const sessionsPath = `/agents/${encodeURIComponent(agent.id)}/sessions`;
  const observabilityPath = `${buildProjectPath(currentProjectId, '/kpi-dashboard')}#${clusKpiAgentObservabilityHashSegment(agent.name)}`;
  const showPreviewSessionLink = previewInteractionEnded && (previewCallStatus === 'ended' || previewCallStatus === 'error');
  const isPublishedSummary = lifecycle !== 'draft';
  const configuredKnowledge = agentDraft
    ? configuredCapabilityLabels(agentDraft, 'knowledge', summary.knowledgeBases)
    : summary.knowledgeBases;
  const configuredMemory = configuredCapabilityLabels(agentDraft, 'memory');
  const configuredActions = agentDraft
    ? configuredCapabilityLabels(agentDraft, 'actions', summary.actions)
    : summary.actions;
  const configuredHandoff = configuredCapabilityLabels(agentDraft, 'handoff');
  // Surface triggered guardrails first (e.g. "Large reservation approval"),
  // ordered by trigger count desc; a stable sort keeps the rest as configured.
  const configuredSecurity = configuredCapabilityLabels(agentDraft, 'security')
    .map((item, index) => ({ item, index, count: getCiscoLiveGuardrailTriggerCount(item) }))
    .sort((a, b) => b.count - a.count || a.index - b.index)
    .map(entry => entry.item);
  const configuredOrchestration = [...configuredActions, ...configuredHandoff];
  const connectedCapabilityCount = configuredKnowledge.length
    + configuredMemory.length
    + configuredOrchestration.length
    + configuredSecurity.length;
  const hasConnectedResources = connectedCapabilityCount > 0;
  const showOperationalStatus = lifecycle !== 'draft';
  const knownSessionId = previewSessionId || agentDraft?.previewState.sessionId || '';
  // A live preview session stays on this agent; otherwise resolve to the demo
  // session that actually carries the designed transcript (guardrail first) so
  // "View session" always opens the transcript with its guardrail markers.
  const operationalSessionLocator = knownSessionId
    ? { agentId: agent.id, sessionId: knownSessionId }
    : getCiscoLiveSessionLocator(agent.id, getCiscoLiveObservability(agent.id).sessionId);
  const operationalSessionPath = `/agents/${encodeURIComponent(operationalSessionLocator.agentId)}/sessions?sessionId=${encodeURIComponent(operationalSessionLocator.sessionId)}&source=observability`;
  // The banner describes the event that owns the transcript being opened, so its
  // title/meta/description stay in sync with the session "View session" links to.
  const operationalEvent = getCiscoLiveObservability(operationalSessionLocator.agentId);
  const operationalKpis = operationalKpisForAgent(agent.name);
  const activeObservabilityKpi = operationalKpis.find(metric => metric.id === activeObservabilityKpiId);
  const activeObservabilityChartId = activeObservabilityKpi
    ? `agent-studio-observability-chart-${activeObservabilityKpi.id}`
    : undefined;
  const studioHeaderAgent = { ...agent, meta: agent.description };
  const previewTranscriptButton = (
    <Button
      type="button"
      variant={previewExpanded ? 'secondary' : 'tertiary'}
      size="sm"
      className="agent-studio-preview-expand-btn"
      aria-expanded={previewExpanded}
      aria-pressed={previewExpanded}
      aria-haspopup="dialog"
      onClick={() => setPreviewExpanded(true)}
    >
      <Icon name="transcript" weight="bold" size="sm" />
      Text transcript
    </Button>
  );
  const previewExperience = (
    <div
      className={`agent-studio-preview-soundbar${previewCallStatus === 'connecting' || previewCallStatus === 'listening' || previewCallStatus === 'speaking' ? ' agent-studio-preview-soundbar--active' : ''}`}
      aria-label="Preview configured greeting"
    >
      <div className="eva-voice-preview__visualizer" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, index) => (
          <span key={index} style={{ animationDelay: `${index * 55}ms` }} />
        ))}
      </div>
      {previewCallStatus === 'error' && (
        <span>{previewCallError || 'Voice preview failed.'}</span>
      )}
      {previewCallStatus === 'connecting' && <span>Connecting voice preview...</span>}
      {previewCallStatus === 'listening' && <span>Listening...</span>}
      {previewCallStatus === 'speaking' && <span>Agent is speaking...</span>}
      {previewCallStatus === 'paused' && (
        <span>Call paused. Resume to continue sending caller audio.</span>
      )}
      <div className="agent-studio-preview-actions">
        <Button
          type="button"
          size="sm"
          disabled={previewCallStatus === 'connecting' || previewCallStatus === 'listening' || previewCallStatus === 'speaking' || previewCallStatus === 'paused'}
          onClick={() => { void startPreviewCall(); }}
        >
          <Icon name="phone" weight="bold" size="sm" />
          {previewCallStatus === 'ended' ? 'Restart call' : 'Start Call'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={previewCallStatus !== 'connecting' && previewCallStatus !== 'listening' && previewCallStatus !== 'speaking' && previewCallStatus !== 'paused'}
          onClick={() => stopPreviewCall('ended')}
        >
          End Call
        </Button>
      </div>
      {showPreviewSessionLink && (
        <div className="agent-studio-preview-session-link">
          <Icon name="transcript" weight="regular" size="sm" />
          <span>
            Preview ended.{' '}
            <TextLink
              variant="inline"
              size="sm"
              href={sessionsDeepLink}
              onClick={event => {
                event.preventDefault();
                navigate(sessionsDeepLink);
              }}
            >
              Open this interaction in Sessions
            </TextLink>
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="primary-content agent-studio-landing">
      <AgentHeader
        agent={studioHeaderAgent}
        activeTab="configure"
        showPublishButton={false}
        showTabs={false}
        statusContent={headerStatus}
        headerRight={headerActions}
      />

      <section className="agent-studio-hero" aria-labelledby="agent-studio-title">
        <div className="agent-studio-hero__header">
          <div className="agent-studio-hero__main">
            <div className="agent-studio-hero__content">
              <h1 id="agent-studio-title">Overview</h1>
            </div>
          </div>
        </div>

        <div className={`agent-studio-grid${isPublishedSummary ? ' agent-studio-grid--published' : ''}`}>
          <Card className="agent-studio-card agent-studio-card--summary agent-studio-card--connections">
            <CardHeader>
              <div className="agent-studio-card-heading">
                <span className="agent-studio-card-heading__icon">
                  <Icon name="check-circle-filled" weight="bold" size="sm" />
                </span>
                <span>
                  <strong>{hasConnectedResources ? 'Connected' : isPublishedSummary ? 'Connections' : 'Knowledge and actions'}</strong>
                  <small>
                    {hasConnectedResources
                      ? 'Knowledge, memory, actions, and protection'
                      : isPublishedSummary ? 'Nothing connected yet' : 'Optional for publishing'}
                  </small>
                </span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => goToSection('Knowledge')}>
                Edit
              </Button>
            </CardHeader>
            <CardBody>
              {isPublishedSummary ? (
                <div className="agent-studio-connected-columns">
                  {([
                    [
                      {
                        label: 'Knowledge',
                        empty: 'Not connected',
                        chips: configuredKnowledge.map(item => ({ item, type: 'knowledge' as ConfigurationCategory })),
                      },
                      {
                        label: 'AI memory',
                        empty: 'Not configured',
                        chips: configuredMemory.map(item => ({ item, type: 'memory' as ConfigurationCategory })),
                      },
                    ],
                    [
                      {
                        label: 'Orchestration and actions',
                        empty: 'Not connected',
                        showActionMetric: true,
                        chips: [
                          ...configuredActions.map(item => ({ item, type: 'action' as ConfigurationCategory })),
                          ...configuredHandoff.map(item => ({ item, type: 'orchestration' as ConfigurationCategory })),
                        ],
                      },
                    ],
                    [
                      {
                        label: 'Security',
                        empty: 'Not configured',
                        showGuardrailCount: true,
                        chips: configuredSecurity.map(item => ({ item, type: 'guardrail' as ConfigurationCategory })),
                      },
                    ],
                  ]).map((column, columnIndex) => (
                    <div key={columnIndex} className="agent-studio-connected-column">
                      {column.map(group => (
                        <div key={group.label} className="agent-studio-connected-group">
                          <strong>{group.label}</strong>
                          <div className="agent-studio-chip-group" aria-label={`Connected ${group.label.toLowerCase()}`}>
                            {group.chips.length > 0
                              ? group.chips.map(chip => {
                                  const actionMetric = 'showActionMetric' in group && group.showActionMetric
                                    ? getCiscoLiveActionMetric(chip.item)
                                    : null;
                                  const triggerCount = 'showGuardrailCount' in group && group.showGuardrailCount
                                    ? getCiscoLiveGuardrailTriggerCount(chip.item)
                                    : 0;
                                  return (
                                    <Badge key={`${group.label}-${chip.item}`} variant="default" className={`agent-studio-service-badge agent-studio-service-badge--${chip.type}`}>
                                      <ConfigurationCategoryIcon type={chip.type} />
                                      <span>{chip.item}</span>
                                      {actionMetric ? (
                                        <span
                                          className={`agent-studio-chip-metric${actionMetric.isPositive ? ' is-positive' : ' is-negative'}`}
                                          title={`Action success rate ${actionMetric.rate}`}
                                        >
                                          {actionMetric.rate}
                                          <Icon name={actionMetric.isPositive ? 'trending' : 'trending-down'} weight="regular" size="xs" />
                                        </span>
                                      ) : triggerCount > 0 ? (
                                        <span
                                          className="agent-studio-chip-count"
                                          title={`Triggered ${triggerCount} time${triggerCount === 1 ? '' : 's'}`}
                                        >
                                          {triggerCount}
                                        </span>
                                      ) : (
                                        <span className="agent-studio-chip-health-dot" title="Healthy connection" />
                                      )}
                                    </Badge>
                                  );
                                })
                              : <span className="agent-studio-connected-empty">{group.empty}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="agent-studio-chip-group" aria-label="Connected knowledge bases">
                    {configuredKnowledge.length > 0
                      ? configuredKnowledge.map(item => (
                          <Badge key={item} variant="default" className="agent-studio-service-badge">
                            <Icon name="files" weight="regular" size="xs" />
                            {item}
                          </Badge>
                        ))
                      : <Badge variant="default">Knowledge not connected</Badge>}
                  </div>
                  <div className="agent-studio-chip-group" aria-label="Connected actions">
                    {configuredActions.length > 0
                      ? configuredActions.map(item => (
                          <Badge key={item} variant="default" className="agent-studio-service-badge">
                            <Icon name="tools" weight="regular" size="xs" />
                            {item}
                          </Badge>
                        ))
                      : <Badge variant="default">Actions not connected</Badge>}
                  </div>
                </>
              )}
            </CardBody>
          </Card>

          {showOperationalStatus && (
            <Card className="agent-studio-card agent-studio-card--summary agent-studio-card--operational">
              <CardHeader>
                <div className="agent-studio-card-heading">
                  <span className="agent-studio-card-heading__icon">
                    <Icon name="multiline-chart" weight="bold" size="sm" />
                  </span>
                  <span>
                    <strong>Operational status</strong>
                    <small>Published version and runtime availability</small>
                  </span>
                </div>
                <div className="agent-studio-operational-toolbar" role="group" aria-label="Operational tools">
                  <Dropdown
                    className="agent-studio-operational-timerange"
                    size="compact"
                    leadingIcon="filter"
                    value={operationalTimeRange}
                    onChange={setOperationalTimeRange}
                    options={[
                      { value: '1h', label: 'Past 1 hour' },
                      { value: '6h', label: 'Past 6 hours' },
                      { value: '24h', label: 'Past 24 hours' },
                      { value: '7d', label: 'Past 7 days' },
                      { value: '30d', label: 'Past 30 days' },
                    ]}
                  />
                  <Button variant="secondary" size="sm" onClick={() => navigate(`${sessionsPath}?source=observability`)}>
                    <Icon name="transcript" weight="bold" size="sm" />
                    Open Sessions
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate(observabilityPath)}>
                    <Icon name="multiline-chart" weight="bold" size="sm" />
                    View observability dashboard
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="agent-studio-operational-body">
                <div
                  className="agent-studio-operational-overview"
                  aria-label="Aggregate health and observability metrics"
                >
                  <div className="agent-studio-health-gauge">
                    <div
                      className="agent-studio-health-gauge__dial"
                      role="img"
                      aria-label={`Aggregate health ${OPERATIONAL_HEALTH.score} percent`}
                    >
                      <svg viewBox="0 0 120 120" aria-hidden="true">
                        <circle
                          className="agent-studio-health-gauge__track"
                          cx="60"
                          cy="60"
                          r={HEALTH_GAUGE_RADIUS}
                          fill="none"
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${HEALTH_GAUGE_TRACK} ${HEALTH_GAUGE_CIRCUMFERENCE}`}
                          transform="rotate(135 60 60)"
                        />
                        <circle
                          className="agent-studio-health-gauge__value-arc"
                          cx="60"
                          cy="60"
                          r={HEALTH_GAUGE_RADIUS}
                          fill="none"
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${HEALTH_GAUGE_VALUE} ${HEALTH_GAUGE_CIRCUMFERENCE}`}
                          transform="rotate(135 60 60)"
                        />
                      </svg>
                      <div className="agent-studio-health-gauge__reading">
                        <span className="agent-studio-health-gauge__reading-inner">
                          <strong>{OPERATIONAL_HEALTH.score}</strong>
                          <span className="agent-studio-health-gauge__pct">%</span>
                        </span>
                      </div>
                    </div>
                    <p className="agent-studio-health-gauge__label">Aggregate health</p>
                    <dl className="agent-studio-health-gauge__stats">
                      <div>
                        <dt>Target</dt>
                        <dd>{OPERATIONAL_HEALTH.target}%</dd>
                      </div>
                      <div>
                        <dt>Gap</dt>
                        <dd className="is-positive">+{OPERATIONAL_HEALTH.gap}</dd>
                      </div>
                      <div>
                        <dt>Signals</dt>
                        <dd>{OPERATIONAL_HEALTH.signals}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="agent-studio-operational-metrics-table-wrap">
                    <table className="agent-studio-operational-metrics-table">
                      <thead>
                        <tr>
                          <th scope="col">Metric</th>
                          <th scope="col">Value</th>
                          <th scope="col">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {OPERATIONAL_HEALTH_METRICS.map(metric => (
                          <tr key={metric.id}>
                            <th scope="row">
                              <span className="agent-studio-metric-name">
                                <span className="agent-studio-metric-dot" aria-hidden="true" />
                                {metric.label}
                              </span>
                            </th>
                            <td className="agent-studio-metric-value">{metric.value}</td>
                            <td
                              className={`agent-studio-metric-change${metric.change.startsWith('+') ? ' is-positive' : ''}`}
                            >
                              {metric.change}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <Banner
                  type="success"
                  icon="shield"
                  className="agent-studio-operational-event-banner"
                  title={knownSessionId ? 'Preview session ready for review' : operationalEvent.eventTitle}
                  subtitle={(
                    <>
                      <span className="agent-studio-operational-event-meta">
                        {knownSessionId ? `Preview session ${knownSessionId}` : operationalEvent.eventMeta}
                      </span>
                      <span>
                        {knownSessionId
                          ? 'Review the conversation transcript, outcome, and handoff context.'
                          : operationalEvent.eventDescription}
                      </span>
                    </>
                  )}
                  actions={[{
                    label: 'View session →',
                    onClick: () => navigate(operationalSessionPath),
                    variant: 'outline',
                  }]}
                  dismissable={false}
                />
              </CardBody>
            </Card>
          )}
        </div>
      </section>

      {previewExpanded && (
        <Modal size="md" onClose={() => setPreviewExpanded(false)} className="agent-studio-transcript-modal">
          <ModalHeader
            title="Live transcript"
            description={`Preview transcript for ${agent.name}`}
            onClose={() => setPreviewExpanded(false)}
          />
          <ModalBody>
            <div className="agent-studio-preview-transcript" aria-live="polite">
              <div className="agent-studio-preview-transcript__controls" aria-label="Preview call controls">
                {previewCallStatus === 'ended' ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => { void startPreviewCall(); }}
                  >
                    <Icon name="phone" weight="bold" size="sm" />
                    Restart call
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={previewCallStatus !== 'connecting' && previewCallStatus !== 'listening' && previewCallStatus !== 'speaking' && previewCallStatus !== 'paused'}
                    onClick={togglePreviewPause}
                  >
                    <Icon name={previewPaused ? 'play' : 'pause'} weight="bold" size="sm" />
                    {previewPaused ? 'Resume' : 'Pause'}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={previewCallStatus !== 'connecting' && previewCallStatus !== 'listening' && previewCallStatus !== 'speaking' && previewCallStatus !== 'paused'}
                  onClick={() => stopPreviewCall('ended')}
                >
                  End call
                </Button>
              </div>
              <div ref={previewTranscriptRef} className="agent-studio-preview-transcript__body">
                {previewTranscript.length > 0 ? (
                  previewTranscript.map(message => (
                    <article
                      key={message.id}
                      className={`agent-studio-preview-transcript__message agent-studio-preview-transcript__message--${message.role}`}
                    >
                      <div className="agent-studio-preview-transcript__meta">
                        <span>{message.role === 'agent' ? agent.name : 'Customer'}</span>
                        <time dateTime={message.timestamp}>{message.timeLabel}</time>
                      </div>
                      <p>{message.text}</p>
                    </article>
                  ))
                ) : (
                  <p className="agent-studio-preview-transcript__empty">
                    Transcript text will appear here as the preview sends speech-to-text events.
                  </p>
                )}
              </div>
            </div>
          </ModalBody>
        </Modal>
      )}

      <Divider variant="gradient" aria-hidden="true" />

      <div className="agent-studio-next__header">
        <div className="agent-studio-section-heading">
          <h1 id="agent-studio-next-title">Make the agent smarter</h1>
          <p>Pick one plain-language step. Each one opens the detailed configuration only when you choose it.</p>
        </div>
      </div>

      <div className="agent-studio-step-grid">
        {recommendedStudioSteps.map(step => (
          <Card key={step.id} clickable className="agent-studio-step-card" onClick={() => openStep(step)}>
            <CardHeader>
              <div className="agent-studio-card-heading">
                <span className="agent-studio-card-heading__icon agent-studio-card-heading__icon--muted">
                  <Icon className="agent-studio-step-icon" name={step.icon} weight="regular" size="md" />
                </span>
                <span>
                  <strong>{step.title}</strong>
                  <small>{step.section}</small>
                </span>
              </div>
            </CardHeader>
            <CardBody>
              <div className="agent-studio-step-card__content">
                <p>{step.description}</p>
                <span className="agent-studio-step-card__link">
                  Open {step.section.includes(' · ') ? step.section.split(' · ')[1] : step.section}
                  <Icon name="next" weight="bold" size="xs" />
                </span>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {previewWidgetOpen && (
        <div
          className="agent-studio-preview-widget"
          role="dialog"
          aria-label={`Preview ${agent.name}`}
          aria-labelledby="agent-studio-preview-widget-title"
        >
          <div className="agent-studio-preview-widget__header">
            <div className="agent-studio-preview-widget__heading">
              <strong id="agent-studio-preview-widget-title">Preview</strong>
              <small>Try what is already configured</small>
            </div>
            <div className="agent-studio-preview-widget__header-actions">
              {previewTranscriptButton}
              <button
                type="button"
                className="agent-studio-preview-widget__close"
                onClick={() => setPreviewWidgetOpen(false)}
                aria-label="Close preview"
              >
                <Icon name="cancel" weight="bold" size="sm" />
              </button>
            </div>
          </div>
          {previewExperience}
        </div>
      )}
    </div>
  );
}
