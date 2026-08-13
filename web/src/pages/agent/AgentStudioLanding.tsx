import {
  useEffect,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { IconProvider, StaticChip, ThemeProvider } from '@momentum-design/components/react';
import { ThemeModeProvider, useThemeMode } from '../../app/ThemeContext';
import { publicAssetUrl } from '../../app/publicAsset';
import { AgentHeader } from '../../components/agents';
import {
  Badge,
  Banner,
  Button,
  Card,
  CardBody,
  CardHeader,
  Modal,
  ModalBody,
  ModalHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextLink,
} from '../../components/shared';
import Dropdown from '../../components/shared/Dropdown';
import ConfigurationCategoryIcon, {
  KnowledgeBookIcon,
  type ConfigurationCategory,
} from '../../components/shared/ConfigurationCategoryIcon';
import { useApp, type Agent } from '../../contexts/AppContext';
import { useDesignVariation } from '../../contexts/DesignVariationContext';
import { getElevenLabsConversationSignedUrl, getVoicePreviewErrorMessage } from '../../api/ciscoAi';
import {
  CISCO_LIVE_ACTION_CONTROL_SUMMARY_24H,
  CISCO_LIVE_OPERATIONAL_HEALTH_METRICS,
  CISCO_LIVE_PRIMARY_AGENT_ID,
  getCiscoLiveActionMetric,
  getCiscoLiveActionControlDecisions,
  getCiscoLiveGuardrailTriggerCount,
  getCiscoLiveObservability,
  getCiscoLiveSessionLocator,
  getCiscoLiveSessions,
  summarizeCiscoLiveActionControlDecisions,
} from '../../demo/ciscoLiveDemo';
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
import {
  FAMILY_METADATA,
  type AgentDraft,
  type AgentFamily,
  type AgentLifecycle,
} from '../../features/agent-creation/agentCreationModel';
import { Icon } from '../../icons';
import actionControlArrow from '../../assets/action-control-arrow.svg';

type PreviewCallStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'paused' | 'ended' | 'error';
type OverviewIntervention = 'action_control' | 'guardrail';
type OverviewTileGroup = 'cards' | 'summary' | 'charts';
type OverviewCardId = 'capability' | 'operational';
type OverviewSummaryTileId = 'knowledge' | 'memory' | 'actions' | 'actionControl' | 'guardrails';
type OverviewChartTileId = 'signals' | 'actions' | 'guardrails';
type OverviewConfigurationSection = 'Knowledge' | 'Action' | 'Security';
type OverviewReleaseState = {
  savedRevision: string;
  pendingPublishRevision: string | null;
};

const DEFAULT_OVERVIEW_SUMMARY_ORDER: OverviewSummaryTileId[] = [
  'knowledge',
  'memory',
  'actions',
  'actionControl',
  'guardrails',
];
const DEFAULT_OVERVIEW_CARD_ORDER: OverviewCardId[] = [
  'capability',
  'operational',
];
const DEFAULT_OVERVIEW_CHART_ORDER: OverviewChartTileId[] = [
  'signals',
  'actions',
  'guardrails',
];
const OVERVIEW_SUMMARY_CONFIGURATION_SECTION: Record<OverviewSummaryTileId, OverviewConfigurationSection> = {
  knowledge: 'Knowledge',
  memory: 'Knowledge',
  actions: 'Action',
  actionControl: 'Action',
  guardrails: 'Security',
};
const SHOW_CONNECTED_SUGGESTIONS = false;

function overviewLayoutStorageKey(agentId: string, group: OverviewTileGroup) {
  return `eva-agent-overview-layout-v1:${agentId}:${group}`;
}

function overviewReleaseStorageKey(agentId: string) {
  return `eva-agent-overview-release-v1:${agentId}`;
}

function readOverviewReleaseState(
  agentId: string | undefined,
  currentRevision: string,
): OverviewReleaseState {
  const fallback = {
    savedRevision: currentRevision,
    pendingPublishRevision: null,
  };
  if (!agentId || typeof window === 'undefined') return fallback;

  try {
    const stored = JSON.parse(window.localStorage.getItem(overviewReleaseStorageKey(agentId)) || 'null');
    if (
      stored
      && typeof stored.savedRevision === 'string'
      && (stored.pendingPublishRevision === null || typeof stored.pendingPublishRevision === 'string')
    ) {
      return stored as OverviewReleaseState;
    }
  } catch {
    // Ignore unavailable or invalid browser storage and use the current revision.
  }

  return fallback;
}

function persistOverviewReleaseState(agentId: string, state: OverviewReleaseState) {
  try {
    window.localStorage.setItem(overviewReleaseStorageKey(agentId), JSON.stringify(state));
  } catch {
    // The release control still works for this session when storage is unavailable.
  }
}

function readOverviewTileOrder<T extends string>(
  agentId: string | undefined,
  group: OverviewTileGroup,
  fallback: T[],
): T[] {
  if (!agentId || typeof window === 'undefined') return [...fallback];

  try {
    const stored = JSON.parse(window.localStorage.getItem(overviewLayoutStorageKey(agentId, group)) || 'null');
    if (
      Array.isArray(stored)
      && stored.length === fallback.length
      && fallback.every(tileId => stored.includes(tileId))
    ) {
      return stored as T[];
    }
  } catch {
    // Ignore unavailable or invalid browser storage and use the shared default.
  }

  return [...fallback];
}

function persistOverviewTileOrder<T extends string>(
  agentId: string,
  group: OverviewTileGroup,
  order: T[],
) {
  try {
    window.localStorage.setItem(overviewLayoutStorageKey(agentId, group), JSON.stringify(order));
  } catch {
    // The layout still updates for this session when browser storage is unavailable.
  }
}

function reorderOverviewTiles<T extends string>(order: T[], sourceId: T, targetId: T) {
  const sourceIndex = order.indexOf(sourceId);
  const targetIndex = order.indexOf(targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return order;

  const nextOrder = [...order];
  const [movedTile] = nextOrder.splice(sourceIndex, 1);
  nextOrder.splice(targetIndex, 0, movedTile);
  return nextOrder;
}

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

const OPERATIONAL_HEALTH = {
  score: 95.8,
  target: 85,
  signals: 8,
} as const;

const OPERATIONAL_HEALTH_GAP = Number(
  (OPERATIONAL_HEALTH.score - OPERATIONAL_HEALTH.target).toFixed(1),
);

const OPERATIONAL_HEALTH_METRICS = CISCO_LIVE_OPERATIONAL_HEALTH_METRICS;

const OPERATIONAL_TIME_RANGE_OPTIONS = [
  { value: '1h', label: 'Past 1 hour' },
  { value: '6h', label: 'Past 6 hours' },
  { value: '24h', label: 'Past 24 hours' },
  { value: '7d', label: 'Past 7 days' },
  { value: '30d', label: 'Past 30 days' },
] as const;

const OPERATIONAL_TIME_RANGE_HOURS: Record<string, number> = {
  '1h': 1,
  '6h': 6,
  '24h': 24,
  '7d': 24 * 7,
  '30d': 24 * 30,
};

const sessionAgeHours = (updated: string): number => {
  const normalized = updated.trim().toLowerCase();
  if (normalized === 'just now') return 0;
  const match = normalized.match(/^(\d+)\s+(minute|minutes|hour|hours|day|days)/);
  if (!match) return Number.POSITIVE_INFINITY;
  const value = Number(match[1]);
  if (match[2].startsWith('minute')) return value / 60;
  if (match[2].startsWith('day')) return value * 24;
  return value;
};

const actionControlDecisionAgeHours = (occurredAt: string): number => {
  const occurredAtMs = Date.parse(occurredAt);
  if (Number.isNaN(occurredAtMs)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (Date.now() - occurredAtMs) / (60 * 60 * 1000));
};

const sessionOutcomeVariant = (outcome: string): 'success' | 'warning' | 'info' => {
  if (outcome === 'Transferred') return 'success';
  if (outcome === 'Resolved') return 'success';
  return 'info';
};

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
  const {
    agents,
    agentDrafts,
    publishAgentVersion,
    selectAgent,
    showToast,
  } = useApp();
  const { setVariation } = useDesignVariation();
  const agent = agentId ? agents[agentId] : null;
  const currentAgentRevision = agentId
    ? agentDrafts[agentId]?.updatedAt ?? agents[agentId]?.updatedAt ?? ''
    : '';
  const [previewCallStatus, setPreviewCallStatus] = useState<PreviewCallStatus>('idle');
  const [previewCallError, setPreviewCallError] = useState('');
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [previewInteractionEnded, setPreviewInteractionEnded] = useState(false);
  const [previewWidgetOpen, setPreviewWidgetOpen] = useState(false);
  const [operationalTimeRange, setOperationalTimeRange] = useState('24h');
  const [selectedGuardrailActivity, setSelectedGuardrailActivity] = useState<string | null | undefined>(undefined);
  const [selectedOverviewIntervention, setSelectedOverviewIntervention] = useState<OverviewIntervention | null>(
    () => (agentId === CISCO_LIVE_PRIMARY_AGENT_ID ? 'action_control' : null),
  );
  const [overviewCardOrder, setOverviewCardOrder] = useState<OverviewCardId[]>(
    () => readOverviewTileOrder(agentId, 'cards', DEFAULT_OVERVIEW_CARD_ORDER),
  );
  const [overviewSummaryOrder, setOverviewSummaryOrder] = useState<OverviewSummaryTileId[]>(
    () => readOverviewTileOrder(agentId, 'summary', DEFAULT_OVERVIEW_SUMMARY_ORDER),
  );
  const [overviewChartOrder, setOverviewChartOrder] = useState<OverviewChartTileId[]>(
    () => readOverviewTileOrder(agentId, 'charts', DEFAULT_OVERVIEW_CHART_ORDER),
  );
  const [overviewReleaseState, setOverviewReleaseState] = useState<OverviewReleaseState>(
    () => readOverviewReleaseState(agentId, currentAgentRevision),
  );
  const [draggedOverviewTile, setDraggedOverviewTile] = useState<{
    group: OverviewTileGroup;
    id: string;
  } | null>(null);
  const [overviewDropTarget, setOverviewDropTarget] = useState<{
    group: OverviewTileGroup;
    id: string;
  } | null>(null);
  const [previewSessionId, setPreviewSessionId] = useState('');
  const [previewTranscript, setPreviewTranscript] = useState<PreviewTranscriptEntry[]>([]);
  const [previewPaused, setPreviewPaused] = useState(false);
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

  useEffect(() => {
    setOverviewCardOrder(readOverviewTileOrder(agentId, 'cards', DEFAULT_OVERVIEW_CARD_ORDER));
    setOverviewSummaryOrder(readOverviewTileOrder(agentId, 'summary', DEFAULT_OVERVIEW_SUMMARY_ORDER));
    setOverviewChartOrder(readOverviewTileOrder(agentId, 'charts', DEFAULT_OVERVIEW_CHART_ORDER));
    setDraggedOverviewTile(null);
    setOverviewDropTarget(null);
    setSelectedGuardrailActivity(undefined);
    setSelectedOverviewIntervention(agentId === CISCO_LIVE_PRIMARY_AGENT_ID ? 'action_control' : null);
  }, [agentId]);

  useEffect(() => {
    if (!agentId) return;
    const nextState = readOverviewReleaseState(agentId, currentAgentRevision);
    setOverviewReleaseState(nextState);
    persistOverviewReleaseState(agentId, nextState);
    // currentAgentRevision changes when configuration changes; the saved
    // revision intentionally remains stable until the user chooses Save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

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
  const existingEvaSession = readEvaSessionState();
  const phoneNumberDeferred = Boolean(
    existingEvaSession?.phoneNumberDeferred && existingEvaSession.agentName === agent.name,
  );
  const goToSection = (section: string) => {
    selectAgent(agent.id);
    navigate(`/agents/${agent.id}/configure?section=${section}`);
  };
  const moveOverviewTile = (
    group: OverviewTileGroup,
    sourceId: string,
    targetId: string,
  ) => {
    if (sourceId === targetId) return;

    if (group === 'cards') {
      const nextOrder = reorderOverviewTiles(
        overviewCardOrder,
        sourceId as OverviewCardId,
        targetId as OverviewCardId,
      );
      if (nextOrder === overviewCardOrder) return;
      setOverviewCardOrder(nextOrder);
      persistOverviewTileOrder(agent.id, group, nextOrder);
    } else if (group === 'summary') {
      const nextOrder = reorderOverviewTiles(
        overviewSummaryOrder,
        sourceId as OverviewSummaryTileId,
        targetId as OverviewSummaryTileId,
      );
      if (nextOrder === overviewSummaryOrder) return;
      setOverviewSummaryOrder(nextOrder);
      persistOverviewTileOrder(agent.id, group, nextOrder);
    } else {
      const nextOrder = reorderOverviewTiles(
        overviewChartOrder,
        sourceId as OverviewChartTileId,
        targetId as OverviewChartTileId,
      );
      if (nextOrder === overviewChartOrder) return;
      setOverviewChartOrder(nextOrder);
      persistOverviewTileOrder(agent.id, group, nextOrder);
    }

    showToast('Overview layout saved');
  };
  const moveOverviewTileByOffset = (
    group: OverviewTileGroup,
    tileId: string,
    offset: -1 | 1,
  ) => {
    const order: readonly string[] = group === 'cards'
      ? overviewCardOrder
      : group === 'summary'
        ? overviewSummaryOrder
        : overviewChartOrder;
    const currentIndex = order.indexOf(tileId);
    const targetIndex = Math.min(order.length - 1, Math.max(0, currentIndex + offset));
    if (currentIndex < 0 || currentIndex === targetIndex) return;
    moveOverviewTile(group, tileId, order[targetIndex]);
  };
  const handleOverviewTileKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    group: OverviewTileGroup,
    tileId: string,
  ) => {
    const previousKeys = ['ArrowLeft', 'ArrowUp'];
    const nextKeys = ['ArrowRight', 'ArrowDown'];
    if (!previousKeys.includes(event.key) && !nextKeys.includes(event.key)) return;

    event.preventDefault();
    moveOverviewTileByOffset(group, tileId, previousKeys.includes(event.key) ? -1 : 1);
  };
  const handleOverviewTileDragStart = (
    event: ReactDragEvent<HTMLElement>,
    group: OverviewTileGroup,
    tileId: string,
  ) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', `${group}:${tileId}`);
    setDraggedOverviewTile({ group, id: tileId });
  };
  const handleOverviewTileDragOver = (
    event: ReactDragEvent<HTMLElement>,
    group: OverviewTileGroup,
    tileId: string,
  ) => {
    if (draggedOverviewTile?.group !== group || draggedOverviewTile.id === tileId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setOverviewDropTarget({ group, id: tileId });
  };
  const handleOverviewTileDrop = (
    event: ReactDragEvent<HTMLElement>,
    group: OverviewTileGroup,
    tileId: string,
  ) => {
    event.preventDefault();
    if (draggedOverviewTile?.group === group) {
      moveOverviewTile(group, draggedOverviewTile.id, tileId);
    }
    setDraggedOverviewTile(null);
    setOverviewDropTarget(null);
  };
  const handleOverviewTileDragEnd = () => {
    setDraggedOverviewTile(null);
    setOverviewDropTarget(null);
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

  const handlePublishVersion = () => {
    const publishedDraft = publishAgentVersion(agent.id);
    if (!publishedDraft) {
      showToast('Complete the required profile fields before publishing.', 'error');
      return null;
    }

    showToast(
      `Published version ${publishedDraft.version}. Deployment and live traffic remain separate.`,
      'success',
    );
    return publishedDraft;
  };

  const hasUnsavedConfigurationChanges =
    Boolean(currentAgentRevision)
    && currentAgentRevision !== overviewReleaseState.savedRevision;
  const hasSavedConfigurationReadyToPublish =
    !hasUnsavedConfigurationChanges
    && Boolean(currentAgentRevision)
    && overviewReleaseState.pendingPublishRevision === currentAgentRevision;
  const releaseActionLabel = hasSavedConfigurationReadyToPublish ? 'Publish' : 'Save';
  const releaseActionDisabled =
    !hasUnsavedConfigurationChanges
    && !hasSavedConfigurationReadyToPublish;

  const handleReleaseAction = () => {
    if (hasUnsavedConfigurationChanges) {
      const nextState = {
        savedRevision: currentAgentRevision,
        pendingPublishRevision: currentAgentRevision,
      };
      setOverviewReleaseState(nextState);
      persistOverviewReleaseState(agent.id, nextState);
      showToast('Configuration saved', 'success');
      return;
    }

    if (!hasSavedConfigurationReadyToPublish) return;
    const publishedDraft = handlePublishVersion();
    if (!publishedDraft) return;

    const nextState = {
      savedRevision: publishedDraft.updatedAt,
      pendingPublishRevision: null,
    };
    setOverviewReleaseState(nextState);
    persistOverviewReleaseState(agent.id, nextState);
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
      <Button
        type="button"
        disabled={releaseActionDisabled}
        aria-label={`${releaseActionLabel} ${agent.name}`}
        onClick={handleReleaseAction}
      >
        {releaseActionLabel}
      </Button>
    </div>
  );
  const sessionsDeepLink = previewSessionId
    ? `/agents/${agent.id}/sessions?sessionId=${encodeURIComponent(previewSessionId)}&source=preview`
    : `/agents/${agent.id}/sessions?source=preview`;
  const sessionsPath = `/agents/${encodeURIComponent(agent.id)}/sessions`;
  const observabilityPath = `/observability?agent=${encodeURIComponent(agent.name)}`;
  const showPreviewSessionLink = previewInteractionEnded && (previewCallStatus === 'ended' || previewCallStatus === 'error');
  const configuredKnowledge = agentDraft
    ? configuredCapabilityLabels(agentDraft, 'knowledge', summary.knowledgeBases)
    : summary.knowledgeBases;
  const configuredMemory = configuredCapabilityLabels(agentDraft, 'memory');
  const configuredActions = agentDraft
    ? configuredCapabilityLabels(agentDraft, 'actions', summary.actions)
    : summary.actions;
  const configuredHandoff = configuredCapabilityLabels(agentDraft, 'handoff');
  // Surface triggered guardrails first; a stable sort keeps the rest as configured.
  const configuredSecurity = configuredCapabilityLabels(agentDraft, 'security')
    .map((item, index) => ({ item, index, count: getCiscoLiveGuardrailTriggerCount(item, agent.id) }))
    .sort((a, b) => b.count - a.count || a.index - b.index)
    .map(entry => entry.item);
  const configuredOrchestration = [...configuredActions, ...configuredHandoff];
  const connectedCapabilityCount = configuredKnowledge.length
    + configuredMemory.length
    + configuredOrchestration.length
    + configuredSecurity.length;
  const hasConnectedResources = connectedCapabilityCount > 0;
  const usesEagleGreenShowcaseMetrics = agent.id === 'golftop-vip-reservations';
  const actionPerformanceItems = usesEagleGreenShowcaseMetrics
    ? [
        'Check Availability',
        'Send payment link',
        'Transfer to VIP team',
        'Handover',
      ]
    : configuredActions;
  const connectedActionPerformance = actionPerformanceItems.map(item => {
    const metric = getCiscoLiveActionMetric(item);
    return {
      item,
      rate: Number.parseFloat(metric.rate),
      rateLabel: metric.rate,
      isPositive: metric.isPositive,
    };
  });
  const averageActionSuccess = connectedActionPerformance.length > 0
    ? connectedActionPerformance.reduce((total, item) => total + item.rate, 0) / connectedActionPerformance.length
    : 0;
  const connectedCapabilityTotals = {
    knowledge: usesEagleGreenShowcaseMetrics ? 14 : configuredKnowledge.length,
    memory: configuredMemory.length,
    actions: usesEagleGreenShowcaseMetrics ? 4 : configuredOrchestration.length,
    actionControls: usesEagleGreenShowcaseMetrics ? 2 : 0,
    guardrails: usesEagleGreenShowcaseMetrics ? 6 : configuredSecurity.length,
  } as const;
  const connectedGuardrailActivity = configuredSecurity.map(item => ({
    item,
    count: getCiscoLiveGuardrailTriggerCount(item, agent.id),
  }));
  const defaultSelectedGuardrailName = connectedGuardrailActivity.find(guardrail => guardrail.count > 0)?.item
    ?? connectedGuardrailActivity[0]?.item
    ?? null;
  const selectedGuardrailName = usesEagleGreenShowcaseMetrics
    && selectedOverviewIntervention !== 'guardrail'
    ? null
    : selectedGuardrailActivity === undefined
      ? defaultSelectedGuardrailName
      : selectedGuardrailActivity
        && connectedGuardrailActivity.some(guardrail => guardrail.item === selectedGuardrailActivity)
        ? selectedGuardrailActivity
        : null;
  const selectedGuardrail = connectedGuardrailActivity.find(
    guardrail => guardrail.item === selectedGuardrailName,
  );
  const showSelectedGuardrailDecision = selectedOverviewIntervention === 'guardrail'
    && Boolean(selectedGuardrail && selectedGuardrail.count > 0);
  const guardrailTriggerTotal = connectedGuardrailActivity.reduce((total, item) => total + item.count, 0);
  const actionConfigurationValues = agentDraft?.familyConfiguration.actions?.values;
  const allAgentSessions = getCiscoLiveSessions(agent.id, actionConfigurationValues);
  const operationalTimeRangeHours = OPERATIONAL_TIME_RANGE_HOURS[operationalTimeRange] ?? 6;
  const actionControlDecisions = (usesEagleGreenShowcaseMetrics
    ? getCiscoLiveActionControlDecisions(agent.id, actionConfigurationValues)
    : [])
    .filter(decision => actionControlDecisionAgeHours(decision.occurredAt) <= operationalTimeRangeHours);
  const actionControlFlow = usesEagleGreenShowcaseMetrics && operationalTimeRange === '24h'
    ? CISCO_LIVE_ACTION_CONTROL_SUMMARY_24H
    : summarizeCiscoLiveActionControlDecisions(actionControlDecisions);
  const actionControlSpotlightDecision = [...actionControlDecisions]
    .filter(decision => decision.matched)
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))[0];
  const showSelectedActionControlDecision = selectedOverviewIntervention === 'action_control'
    && Boolean(actionControlSpotlightDecision);
  const actionControlSpotlightEvidence = actionControlSpotlightDecision?.evidence.find(evidence => (
    typeof evidence.actual === 'number'
  ));
  const actionControlSpotlightUnlockedName = actionControlSpotlightDecision?.unlockedActionNames[0] ?? '';
  const actionControlSpotlightUnlocked = Boolean(actionControlSpotlightUnlockedName);
  const actionControlSpotlightActionName = actionControlSpotlightDecision?.actionName === 'Check Availability'
    ? 'Check availability'
    : actionControlSpotlightDecision?.actionName ?? '';
  const actionControlFlowLabel = `${actionControlFlow.evaluated} controls were evaluated. ${actionControlFlow.actionRan} attached action${actionControlFlow.actionRan === 1 ? '' : 's'} completed. ${actionControlFlow.matched} matched and ${actionControlFlow.notMatched} did not match; ${actionControlFlow.steered} redirected the next step and ${actionControlFlow.unlocked} gated action${actionControlFlow.unlocked === 1 ? '' : 's'} unlocked. Match rate ${actionControlFlow.matchRate} percent.`;
  const guardedSessionRate = allAgentSessions.length > 0
    ? Math.round((allAgentSessions.filter(session => session.guardrailTriggered).length / allAgentSessions.length) * 100)
    : 0;
  const connectedCapabilitySignals = [
    {
      id: 'knowledge',
      label: 'Knowledge referenced',
      value: configuredKnowledge.length > 0 ? Math.min(100, 68 + configuredKnowledge.length * 8) : 0,
      count: connectedCapabilityTotals.knowledge,
      type: 'knowledge' as ConfigurationCategory,
    },
    {
      id: 'memory',
      label: 'Memory assisted',
      value: configuredMemory.length > 0 ? Math.min(100, 54 + configuredMemory.length * 8) : 0,
      count: connectedCapabilityTotals.memory,
      type: 'memory' as ConfigurationCategory,
    },
    {
      id: 'actions',
      label: 'Action success',
      value: Math.round(averageActionSuccess),
      count: connectedCapabilityTotals.actions,
      type: 'action' as ConfigurationCategory,
    },
    {
      id: 'security',
      label: 'Guardrail intervention',
      value: configuredSecurity.length > 0 ? guardedSessionRate : 0,
      count: connectedCapabilityTotals.guardrails,
      type: 'guardrail' as ConfigurationCategory,
    },
  ];
  const showOperationalStatus = lifecycle !== 'draft';
  const knownSessionId = previewSessionId || agentDraft?.previewState.sessionId || '';
  // A live preview session stays on this agent; otherwise resolve to the demo
  // session that actually carries the designed transcript (guardrail first) so
  // "View session" always opens the transcript with its guardrail markers.
  const operationalSessionLocator = knownSessionId
    ? { agentId: agent.id, sessionId: knownSessionId }
    : getCiscoLiveSessionLocator(agent.id, getCiscoLiveObservability(agent.id).sessionId);
  const operationalSessionPath = `/agents/${encodeURIComponent(operationalSessionLocator.agentId)}/sessions?sessionId=${encodeURIComponent(operationalSessionLocator.sessionId)}&source=observability`;
  const eagleActionControlSessionPath = actionControlSpotlightDecision
    ? `${sessionsPath}?sessionId=${encodeURIComponent(actionControlSpotlightDecision.sessionId)}&source=overview`
    : sessionsPath;
  const eagleGuardrailSession = allAgentSessions.find(session => (
    session.guardrailTriggered && session.transcript.length > 0
  ));
  const eagleGuardrailEvent = eagleGuardrailSession?.transcript.find(event => event.kind === 'guardrail');
  const eagleGuardrailSessionPath = eagleGuardrailSession
    ? `${sessionsPath}?sessionId=${encodeURIComponent(eagleGuardrailSession.id)}&source=overview`
    : sessionsPath;
  // The banner describes the event that owns the transcript being opened, so its
  // title/meta/description stay in sync with the session "View session" links to.
  const operationalEvent = getCiscoLiveObservability(operationalSessionLocator.agentId);
  const operationalTimeRangeLabel = OPERATIONAL_TIME_RANGE_OPTIONS.find(
    option => option.value === operationalTimeRange,
  )?.label ?? 'Past 6 hours';
  const operationalSessions = getCiscoLiveSessions(agent.id, actionConfigurationValues)
    .filter(session => sessionAgeHours(session.updated) <= operationalTimeRangeHours)
    .slice(0, 3);
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
            <div className="agent-studio-hero__content agent-studio-overview-heading">
              <h1 id="agent-studio-title">Overview</h1>
              <div className="agent-studio-overview-controls" role="group" aria-label="Overview filters">
                <Dropdown
                  className="agent-studio-operational-timerange"
                  size="compact"
                  leadingIcon="filter"
                  value={operationalTimeRange}
                  onChange={setOperationalTimeRange}
                  options={OPERATIONAL_TIME_RANGE_OPTIONS.map(option => ({ ...option }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="agent-studio-grid agent-studio-grid--published">
          {overviewCardOrder.map((cardId, index) => cardId === 'capability' ? (
          <Card
            key={cardId}
            className={[
              'agent-studio-card agent-studio-card--summary agent-studio-card--connections',
              'agent-studio-overview-card agent-studio-overview-tile',
              draggedOverviewTile?.group === 'cards' && draggedOverviewTile.id === cardId
                ? 'is-dragging'
                : '',
              overviewDropTarget?.group === 'cards' && overviewDropTarget.id === cardId
                ? 'is-drop-target'
                : '',
            ].filter(Boolean).join(' ')}
            draggable={showOperationalStatus}
            onDragStart={event => handleOverviewTileDragStart(event, 'cards', cardId)}
            onDragOver={event => handleOverviewTileDragOver(event, 'cards', cardId)}
            onDrop={event => handleOverviewTileDrop(event, 'cards', cardId)}
            onDragEnd={handleOverviewTileDragEnd}
          >
            {showOperationalStatus && (
              <button
                type="button"
                className="agent-studio-overview-card__drag-handle"
                aria-label={`Reorder Capability usage. Position ${index + 1} of ${overviewCardOrder.length}`}
                title="Drag to reorder. Use arrow keys to move this card."
                onKeyDown={event => handleOverviewTileKeyDown(event, 'cards', cardId)}
              >
                <Icon name="dragger-vertical" weight="bold" size="sm" />
              </button>
            )}
            <CardHeader>
              <div className="agent-studio-card-heading">
                <span className="agent-studio-card-heading__icon">
                  <Icon name="check-circle-filled" weight="bold" size="sm" />
                </span>
                <span>
                  <strong>Capability usage</strong>
                  <small>
                    {hasConnectedResources
                      ? 'Knowledge, memory, actions, and protection'
                      : 'Nothing connected yet'}
                  </small>
                </span>
              </div>
            </CardHeader>
            <CardBody id="agent-studio-connected-content">
              <div className="agent-studio-connected-metrics">
                    <div className="agent-studio-connected-summary" aria-label="Capability usage summary">
                      {[
                        {
                          id: 'knowledge' as OverviewSummaryTileId,
                          label: 'Knowledge',
                          value: connectedCapabilityTotals.knowledge,
                          status: configuredKnowledge.length > 0 ? 'All sources synced · 8 min ago' : null,
                          type: 'knowledge' as ConfigurationCategory,
                        },
                        {
                          id: 'memory' as OverviewSummaryTileId,
                          label: 'AI memory',
                          value: connectedCapabilityTotals.memory,
                          status: null,
                          type: 'memory' as ConfigurationCategory,
                        },
                        {
                          id: 'actions' as OverviewSummaryTileId,
                          label: 'Actions',
                          value: connectedCapabilityTotals.actions,
                          status: usesEagleGreenShowcaseMetrics
                            ? '2 Transfers, 2 MCPs'
                            : configuredOrchestration.length > 0
                              ? `${configuredActions.length} actions · ${configuredHandoff.length} MCPs`
                              : null,
                          type: 'action' as ConfigurationCategory,
                        },
                        {
                          id: 'actionControl' as OverviewSummaryTileId,
                          label: 'Agent control',
                          value: connectedCapabilityTotals.actionControls,
                          status: usesEagleGreenShowcaseMetrics ? '2 active · Steer' : null,
                          type: 'action-control' as ConfigurationCategory,
                        },
                        {
                          id: 'guardrails' as OverviewSummaryTileId,
                          label: 'Guardrails',
                          value: connectedCapabilityTotals.guardrails,
                          status: usesEagleGreenShowcaseMetrics
                            ? '4 prebuilt · 2 adaptive'
                            : configuredSecurity.length > 0
                              ? `${configuredSecurity.length} configured`
                              : null,
                          type: 'guardrail' as ConfigurationCategory,
                        },
                      ]
                        .sort((a, b) => overviewSummaryOrder.indexOf(a.id) - overviewSummaryOrder.indexOf(b.id))
                        .map((item, index) => (
                        <div
                          key={item.id}
                          className={[
                            'agent-studio-connected-summary__item',
                            `agent-studio-connected-summary__item--${item.type}`,
                            'agent-studio-overview-tile',
                            draggedOverviewTile?.group === 'summary' && draggedOverviewTile.id === item.id
                              ? 'is-dragging'
                              : '',
                            overviewDropTarget?.group === 'summary' && overviewDropTarget.id === item.id
                              ? 'is-drop-target'
                              : '',
                          ].filter(Boolean).join(' ')}
                          onDragOver={event => handleOverviewTileDragOver(event, 'summary', item.id)}
                          onDrop={event => handleOverviewTileDrop(event, 'summary', item.id)}
                        >
                          <button
                            type="button"
                            className="agent-studio-overview-tile__drag-handle"
                            aria-label={`Reorder ${item.label}. Position ${index + 1} of ${overviewSummaryOrder.length}`}
                            title="Drag to reorder. Use arrow keys to move this tile."
                            draggable
                            onDragStart={event => handleOverviewTileDragStart(event, 'summary', item.id)}
                            onDragEnd={handleOverviewTileDragEnd}
                            onKeyDown={event => handleOverviewTileKeyDown(event, 'summary', item.id)}
                          >
                            <Icon name="dragger-vertical" weight="bold" size="sm" />
                          </button>
                          <Link
                            className="agent-studio-connected-summary__link"
                            to={`/agents/${agent.id}/configure?section=${OVERVIEW_SUMMARY_CONFIGURATION_SECTION[item.id]}`}
                            aria-label={`Open ${item.label} configuration`}
                            title={`Open ${item.label} configuration`}
                            draggable={false}
                            onClick={() => selectAgent(agent.id)}
                          >
                            <span className="agent-studio-connected-summary__icon" aria-hidden="true">
                              <ConfigurationCategoryIcon type={item.type} />
                            </span>
                            <span>
                              <strong>{item.value}</strong>
                              <small>{item.label}</small>
                              {item.status && (
                                <span className="agent-studio-connected-summary__status">{item.status}</span>
                              )}
                            </span>
                          </Link>
                        </div>
                      ))}
                    </div>

                    <div className="agent-studio-connected-chart-grid">
                      {overviewChartOrder.map((tileId, index) => {
                        const tileLabel = tileId === 'signals'
                          ? 'Capability signals'
                          : tileId === 'actions'
                            ? usesEagleGreenShowcaseMetrics
                              ? 'Agent control activity'
                              : 'Action performance'
                            : 'Guardrail activity';
                        const labelledBy = `agent-studio-${tileId}-chart-title`;
                        return (
                          <section
                            key={tileId}
                            className={[
                              'agent-studio-connected-chart',
                              'agent-studio-overview-tile',
                              draggedOverviewTile?.group === 'charts' && draggedOverviewTile.id === tileId
                                ? 'is-dragging'
                                : '',
                              overviewDropTarget?.group === 'charts' && overviewDropTarget.id === tileId
                                ? 'is-drop-target'
                                : '',
                            ].filter(Boolean).join(' ')}
                            aria-labelledby={labelledBy}
                            draggable
                            onDragStart={event => handleOverviewTileDragStart(event, 'charts', tileId)}
                            onDragOver={event => handleOverviewTileDragOver(event, 'charts', tileId)}
                            onDrop={event => handleOverviewTileDrop(event, 'charts', tileId)}
                            onDragEnd={handleOverviewTileDragEnd}
                          >
                            <button
                              type="button"
                              className="agent-studio-overview-tile__drag-handle"
                              aria-label={`Reorder ${tileLabel}. Position ${index + 1} of ${overviewChartOrder.length}`}
                              title="Drag to reorder. Use arrow keys to move this tile."
                              onKeyDown={event => handleOverviewTileKeyDown(event, 'charts', tileId)}
                            >
                              <Icon name="dragger-vertical" weight="bold" size="sm" />
                            </button>

                            {tileId === 'signals' && (
                              <>
                                <div className="agent-studio-connected-chart__header">
                                  <div>
                                    <h3 id={labelledBy}>Capability signals</h3>
                                    <p>Primary signal for each capability</p>
                                  </div>
                                </div>
                                <div className="agent-studio-capability-signals">
                                  {connectedCapabilitySignals.map(signal => (
                                    <div key={signal.id} className="agent-studio-capability-signal">
                                      <div className="agent-studio-capability-signal__label">
                                        <span>
                                          <ConfigurationCategoryIcon type={signal.type} />
                                          {signal.label}
                                        </span>
                                        <strong>{signal.value}%</strong>
                                      </div>
                                      <div
                                        className={`agent-studio-capability-signal__track agent-studio-capability-signal__track--${signal.type}`}
                                        role="progressbar"
                                        aria-label={`${signal.label}: ${signal.value} percent`}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-valuenow={signal.value}
                                      >
                                        <span style={{ width: `${signal.value}%` }} />
                                      </div>
                                      <small>{signal.count} configured</small>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}

                            {tileId === 'actions' && (
                              <>
                                <div className="agent-studio-connected-chart__header">
                                  <div>
                                    <h3 id={labelledBy}>
                                      {usesEagleGreenShowcaseMetrics ? 'Agent control activity' : 'Action performance'}
                                    </h3>
                                    <p>
                                      {usesEagleGreenShowcaseMetrics
                                        ? `Agent control activity during ${operationalTimeRangeLabel.toLowerCase()}`
                                        : 'Success rate against a 95% target'}
                                    </p>
                                  </div>
                                  {!usesEagleGreenShowcaseMetrics && (
                                    <strong className="agent-studio-connected-chart__headline">
                                      {averageActionSuccess.toFixed(1)}%
                                    </strong>
                                  )}
                                </div>
                                {usesEagleGreenShowcaseMetrics ? (
                                  <figure
                                    className="agent-studio-action-control-flow"
                                    aria-labelledby="agent-studio-action-control-flow-caption"
                                  >
                                    <figcaption
                                      id="agent-studio-action-control-flow-caption"
                                      className="agent-studio-action-control-flow__caption"
                                    >
                                      {actionControlFlowLabel}
                                    </figcaption>
                                    <div className="agent-studio-action-control-flow__summary" aria-hidden="true">
                                      <span className="agent-studio-action-control-flow__summary-copy">
                                        <strong>Evaluated</strong>
                                      </span>
                                      <strong className="agent-studio-action-control-flow__summary-value">
                                        {actionControlFlow.evaluated}
                                      </strong>
                                    </div>
                                    <div className="agent-studio-action-control-flow__divider" aria-hidden="true" />

                                    <div className="agent-studio-action-control-flow__rows">
                                      <div
                                        className={`agent-studio-action-control-flow__row agent-studio-action-control-flow__matched-trigger${showSelectedActionControlDecision ? ' is-selected' : ''}`}
                                      >
                                        <button
                                          type="button"
                                          className="agent-studio-action-control-flow__disclosure"
                                          aria-expanded={showSelectedActionControlDecision}
                                          aria-controls="agent-studio-action-control-decision-banner"
                                          aria-label={`${showSelectedActionControlDecision ? 'Hide' : 'Show'} latest matching decision`}
                                          disabled={!actionControlSpotlightDecision}
                                          onClick={() => {
                                            setSelectedOverviewIntervention(current => (
                                              current === 'action_control' ? null : 'action_control'
                                            ));
                                          }}
                                        />
                                        <div className="agent-studio-action-control-flow__matched-content" aria-hidden="true">
                                          <div className="agent-studio-action-control-flow__matched-heading">
                                            <strong>Matched</strong>
                                            <strong>{actionControlFlow.matched}</strong>
                                          </div>

                                          {actionControlSpotlightDecision && (
                                            <IconProvider
                                              className="agent-studio-action-control-flow__chip-provider"
                                              iconSet="custom-icons"
                                              url={publicAssetUrl('icons').replace(/\/$/, '')}
                                              fileExtension="svg"
                                            >
                                              <div className="agent-studio-action-control-flow__outcomes">
                                                <div className="agent-studio-action-control-flow__action-item">
                                                  <span>{actionControlSpotlightActionName}</span>
                                                  <StaticChip
                                                    className="agent-studio-action-control-flow__chip"
                                                    color="lime"
                                                    iconName="automation-bold"
                                                    label="Steered"
                                                  />
                                                </div>
                                                <span className="agent-studio-action-control-flow__outcome-connector" aria-hidden="true">
                                                  <img src={actionControlArrow} alt="" />
                                                </span>
                                                <div className="agent-studio-action-control-flow__action-item">
                                                  <span>{actionControlSpotlightUnlockedName}</span>
                                                  <StaticChip
                                                    className="agent-studio-action-control-flow__chip"
                                                    color="cobalt"
                                                    label="Unlocked"
                                                  />
                                                </div>
                                              </div>
                                            </IconProvider>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </figure>
                                ) : (
                                  <div className="agent-studio-action-performance">
                                    {connectedActionPerformance.length > 0 ? connectedActionPerformance.map(action => (
                                      <div key={action.item} className="agent-studio-action-performance__row">
                                        <div>
                                          <span title={action.item}>{action.item}</span>
                                          <strong className={action.isPositive ? 'is-positive' : 'is-negative'}>
                                            {action.rateLabel}
                                            <Icon name={action.isPositive ? 'trending' : 'trending-down'} weight="regular" size="xs" />
                                          </strong>
                                        </div>
                                        <div
                                          className="agent-studio-action-performance__track"
                                          role="progressbar"
                                          aria-label={`${action.item} success rate: ${action.rateLabel}`}
                                          aria-valuemin={0}
                                          aria-valuemax={100}
                                          aria-valuenow={action.rate}
                                        >
                                          <span className="agent-studio-action-performance__target" aria-hidden="true" />
                                          <span className="agent-studio-action-performance__value" style={{ width: `${action.rate}%` }} />
                                        </div>
                                      </div>
                                    )) : (
                                      <p className="agent-studio-connected-chart__empty">Connect an action to see performance.</p>
                                    )}
                                  </div>
                                )}
                              </>
                            )}

                            {tileId === 'guardrails' && (
                              <>
                                <div className="agent-studio-connected-chart__header">
                                  <div>
                                    <h3 id={labelledBy}>Guardrail activity</h3>
                                    <p>Triggers during the {operationalTimeRangeLabel.toLowerCase()}</p>
                                  </div>
                                  <strong className="agent-studio-connected-chart__headline">{guardrailTriggerTotal}</strong>
                                </div>
                                {connectedGuardrailActivity.length > 0 ? (
                                  <div className="agent-studio-guardrail-chart">
                                    {connectedGuardrailActivity.map(guardrail => {
                                      const maxCount = Math.max(1, ...connectedGuardrailActivity.map(item => item.count));
                                      const width = (guardrail.count / maxCount) * 100;
                                      return (
                                        <div
                                          key={guardrail.item}
                                          className={`agent-studio-guardrail-chart__item${selectedGuardrailName === guardrail.item ? ' is-selected' : ''}`}
                                        >
                                          <button
                                            type="button"
                                            className="agent-studio-guardrail-chart__plot"
                                            aria-label={`${guardrail.item}: ${guardrail.count} trigger${guardrail.count === 1 ? '' : 's'}`}
                                            aria-pressed={selectedGuardrailName === guardrail.item}
                                            onClick={() => {
                                              const nextGuardrail = selectedGuardrailName === guardrail.item
                                                ? null
                                                : guardrail.item;
                                              setSelectedGuardrailActivity(nextGuardrail);
                                              if (usesEagleGreenShowcaseMetrics) {
                                                setSelectedOverviewIntervention(nextGuardrail ? 'guardrail' : null);
                                              }
                                            }}
                                          >
                                            <span className="agent-studio-guardrail-chart__label">
                                              <small title={guardrail.item}>{guardrail.item}</small>
                                              <strong>{guardrail.count}</strong>
                                            </span>
                                            <span className="agent-studio-guardrail-chart__track" aria-hidden="true">
                                              <i style={{ width: `${width}%` }} />
                                            </span>
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="agent-studio-connected-chart__empty">Configure a guardrail to see activity.</p>
                                )}
                              </>
                            )}
                          </section>
                        );
                      })}
                    </div>

                    {usesEagleGreenShowcaseMetrics ? (
                      (showSelectedGuardrailDecision || showSelectedActionControlDecision)
                      && (
                        <div
                          id={showSelectedActionControlDecision
                            ? 'agent-studio-action-control-decision-banner'
                            : undefined}
                        >
                          <Banner
                            type={showSelectedGuardrailDecision ? 'warning' : 'info'}
                            icon={showSelectedGuardrailDecision ? 'shield' : 'automation'}
                            className="agent-studio-operational-event-banner agent-studio-connected-event-banner"
                            title={showSelectedGuardrailDecision
                              ? `${selectedGuardrail?.item ?? 'Guardrail'} triggered`
                              : actionControlSpotlightUnlocked
                                ? 'Large event transfer unlocked'
                                : 'Standard path redirected'}
                            subtitle={!showSelectedGuardrailDecision ? (
                              <>
                                <span className="agent-studio-operational-event-meta">
                                  {actionControlSpotlightDecision?.sessionId} · {actionControlSpotlightDecision?.timestamp} · {actionControlSpotlightDecision?.timing === 'post_tool'
                                    ? `Evaluated after ${actionControlSpotlightDecision.actionName}`
                                    : `Evaluated before ${actionControlSpotlightDecision?.actionName}`}
                                </span>
                                <span>
                                  {actionControlSpotlightDecision?.timing === 'post_tool'
                                    && `${actionControlSpotlightDecision.actionName} completed. `}
                                  {actionControlSpotlightUnlocked
                                    ? `${actionControlSpotlightUnlockedName} was unlocked`
                                    : actionControlSpotlightDecision?.toolExecuted
                                      ? `${actionControlSpotlightDecision?.actionName} continued`
                                      : `${actionControlSpotlightDecision?.actionName} was skipped`}
                                  {actionControlSpotlightEvidence
                                    ? ` after ${actionControlSpotlightEvidence.field} ${Number(actionControlSpotlightEvidence.actual).toLocaleString('en-US')} exceeded ${Number(actionControlSpotlightEvidence.expected).toLocaleString('en-US')}.`
                                    : ' after the configured control matched.'}
                                  {actionControlSpotlightDecision?.timing === 'post_tool'
                                    && actionControlSpotlightDecision.matched
                                    && ' The standard automated path stopped.'}
                                  {!actionControlSpotlightUnlocked && ' No gated action was unlocked.'}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="agent-studio-operational-event-meta">
                                  {eagleGuardrailSession?.id ?? 'Session'} · {eagleGuardrailEvent?.time ?? 'Just now'} · Adaptive guardrail blocked sensitive input
                                </span>
                                <span>{eagleGuardrailEvent?.text ?? 'Sensitive payment data was blocked and removed from the transcript.'}</span>
                              </>
                            )}
                            actions={[{
                              label: 'View session →',
                              onClick: () => navigate(
                                showSelectedGuardrailDecision
                                  ? eagleGuardrailSessionPath
                                  : eagleActionControlSessionPath,
                              ),
                              variant: 'outline',
                            }]}
                            dismissable={false}
                          />
                        </div>
                      )
                    ) : selectedGuardrail && selectedGuardrail.count > 0 ? (
                      <Banner
                        type="success"
                        icon="shield"
                        className="agent-studio-operational-event-banner agent-studio-connected-event-banner"
                        title={operationalEvent.eventTitle}
                        subtitle={(
                          <>
                            <span className="agent-studio-operational-event-meta">{operationalEvent.eventMeta}</span>
                            <span>{operationalEvent.eventDescription}</span>
                          </>
                        )}
                        actions={[{
                          label: 'View session →',
                          onClick: () => navigate(operationalSessionPath),
                          variant: 'outline',
                        }]}
                        dismissable={false}
                      />
                    ) : null}

                    {SHOW_CONNECTED_SUGGESTIONS && (
                    <section className="agent-studio-connected-insights" aria-labelledby="connected-insights-title">
                      <div className="agent-studio-connected-insights__heading">
                        <span className="agent-studio-card-heading__icon agent-studio-connected-insights__bulb" aria-hidden="true">
                          <svg viewBox="0 0 20 20" fill="none">
                            <path d="M10 2.25a5.75 5.75 0 0 0-3.55 10.27c.7.55 1.05 1.3 1.05 2.23h5c0-.93.35-1.68 1.05-2.23A5.75 5.75 0 0 0 10 2.25Z" />
                            <path d="M7.75 16.25h4.5M8.5 18h3M8.25 9.25 10 11l1.75-1.75M10 11v3.75" />
                          </svg>
                        </span>
                        <div>
                          <h3 id="connected-insights-title">Suggestions</h3>
                          <p>Signals worth checking before the next configuration change</p>
                        </div>
                      </div>
                      <div className="agent-studio-connected-insights__list">
                        <button type="button" onClick={() => goToSection('Action')}>
                          <span className="agent-studio-connected-insights__status">
                            <Icon name="tools" weight="bold" size="sm" />
                          </span>
                          <span>
                            <strong>
                              {connectedActionPerformance.length > 0
                                ? 'Keep action success above target'
                                : 'Connect an action'}
                            </strong>
                            <small>
                              {connectedActionPerformance.length > 0
                                ? `All ${connectedActionPerformance.length} connected actions are at or above the 95% target.`
                                : 'Add an action to track success and availability.'}
                            </small>
                          </span>
                          <Icon name="arrow-right" weight="bold" size="sm" />
                        </button>
                        <button type="button" onClick={() => goToSection('Knowledge')}>
                          <span className="agent-studio-connected-insights__status">
                            <KnowledgeBookIcon size={16} />
                          </span>
                          <span>
                            <strong>
                              {connectedCapabilityCount > 0 ? 'Maintain healthy coverage' : 'Connect knowledge'}
                            </strong>
                            <small>
                              {connectedCapabilityCount > 0
                                ? `All ${connectedCapabilityCount} resources are connected with no availability issues.`
                                : 'Add a knowledge source to start measuring coverage.'}
                            </small>
                          </span>
                          <Icon name="arrow-right" weight="bold" size="sm" />
                        </button>
                      </div>
                    </section>
                    )}
              </div>
            </CardBody>
          </Card>
          ) : cardId === 'operational' && showOperationalStatus ? (
            <Card
              key={cardId}
              className={[
                'agent-studio-card agent-studio-card--summary agent-studio-card--operational',
                'agent-studio-overview-card agent-studio-overview-tile',
                draggedOverviewTile?.group === 'cards' && draggedOverviewTile.id === cardId
                  ? 'is-dragging'
                  : '',
                overviewDropTarget?.group === 'cards' && overviewDropTarget.id === cardId
                  ? 'is-drop-target'
                  : '',
              ].filter(Boolean).join(' ')}
              draggable
              onDragStart={event => handleOverviewTileDragStart(event, 'cards', cardId)}
              onDragOver={event => handleOverviewTileDragOver(event, 'cards', cardId)}
              onDrop={event => handleOverviewTileDrop(event, 'cards', cardId)}
              onDragEnd={handleOverviewTileDragEnd}
            >
              <button
                type="button"
                className="agent-studio-overview-card__drag-handle"
                aria-label={`Reorder Operational status. Position ${index + 1} of ${overviewCardOrder.length}`}
                title="Drag to reorder. Use arrow keys to move this card."
                onKeyDown={event => handleOverviewTileKeyDown(event, 'cards', cardId)}
              >
                <Icon name="dragger-vertical" weight="bold" size="sm" />
              </button>
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
                      <svg viewBox="0 0 208 108" aria-hidden="true">
                        <path
                          className="agent-studio-health-gauge__track"
                          d="M 12 104 A 92 92 0 0 1 196 104"
                          fill="none"
                          pathLength="100"
                          strokeWidth="5"
                        />
                        <path
                          className="agent-studio-health-gauge__value-arc"
                          d="M 12 104 A 92 92 0 0 1 196 104"
                          fill="none"
                          pathLength="100"
                          strokeWidth="5"
                          strokeDasharray={`${OPERATIONAL_HEALTH.score} 100`}
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
                        <dd className="is-positive">+{OPERATIONAL_HEALTH_GAP}</dd>
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
                <section
                  className="agent-studio-session-events"
                  aria-labelledby="agent-studio-session-events-title"
                >
                  <div className="agent-studio-session-events__header">
                    <div>
                      <strong id="agent-studio-session-events-title">Session events</strong>
                      <span>{operationalTimeRangeLabel}</span>
                    </div>
                    <div className="agent-studio-session-events__actions">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`${sessionsPath}?source=observability`)}
                      >
                        <Icon name="transcript" weight="bold" size="sm" />
                        Open Sessions
                      </Button>
                    </div>
                  </div>
                  <Table className="agent-studio-session-events__table">
                    <TableHead>
                      <TableRow>
                        <TableHeader>Channel</TableHeader>
                        <TableHeader>Session ID</TableHeader>
                        <TableHeader>Customer</TableHeader>
                        <TableHeader>Messages</TableHeader>
                        <TableHeader>Updated</TableHeader>
                        <TableHeader>Outcome</TableHeader>
                        <TableHeader>Event</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody
                      empty={operationalSessions.length === 0}
                      emptyTitle="No sessions in this time range"
                      emptyDescription="Choose a longer time range to see recent sessions."
                      colSpan={7}
                    >
                      {operationalSessions.map(session => (
                        <TableRow
                          key={session.id}
                          onClick={() => navigate(
                            `${sessionsPath}?sessionId=${encodeURIComponent(session.id)}&source=observability`,
                          )}
                        >
                          <TableCell>
                            <span className="agent-session-channel">
                              <Icon name={session.channel === 'Voice' ? 'phone' : 'chat'} weight="regular" size="sm" />
                              {session.channel}
                            </span>
                          </TableCell>
                          <TableCell><strong>{session.id}</strong><small>{session.topic}</small></TableCell>
                          <TableCell>{session.customer}</TableCell>
                          <TableCell>{session.messages}</TableCell>
                          <TableCell>{session.updated}</TableCell>
                          <TableCell>
                            <Badge variant={sessionOutcomeVariant(session.outcome)}>{session.outcome}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="agent-session-metadata-icons">
                              {session.actionControlTriggered && (
                                <Badge
                                  variant="info"
                                  className="agent-session-metadata-icons__action-control"
                                >
                                  <Icon name="automation" weight="bold" size="sm" />
                                  Agent control
                                </Badge>
                              )}
                              {session.guardrailTriggered && (
                                <Badge variant="warning">
                                  <Icon name="shield" weight="bold" size="sm" />
                                  Guardrail
                                </Badge>
                              )}
                              {session.transferred && (
                                <span title="Human transfer">
                                  <Icon name="headset" weight="bold" size="sm" />
                                </span>
                              )}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </section>
              </CardBody>
            </Card>
          ) : null)}
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
