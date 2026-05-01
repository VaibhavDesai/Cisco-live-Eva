import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import Button from '../components/shared/Button';
import { AccordionItem, AiFooter, AiResponseMessage, AiSymbol, AiThreadPanel, AiUserMessage, Badge, DividerWithLabel, Dropdown, Input, Slider, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea, Toggle } from '../components/shared';
import { AgentCard } from '../components/agents';
import { Icon } from '../icons';
import type { IconName } from '../icons/types';
import { EVA_TEMPLATES } from '../features/eva';
import type { EvaAgentDraft, EvaMessage, EvaTemplateId } from '../features/eva';
import { optimizeInstructions } from '../api/ciscoAi';
import { CAPABILITIES } from './agent/actionConfigShared';

const gradient = 'linear-gradient(135deg, var(--accent-bg), var(--bg-glass-light))';
type EvaConversationStep = 'profile' | 'instructions' | 'knowledge' | 'actions' | 'channels' | 'security' | 'review';
type EvaLandingMode = 'build' | 'existing';
type EvaSecurityTier = 'standard' | 'advanced';
type EvaChannelType = 'digital' | 'voice';
type EvaDigitalChannel = 'chat' | 'email' | 'sms';
type EvaSensitivity = 'low' | 'medium' | 'high';
type EvaEnforcement = 'monitor' | 'block';
type EvaDirection = 'prompt' | 'response';
type EvaThread = { id: string; title: string; group?: string };

const evaStepOrder: EvaConversationStep[] = ['profile', 'channels', 'instructions', 'knowledge', 'actions', 'security', 'review'];
const EVA_SESSION_STORAGE_KEY = 'eva-agents-session-state';

const sensitivityToValue: Record<EvaSensitivity, number> = {
  low: 0,
  medium: 50,
  high: 100,
};

const valueToSensitivity = (value: number): EvaSensitivity => {
  if (value <= 0) return 'low';
  if (value >= 100) return 'high';
  return 'medium';
};

const isOrchestrationIntent = (normalized: string) => (
  (
    normalized.includes('connect')
    || normalized.includes('orchestrat')
    || normalized.includes('handoff')
    || normalized.includes('coordinate')
    || normalized.includes('link')
  )
  && (
    normalized.includes('agent')
    || normalized.includes('workflow')
    || normalized.includes('flow')
  )
) || normalized.includes('multi-agent');

const PROFILE_TIMEZONE_OPTIONS = [
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
  { value: 'UTC', label: 'UTC' },
];

const PROFILE_LANGUAGE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
];

const PROFILE_VOICE_OPTIONS = [
  { value: 'ava', label: 'Ava' },
  { value: 'daniel', label: 'Daniel' },
  { value: 'emma', label: 'Emma' },
  { value: 'liam', label: 'Liam' },
  { value: 'sophia', label: 'Sophia' },
];

const CHANNEL_PHONE_NUMBER_OPTIONS = [
  { value: '+1 415 555 0198', label: '+1 415 555 0198' },
  { value: '+1 512 555 0142', label: '+1 512 555 0142' },
  { value: '+44 20 7946 0958', label: '+44 20 7946 0958' },
];

const DIGITAL_CHANNEL_OPTIONS: Array<{ value: EvaDigitalChannel; label: string }> = [
  { value: 'chat', label: 'Chat' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
];

const DIGITAL_CHANNEL_DETAILS: Record<EvaDigitalChannel, {
  label: string;
  placeholder: string;
  hint: string;
  inputType: string;
}> = {
  chat: {
    label: 'Chat entry point',
    placeholder: 'support-chat',
    hint: 'Use the Webex Connect chat asset, widget, or queue address.',
    inputType: 'text',
  },
  email: {
    label: 'Email address',
    placeholder: 'support@example.com',
    hint: 'Use the mailbox customers should send requests to.',
    inputType: 'email',
  },
  sms: {
    label: 'SMS number',
    placeholder: '+1 415 555 0198',
    hint: 'Use the SMS-capable number for inbound customer messages.',
    inputType: 'tel',
  },
};

const INSTRUCTION_EXAMPLES = [
  {
    title: 'Customer Service Representative',
    content: `#### Role & Identity\nYou are a professional customer service representative dedicated to providing exceptional support and assistance across all customer touchpoints.\n\n#### Primary Goals\nResolve customer inquiries efficiently, ensure satisfaction in every interaction, and build lasting positive relationships.\n\n#### Guardrails\nYou must NOT make unauthorized promises, share confidential information, or engage in conversations outside your defined support scope.\n\n#### Output Rules\nMaintain a warm, empathetic, and professional tone in all communications.`,
  },
  {
    title: 'Healthcare Appointment Scheduler',
    content: `#### Role & Identity\nYou are a virtual receptionist for a healthcare clinic, helping patients schedule, reschedule, and cancel appointments.\n\n#### Primary Goals\nEfficiently manage appointment bookings while ensuring patients feel heard and cared for.\n\n#### Guardrails\nNever provide medical advice or diagnoses. Always direct urgent medical concerns to emergency services.\n\n#### Output Rules\nBe compassionate and reassuring. Always confirm appointment details before finalizing.`,
  },
  {
    title: 'IT Help Desk Agent',
    content: `#### Role & Identity\nYou are an IT help desk agent assisting employees with common technical issues including password resets, VPN, software installations, and access requests.\n\n#### Primary Goals\nResolve technical issues quickly through structured troubleshooting. Escalate to specialized teams when remote resolution is not possible.\n\n#### Guardrails\nNever ask for or store full passwords. Do not provide workarounds that bypass security policies.\n\n#### Output Rules\nUse clear, step-by-step instructions. Provide ticket numbers for escalations.`,
  },
];

const starterPrompts: Array<{
  templateId: EvaTemplateId;
  title: string;
  description: string;
  prompt: string;
  icon: IconName;
}> = [
  {
    templateId: 'customer-support',
    title: 'Customer onboarding',
    description: 'Build an agent that guides new customers from signup to activation.',
    prompt: 'Create an AI agent for customer onboarding.',
    icon: 'bot-customer-assistant',
  },
  {
    templateId: 'knowledge-assistant',
    title: 'Healthcare receptionist',
    description: 'Route appointments, insurance questions, medical FAQs, and billing.',
    prompt: 'Create a healthcare receptionist agent.',
    icon: 'headset',
  },
  {
    templateId: 'workflow-automation',
    title: 'IT support copilot',
    description: 'Diagnose issues, search docs, create tickets, and trigger workflows.',
    prompt: 'Create an IT support copilot agent.',
    icon: 'setup-assistant',
  },
  {
    templateId: 'policy-compliance',
    title: 'Policy reviewer',
    description: 'Guide employees through governed requests and compliance checks.',
    prompt: 'Create a policy compliance review agent.',
    icon: 'shield',
  },
];

const evaPlanningRows: Array<{ icon: IconName; title: string; text: (draft: EvaAgentDraft, generatedName: string, prompt?: string) => string; status: string }> = [
  { icon: 'check', title: 'Understand request', text: (_draft, _generatedName, prompt) => `Interpreted the prompt${prompt ? `: "${prompt}"` : ''}.`, status: 'done' },
  { icon: 'sparkle', title: 'Choose starting profile', text: (_draft, generatedName) => `Matched the request to "${generatedName}" as the initial agent profile.`, status: 'done' },
  { icon: 'document', title: 'Pre-plan configuration', text: draft => `Prepared profile, instructions, knowledge, actions, and guardrails from ${draft.knowledgeBases.length} recommended knowledge source${draft.knowledgeBases.length === 1 ? '' : 's'}.`, status: 'active' },
  { icon: 'check', title: 'Guide setup', text: () => 'Ready to walk through each configuration step with your confirmation.', status: 'queued' },
];

const EVA_ACTION_ROWS = CAPABILITIES.map((capability, index) => ({
  id: capability.id,
  name: capability.name,
  description: capability.description || 'Escalate the conversation to a human agent based on general rules and conditions',
  actionType: index === 0 ? 'Transfer' : capability.type === 'Handoff' ? 'MCP' : capability.type,
  providerType: 'System',
  createdBy: index === 0 ? 'System' : 'Claire',
  lastUpdated: '02/28/25, at 1:08 AM',
}));

const EVA_STANDARD_GUARDRAILS = [
  { id: 'std-toxicity', name: 'Toxicity', description: 'Detect and filter toxic language, insults, and abusive content in conversations.', enabled: true, sensitivity: 'medium' as EvaSensitivity, enforcement: 'monitor' as EvaEnforcement, direction: 'response' as EvaDirection },
  { id: 'std-harm', name: 'Harm detection', description: 'Identify requests or responses that could cause physical, emotional, or financial harm.', enabled: false, sensitivity: 'medium' as EvaSensitivity, enforcement: 'monitor' as EvaEnforcement, direction: 'response' as EvaDirection },
  { id: 'std-jailbreak', name: 'Jailbreak', description: 'Detect prompt injection attempts designed to bypass agent instructions and safety rules.', enabled: true, sensitivity: 'medium' as EvaSensitivity, enforcement: 'block' as EvaEnforcement, direction: 'prompt' as EvaDirection },
  { id: 'std-multiturn', name: 'Multi-turn jailbreak', description: 'Detect multi-step manipulation where users gradually steer the agent away from its guardrails across turns.', enabled: false, sensitivity: 'medium' as EvaSensitivity, enforcement: 'block' as EvaEnforcement, direction: 'prompt' as EvaDirection },
];

const EVA_ADVANCED_GUARDRAIL_GROUPS: Array<{
  id: string;
  label: string;
  icon: IconName;
  items: Array<{ id: string; name: string; description: string; enabled: boolean; sensitivity: EvaSensitivity; enforcement: EvaEnforcement; direction: EvaDirection }>;
}> = [
  {
    id: 'security',
    label: 'Security guardrails',
    icon: 'shield',
    items: [
      { id: 'sec-prompt-injection', name: 'Prompt injection', description: 'Detect attempts to manipulate the agent with hidden instructions.', enabled: false, sensitivity: 'medium', enforcement: 'block', direction: 'prompt' },
      { id: 'sec-system-prompt', name: 'System prompt extraction', description: 'Prevent users from tricking the agent into revealing its system prompt.', enabled: false, sensitivity: 'medium', enforcement: 'block', direction: 'prompt' },
      { id: 'sec-sql-injection', name: 'SQL injection', description: 'Identify inputs crafted to execute unauthorized database queries.', enabled: false, sensitivity: 'medium', enforcement: 'block', direction: 'prompt' },
    ],
  },
  {
    id: 'privacy',
    label: 'Privacy guardrails',
    icon: 'privacy-circle',
    items: [
      { id: 'priv-pii', name: 'PII detection', description: 'Identify personally identifiable information in agent responses.', enabled: false, sensitivity: 'medium', enforcement: 'block', direction: 'response' },
      { id: 'priv-ssn', name: 'SSN redaction', description: 'Automatically redact Social Security numbers from responses.', enabled: false, sensitivity: 'medium', enforcement: 'block', direction: 'response' },
      { id: 'priv-credit-card', name: 'Credit card redaction', description: 'Strip credit card numbers from agent output before delivery.', enabled: false, sensitivity: 'medium', enforcement: 'block', direction: 'response' },
    ],
  },
  {
    id: 'safety',
    label: 'Safety guardrails',
    icon: 'check-circle',
    items: [
      { id: 'safe-toxicity', name: 'Toxicity', description: 'Detect and block toxic, abusive, or offensive language in responses.', enabled: false, sensitivity: 'medium', enforcement: 'block', direction: 'response' },
      { id: 'safe-hate', name: 'Hate speech', description: 'Block responses containing hate speech targeting protected groups.', enabled: false, sensitivity: 'medium', enforcement: 'block', direction: 'response' },
      { id: 'safe-misinfo', name: 'Misinformation', description: 'Flag responses containing known false or misleading claims.', enabled: false, sensitivity: 'medium', enforcement: 'monitor', direction: 'response' },
    ],
  },
];

interface EvaSessionState {
  landingMode: EvaLandingMode;
  selectedTemplateId: EvaTemplateId | null;
  draft: EvaAgentDraft;
  messages: EvaMessage[];
  guidanceVisible: boolean;
  orchestrationSuggested: boolean;
  evaStep: EvaConversationStep;
  agentName: string;
  agentDescription: string;
  avatarUrl: string;
  timezone: string;
  aiEngine: string;
  welcomeMessage: string;
  instructionPrompt: string;
  selectedKnowledgeBases: string[];
  selectedActions: string[];
  optimizeAccepted: boolean;
  preOptimizeText: string;
  optimizeSummary: { changes: string[]; reasoning: string[] };
  securityTier: EvaSecurityTier;
  channelType: EvaChannelType;
  digitalChannel?: EvaDigitalChannel;
  digitalChannelAddress?: string;
  channelPhoneNumber: string;
  standardGuardrails: typeof EVA_STANDARD_GUARDRAILS;
  advancedGuardrailGroups: typeof EVA_ADVANCED_GUARDRAIL_GROUPS;
  expandedAdvancedGroups: string[];
  personality: { llm: string; voice: string; language: string; gender: string };
  customRules: string[];
}

function readEvaSessionState(): EvaSessionState | null {
  try {
    const raw = window.sessionStorage.getItem(EVA_SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) as EvaSessionState : null;
  } catch {
    return null;
  }
}

function buildGuidanceMessage(draft: EvaAgentDraft) {
  return [
    `I can turn this into ${draft.name}. Here is the guided setup I recommend:`,
    '',
    `1. Basic profile: ${draft.description}`,
    `2. Available knowledge: ${draft.knowledgeBases.length ? draft.knowledgeBases.join(', ') : 'choose trusted knowledge sources'}`,
    `3. Actions: ${draft.actions.length ? draft.actions.join(', ') : 'decide whether the agent should take action'}`,
    `4. Security settings: ${draft.security.join(', ')}`,
  ].join('\n');
}

function buildInstructionPrompt(draft: EvaAgentDraft) {
  return [
    `You are ${draft.name}.`,
    '',
    `Purpose: ${draft.description}`,
    '',
    'Goals:',
    ...draft.goals.map(goal => `- ${goal}`),
    '',
    'Behavior and guardrails:',
    ...draft.security.map(rule => `- ${rule}`),
    '',
    'Response style: Be clear, concise, grounded in approved knowledge, and explicit about next steps.',
  ].join('\n');
}

function buildWelcomeMessage(draft: EvaAgentDraft) {
  const firstGoal = draft.goals[0]?.toLowerCase() ?? 'help with your request';
  return `Hi, I am ${draft.name.replace(/\s+Eva Agent$/, '')}. I can ${firstGoal} and guide you to the right next step.`;
}

function summarizeInstructionPrompt(prompt: string) {
  const summary = prompt
    .split('\n')
    .map(line => line.replace(/^#+\s*/, '').replace(/^-\s*/, '').trim())
    .filter(Boolean)
    .filter(line => !line.endsWith(':'))
    .slice(0, 3)
    .join(' ');

  return summary.length > 220 ? `${summary.slice(0, 217).trim()}...` : summary || 'No instruction summary added';
}

export default function Agents() {
  const navigate = useNavigate();
  const { agents, addAgent, aiEngines, selectAgent, setIsCreateModalOpen, showToast } = useApp();
  const restoredEvaSessionRef = useRef<EvaSessionState | null>(null);
  if (restoredEvaSessionRef.current === null) {
    restoredEvaSessionRef.current = readEvaSessionState();
  }
  const restoredEvaSession = restoredEvaSessionRef.current;
  const [landingMode, setLandingMode] = useState<EvaLandingMode>(restoredEvaSession?.landingMode ?? 'build');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<EvaTemplateId | null>(restoredEvaSession?.selectedTemplateId ?? null);
  const [draft, setDraft] = useState<EvaAgentDraft>(restoredEvaSession?.draft ?? EVA_TEMPLATES[0].draft);
  const [messages, setMessages] = useState<EvaMessage[]>(restoredEvaSession?.messages ?? []);
  const [guidanceVisible, setGuidanceVisible] = useState(restoredEvaSession?.guidanceVisible ?? false);
  const [evaThinking, setEvaThinking] = useState(false);
  const [orchestrationSuggested, setOrchestrationSuggested] = useState(restoredEvaSession?.orchestrationSuggested ?? false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [evaStep, setEvaStep] = useState<EvaConversationStep>(restoredEvaSession?.evaStep ?? 'profile');
  const [agentName, setAgentName] = useState(restoredEvaSession?.agentName ?? EVA_TEMPLATES[0].draft.name);
  const [agentDescription, setAgentDescription] = useState(restoredEvaSession?.agentDescription ?? EVA_TEMPLATES[0].draft.description);
  const [avatarUrl, setAvatarUrl] = useState(restoredEvaSession?.avatarUrl ?? 'https://us.webexbotbuilder.com/static/assets/i...');
  const [timezone, setTimezone] = useState(restoredEvaSession?.timezone ?? 'Europe/London');
  const [aiEngine, setAiEngine] = useState(restoredEvaSession?.aiEngine ?? 'Webex AI Pro 1.0');
  const [welcomeMessage, setWelcomeMessage] = useState(restoredEvaSession?.welcomeMessage ?? 'Hi, I am Eva. I can help answer questions, guide next steps, and connect you with the right support path.');
  const [instructionPrompt, setInstructionPrompt] = useState(restoredEvaSession?.instructionPrompt ?? '');
  const [selectedKnowledgeBases, setSelectedKnowledgeBases] = useState<string[]>(restoredEvaSession?.selectedKnowledgeBases ?? EVA_TEMPLATES[0].draft.knowledgeBases.slice(0, 2));
  const [selectedActions, setSelectedActions] = useState<string[]>(restoredEvaSession?.selectedActions ?? EVA_TEMPLATES[0].draft.actions.slice(0, 2));
  const [showInstructionExamples, setShowInstructionExamples] = useState(false);
  const [optimizingInstructions, setOptimizingInstructions] = useState(false);
  const [optimizeAccepted, setOptimizeAccepted] = useState(restoredEvaSession?.optimizeAccepted ?? false);
  const [preOptimizeText, setPreOptimizeText] = useState(restoredEvaSession?.preOptimizeText ?? '');
  const [optimizeSummary, setOptimizeSummary] = useState<{ changes: string[]; reasoning: string[] }>(restoredEvaSession?.optimizeSummary ?? { changes: [], reasoning: [] });
  const [securityTier, setSecurityTier] = useState<EvaSecurityTier>(restoredEvaSession?.securityTier ?? 'standard');
  const [channelType, setChannelType] = useState<EvaChannelType>(restoredEvaSession?.channelType ?? 'digital');
  const [digitalChannel, setDigitalChannel] = useState<EvaDigitalChannel>(restoredEvaSession?.digitalChannel ?? 'chat');
  const [digitalChannelAddress, setDigitalChannelAddress] = useState(restoredEvaSession?.digitalChannelAddress ?? '');
  const [channelPhoneNumber, setChannelPhoneNumber] = useState(restoredEvaSession?.channelPhoneNumber ?? CHANNEL_PHONE_NUMBER_OPTIONS[0].value);
  const [standardGuardrails, setStandardGuardrails] = useState(restoredEvaSession?.standardGuardrails ?? EVA_STANDARD_GUARDRAILS);
  const [advancedGuardrailGroups, setAdvancedGuardrailGroups] = useState(restoredEvaSession?.advancedGuardrailGroups ?? EVA_ADVANCED_GUARDRAIL_GROUPS);
  const [expandedAdvancedGroups, setExpandedAdvancedGroups] = useState<Set<string>>(
    () => new Set(restoredEvaSession?.expandedAdvancedGroups ?? EVA_ADVANCED_GUARDRAIL_GROUPS.map(group => group.id)),
  );
  const [personality, setPersonality] = useState(restoredEvaSession?.personality ?? {
    llm: 'Webex AI Pro 1.0',
    voice: 'ava',
    language: 'en-US',
    gender: 'neutral',
  });
  const [customRules, setCustomRules] = useState<string[]>(restoredEvaSession?.customRules ?? []);
  const [showEvaThreadPanel, setShowEvaThreadPanel] = useState(false);
  const [activeEvaThreadId, setActiveEvaThreadId] = useState('eva-thread-current');
  const [evaThreads, setEvaThreads] = useState<EvaThread[]>([
    { id: 'eva-thread-current', title: 'Current Eva setup', group: 'Today' },
    { id: 'eva-thread-canvas', title: 'Canvas orchestration', group: 'Today' },
  ]);
  const [evaPlanningProgress, setEvaPlanningProgress] = useState(0);
  const thinkingTimerRef = useRef<number | null>(null);
  const planningIntervalRef = useRef<number | null>(null);

  const persistEvaSession = (overrides: Partial<EvaSessionState> = {}) => {
    const snapshot: EvaSessionState = {
      landingMode,
      selectedTemplateId,
      draft,
      messages,
      guidanceVisible,
      orchestrationSuggested,
      evaStep,
      agentName,
      agentDescription,
      avatarUrl,
      timezone,
      aiEngine,
      welcomeMessage,
      instructionPrompt,
      selectedKnowledgeBases,
      selectedActions,
      optimizeAccepted,
      preOptimizeText,
      optimizeSummary,
      securityTier,
      channelType,
      digitalChannel,
      digitalChannelAddress,
      channelPhoneNumber,
      standardGuardrails,
      advancedGuardrailGroups,
      expandedAdvancedGroups: Array.from(expandedAdvancedGroups),
      personality,
      customRules,
      ...overrides,
    };
    window.sessionStorage.setItem(EVA_SESSION_STORAGE_KEY, JSON.stringify(snapshot));
  };

  const openEvaCanvas = (overrides: Partial<EvaSessionState> = {}) => {
    persistEvaSession(overrides);
    navigate('/agents/eva-canvas');
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 's' || !event.ctrlKey) return;
      const target = event.target;
      const isTextTarget =
        target instanceof HTMLElement &&
        Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
      if (isTextTarget) return;
      event.preventDefault();
      setVoiceActive(prev => !prev);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => () => {
    if (thinkingTimerRef.current) {
      window.clearTimeout(thinkingTimerRef.current);
    }
    if (planningIntervalRef.current) {
      window.clearInterval(planningIntervalRef.current);
    }
  }, []);

  useEffect(() => {
    if (!guidanceVisible || evaThinking) return;
    const frameId = window.requestAnimationFrame(() => {
      const stepAnchor = document.querySelector<HTMLElement>(`[data-eva-step="${evaStep}"]`);
      if (!stepAnchor) return;
      stepAnchor.focus({ preventScroll: true });
      stepAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [evaStep, guidanceVisible, evaThinking]);

  const completeEvaThinking = (callback: () => void) => {
    setEvaThinking(true);
    setGuidanceVisible(false);
    setEvaPlanningProgress(1);
    if (thinkingTimerRef.current) {
      window.clearTimeout(thinkingTimerRef.current);
    }
    if (planningIntervalRef.current) {
      window.clearInterval(planningIntervalRef.current);
    }
    planningIntervalRef.current = window.setInterval(() => {
      setEvaPlanningProgress(prev => {
        const next = Math.min(prev + 1, evaPlanningRows.length);
        if (next === evaPlanningRows.length && planningIntervalRef.current) {
          window.clearInterval(planningIntervalRef.current);
          planningIntervalRef.current = null;
        }
        return next;
      });
    }, 560);
    thinkingTimerRef.current = window.setTimeout(() => {
      setEvaPlanningProgress(evaPlanningRows.length);
      callback();
      setEvaThinking(false);
      setGuidanceVisible(true);
      thinkingTimerRef.current = null;
    }, evaPlanningRows.length * 560 + 420);
  };

  const handleTemplateSelect = (templateId: EvaTemplateId) => {
    setLandingMode('build');
    const template = EVA_TEMPLATES.find(item => item.id === templateId) ?? EVA_TEMPLATES[0];
    setMessages(prev => [
      ...prev,
      { role: 'user', text: starterPrompts.find(prompt => prompt.templateId === templateId)?.prompt ?? `Use the ${template.name} template.` },
    ]);
    completeEvaThinking(() => {
      setSelectedTemplateId(template.id);
      setDraft(template.draft);
      setEvaStep('profile');
      setAgentName(template.draft.name);
      setAgentDescription(template.draft.description);
      setTimezone('Europe/London');
      setAiEngine('Webex AI Pro 1.0');
      setWelcomeMessage(buildWelcomeMessage(template.draft));
      setInstructionPrompt(buildInstructionPrompt(template.draft));
      setPersonality(prev => ({
        ...prev,
        llm: 'Webex AI Pro 1.0',
        voice: 'ava',
        language: 'en-US',
      }));
      setSelectedKnowledgeBases(template.draft.knowledgeBases.slice(0, 2));
      setSelectedActions(template.draft.actions.slice(0, 2));
      setCustomRules([]);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: buildGuidanceMessage(template.draft),
          followups: ['Create this agent', 'Open Knowledge setup', 'Open Actions setup', 'Open Security setup'],
        },
      ]);
    });
  };

  const handleBuildFromScratch = () => {
    setIsCreateModalOpen(true);
  };

  const handleNewEvaThread = () => {
    const id = `eva-thread-${Date.now()}`;
    setEvaThreads(prev => [{ id, title: 'New thread', group: 'Today' }, ...prev]);
    setActiveEvaThreadId(id);
    setMessages([]);
    setGuidanceVisible(false);
    setEvaThinking(false);
    setOrchestrationSuggested(false);
    setLandingMode('build');
  };

  const handleSelectEvaThread = (threadId: string | number) => {
    setActiveEvaThreadId(String(threadId));
  };

  const handleRenameEvaThread = (threadId: string | number) => {
    const currentThread = evaThreads.find(thread => thread.id === String(threadId));
    const nextTitle = window.prompt('Rename thread', currentThread?.title ?? '');
    if (!nextTitle?.trim()) return;
    setEvaThreads(prev => prev.map(thread =>
      thread.id === String(threadId) ? { ...thread, title: nextTitle.trim() } : thread,
    ));
  };

  const handleDeleteEvaThread = (threadId: string | number) => {
    const id = String(threadId);
    setEvaThreads(prev => {
      const next = prev.filter(thread => thread.id !== id);
      if (activeEvaThreadId === id) {
        setActiveEvaThreadId(next[0]?.id ?? 'eva-thread-current');
      }
      return next.length ? next : [{ id: 'eva-thread-current', title: 'Current Eva setup', group: 'Today' }];
    });
  };

  const handleEvaOptimizeInstructions = async () => {
    const text = instructionPrompt.trim();
    if (!text || optimizingInstructions) return;

    setOptimizingInstructions(true);
    setPreOptimizeText(instructionPrompt);
    setOptimizeAccepted(false);
    setOptimizeSummary({ changes: [], reasoning: [] });

    try {
      const result = await optimizeInstructions(text);
      setInstructionPrompt(result.optimizedText);
      setOptimizeSummary({ changes: result.changes, reasoning: result.reasoning });
      setOptimizeAccepted(true);
      showToast('Optimized instruction prompt', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Optimization failed';
      showToast(message, 'error');
    } finally {
      setOptimizingInstructions(false);
    }
  };

  const handleEvaUndoOptimize = () => {
    setInstructionPrompt(preOptimizeText);
    setOptimizeAccepted(false);
    setOptimizeSummary({ changes: [], reasoning: [] });
    showToast('Reverted to original instructions', 'success');
  };

  const createDraftAgent = () => {
    const agent = addAgent({
      name: agentName,
      description: agentDescription,
      gradient,
      status: 'Ready to Publish',
      knowledgeBases: selectedKnowledgeBases,
    });
    showToast(`Eva created "${agentName}" as a draft agent.`, 'success');
    navigate(`/agents/${agent.id}/configure?section=Profile`);
  };

  const handleAgentClick = (agentId: string) => {
    selectAgent(agentId);
    navigate(`/agents/${agentId}`);
  };

  const handleConfigureClick = (agentId: string) => {
    selectAgent(agentId);
    navigate(`/agents/${agentId}/configure`);
  };

  const getBadgeVariant = (statusClass: string) => {
    if (statusClass === 'badge-success') return 'success';
    if (statusClass === 'badge-warning') return 'warning';
    return 'default';
  };

  const handleSectionJump = (section: 'Profile' | 'Knowledge' | 'Action' | 'Security') => {
    const existingAgent = Object.values(agents)[0];
    if (!existingAgent) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'Create a draft agent first, then I can take you directly into that configuration section.',
          followups: ['Create this agent'],
        },
      ]);
      return;
    }
    selectAgent(existingAgent.id);
    navigate(`/agents/${existingAgent.id}/configure?section=${section}`);
  };

  const showOrchestrationSuggestion = () => {
    setLandingMode('build');
    setGuidanceVisible(false);
    setEvaThinking(false);
    setOrchestrationSuggested(true);
  };

  const handleSend = (text: string) => {
    const normalized = text.trim().toLowerCase();
    if (!normalized) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setOrchestrationSuggested(false);

    if (isOrchestrationIntent(normalized) || normalized.includes('canvas') || normalized.includes('collaboration')) {
      showOrchestrationSuggestion();
      return;
    }

    if (normalized.includes('knowledge')) {
      handleSectionJump('Knowledge');
      return;
    }

    if (normalized.includes('action')) {
      handleSectionJump('Action');
      return;
    }

    if (normalized.includes('security') || normalized.includes('policy')) {
      handleSectionJump('Security');
      return;
    }

    if (normalized === 'create this agent' || normalized === 'create draft agent') {
      createDraftAgent();
      return;
    }

    const matchedTemplate =
      normalized.includes('healthcare') || normalized.includes('reception')
        ? EVA_TEMPLATES.find(template => template.id === 'knowledge-assistant')
        : normalized.includes('it ') || normalized.includes('ticket') || normalized.includes('support')
          ? EVA_TEMPLATES.find(template => template.id === 'workflow-automation')
          : normalized.includes('policy') || normalized.includes('compliance')
            ? EVA_TEMPLATES.find(template => template.id === 'policy-compliance')
            : normalized.includes('sales')
              ? EVA_TEMPLATES.find(template => template.id === 'sales-enablement')
              : EVA_TEMPLATES.find(template => template.id === (selectedTemplateId ?? 'customer-support'));

    completeEvaThinking(() => {
      if (matchedTemplate) {
        setSelectedTemplateId(matchedTemplate.id);
        setDraft(matchedTemplate.draft);
        setAgentName(matchedTemplate.draft.name);
        setAgentDescription(matchedTemplate.draft.description);
        setTimezone('Europe/London');
        setAiEngine('Webex AI Pro 1.0');
        setWelcomeMessage(buildWelcomeMessage(matchedTemplate.draft));
        setInstructionPrompt(buildInstructionPrompt(matchedTemplate.draft));
        setPersonality(prev => ({
          ...prev,
          llm: 'Webex AI Pro 1.0',
          voice: 'ava',
          language: 'en-US',
        }));
        setSelectedKnowledgeBases(matchedTemplate.draft.knowledgeBases.slice(0, 2));
        setSelectedActions(matchedTemplate.draft.actions.slice(0, 2));
      }
      setEvaStep('profile');
      setCustomRules([]);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: buildGuidanceMessage(matchedTemplate?.draft ?? draft),
          followups: ['Create this agent', 'Open the canvas', 'Open Knowledge setup', 'Open Security setup'],
        },
      ]);
    });
  };

  const handleWaterfallFollowup = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const normalized = trimmed.toLowerCase();
    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setOrchestrationSuggested(false);

    if (normalized === 'complete create agent' || normalized === 'complete agent creation') {
      createDraftAgent();
      return;
    }

    if (isOrchestrationIntent(normalized) || normalized.includes('canvas')) {
      showOrchestrationSuggestion();
      return;
    }

    if (normalized === 'create this agent' || normalized === 'create agent') {
      createDraftAgent();
      return;
    }

    if (normalized.includes('review configuration')) {
      setEvaStep('review');
      return;
    }

    if (normalized.includes('looks good') || normalized.includes('continue')) {
      const nextIndex = Math.min(currentStepIndex + 1, evaStepOrder.length - 1);
      setEvaStep(evaStepOrder[nextIndex]);
      return;
    }

    if (normalized.includes('guardrail')) {
      setCustomRules(prev => [...prev, trimmed]);
      setInstructionPrompt(prev => `${prev}\n\nAdditional guardrail:\n- ${trimmed}`);
      setEvaStep('review');
      return;
    }

    if (evaStep === 'profile') {
      setWelcomeMessage(trimmed);
      setEvaStep('channels');
      return;
    }

    if (evaStep === 'channels') {
      if (channelType === 'digital') {
        setDigitalChannelAddress(trimmed);
      } else {
        setChannelPhoneNumber(trimmed);
      }
      setEvaStep('instructions');
      return;
    }

    if (evaStep === 'instructions') {
      setInstructionPrompt(prev => `${prev}\n\nAdditional user direction:\n- ${trimmed}`);
      setEvaStep('knowledge');
      return;
    }

    if (evaStep === 'knowledge') {
      setSelectedKnowledgeBases(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
      setEvaStep('actions');
      return;
    }

    if (evaStep === 'actions') {
      setSelectedActions(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
      setEvaStep('security');
      return;
    }

    setCustomRules(prev => [...prev, trimmed]);
  };

  const handleNextStepSuggestion = (text: string) => {
    setCustomRules(prev => [...prev, text]);
    setInstructionPrompt(prev => `${prev}\n\nAdditional task:\n- ${text}`);
    showToast('Added task to the agent instructions.', 'success');
  };

  const generatedName = draft.name.includes('Customer')
    ? 'ClaimClarity'
    : draft.name.replace(/\s+Eva Agent$/, '').replace(/\s+Agent$/, '') || 'EvaAgent';

  const currentStepIndex = evaStepOrder.indexOf(evaStep);
  const visibleSteps = evaStepOrder.slice(0, currentStepIndex + 1);
  const latestUserMessage = [...messages].reverse().find(message => message.role === 'user');
  const existingAgentList = Object.values(agents);
  const aiEngineOptions = aiEngines.map(engine => ({ value: engine.name, label: engine.name }));
  const profileInitials = agentName
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'EA';
  const filteredAgents = existingAgentList.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'published' && agent.status === 'Published') ||
      (statusFilter === 'draft' && agent.status !== 'Published');
    return matchesSearch && matchesStatus;
  });
  const showLandingOptions = !guidanceVisible && !evaThinking && !orchestrationSuggested;
  const showBuildFlow = landingMode === 'build' || guidanceVisible || evaThinking || orchestrationSuggested;
  const shouldShowEvaThreadPanel = showEvaThreadPanel && !showLandingOptions;
  const evaFirstInterfaceStyle = showLandingOptions ? { padding: '12px 24px' } : undefined;
  const evaHeroStyle = showLandingOptions ? { paddingTop: '20px' } : undefined;
  const selectedLanguage = PROFILE_LANGUAGE_OPTIONS.find(option => option.value === personality.language);
  const selectedVoice = PROFILE_VOICE_OPTIONS.find(option => option.value === personality.voice);
  const languageSummary = selectedLanguage?.label ?? personality.language;
  const agentCharacterSummary = `${selectedVoice?.label ?? personality.voice} voice · ${personality.gender === 'neutral' ? 'Neutral' : personality.gender} character`;
  const instructionSummary = summarizeInstructionPrompt(instructionPrompt);
  const selectedDigitalChannel = DIGITAL_CHANNEL_OPTIONS.find(option => option.value === digitalChannel) ?? DIGITAL_CHANNEL_OPTIONS[0];
  const selectedDigitalChannelDetails = DIGITAL_CHANNEL_DETAILS[digitalChannel];
  const channelDestination = channelType === 'digital' ? digitalChannelAddress.trim() : channelPhoneNumber;
  const channelSummary = channelType === 'digital'
    ? `${selectedDigitalChannel.label} · ${channelDestination || 'Add address or number'}`
    : `Voice · ${channelPhoneNumber}`;
  const renderUserPromptForStep = (step: EvaConversationStep) => (
    latestUserMessage && evaStep === step
      ? <AiUserMessage key={`user-${step}-${latestUserMessage.text}`} text={step === 'review' ? 'I want to review all my configurations to a agent' : latestUserMessage.text} />
      : null
  );
  const renderEvaPlanningRows = (visibleCount = evaPlanningRows.length, dynamic = false, complete = false) => (
    <div
      className={`eva-waterfall-card eva-waterfall-status eva-waterfall-status--planning${dynamic ? ' eva-waterfall-status--dynamic' : ''}`}
      aria-label="Eva planning process"
    >
      {evaPlanningRows.slice(0, visibleCount).map((item, index) => {
        const status = complete
          ? 'done'
          : dynamic
          ? (index === visibleCount - 1 && visibleCount < evaPlanningRows.length ? 'active' : 'done')
          : item.status;
        const iconName = status === 'done' ? 'check-circle-filled' : item.icon;
        return (
          <div key={`${item.title}-${index}`} className={`eva-waterfall-status__row eva-waterfall-status__row--${status}`}>
            <Icon name={iconName} weight="bold" size="sm" />
            <span>
              <strong>{item.title}</strong>
              {item.text(draft, generatedName, latestUserMessage?.text)}
            </span>
          </div>
        );
      })}
    </div>
  );
  const renderEvaPlanningProcess = () => (
    <AccordionItem
      title={(
        <span className="eva-planning-accordion__title">
          <Icon name="sparkle" weight="bold" size="sm" />
          View Eva’s thinking trace
        </span>
      )}
      className="eva-planning-accordion"
      size="small"
    >
      {renderEvaPlanningRows(evaPlanningRows.length, false, true)}
    </AccordionItem>
  );

  const toggleKnowledgeBase = (knowledgeBase: string) => {
    setSelectedKnowledgeBases(prev =>
      prev.includes(knowledgeBase)
        ? prev.filter(item => item !== knowledgeBase)
        : [...prev, knowledgeBase],
    );
  };

  const toggleAction = (action: string) => {
    setSelectedActions(prev =>
      prev.includes(action)
        ? prev.filter(item => item !== action)
        : [...prev, action],
    );
  };

  const toggleStandardGuardrail = (id: string) => {
    setStandardGuardrails(prev => prev.map(item =>
      item.id === id ? { ...item, enabled: !item.enabled } : item,
    ));
  };

  const updateStandardGuardrail = (
    id: string,
    key: 'sensitivity' | 'enforcement' | 'direction',
    value: EvaSensitivity | EvaEnforcement | EvaDirection,
  ) => {
    setStandardGuardrails(prev => prev.map(item =>
      item.id === id ? { ...item, [key]: value } : item,
    ));
  };

  const toggleAdvancedGuardrail = (groupId: string, itemId: string) => {
    setAdvancedGuardrailGroups(prev => prev.map(group =>
      group.id === groupId
        ? {
            ...group,
            items: group.items.map(item =>
              item.id === itemId ? { ...item, enabled: !item.enabled } : item,
            ),
          }
        : group,
    ));
  };

  const updateAdvancedGuardrail = (
    groupId: string,
    itemId: string,
    key: 'sensitivity' | 'enforcement' | 'direction',
    value: EvaSensitivity | EvaEnforcement | EvaDirection,
  ) => {
    setAdvancedGuardrailGroups(prev => prev.map(group =>
      group.id === groupId
        ? {
            ...group,
            items: group.items.map(item =>
              item.id === itemId ? { ...item, [key]: value } : item,
            ),
          }
        : group,
    ));
  };

  const toggleAdvancedGroup = (groupId: string) => {
    setExpandedAdvancedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  if (landingMode === 'existing') {
    return (
      <div className="primary-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Agents</h1>
            <p className="page-subtitle">Manage your AI agents</p>
          </div>
          <Button onClick={handleBuildFromScratch}>+ Create Agent</Button>
        </div>

        <div className="secondary-content">
          <div className="filter-bar">
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              leadingIcon="search"
              clearable
              onClear={() => setSearchQuery('')}
              className="filter-bar-search"
            />
            <Dropdown
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Draft' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
            />
            <div className="view-switcher">
              <button
                type="button"
                className={`view-switcher-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                aria-label="Show table view"
              >
                <Icon name="view-list" weight="bold" size="sm" />
              </button>
              <button
                type="button"
                className={`view-switcher-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Show grid view"
              >
                <Icon name="view-thumbnail" weight="bold" size="sm" />
              </button>
            </div>
          </div>

          {viewMode === 'table' && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Agent</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Sessions</TableHeader>
                  <TableHeader>Success Rate</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody empty={filteredAgents.length === 0} colSpan={5}>
                {filteredAgents.map(agent => (
                  <TableRow key={agent.id} onClick={() => handleAgentClick(agent.id)}>
                    <TableCell>
                      <div className="agents-table-agent">
                        <div className="agents-table-agent__avatar" style={{ background: agent.gradient }}>
                          {agent.initials}
                        </div>
                        <div>
                          <div className="agents-table-agent__name">{agent.name}</div>
                          <div className="agents-table-agent__description">{agent.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(agent.statusClass)}>{agent.status}</Badge>
                    </TableCell>
                    <TableCell>{agent.sessions}</TableCell>
                    <TableCell>{agent.successRate}</TableCell>
                    <TableCell>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={event => {
                          event.stopPropagation();
                          handleConfigureClick(agent.id);
                        }}
                      >
                        Configure
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {viewMode === 'grid' && (
            <div className="agents-card-grid">
              {filteredAgents.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onSelect={() => handleAgentClick(agent.id)}
                  onConfigure={() => handleConfigureClick(agent.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="primary-content eva-agents-landing eva-agents-landing--flush">
      {shouldShowEvaThreadPanel && (
        <aside className="eva-thread-panel-shell" aria-label="Eva threads">
          <AiThreadPanel
            threads={evaThreads}
            activeThreadId={activeEvaThreadId}
            onSelectThread={handleSelectEvaThread}
            onNewThread={handleNewEvaThread}
            onRenameThread={handleRenameEvaThread}
            onDeleteThread={handleDeleteEvaThread}
            onCollapse={() => setShowEvaThreadPanel(false)}
          />
        </aside>
      )}

      <div
        className={`eva-first-interface${showLandingOptions ? ' eva-first-interface--landing' : ''}${guidanceVisible || evaThinking || orchestrationSuggested ? ' eva-first-interface--generated' : ''}`}
        style={evaFirstInterfaceStyle}
      >
        {!showLandingOptions && (
          <div className="eva-view-actions">
            <div className="eva-view-header">
              <div className="agent-avatar eva-view-header__avatar" style={{ background: gradient }}>
                {profileInitials}
              </div>
              <div className="eva-view-header__content">
                <div className="eva-view-header__title-row">
                  <h1 className="eva-view-title">{agentName}</h1>
                  <Badge variant="warning">Draft</Badge>
                </div>
                <p className="eva-view-header__meta">{agentDescription} • Last updated just now</p>
              </div>
            </div>
            <div className="eva-view-actions__controls">
              {!showEvaThreadPanel && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="eva-view-actions__icon-btn"
                  onClick={() => setShowEvaThreadPanel(true)}
                  aria-label="Show threads"
                  title="Show threads"
                >
                  <Icon name="side-panel" weight="bold" size="sm" />
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => openEvaCanvas()}>
                <Icon name="workflow-deployments" weight="bold" size="sm" />
                Canvas view
              </Button>
              <button type="button" className="ai-thread-panel__new-btn" onClick={handleNewEvaThread}>
                <Icon name="start-chat" weight="bold" size="sm" />
                New thread
              </button>
            </div>
          </div>
        )}

        {showLandingOptions && (
          <section className="eva-first-interface__hero" aria-labelledby="eva-landing-title" style={evaHeroStyle}>
            <h1 id="eva-landing-title">Hi I'm Eva!</h1>
            <h2>Build smart agent anytime, anywhere.</h2>
            <p>
              Describe the business need, persona, tools, data, routing, or guardrails.
              Eva will decide when your request should become a guided agent configuration.
            </p>
          </section>
        )}

        {showLandingOptions && landingMode === 'build' && (
          <>
            <section className="eva-prompt-examples" aria-label="Quick templates">
              {starterPrompts.slice(0, 4).map(prompt => (
                <button
                  key={prompt.templateId}
                  type="button"
                  className="eva-prompt-card"
                  onClick={() => handleTemplateSelect(prompt.templateId)}
                >
                  <span className="eva-prompt-card__icon" aria-hidden="true">
                    <Icon name={prompt.icon} weight="bold" size="md" />
                  </span>
                  <strong>{prompt.title}</strong>
                  <span>{prompt.description}</span>
                  <small>Use this example</small>
                </button>
              ))}
            </section>
            <section className="eva-landing-actions" aria-label="Eva landing actions">
              <DividerWithLabel label="Or" className="eva-landing-actions__divider" />
              <Button variant="secondary" onClick={() => setLandingMode('existing')}>
                Existing AI Agents
              </Button>
              <Button onClick={handleBuildFromScratch}>
                Build from scratch
              </Button>
            </section>
          </>
        )}

        {evaThinking && (
          <section className="eva-dialogue" aria-label="Eva conversation flow" aria-live="polite">
            {latestUserMessage && <AiUserMessage text={latestUserMessage.text} />}
            <AiResponseMessage
              className="eva-ai-response"
              assistantName="Thinking through your request and preparing the setup plan..."
              assistantState="processing"
              content={null}
            >
              {renderEvaPlanningRows(evaPlanningProgress, true)}
            </AiResponseMessage>
          </section>
        )}

        {orchestrationSuggested && !guidanceVisible && !evaThinking && (
          <section className="eva-dialogue" aria-label="Eva conversation flow">
            {latestUserMessage && <AiUserMessage text={latestUserMessage.text} />}
            <AiResponseMessage
              className="eva-ai-response"
              assistantName="Eva"
              content="Eva Canvas is the visual workspace for mapping agent orchestration, connecting nodes, defining handoffs, and coordinating flows. I can open it for you while preserving this chat."
            >
              <div className="eva-dialogue__actions">
                <Button onClick={() => openEvaCanvas()}>Open Eva Canvas</Button>
                <Button variant="secondary" onClick={() => setOrchestrationSuggested(false)}>
                  Build a single agent instead
                </Button>
              </div>
            </AiResponseMessage>
          </section>
        )}

        {guidanceVisible && !evaThinking && (
          <section className="eva-dialogue" aria-label="Eva conversation flow">
            {visibleSteps.includes('profile') && (
              <>
                <div className="eva-step-anchor" data-eva-step="profile" tabIndex={-1} />
                {renderUserPromptForStep('profile')}
                <AiResponseMessage
                  className="eva-ai-response"
                  assistantName="Eva"
                  content={`Plan complete. I collapsed the setup plan below, and we can start configuring ${generatedName} step by step.`}
                >
                  <div className="eva-config-block">
                    {renderEvaPlanningProcess()}
                    <div className="eva-waterfall-card eva-config-step-card">
                      <div className="eva-config-step-card__header">
                        <span>
                          <Icon name="document" weight="bold" size="sm" />
                          Step 1 · Profile
                        </span>
                        <p>Confirm the same profile details used by the agent configuration framework before Eva drafts instructions, knowledge, actions, and guardrails.</p>
                      </div>
                      <div className="eva-config-block">
                        <div className="eva-config-grid eva-config-grid--responsive-two">
                          <Input label="Agent name" required value={agentName} onChange={event => setAgentName(event.target.value)} />
                          <div className="v2-profile-avatar-row">
                            <div className="v2-profile-avatar-preview">
                              <div className="agent-avatar" style={{ background: gradient, width: 48, height: 48, fontSize: 16 }}>
                                {profileInitials}
                              </div>
                            </div>
                            <div className="v2-profile-avatar-field">
                              <Input
                                label="URL for agent profile image"
                                required
                                value={avatarUrl}
                                onChange={event => setAvatarUrl(event.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="eva-config-grid eva-config-grid--responsive-two">
                          <Dropdown
                            label="Time zone"
                            required
                            options={PROFILE_TIMEZONE_OPTIONS}
                            value={timezone}
                            onChange={setTimezone}
                          />
                          <Dropdown
                            label="Language"
                            required
                            options={PROFILE_LANGUAGE_OPTIONS}
                            value={personality.language}
                            onChange={value => setPersonality(prev => ({ ...prev, language: value }))}
                          />
                          <Dropdown
                            label="Voice name"
                            required
                            options={PROFILE_VOICE_OPTIONS}
                            value={personality.voice}
                            onChange={value => setPersonality(prev => ({ ...prev, voice: value }))}
                          />
                          <Dropdown
                            label="AI engine"
                            required
                            options={aiEngineOptions}
                            value={aiEngine}
                            onChange={value => {
                              setAiEngine(value);
                              setPersonality(prev => ({ ...prev, llm: value }));
                            }}
                          />
                        </div>
                        <div className="v2-profile-textarea-group">
                          <div className="v2-profile-textarea-header">
                            <label className="v2-profile-label">
                              Welcome message <span className="v2-profile-required">*</span>
                              <button type="button" className="v2-profile-info-btn" aria-label="Info">
                                <Icon name="info-badge" size={16} />
                              </button>
                            </label>
                            <button
                              type="button"
                              className="v2-profile-insert-example"
                              onClick={() => setWelcomeMessage(buildWelcomeMessage(draft))}
                            >
                              Insert example
                            </button>
                          </div>
                          <Textarea
                            value={welcomeMessage}
                            onChange={event => setWelcomeMessage(event.target.value)}
                            placeholder="Enter description"
                            rows={4}
                          />
                        </div>
                      </div>
                      {evaStep === 'profile' && (
                        <div className="eva-dialogue__actions">
                          <Button onClick={() => setEvaStep('channels')}>Use this profile</Button>
                        </div>
                      )}
                    </div>
                  </div>
                </AiResponseMessage>
              </>
            )}

            {visibleSteps.includes('channels') && (
              <>
                <div className="eva-step-anchor" data-eva-step="channels" tabIndex={-1} />
                {renderUserPromptForStep('channels')}
                <AiResponseMessage
                  className="eva-ai-response"
                  assistantName="Eva"
                  content="Next, choose where this agent should be available. Select a channel type, then choose the specific channel and address or number Eva should use."
                >
                  <div className="eva-config-block">
                    <div className="eva-security-tier-selector eva-channel-type-selector" role="radiogroup" aria-label="Channel type">
                      <button
                        type="button"
                        className={`eva-security-tier-card${channelType === 'digital' ? ' eva-security-tier-card--selected' : ''}`}
                        onClick={() => setChannelType('digital')}
                        aria-pressed={channelType === 'digital'}
                      >
                        <Icon name="chat" weight="bold" size={24} />
                        <span>
                          <strong>Digital</strong>
                          <small>Use messaging and digital entry points for customer conversations.</small>
                        </span>
                      </button>
                      <button
                        type="button"
                        className={`eva-security-tier-card${channelType === 'voice' ? ' eva-security-tier-card--selected' : ''}`}
                        onClick={() => setChannelType('voice')}
                        aria-pressed={channelType === 'voice'}
                      >
                        <Icon name="phone" weight="bold" size={24} />
                        <span>
                          <strong>Voice</strong>
                          <small>Use voice calling flows for phone-based customer conversations.</small>
                        </span>
                      </button>
                    </div>
                    {channelType === 'digital' ? (
                      <div className="eva-config-grid eva-config-grid--responsive-two">
                        <Dropdown
                          label="Digital channel"
                          required
                          options={DIGITAL_CHANNEL_OPTIONS}
                          value={digitalChannel}
                          onChange={value => setDigitalChannel(value as EvaDigitalChannel)}
                        />
                        <Input
                          label={selectedDigitalChannelDetails.label}
                          required
                          type={selectedDigitalChannelDetails.inputType}
                          value={digitalChannelAddress}
                          onChange={event => setDigitalChannelAddress(event.target.value)}
                          placeholder={selectedDigitalChannelDetails.placeholder}
                          hint={selectedDigitalChannelDetails.hint}
                        />
                      </div>
                    ) : (
                      <Dropdown
                        label="Voice phone number"
                        required
                        options={CHANNEL_PHONE_NUMBER_OPTIONS}
                        value={channelPhoneNumber}
                        onChange={setChannelPhoneNumber}
                      />
                    )}
                    {evaStep === 'channels' && (
                      <div className="eva-dialogue__actions">
                        <Button onClick={() => setEvaStep('instructions')} disabled={!channelDestination}>Continue to instructions</Button>
                      </div>
                    )}
                  </div>
                </AiResponseMessage>
              </>
            )}

            {visibleSteps.includes('instructions') && (
              <>
                <div className="eva-step-anchor" data-eva-step="instructions" tabIndex={-1} />
                {renderUserPromptForStep('instructions')}
                <AiResponseMessage
                  className="eva-ai-response"
                  assistantName="Eva"
                  content="Next I drafted the instruction prompt from your request, selected profile, goals, and guardrails. Use this step to clarify what the agent can do, organize role, goals, guardrails, and output rules with markdown headers, define tone and escalation paths, and add dynamic content with {{variable}} syntax."
                >
                  <div className="eva-config-block">
                    <div className="eva-instructions-layout">
                      <div className="instructions-editor">
                        <div className="instructions-toolbar">
                          <div className="instructions-toolbar-left">
                            <button type="button" className="instructions-toolbar-btn" aria-label="Bold"><Icon name="bold" weight="bold" size={16} /></button>
                            <button type="button" className="instructions-toolbar-btn" aria-label="Italic"><Icon name="italic" weight="bold" size={16} /></button>
                            <button type="button" className="instructions-toolbar-btn" aria-label="Underline"><Icon name="underline" weight="bold" size={16} /></button>
                            <button type="button" className="instructions-toolbar-btn" aria-label="Link"><Icon name="link" weight="bold" size={16} /></button>
                            <button type="button" className="instructions-toolbar-btn" aria-label="Table"><Icon name="table" weight="bold" size={16} /></button>
                            <span className="instructions-toolbar-divider" />
                            <button type="button" className="instructions-toolbar-pill" onClick={() => setShowInstructionExamples(prev => !prev)}>
                              <Icon name="guide" weight="bold" size={16} />
                              Example
                            </button>
                            {optimizeAccepted && (
                              <button type="button" className="instructions-toolbar-pill" onClick={handleEvaUndoOptimize}>
                                <Icon name="undo" weight="bold" size={16} />
                                Undo
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            className="instructions-toolbar-pill instructions-optimize-btn"
                            onClick={handleEvaOptimizeInstructions}
                            disabled={!instructionPrompt.trim() || optimizingInstructions}
                          >
                            <Icon name="sparkle" weight="bold" size={16} />
                            {optimizingInstructions ? 'Optimizing...' : 'Optimize prompt'}
                          </button>
                        </div>
                        <textarea
                          className="instructions-textarea"
                          placeholder="Set clear goals for your agent. Provide step-by-step instructions to help them succeed in reaching these targets."
                          value={instructionPrompt}
                          onChange={event => setInstructionPrompt(event.target.value)}
                        />
                        {optimizeAccepted && (
                          <div className="instructions-ai-footer">
                            <Icon name="check" weight="bold" size={14} color="var(--mds-color-theme-text-success-normal, var(--success-color))" />
                            <span>AI Generated</span>
                            <span className="instructions-ai-divider">·</span>
                            <span>Is this helpful?</span>
                            <button type="button" className="instructions-feedback-btn" aria-label="Helpful"><Icon name="like" weight="bold" size={14} /></button>
                            <button type="button" className="instructions-feedback-btn" aria-label="Not helpful"><Icon name="dislike" weight="bold" size={14} /></button>
                          </div>
                        )}
                      </div>
                    </div>

                    {optimizeAccepted && (
                      <div className="eva-instruction-optimize-summary">
                        <div className="instructions-optimize-header">
                          <Icon name="sparkle" weight="bold" size={20} />
                          <h3 className="instructions-optimize-title">Optimize summary</h3>
                          <Button variant="secondary" size="sm" onClick={handleEvaUndoOptimize}>
                            <Icon name="undo" weight="bold" size={16} />
                            Undo
                          </Button>
                        </div>
                        <div className="instructions-optimize-results">
                          <div className="optimize-results-section">
                            <h4>What's been changed:</h4>
                            <ul>{optimizeSummary.changes.map((change, index) => <li key={index}>{change}</li>)}</ul>
                          </div>
                          <div className="optimize-results-section">
                            <h4>Reasoning behind changes:</h4>
                            <ul>{optimizeSummary.reasoning.map((reason, index) => <li key={index}>{reason}</li>)}</ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {showInstructionExamples && (
                      <div className="eva-instruction-examples" aria-label="Instruction examples and tips">
                        <div className="eva-instruction-examples__section">
                          <h4>Instruction examples</h4>
                          <div className="eva-instruction-examples__cards">
                            {INSTRUCTION_EXAMPLES.map(example => (
                              <article key={example.title} className="eva-instruction-example-card">
                                <strong>{example.title}</strong>
                                <p>{example.content.split('\n\n')[0].replace('#### Role & Identity\n', '')}</p>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setInstructionPrompt(`**${example.title}**\n\n${example.content}`);
                                    setShowInstructionExamples(false);
                                    setOptimizeAccepted(false);
                                    showToast('Example inserted into instructions', 'success');
                                  }}
                                >
                                  Insert
                                </Button>
                              </article>
                            ))}
                          </div>
                        </div>
                        <div className="eva-instruction-examples__section">
                          <h4>Best practice tips</h4>
                          <ul className="eva-instruction-tips">
                            <li>Start with a clear role definition.</li>
                            <li>Use markdown headers for role, goals, guardrails, and output rules.</li>
                            <li>Define the agent's tone and escalation path.</li>
                          </ul>
                        </div>
                      </div>
                    )}
                    {evaStep === 'instructions' && (
                      <div className="eva-dialogue__actions">
                        <Button onClick={() => setEvaStep('knowledge')}>Continue to knowledge</Button>
                      </div>
                    )}
                  </div>
                </AiResponseMessage>
              </>
            )}

            {visibleSteps.includes('knowledge') && (
              <>
                <div className="eva-step-anchor" data-eva-step="knowledge" tabIndex={-1} />
                {renderUserPromptForStep('knowledge')}
                <AiResponseMessage
                  className="eva-ai-response"
                  assistantName="Eva"
                  content="For knowledge, I recommend grounding this agent in the sources below. Keep the selected sources or add your own in the composer."
                >
                  <div className="eva-config-block">
                    <div className="eva-choice-list">
                      {draft.knowledgeBases.map(source => (
                        <Toggle
                          key={source}
                          size="compact"
                          label={source}
                          helperText={selectedKnowledgeBases.includes(source) ? 'Selected as a grounding source.' : 'Available recommendation.'}
                          checked={selectedKnowledgeBases.includes(source)}
                          onChange={() => toggleKnowledgeBase(source)}
                        />
                      ))}
                    </div>
                    {evaStep === 'knowledge' && (
                      <div className="eva-dialogue__actions">
                        <Button onClick={() => setEvaStep('actions')}>Continue to actions</Button>
                      </div>
                    )}
                  </div>
                </AiResponseMessage>
              </>
            )}

            {visibleSteps.includes('actions') && (
              <>
                <div className="eva-step-anchor" data-eva-step="actions" tabIndex={-1} />
                {renderUserPromptForStep('actions')}
                <AiResponseMessage
                  className="eva-ai-response"
                  assistantName="Eva"
                  content="For actions, I recommend these fulfillment capabilities based on the agent purpose. Review what Eva should be allowed to do."
                >
                  <div className="eva-config-block">
                    <div className="eva-actions-table" role="table" aria-label="Recommended actions and MCP tools">
                      <div className="eva-actions-table__header" role="row">
                        <span role="columnheader">Action name</span>
                        <span role="columnheader">Created by</span>
                        <span role="columnheader">Description</span>
                        <span role="columnheader">Last updated</span>
                        <span role="columnheader">Action type</span>
                        <span role="columnheader">Provider type</span>
                      </div>
                      {EVA_ACTION_ROWS.map(action => {
                        const selected = selectedActions.includes(action.name);
                        return (
                          <div key={action.id} className="eva-actions-table__row" role="row">
                            <span className="eva-actions-table__name" role="cell">
                              <Toggle
                                size="compact"
                                checked={selected}
                                onChange={() => toggleAction(action.name)}
                                aria-label={`${selected ? 'Disable' : 'Enable'} ${action.name}`}
                              />
                              <strong>{action.name}</strong>
                            </span>
                            <span role="cell">{action.createdBy}</span>
                            <span role="cell">{action.description}</span>
                            <span role="cell">{action.lastUpdated}</span>
                            <span role="cell">{action.actionType}</span>
                            <span role="cell">{action.providerType}</span>
                          </div>
                        );
                      })}
                    </div>
                    {evaStep === 'actions' && (
                      <div className="eva-dialogue__actions">
                        <Button onClick={() => setEvaStep('security')}>Continue to security</Button>
                      </div>
                    )}
                  </div>
                </AiResponseMessage>
              </>
            )}

            {visibleSteps.includes('security') && (
              <>
                <div className="eva-step-anchor" data-eva-step="security" tabIndex={-1} />
                {renderUserPromptForStep('security')}
                <AiResponseMessage
                  className="eva-ai-response"
                  assistantName="Eva"
                  content="For security, I broke the configuration into the same sections as the Security page: choose a guardrail tier, review observability behavior, tune standard guardrails, and optionally enable advanced AI Defense categories or custom profiles."
                >
                  <div className="eva-config-block">
                    <div className="eva-security-panel">
                      <div className="eva-security-header">
                        <div>
                          <h3>Security</h3>
                          <p>Configure protection rules to control agent behavior, enforce safety policies, and prevent misuse.</p>
                        </div>
                      </div>

                      <div className="eva-security-tier-selector" role="radiogroup" aria-label="Security tier">
                        <button
                          type="button"
                          className={`eva-security-tier-card${securityTier === 'standard' ? ' eva-security-tier-card--selected' : ''}`}
                          onClick={() => setSecurityTier('standard')}
                        >
                          <Icon name="shield" weight="bold" size={24} />
                          <span>
                            <strong>Standard guardrails</strong>
                            <small>Basic protection with toxicity, harm detection, and jailbreak prevention.</small>
                            <em>{standardGuardrails.filter(item => item.enabled).length}/{standardGuardrails.length} enabled</em>
                          </span>
                        </button>
                        <button
                          type="button"
                          className={`eva-security-tier-card${securityTier === 'advanced' ? ' eva-security-tier-card--selected' : ''}`}
                          onClick={() => setSecurityTier('advanced')}
                        >
                          <Icon name="secure-circle" weight="bold" size={24} />
                          <span>
                            <strong>Advanced guardrails <Badge variant="success" className="security-tier-badge">AI Defense</Badge></strong>
                            <small>Comprehensive security, privacy, and safety guardrails with custom profiles.</small>
                            <em>{advancedGuardrailGroups.reduce((sum, group) => sum + group.items.filter(item => item.enabled).length, 0)}/{advancedGuardrailGroups.reduce((sum, group) => sum + group.items.length, 0)} enabled</em>
                          </span>
                        </button>
                      </div>

                      <div className="eva-security-observability">
                        <Icon name="info-circle" weight="bold" size={18} />
                        <span>
                          <strong>Observability and logging</strong>
                          Triggered rails are logged in Sessions. Monitor allows the interaction to continue with a log entry; Block rejects the individual prompt while keeping the conversation active.
                        </span>
                      </div>

                      {securityTier === 'standard' && (
                        <div className="eva-security-standard-list">
                          {standardGuardrails.map(guardrail => (
                            <section key={guardrail.id} className="eva-security-guardrail-card">
                              <div className="eva-security-guardrail-header">
                                <Toggle
                                  size="compact"
                                  checked={guardrail.enabled}
                                  onChange={() => toggleStandardGuardrail(guardrail.id)}
                                  aria-label={`${guardrail.enabled ? 'Disable' : 'Enable'} ${guardrail.name}`}
                                />
                                <span>
                                  <strong>{guardrail.name}</strong>
                                  <small>{guardrail.description}</small>
                                </span>
                              </div>
                              {guardrail.enabled && (
                                <div className="eva-security-controls">
                                  <div className="eva-security-sensitivity-control">
                                    <label>Sensitivity</label>
                                    <Slider
                                      value={sensitivityToValue[guardrail.sensitivity]}
                                      onChange={value => updateStandardGuardrail(guardrail.id, 'sensitivity', valueToSensitivity(value as number))}
                                      min={0}
                                      max={100}
                                      step={50}
                                      showTicks
                                      aria-label={`${guardrail.name} sensitivity`}
                                    />
                                    <div className="security-sensitivity-labels">
                                      <span>Low</span>
                                      <span>Medium</span>
                                      <span>High</span>
                                    </div>
                                  </div>
                                  <Dropdown
                                    label="Enforcement"
                                    options={[
                                      { value: 'monitor', label: 'Monitor' },
                                      { value: 'block', label: 'Block' },
                                    ]}
                                    value={guardrail.enforcement}
                                    onChange={value => updateStandardGuardrail(guardrail.id, 'enforcement', value as EvaEnforcement)}
                                  />
                                  <Dropdown
                                    label="Direction"
                                    options={[
                                      { value: 'prompt', label: 'Prompt' },
                                      { value: 'response', label: 'Response' },
                                    ]}
                                    value={guardrail.direction}
                                    onChange={value => updateStandardGuardrail(guardrail.id, 'direction', value as EvaDirection)}
                                  />
                                </div>
                              )}
                            </section>
                          ))}
                        </div>
                      )}

                      {securityTier === 'advanced' && (
                        <div className="eva-security-advanced-list">
                          {advancedGuardrailGroups.map(group => (
                            <section key={group.id} className="eva-security-advanced-group">
                              <button
                                type="button"
                                className="eva-security-group-header eva-security-group-header--button"
                                onClick={() => toggleAdvancedGroup(group.id)}
                                aria-expanded={expandedAdvancedGroups.has(group.id)}
                              >
                                <Icon name={group.icon} weight="bold" size={18} />
                                <strong>{group.label}</strong>
                                <Badge>{group.items.filter(item => item.enabled).length}/{group.items.length}</Badge>
                                <Icon name={expandedAdvancedGroups.has(group.id) ? 'arrow-up' : 'arrow-down'} weight="bold" size={16} />
                              </button>
                              {expandedAdvancedGroups.has(group.id) && (
                                <div className="eva-security-advanced-items">
                                  {group.items.map(item => (
                                    <section key={item.id} className="eva-security-guardrail-card eva-security-advanced-rule-card">
                                      <div className="eva-security-guardrail-header">
                                        <Toggle
                                          size="compact"
                                          checked={item.enabled}
                                          onChange={() => toggleAdvancedGuardrail(group.id, item.id)}
                                          aria-label={`${item.enabled ? 'Disable' : 'Enable'} ${item.name}`}
                                        />
                                        <span>
                                          <strong>{item.name}</strong>
                                          <small>{item.description}</small>
                                        </span>
                                      </div>
                                      {item.enabled && (
                                        <div className="eva-security-controls">
                                          <div className="eva-security-sensitivity-control">
                                            <label>Sensitivity</label>
                                            <Slider
                                              value={sensitivityToValue[item.sensitivity]}
                                              onChange={value => updateAdvancedGuardrail(group.id, item.id, 'sensitivity', valueToSensitivity(value as number))}
                                              min={0}
                                              max={100}
                                              step={50}
                                              showTicks
                                              aria-label={`${item.name} sensitivity`}
                                            />
                                            <div className="security-sensitivity-labels">
                                              <span>Low</span>
                                              <span>Medium</span>
                                              <span>High</span>
                                            </div>
                                          </div>
                                          <Dropdown
                                            label="Enforcement"
                                            options={[
                                              { value: 'monitor', label: 'Monitor' },
                                              { value: 'block', label: 'Block' },
                                            ]}
                                            value={item.enforcement}
                                            onChange={value => updateAdvancedGuardrail(group.id, item.id, 'enforcement', value as EvaEnforcement)}
                                          />
                                          <Dropdown
                                            label="Direction"
                                            options={[
                                              { value: 'prompt', label: 'Prompt' },
                                              { value: 'response', label: 'Response' },
                                            ]}
                                            value={item.direction}
                                            onChange={value => updateAdvancedGuardrail(group.id, item.id, 'direction', value as EvaDirection)}
                                          />
                                        </div>
                                      )}
                                    </section>
                                  ))}
                                </div>
                              )}
                            </section>
                          ))}
                          <section className="eva-security-custom-profile">
                            <div className="eva-security-group-header">
                              <Icon name="document-create" weight="bold" size={18} />
                              <strong>Custom profiles</strong>
                            </div>
                            <p>Generate custom profiles tailored to this agent's configuration and requirements.</p>
                            <Button variant="secondary" size="sm">
                              <Icon name="plus" weight="bold" size={16} />
                              Create custom profile
                            </Button>
                          </section>
                        </div>
                      )}
                    </div>
                    {evaStep === 'security' && (
                      <div className="eva-dialogue__actions">
                        <Button onClick={() => setEvaStep('review')}>Review configuration</Button>
                      </div>
                    )}
                  </div>
                </AiResponseMessage>
              </>
            )}

            {visibleSteps.includes('review') && (
              <>
                <div className="eva-step-anchor" data-eva-step="review" tabIndex={-1} />
                {renderUserPromptForStep('review')}
                <AiResponseMessage
                  className="eva-ai-response"
                  assistantName="Eva"
                  content={`Ready to create ${agentName}? I kept each recommendation tied to the agent configuration: profile, instructions, knowledge, actions, channels, and guardrails.`}
                >
                  <div className="eva-config-block">
                    <div className="eva-config-summary">
                      <span><strong>Welcome</strong>{welcomeMessage}</span>
                      <span><strong>Language</strong>{languageSummary}</span>
                      <span><strong>Time zone</strong>{timezone}</span>
                      <span><strong>Agent character</strong>{agentCharacterSummary}</span>
                      <span><strong>Instructions</strong>{instructionSummary}</span>
                      <span><strong>Knowledge</strong>{selectedKnowledgeBases.join(', ') || 'No sources selected'}</span>
                      <span><strong>Actions</strong>{selectedActions.join(', ') || 'No actions selected'}</span>
                      <span><strong>Channel</strong>{channelSummary}</span>
                      <span><strong>Guardrails</strong>{[...draft.security, ...customRules].join(', ')}</span>
                    </div>
                    <div className="eva-next-step-block" aria-label="Suggested next steps">
                      <div className="eva-next-step-block__header">
                        <span>What would you like to add next?</span>
                      </div>
                      <div className="eva-next-step-block__chips">
                        {[
                          'Include a guide on filing a claim',
                          'Add tips for choosing the right insurance plan',
                          'Explain deductible and co-pay concepts',
                          'Provide updates on ongoing claims',
                          'Create a FAQ on common policy terms',
                        ].map(option => (
                          <button key={option} type="button" onClick={() => handleNextStepSuggestion(option)}>
                            {option}
                          </button>
                        ))}
                      </div>
                      <div className="eva-next-step-block__actions">
                        <Button onClick={createDraftAgent}>
                          <Icon name="sparkle" weight="bold" size="sm" />
                          Complete create agent
                        </Button>
                      </div>
                    </div>
                  </div>
                </AiResponseMessage>
              </>
            )}
          </section>
        )}

        {showBuildFlow && (
          <section className={`eva-first-interface__chat${guidanceVisible || evaThinking || orchestrationSuggested ? ' eva-first-interface__chat--sticky' : ''}`} aria-label="Talk to Eva">
            {!guidanceVisible && !evaThinking && <div className="eva-chat-spacer" aria-hidden />}
            <AiFooter
              className="eva-ai-footer"
              fillContainer
              onSend={guidanceVisible ? handleWaterfallFollowup : handleSend}
              processing={false}
              disabled={evaThinking}
              placeholder={guidanceVisible || orchestrationSuggested ? 'Tell Eva what to adjust or add...' : 'Type with Eva. Try: Create an AI agent for customer onboarding...'}
              suggestions={[]}
              voiceActive={voiceActive}
              onVoiceToggle={() => setVoiceActive(prev => !prev)}
            />
          </section>
        )}
      </div>
    </div>
  );
}
