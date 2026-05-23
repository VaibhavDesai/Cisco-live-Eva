import type { IconName } from '../../icons/types';
import { CAPABILITIES } from '../../pages/agent/actionConfigShared';
import { EVA_TEMPLATES } from './evaTemplates';
import type { EvaAgentDraft, EvaMessage, EvaTemplateId } from './types';

export type EvaConversationStep =
  | 'profile'
  | 'channels'
  | 'instructions'
  | 'knowledge'
  | 'actions'
  | 'security'
  | 'review'
  | 'preview'
  | 'testing';

export type EvaLandingMode = 'build' | 'existing';
export type EvaSecurityTier = 'standard' | 'advanced';
export type EvaChannelType = 'digital' | 'voice';
export type EvaChannelSelection = EvaChannelType | 'video';
export type EvaDigitalChannel = 'chat' | 'email' | 'sms';
export type EvaConversationalOnboardingStep =
  | 'idle'
  | 'profile-name'
  | 'profile-purpose'
  | 'channel-type'
  | 'digital-channel'
  | 'digital-address'
  | 'voice-phone'
  | 'ready-for-studio';
export type EvaSensitivity = 'low' | 'medium' | 'high' | 'critical';
export type EvaEnforcement = 'monitor' | 'block';
export type EvaDirection = 'prompt' | 'response';
export type EvaThread = { id: string; title: string; group?: string };

export const EVA_STEP_ORDER: EvaConversationStep[] = [
  'profile',
  'channels',
  'instructions',
  'knowledge',
  'actions',
  'security',
  'review',
  'preview',
  'testing',
];

export const EVA_SESSION_STORAGE_KEY = 'eva-agents-session-state';
export const EVA_AUTO_START_VOICE_PREVIEW_KEY = 'eva-auto-start-voice-preview';

export const sensitivityToValue: Record<EvaSensitivity, number> = {
  low: 0,
  medium: 33,
  high: 66,
  critical: 100,
};

export const valueToSensitivity = (value: number): EvaSensitivity => {
  if (value <= 0) return 'low';
  if (value >= 100) return 'critical';
  if (value >= 66) return 'high';
  return 'medium';
};

export const isOrchestrationIntent = (normalized: string) =>
  normalized.includes('collaboration') ||
  normalized.includes('collaborative agent') ||
  normalized.includes('collaborative agents') ||
  normalized.includes('agents collaborate') ||
  normalized.includes('agent collaborate') ||
  normalized.includes('two agents') ||
  ((normalized.includes('connect') ||
    normalized.includes('orchestrat') ||
    normalized.includes('collaborat') ||
    normalized.includes('handoff') ||
    normalized.includes('coordinate') ||
    normalized.includes('link')) &&
    (normalized.includes('agent') ||
      normalized.includes('workflow') ||
      normalized.includes('flow'))) ||
  normalized.includes('multi-agent');

export const PROFILE_TIMEZONE_OPTIONS = [
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
  { value: 'UTC', label: 'UTC' },
];

export const PROFILE_LANGUAGE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
];

export const PROFILE_VOICE_OPTIONS = [
  { value: 'ava', label: 'Ava' },
  { value: 'daniel', label: 'Daniel' },
  { value: 'emma', label: 'Emma' },
  { value: 'liam', label: 'Liam' },
  { value: 'sophia', label: 'Sophia' },
];

export const CHANNEL_PHONE_NUMBER_OPTIONS = [
  { value: '+1 415 555 0198', label: '+1 415 555 0198' },
  { value: '+1 512 555 0142', label: '+1 512 555 0142' },
  { value: '+44 20 7946 0958', label: '+44 20 7946 0958' },
];

export const DEFAULT_EVA_CHANNEL_SELECTIONS: EvaChannelSelection[] = ['voice'];
export const DEFAULT_EVA_DIGITAL_CHANNEL_SELECTIONS: EvaDigitalChannel[] = ['chat'];

export const EVA_CHANNEL_SELECTION_OPTIONS: Array<{
  value: EvaChannelSelection;
  icon: IconName;
  title: string;
  description: string;
}> = [
  {
    value: 'voice',
    icon: 'phone',
    title: 'Voice',
    description: 'Use voice calling flows for phone-based customer conversations.',
  },
  {
    value: 'digital',
    icon: 'chat',
    title: 'Digital',
    description: 'Add messaging, email, and SMS entry points for customer conversations.',
  },
  {
    value: 'video',
    icon: 'video',
    title: 'Video',
    description: 'Support video conversations with product guidance and live assistance.',
  },
];

export const DIGITAL_CHANNEL_OPTIONS: Array<{ value: EvaDigitalChannel; label: string }> = [
  { value: 'chat', label: 'Chat' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
];

export const normalizeEvaChannelSelections = (
  channels?: EvaChannelSelection[],
  legacyChannelType?: EvaChannelType,
): EvaChannelSelection[] => {
  const allowed = new Set<EvaChannelSelection>(['voice', 'digital', 'video']);
  const normalized = (channels ?? [])
    .filter((channel): channel is EvaChannelSelection => allowed.has(channel as EvaChannelSelection));
  const unique = Array.from(new Set(normalized));

  if (unique.length > 0) return unique;
  if (legacyChannelType === 'digital') return ['digital'];
  if (legacyChannelType === 'voice') return ['voice'];
  return DEFAULT_EVA_CHANNEL_SELECTIONS;
};

export const normalizeEvaDigitalChannelSelections = (
  channels?: EvaDigitalChannel[],
  legacyDigitalChannel?: EvaDigitalChannel,
): EvaDigitalChannel[] => {
  const allowed = new Set<EvaDigitalChannel>(['chat', 'email', 'sms']);
  const normalized = (channels ?? [])
    .filter((channel): channel is EvaDigitalChannel => allowed.has(channel as EvaDigitalChannel));
  const unique = Array.from(new Set(normalized));

  if (unique.length > 0) return unique;
  if (legacyDigitalChannel && allowed.has(legacyDigitalChannel)) return [legacyDigitalChannel];
  return DEFAULT_EVA_DIGITAL_CHANNEL_SELECTIONS;
};

export const DIGITAL_CHANNEL_DETAILS: Record<
  EvaDigitalChannel,
  { label: string; placeholder: string; hint: string; inputType: string }
> = {
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

export const INSTRUCTION_EXAMPLES = [
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

export const INSTRUCTION_TIPS = [
  { title: 'Start with a clear role definition', description: 'Begin your instructions by defining who the agent is and what its primary function is. This anchors all subsequent behavior.' },
  { title: 'Use markdown headers to organize', description: 'Structure your instructions with #### headers for each section (Role, Goals, Guardrails, Output Rules). This helps the AI parse priorities.' },
  { title: 'Set explicit guardrails', description: 'Clearly state what the agent must NOT do. Negative constraints are as important as positive instructions.' },
  { title: 'Define the tone and style', description: 'Specify the communication style - warm, professional, concise. Include examples of phrasing if possible.' },
  { title: 'Include domain context', description: 'Give the agent knowledge about your products, policies, and processes so it can answer accurately without hallucinating.' },
];

export const STARTER_PROMPTS: Array<{
  templateId: EvaTemplateId;
  title: string;
  summary: string;
  description: string;
  prompt: string;
  icon: IconName;
}> = [
  {
    templateId: 'customer-support',
    title: 'Receptionist',
    summary: 'Answer and route every request',
    description: 'Books appointments, confirms details, and sends reminders.',
    prompt: 'Create a receptionist agent.',
    icon: 'bot-customer-assistant',
  },
  {
    templateId: 'knowledge-assistant',
    title: 'CX Concierge',
    summary: 'Handle customer needs end-to-end',
    description: 'Resolves issues, answers questions, updates accounts, routes requests, and more.',
    prompt: 'Create a customer concierge agent.',
    icon: 'concierge',
  },
  {
    templateId: 'policy-compliance',
    title: 'Help Desk',
    summary: 'Resolve employee requests instantly',
    description: 'Handles passwords, PTO, and common internal tasks.',
    prompt: 'Create a help desk agent.',
    icon: 'helpdesk',
  },
  {
    templateId: 'workflow-automation',
    title: 'Order Management',
    summary: 'Track order status',
    description: 'Handles order inquiries, tracking, delivery estimates, and basic returns.',
    prompt: 'Create an order management agent.',
    icon: 'shopping-cart',
  },
];

export const EVA_PLANNING_ROWS: Array<{
  icon: IconName;
  title: string;
  text: (draft: EvaAgentDraft, generatedName: string, prompt?: string) => string;
  status: string;
}> = [
  {
    icon: 'check',
    title: 'Understand request',
    text: (_draft, _generatedName, prompt) =>
      `Interpreted the prompt${prompt ? `: "${prompt}"` : ''}.`,
    status: 'done',
  },
  {
    icon: 'sparkle',
    title: 'Choose starting profile',
    text: (_draft, generatedName) =>
      `Matched the request to "${generatedName}" as the initial agent profile.`,
    status: 'done',
  },
  {
    icon: 'document',
    title: 'Pre-plan configuration',
    text: draft =>
      `Prepared profile, instructions, knowledge, actions, and guardrails from ${draft.knowledgeBases.length} recommended knowledge source${
        draft.knowledgeBases.length === 1 ? '' : 's'
      }.`,
    status: 'active',
  },
  {
    icon: 'check',
    title: 'Guide setup',
    text: () => 'Ready to walk through each configuration step with your confirmation.',
    status: 'queued',
  },
];

export const EVA_ACTION_ROWS = CAPABILITIES.map((capability, index) => ({
  id: capability.id,
  name: capability.name,
  description:
    capability.description ||
    'Escalate the conversation to a human agent based on general rules and conditions',
  actionType:
    index === 0 ? 'Transfer' : capability.type === 'Handoff' ? 'MCP' : capability.type,
  providerType: 'System',
  createdBy: index === 0 ? 'System' : 'Claire',
  lastUpdated: '02/28/25, at 1:08 AM',
}));

export const EVA_STANDARD_GUARDRAILS = [
  {
    id: 'std-toxicity',
    name: 'Toxicity',
    description:
      'Detect and filter toxic language, insults, and abusive content in conversations.',
    enabled: true,
    sensitivity: 'medium' as EvaSensitivity,
    enforcement: 'monitor' as EvaEnforcement,
    direction: 'response' as EvaDirection,
  },
  {
    id: 'std-harm',
    name: 'Harm detection',
    description:
      'Identify requests or responses that could cause physical, emotional, or financial harm.',
    enabled: false,
    sensitivity: 'medium' as EvaSensitivity,
    enforcement: 'monitor' as EvaEnforcement,
    direction: 'response' as EvaDirection,
  },
  {
    id: 'std-jailbreak',
    name: 'Jailbreak',
    description:
      'Detect prompt injection attempts designed to bypass agent instructions and safety rules.',
    enabled: true,
    sensitivity: 'medium' as EvaSensitivity,
    enforcement: 'block' as EvaEnforcement,
    direction: 'prompt' as EvaDirection,
  },
  {
    id: 'std-multiturn',
    name: 'Multi-turn jailbreak',
    description:
      'Detect multi-step manipulation where users gradually steer the agent away from its guardrails across turns.',
    enabled: false,
    sensitivity: 'medium' as EvaSensitivity,
    enforcement: 'block' as EvaEnforcement,
    direction: 'prompt' as EvaDirection,
  },
];

export const EVA_ADVANCED_GUARDRAIL_GROUPS: Array<{
  id: string;
  label: string;
  icon: IconName;
  items: Array<{
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    sensitivity: EvaSensitivity;
    enforcement: EvaEnforcement;
    direction: EvaDirection;
  }>;
}> = [
  {
    id: 'security',
    label: 'Security guardrails',
    icon: 'shield',
    items: [
      {
        id: 'sec-prompt-injection',
        name: 'Prompt injection',
        description: 'Detect attempts to manipulate the agent with hidden instructions.',
        enabled: false,
        sensitivity: 'medium',
        enforcement: 'block',
        direction: 'prompt',
      },
      {
        id: 'sec-system-prompt',
        name: 'System prompt extraction',
        description:
          'Prevent users from tricking the agent into revealing its system prompt.',
        enabled: false,
        sensitivity: 'medium',
        enforcement: 'block',
        direction: 'prompt',
      },
      {
        id: 'sec-sql-injection',
        name: 'SQL injection',
        description: 'Identify inputs crafted to execute unauthorized database queries.',
        enabled: false,
        sensitivity: 'medium',
        enforcement: 'block',
        direction: 'prompt',
      },
    ],
  },
  {
    id: 'privacy',
    label: 'Privacy guardrails',
    icon: 'privacy-circle',
    items: [
      {
        id: 'priv-pii',
        name: 'PII detection',
        description: 'Identify personally identifiable information in agent responses.',
        enabled: false,
        sensitivity: 'medium',
        enforcement: 'block',
        direction: 'response',
      },
      {
        id: 'priv-ssn',
        name: 'SSN redaction',
        description: 'Automatically redact Social Security numbers from responses.',
        enabled: false,
        sensitivity: 'medium',
        enforcement: 'block',
        direction: 'response',
      },
      {
        id: 'priv-credit-card',
        name: 'Credit card redaction',
        description: 'Strip credit card numbers from agent output before delivery.',
        enabled: false,
        sensitivity: 'medium',
        enforcement: 'block',
        direction: 'response',
      },
    ],
  },
  {
    id: 'safety',
    label: 'Safety guardrails',
    icon: 'check-circle',
    items: [
      {
        id: 'safe-toxicity',
        name: 'Toxicity',
        description: 'Detect and block toxic, abusive, or offensive language in responses.',
        enabled: false,
        sensitivity: 'medium',
        enforcement: 'block',
        direction: 'response',
      },
      {
        id: 'safe-hate',
        name: 'Hate speech',
        description: 'Block responses containing hate speech targeting protected groups.',
        enabled: false,
        sensitivity: 'medium',
        enforcement: 'block',
        direction: 'response',
      },
      {
        id: 'safe-misinfo',
        name: 'Misinformation',
        description: 'Flag responses containing known false or misleading claims.',
        enabled: false,
        sensitivity: 'medium',
        enforcement: 'monitor',
        direction: 'response',
      },
    ],
  },
];

export interface EvaSessionState {
  landingMode: EvaLandingMode;
  selectedTemplateId: EvaTemplateId | null;
  draft: EvaAgentDraft;
  messages: EvaMessage[];
  guidanceVisible: boolean;
  orchestrationSuggested: boolean;
  /* True when the user is in a free-form LLM chat that didn't kick off
     the deterministic build flow. Optional so older persisted snapshots
     keep deserializing cleanly. */
  freeChatActive?: boolean;
  conversationalOnboardingStep?: EvaConversationalOnboardingStep;
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
  selectedChannels?: EvaChannelSelection[];
  digitalChannel?: EvaDigitalChannel;
  selectedDigitalChannels?: EvaDigitalChannel[];
  digitalChannelAddress?: string;
  channelPhoneNumber: string;
  phoneNumberDeferred?: boolean;
  standardGuardrails: typeof EVA_STANDARD_GUARDRAILS;
  advancedGuardrailGroups: typeof EVA_ADVANCED_GUARDRAIL_GROUPS;
  expandedAdvancedGroups: string[];
  personality: { llm: string; voice: string; language: string; gender: string };
  customRules: string[];
}

const replacePersistedEvaCopy = (value: string) => value
  .replace(/\bEva\b/g, 'AI Assistant')
  .replace(
    /(Voice|Digital|Video|Voice, Digital|Voice, Video|Digital, Video|Voice, Digital, Video) (is|are) added for this receptionist\. What should we name this agent\?/g,
    '$1 $2 selected for this agent. What should we name the agent?',
  )
  .replace(
    'Great, I would like to help you with that. I found Acme Electronics in San Jose from Matt’s organization profile and connected store systems. Voice is selected by default. Add any other channels this agent should support.',
    'I found Acme Electronics in San Jose from your organization profile and connected store systems. Voice is selected. Choose any additional channels for this agent.',
  )
  .replace(
    'I recommend this welcome message. You can use it as-is or edit it before continuing.',
    'Here’s a suggested welcome message. Use it as is or edit it before continuing.',
  )
  .replace(
    'Hi, thanks for calling Acme Electronics in San Jose. I can help with store hours, directions, product availability, common questions, how can I help you today?',
    'Hi, thanks for calling Acme Electronics in San Jose. I can help with store hours, directions, product availability, and common questions. How can I help?',
  )
  .replace(
    'Warm, helpful, concise, and professional. Best for a neighborhood store receptionist because it sounds friendly and covers all core tasks.',
    'Sets clear expectations for callers and covers common store questions.',
  )
  .replace(
    'Great. Next, here are the connected knowledge bases and a few recommended sources to enable for this agent.',
    'Choose the knowledge sources this agent can use.',
  )
  .replace(
    'Now let’s review connected and recommended actions for this agent.',
    'Choose the actions this agent can run.',
  )
  .replace(
    /You're all set! (.+?) is ready\./g,
    'Your $1 draft is ready.',
  )
  .replace(
    'I captured the connected knowledge bases, recommended actions, voice channel, escalation to Matt, and your selected greeting.',
    'I saved the voice channel, selected knowledge sources, selected actions, escalation contact, and greeting.',
  )
  .replace(
    'Preview the agent next, complete it now, or continue into advanced configuration.',
    'Review the agent, create it now, or configure advanced settings.',
  )
  .replace(
    'If you need to adjust anything or want me to consider more details, you can always ask here.',
    'To change anything, ask me or open advanced configuration.',
  );

const migratePersistedEvaCopy = (state: EvaSessionState): EvaSessionState => ({
  ...state,
  draft: {
    ...state.draft,
    name: replacePersistedEvaCopy(state.draft.name),
    description: replacePersistedEvaCopy(state.draft.description),
  },
  messages: state.messages.map(message => ({
    ...message,
    text: replacePersistedEvaCopy(message.text),
  })),
  agentName: replacePersistedEvaCopy(state.agentName),
  agentDescription: replacePersistedEvaCopy(state.agentDescription),
  welcomeMessage: replacePersistedEvaCopy(state.welcomeMessage),
  instructionPrompt: replacePersistedEvaCopy(state.instructionPrompt),
  optimizeSummary: {
    changes: (state.optimizeSummary?.changes ?? []).map(replacePersistedEvaCopy),
    reasoning: (state.optimizeSummary?.reasoning ?? []).map(replacePersistedEvaCopy),
  },
});

export const readEvaSessionState = (): EvaSessionState | null => {
  try {
    const raw = window.sessionStorage.getItem(EVA_SESSION_STORAGE_KEY);
    return raw ? migratePersistedEvaCopy(JSON.parse(raw) as EvaSessionState) : null;
  } catch {
    return null;
  }
};

export const buildGuidanceMessage = (draft: EvaAgentDraft) =>
  [
    `I can turn this into ${draft.name}. Here is the guided setup I recommend:`,
    '',
    `1. Basic profile: ${draft.description}`,
    `2. Available knowledge: ${draft.knowledgeBases.length ? draft.knowledgeBases.map(kb => kb.name).join(', ') : 'choose trusted knowledge sources'}`,
    `3. Actions: ${draft.actions.length ? draft.actions.join(', ') : 'decide whether the agent should take action'}`,
    `4. Security settings: ${draft.security.join(', ')}`,
  ].join('\n');

export const buildInstructionPrompt = (draft: EvaAgentDraft) =>
  [
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

export const buildWelcomeMessage = (draft: EvaAgentDraft) => {
  const firstGoal = draft.goals[0]?.toLowerCase() ?? 'help with your request';
  return `Hi, I am ${draft.name.replace(/\s+AI Assistant Agent$/, '').replace(/\s+Eva Agent$/, '')}. I can ${firstGoal} and guide you to the right next step.`;
};

export const summarizeInstructionPrompt = (prompt: string) => {
  const summary = prompt
    .split('\n')
    .map(line => line.replace(/^#+\s*/, '').replace(/^-\s*/, '').trim())
    .filter(Boolean)
    .filter(line => !line.endsWith(':'))
    .slice(0, 3)
    .join(' ');

  return summary.length > 220
    ? `${summary.slice(0, 217).trim()}...`
    : summary || 'No instruction summary added';
};

export const evaInitialDraft: EvaAgentDraft = EVA_TEMPLATES[0].draft;
