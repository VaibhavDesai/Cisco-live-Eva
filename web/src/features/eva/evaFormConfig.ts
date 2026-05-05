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
  | 'review';

export type EvaLandingMode = 'build' | 'existing';
export type EvaSecurityTier = 'standard' | 'advanced';
export type EvaChannelType = 'digital' | 'voice';
export type EvaDigitalChannel = 'chat' | 'email' | 'sms';
export type EvaSensitivity = 'low' | 'medium' | 'high';
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
];

export const EVA_SESSION_STORAGE_KEY = 'eva-agents-session-state';

export const sensitivityToValue: Record<EvaSensitivity, number> = {
  low: 0,
  medium: 50,
  high: 100,
};

export const valueToSensitivity = (value: number): EvaSensitivity => {
  if (value <= 0) return 'low';
  if (value >= 100) return 'high';
  return 'medium';
};

export const isOrchestrationIntent = (normalized: string) =>
  ((normalized.includes('connect') ||
    normalized.includes('orchestrat') ||
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

export const DIGITAL_CHANNEL_OPTIONS: Array<{ value: EvaDigitalChannel; label: string }> = [
  { value: 'chat', label: 'Chat' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
];

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

export const STARTER_PROMPTS: Array<{
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

export const readEvaSessionState = (): EvaSessionState | null => {
  try {
    const raw = window.sessionStorage.getItem(EVA_SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EvaSessionState) : null;
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
  return `Hi, I am ${draft.name.replace(/\s+Eva Agent$/, '')}. I can ${firstGoal} and guide you to the right next step.`;
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
