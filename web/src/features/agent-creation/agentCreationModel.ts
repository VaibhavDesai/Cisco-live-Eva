export type AgentFamily = 'calling' | 'contact_center' | 'internal_assistant';

export type EntitlementState = 'licensed' | 'unavailable';

export type CapabilityAvailability = 'minimum' | 'recommended' | 'cx_only' | 'external';

export type CapabilityProgress =
  | 'not_started'
  | 'in_progress'
  | 'configured'
  | 'skipped'
  | 'blocked';

export type CapabilityTrackerStatus = 'queued' | 'active' | 'done' | 'skipped' | 'blocked';

export type AgentLifecycle = 'draft' | 'published' | 'deployed' | 'live';

export type CustomerChannel = 'voice' | 'digital' | 'video';
export type ContactCenterChannelChoice = string;

export interface ContactCenterChannelValues {
  selectedChannels: CustomerChannel[];
  greetings: Partial<Record<CustomerChannel, string>>;
  digitalChannels?: string[];
  voiceLocation?: string;
  voicePhoneNumber?: string;
  voiceExtension?: string;
}

export type AgentCreationSection =
  | 'basics'
  | 'instructions'
  | 'language'
  | 'voice'
  | 'channels'
  | 'identity'
  | 'memory'
  | 'handoff'
  | 'knowledge'
  | 'actions'
  | 'security'
  | 'testing'
  | 'observability'
  | 'insights'
  | 'audience'
  | 'placement'
  | 'audit'
  | 'preview'
  | 'external'
  | 'cx_only'
  | 'deployment';

export type RecommendationActionKind =
  | 'open_section'
  | 'open_external'
  | 'review_entitlement';

export interface FamilyMetadata {
  id: AgentFamily;
  label: string;
  shortLabel: string;
  description: string;
  summary: string;
  examples: string[];
  defaultLanguage: string;
}

export interface CapabilityDefinition {
  id: string;
  label: string;
  description: string;
  section: AgentCreationSection;
  availability: CapabilityAvailability;
  icon?: string;
}

export interface CapabilityState extends CapabilityDefinition {
  progress: CapabilityProgress;
  values?: Record<string, unknown>;
  updatedAt?: string;
}

export interface AgentRecommendation {
  id: string;
  title: string;
  reason: string;
  benefit: string;
  requirement: CapabilityAvailability;
  targetSection: AgentCreationSection;
  actionKind: RecommendationActionKind;
  priority?: number;
}

export interface DraftChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
}

export interface AgentPreviewState {
  status: 'not_started' | 'ready' | 'running' | 'passed' | 'failed';
  lastRunAt?: string;
  sessionId?: string;
  transcript?: Array<{ role: 'user' | 'assistant'; text: string }>;
}

export interface DeploymentReference {
  id: string;
  kind: 'phone_number' | 'contact_center_channel' | 'internal_channel' | 'other';
  label: string;
  status: 'pending' | 'connected';
  externalUrl?: string;
}

export interface AgentDraft {
  id: string;
  family: AgentFamily;
  entitlement: EntitlementState;
  basics: {
    name: string;
    purpose: string;
    description: string;
  };
  instructions: {
    content: string;
    applied: boolean;
    sourceRevision?: string;
  };
  language: {
    defaultLanguage: string;
    additionalLanguages: string[];
  };
  familyConfiguration: Record<string, CapabilityState>;
  recommendations: AgentRecommendation[];
  recommendationsStale: boolean;
  recommendationSourceRevision: string;
  dismissedRecommendationIds: string[];
  chatHistory: DraftChatMessage[];
  previewState: AgentPreviewState;
  deploymentReferences: DeploymentReference[];
  activeSection: AgentCreationSection;
  lifecycle: AgentLifecycle;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface StarterProposal {
  name: string;
  purpose: string;
  description: string;
  language: string;
  instructions: string;
  /** Quick-creation review values. Optional for legacy and non-CX proposals. */
  channel?: ContactCenterChannelChoice;
  greeting?: string;
  selectedChannels?: CustomerChannel[];
  greetings?: Partial<Record<CustomerChannel, string>>;
}

export interface AdaptiveIntakeQuestion {
  id: string;
  answerKey: string;
  prompt: string;
  helperText: string;
  required: boolean;
  inputKind: 'text' | 'textarea' | 'select';
  options?: string[];
}

/** Stored when an optional preset question is intentionally skipped. */
export const SKIPPED_INTAKE_ANSWER = '__skipped__';

export interface VoiceDestinationAnswer {
  location: string;
  phoneNumber: string;
}

export const encodeVoiceDestinationAnswer = (answer: VoiceDestinationAnswer) =>
  JSON.stringify(answer);

export const decodeVoiceDestinationAnswer = (answer: string | undefined): VoiceDestinationAnswer | null => {
  if (!answer) return null;
  try {
    const parsed = JSON.parse(answer) as Partial<VoiceDestinationAnswer>;
    if (typeof parsed.location !== 'string' || typeof parsed.phoneNumber !== 'string') return null;
    if (!parsed.location.trim() || !parsed.phoneNumber.trim()) return null;
    return { location: parsed.location, phoneNumber: parsed.phoneNumber };
  } catch {
    return null;
  }
};

export const FAMILY_METADATA: Record<AgentFamily, FamilyMetadata> = {
  calling: {
    id: 'calling',
    label: 'Calling',
    shortLabel: 'Calling',
    description: 'Create an AI voice agent for incoming calls and receptionist experiences.',
    summary: 'Answer, guide, and route callers with a natural voice experience.',
    examples: ['Voice receptionist', 'Appointment scheduler', 'Retail store assistant'],
    defaultLanguage: 'English (US)',
  },
  contact_center: {
    id: 'contact_center',
    label: 'Contact Center',
    shortLabel: 'Contact Center',
    description: 'Create a governed customer-service agent across voice and digital channels.',
    summary: 'Resolve customer needs with knowledge, actions, handoff, security, and testing.',
    examples: ['CX concierge', 'Order management', 'Property service agent'],
    defaultLanguage: 'English (US)',
  },
  internal_assistant: {
    id: 'internal_assistant',
    label: 'AI Assistant',
    shortLabel: 'AI Assistant',
    description: 'Create an employee-facing assistant grounded in internal tools and information.',
    summary: 'Help teams find answers and complete common internal tasks.',
    examples: ['IT help desk', 'Employee policy assistant', 'Incident command assistant'],
    defaultLanguage: 'English (US)',
  },
};

export const ALL_LICENSED_ENTITLEMENTS: Record<AgentFamily, EntitlementState> = {
  calling: 'licensed',
  contact_center: 'licensed',
  internal_assistant: 'licensed',
};

const sharedMinimumCapabilities: CapabilityDefinition[] = [
  {
    id: 'profile',
    label: 'Basic profile',
    description: 'Name the agent and define the outcome it should deliver.',
    section: 'basics',
    availability: 'minimum',
    icon: 'profile',
  },
  {
    id: 'instructions',
    label: 'Instructions',
    description: 'Set the role, goals, boundaries, and response style.',
    section: 'instructions',
    availability: 'minimum',
    icon: 'document',
  },
  {
    id: 'language',
    label: 'Default language',
    description: 'Choose the primary language for the first published version.',
    section: 'language',
    availability: 'minimum',
    icon: 'language',
  },
];

const capability = (
  id: string,
  label: string,
  description: string,
  section: AgentCreationSection,
  availability: CapabilityAvailability,
  icon?: string,
): CapabilityDefinition => ({ id, label, description, section, availability, icon });

export const FAMILY_CAPABILITIES: Record<AgentFamily, CapabilityDefinition[]> = {
  calling: [
    ...sharedMinimumCapabilities,
    capability('voice', 'Voice experience', 'Choose the voice, pace, tone, and spoken response behavior.', 'voice', 'recommended', 'phone'),
    capability('identity', 'Customer identity', 'Decide when and how callers should be identified or verified.', 'identity', 'recommended', 'profile'),
    capability('memory', 'AI memory', 'Use continuity only when the experience needs it.', 'memory', 'recommended', 'history'),
    capability('handoff', 'Human handoff', 'Define when and how the agent should connect a caller to a person.', 'handoff', 'recommended', 'transfer-call'),
    capability('knowledge', 'Basic knowledge', 'Ground answers in approved business information.', 'knowledge', 'recommended', 'knowledge'),
    capability('testing', 'Voice preview', 'Try a sample call and refine the experience.', 'preview', 'recommended', 'play'),
    capability('deployment', 'Phone number', 'Connect and manage a phone number outside Agent Studio.', 'external', 'external', 'phone'),
    capability('routing', 'Calling routing', 'Configure routing in the Webex Calling administration experience.', 'external', 'external', 'flow'),
    capability('calling_queues', 'Calling queues', 'Configure and manage queues outside Agent Studio.', 'external', 'external', 'queue'),
    capability('omnichannel', 'Omnichannel customer channels', 'Add digital and video customer channels with Contact Center.', 'cx_only', 'cx_only', 'channels'),
    capability('actions', 'Advanced Actions and MCP', 'Connect transactional tools and MCP servers with Contact Center.', 'cx_only', 'cx_only', 'actions'),
    capability('security', 'AI Defense profiles', 'Apply advanced AI Defense profiles with Contact Center.', 'cx_only', 'cx_only', 'security'),
    capability('evaluation_suites', 'Evaluation suites', 'Run advanced evaluation suites with Contact Center.', 'cx_only', 'cx_only', 'play'),
    capability('observability', 'Observability', 'Monitor production traces and quality with Contact Center.', 'cx_only', 'cx_only', 'analytics'),
    capability('insights', 'Insights', 'Discover operational trends with Contact Center.', 'cx_only', 'cx_only', 'insights'),
  ],
  contact_center: [
    ...sharedMinimumCapabilities,
    capability('channels', 'Voice, digital, and video channels', 'Choose the customer channels to configure for deployment.', 'channels', 'recommended', 'channels'),
    capability('identity', 'Customer identity', 'Verify identity before account-specific conversations.', 'identity', 'recommended', 'profile'),
    capability('memory', 'AI memory', 'Maintain continuity when the use case calls for it.', 'memory', 'recommended', 'history'),
    capability('knowledge', 'Knowledge', 'Connect approved customer-support information.', 'knowledge', 'recommended', 'knowledge'),
    capability('actions', 'Actions and MCP', 'Resolve requests or update systems with verified capabilities.', 'actions', 'recommended', 'actions'),
    capability('handoff', 'Human handoff', 'Transfer customers with context when a person is needed.', 'handoff', 'recommended', 'transfer-call'),
    capability('security', 'Security and AI Defense', 'Apply guardrails, data controls, and AI Defense profiles.', 'security', 'recommended', 'security'),
    capability('testing', 'Testing', 'Validate representative customer conversations before publishing.', 'testing', 'recommended', 'play'),
    capability('observability', 'Observability', 'Review traces, performance, and quality after deployment.', 'observability', 'recommended', 'analytics'),
    capability('insights', 'Insights', 'Find customer and operational trends.', 'insights', 'recommended', 'insights'),
    capability('deployment', 'Queues, entry points, and destinations', 'Connect a published version when preparing to deploy.', 'deployment', 'external', 'channels'),
  ],
  internal_assistant: [
    ...sharedMinimumCapabilities,
    capability('audience', 'Employee audience and access', 'Choose who can use the assistant and respect their permissions.', 'audience', 'recommended', 'people'),
    capability('placement', 'Work-surface placement', 'Select one or more Webex employee work surfaces.', 'placement', 'recommended', 'apps'),
    capability('knowledge', 'Internal knowledge', 'Ground answers in approved policies, playbooks, and documentation.', 'knowledge', 'recommended', 'knowledge'),
    capability('actions', 'Actions and skills', 'Create tickets, update work, and hand off to the right team.', 'actions', 'recommended', 'actions'),
    capability('memory', 'AI memory', 'Maintain employee continuity only when it is appropriate.', 'memory', 'recommended', 'history'),
    capability('security', 'Security and audit', 'Respect employee permissions and preserve an audit trail.', 'audit', 'recommended', 'security'),
    capability('testing', 'Testing', 'Try common employee questions and workflows.', 'testing', 'recommended', 'play'),
    capability('deployment', 'Employee channel', 'Choose where employees can reach the assistant.', 'deployment', 'external', 'channels'),
  ],
};

const FAMILY_INTAKE: Record<AgentFamily, AdaptiveIntakeQuestion[]> = {
  calling: [
    {
      id: 'calling-location-phone',
      answerKey: 'voice_destination',
      prompt: 'Select a location and phone number',
      helperText: 'Select where this agent receives calls and the connected number callers use.',
      required: true,
      inputKind: 'select',
    },
    {
      id: 'calling-outcome',
      answerKey: 'outcome',
      prompt: "What's your agent goal?",
      helperText: 'Describe why people call and what the agent should help them do.',
      required: true,
      inputKind: 'textarea',
    },
    {
      id: 'calling-name',
      answerKey: 'name',
      prompt: 'What should this agent be called?',
      helperText: 'Use the suggested name or enter a different one.',
      required: true,
      inputKind: 'text',
    },
    {
      id: 'calling-greeting',
      answerKey: 'greeting',
      prompt: 'Review the welcome message',
      helperText: 'Use the suggested message or edit it.',
      required: true,
      inputKind: 'textarea',
    },
    {
      id: 'calling-knowledge',
      answerKey: 'knowledge',
      prompt: 'Select a knowledge base',
      helperText: 'Choose the approved information this agent can use to answer callers.',
      required: true,
      inputKind: 'select',
    },
  ],
  contact_center: [
    {
      id: 'contact-center-channel',
      answerKey: 'channel',
      prompt: 'Which channels should this agent support?',
      helperText: 'Choose one or more channels. You can add specific entry points later.',
      required: true,
      inputKind: 'select',
      options: ['Voice', 'Digital', 'Video'],
    },
    {
      id: 'contact-center-outcome',
      answerKey: 'outcome',
      prompt: "What's your agent goal?",
      helperText: 'Describe what customers need and what the agent should help them do.',
      required: true,
      inputKind: 'textarea',
    },
    {
      id: 'contact-center-name',
      answerKey: 'name',
      prompt: 'What should this agent be called?',
      helperText: 'Use the suggested name or enter a different one.',
      required: true,
      inputKind: 'text',
    },
    {
      id: 'contact-center-greeting',
      answerKey: 'greeting',
      prompt: 'Review the welcome message',
      helperText: 'Use the suggested message or edit it.',
      required: true,
      inputKind: 'textarea',
    },
    {
      id: 'contact-center-knowledge',
      answerKey: 'knowledge',
      prompt: 'Select a knowledge base',
      helperText: 'Choose approved information for customer answers, or skip this step.',
      required: false,
      inputKind: 'select',
    },
    {
      id: 'contact-center-actions',
      answerKey: 'actions',
      prompt: 'Select an action',
      helperText: 'Choose what the agent can do for customers, or skip this step.',
      required: false,
      inputKind: 'select',
    },
  ],
  internal_assistant: [
    {
      id: 'internal-outcome',
      answerKey: 'outcome',
      prompt: "What's your agent goal?",
      helperText: 'Describe what employees need and what this assistant should help them do.',
      required: true,
      inputKind: 'textarea',
    },
    {
      id: 'internal-name',
      answerKey: 'name',
      prompt: 'What should this agent be called?',
      helperText: 'Use the suggested name or enter a different one.',
      required: true,
      inputKind: 'text',
    },
    {
      id: 'internal-knowledge',
      answerKey: 'knowledge',
      prompt: 'Select a knowledge base',
      helperText: 'Choose the approved information this assistant can use to help employees.',
      required: true,
      inputKind: 'select',
    },
  ],
};

interface StarterTemplate {
  id: string;
  keywords: string[];
  proposal: StarterProposal;
}

export const STARTER_TEMPLATES: Record<AgentFamily, StarterTemplate[]> = {
  calling: [
    {
      id: 'voice-receptionist',
      keywords: ['receptionist', 'route', 'front desk', 'common question'],
      proposal: {
        name: 'Voice Receptionist',
        purpose: 'Answer common questions and route callers to the right person.',
        description: 'A voice receptionist that greets callers, shares approved business information, and escalates when needed.',
        language: 'English (US)',
        instructions: '#### Role & Identity\nYou are a friendly voice receptionist.\n\n#### Primary Goals\nAnswer common questions using approved business information and route callers to the right person.\n\n#### Guardrails\nDo not invent business details. Escalate requests that require a person.\n\n#### Output Rules\nKeep spoken responses warm, clear, and concise.',
      },
    },
    {
      id: 'appointment-scheduler',
      keywords: ['appointment', 'schedule', 'reschedule', 'clinic', 'booking'],
      proposal: {
        name: 'Appointment Scheduler',
        purpose: 'Help callers schedule, reschedule, and cancel appointments.',
        description: 'A virtual receptionist that confirms appointment details and routes urgent requests appropriately.',
        language: 'English (US)',
        instructions: '#### Role & Identity\nYou are a virtual appointment receptionist.\n\n#### Primary Goals\nHelp callers schedule, reschedule, and cancel appointments, and confirm all details before finalizing.\n\n#### Guardrails\nDo not give professional advice. Route urgent or sensitive requests to the appropriate person.\n\n#### Output Rules\nBe compassionate, reassuring, and concise.',
      },
    },
    {
      id: 'retail-store-assistant',
      keywords: ['retail', 'store', 'inventory', 'product', 'return'],
      proposal: {
        name: 'Retail Store AI Agent',
        purpose: 'Answer store calls, share product information, and help with availability and returns.',
        description: 'A retail calling agent for store details, inventory-backed answers, returns guidance, and follow-up.',
        language: 'English (US)',
        instructions: '#### Role & Identity\nYou are a retail store voice assistant.\n\n#### Primary Goals\nAnswer store questions, share approved product information, and help callers understand availability and returns.\n\n#### Guardrails\nUse approved retail sources and escalate sensitive requests.\n\n#### Output Rules\nUse a warm, helpful, professional tone.',
      },
    },
  ],
  contact_center: [
    {
      id: 'cx-concierge',
      keywords: ['support', 'concierge', 'customer', 'resolve', 'account'],
      proposal: {
        name: 'CX Concierge',
        purpose: 'Resolve customer questions and route requests that need a specialist.',
        description: 'A customer-service agent that answers questions, guides next steps, and hands off with context.',
        language: 'English (US)',
        instructions: '#### Role & Identity\nYou are a customer experience concierge.\n\n#### Primary Goals\nResolve customer questions accurately and preserve context when handing off.\n\n#### Guardrails\nUse approved information, protect customer data, and do not make unauthorized promises.\n\n#### Output Rules\nBe warm, empathetic, and professional.',
      },
    },
    {
      id: 'order-management',
      keywords: ['order', 'tracking', 'delivery', 'return', 'shipment'],
      proposal: {
        name: 'Order Management Agent',
        purpose: 'Help customers check orders, delivery estimates, and basic returns.',
        description: 'A contact-center agent for order inquiries, tracking, delivery updates, and returns guidance.',
        language: 'English (US)',
        instructions: '#### Role & Identity\nYou are an order management support agent.\n\n#### Primary Goals\nHelp customers understand order status, tracking, delivery estimates, and basic returns.\n\n#### Guardrails\nConfirm the customer and order before sharing account-specific details. Escalate exceptions.\n\n#### Output Rules\nGive direct status summaries and clear next steps.',
      },
    },
    {
      id: 'property-service',
      keywords: ['property', 'tenant', 'maintenance', 'technician', 'service request'],
      proposal: {
        name: 'Property Management Service Agent',
        purpose: 'Triage tenant service requests and coordinate the next support step.',
        description: 'A service agent for identity checks, maintenance triage, ticket creation, and technician coordination.',
        language: 'English (US)',
        instructions: '#### Role & Identity\nYou are a property management service agent.\n\n#### Primary Goals\nVerify the caller, triage service requests, and coordinate an approved next step.\n\n#### Guardrails\nEscalate safety issues immediately and protect tenant information.\n\n#### Output Rules\nBe measured, clear, and reassuring.',
      },
    },
  ],
  internal_assistant: [
    {
      id: 'it-help-desk',
      keywords: ['it', 'help desk', 'password', 'vpn', 'software', 'access'],
      proposal: {
        name: 'IT Help Desk Agent',
        purpose: 'Help employees resolve common technical and access issues.',
        description: 'An internal assistant for password, VPN, software, and access troubleshooting with ticket escalation.',
        language: 'English (US)',
        instructions: '#### Role & Identity\nYou are an IT help desk agent for employees.\n\n#### Primary Goals\nResolve common technical issues with structured troubleshooting and escalate when remote resolution is not possible.\n\n#### Guardrails\nNever ask for or store full passwords. Do not bypass security policies.\n\n#### Output Rules\nUse clear steps and provide ticket references for escalations.',
      },
    },
    {
      id: 'employee-policy',
      keywords: ['policy', 'pto', 'benefit', 'leave', 'hr', 'people'],
      proposal: {
        name: 'Employee Policy Assistant',
        purpose: 'Help employees find approved policy, benefits, leave, and people-operations guidance.',
        description: 'An internal assistant grounded in HR policies and process playbooks that routes sensitive cases.',
        language: 'English (US)',
        instructions: '#### Role & Identity\nYou are an employee policy assistant.\n\n#### Primary Goals\nExplain approved HR policies and process steps in plain language.\n\n#### Guardrails\nUse approved policy sources, respect employee permissions, and route sensitive or case-specific questions to People Operations.\n\n#### Output Rules\nBe clear, neutral, and supportive.',
      },
    },
    {
      id: 'candidate-feedback',
      keywords: ['candidate', 'interview', 'feedback', 'hiring', 'recruiting'],
      proposal: {
        name: 'Candidate Feedback Assistant',
        purpose: 'Summarize approved interview feedback and prepare the next recruiting step.',
        description: 'An internal recruiting assistant for panel feedback, open questions, and approved follow-up work.',
        language: 'English (US)',
        instructions: '#### Role & Identity\nYou are a recruiting feedback assistant.\n\n#### Primary Goals\nSummarize approved panel feedback, surface open questions, and prepare the next recruiting step.\n\n#### Guardrails\nRespect hiring-data permissions and require human confirmation before final decisions.\n\n#### Output Rules\nBe concise, neutral, and explicit about evidence and next steps.',
      },
    },
    {
      id: 'incident-command',
      keywords: ['incident', 'outage', 'runbook', 'sre', 'deployment', 'post-mortem'],
      proposal: {
        name: 'AI Incident Command Agent',
        purpose: 'Coordinate technical incidents with runbooks, ownership, updates, and remediation tracking.',
        description: 'An internal incident assistant that surfaces operational context and supports stakeholder communication.',
        language: 'English (US)',
        instructions: '#### Role & Identity\nYou are an AI incident command assistant.\n\n#### Primary Goals\nSurface runbooks and ownership, keep incident updates consistent, and track approved remediation work.\n\n#### Guardrails\nRequire confirmation before remediation actions and escalate critical operational changes.\n\n#### Output Rules\nBe concise, factual, and explicit about owners and next steps.',
      },
    },
  ],
};

const normalize = (value: string | undefined) => value?.trim() ?? '';

const normalizeForMatching = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');

const scoreTemplate = (template: StarterTemplate, text: string) =>
  template.keywords.reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0);

const chooseTemplate = (family: AgentFamily, answers: Record<string, string>) => {
  const text = normalizeForMatching(Object.values(answers).join(' '));
  const ranked = FAMILY_TEMPLATE_PRIORITY[family]
    .map(template => ({ template, score: scoreTemplate(template, text) }))
    .sort((left, right) => right.score - left.score);
  return ranked[0].score > 0 ? ranked[0].template : STARTER_TEMPLATES[family][0];
};

const templatesById = (family: AgentFamily, ids: string[]) => ids.map(id => {
  const template = STARTER_TEMPLATES[family].find(candidate => candidate.id === id);
  if (!template) throw new Error(`Missing ${family} starter template: ${id}`);
  return template;
});

/* Put the broad default last while scoring so a more specific use case wins. */
const FAMILY_TEMPLATE_PRIORITY: Record<AgentFamily, StarterTemplate[]> = {
  calling: templatesById('calling', ['appointment-scheduler', 'retail-store-assistant', 'voice-receptionist']),
  contact_center: templatesById('contact_center', ['order-management', 'property-service', 'cx-concierge']),
  internal_assistant: templatesById('internal_assistant', ['employee-policy', 'candidate-feedback', 'incident-command', 'it-help-desk']),
};

export const getAdaptiveIntakeQuestions = (
  family: AgentFamily,
  answers: Record<string, string> = {},
): AdaptiveIntakeQuestion[] => {
  const questions = FAMILY_INTAKE[family];
  const firstMissingIndex = questions.findIndex(question => !normalize(answers[question.answerKey]));
  return firstMissingIndex === -1 ? questions : questions.slice(0, firstMissingIndex + 1);
};

export const buildStarterProposal = (
  family: AgentFamily,
  answers: Record<string, string>,
): StarterProposal => {
  const chosen = chooseTemplate(family, answers).proposal;
  const requestedOutcome = normalize(answers.purpose)
    || normalize(answers.outcome)
    || normalize(answers.use_case);
  const purpose = requestedOutcome || chosen.purpose;
  const audience = normalize(answers.audience);
  const mode = normalize(answers.mode);
  const tasks = normalize(answers.tasks) || purpose;
  const language = normalize(answers.language) || chosen.language;
  const fallbackName = family === 'internal_assistant' && mode
    ? mode === 'Employee Help'
      ? 'Employee Help Assistant'
      : mode
    : chosen.name;
  const name = normalize(answers.name) || fallbackName;
  const description =
    normalize(answers.description) ||
    (audience ? `${purpose} Designed first for ${audience}.` : chosen.description);

  const rawChannel = normalize(answers.channel).toLowerCase();
  const selectedChannels: CustomerChannel[] | undefined = family !== 'contact_center'
    ? undefined
    : (['voice', 'digital', 'video'] as CustomerChannel[]).filter(
        candidate => rawChannel.includes(candidate) || (rawChannel === 'both' && candidate !== 'video'),
      );
  const channel: ContactCenterChannelChoice | undefined = selectedChannels?.includes('voice')
    && selectedChannels.includes('digital')
    && !selectedChannels.includes('video')
    ? 'Both'
    : selectedChannels?.length
      ? selectedChannels.map(item => `${item.charAt(0).toUpperCase()}${item.slice(1)}`).join(', ')
      : undefined;
  const suggestedGreeting = family === 'calling'
    ? `Thanks for calling. You are speaking with ${name}. How can I help?`
    : selectedChannels?.length === 1 && selectedChannels[0] === 'voice'
      ? `Thanks for calling. You are speaking with ${name}. How can I help?`
      : channel
        ? `Hi, I am ${name}. How can I help today?`
        : '';
  const greeting = family === 'contact_center' || family === 'calling'
    ? normalize(answers.greeting) || suggestedGreeting
    : undefined;
  const greetings = selectedChannels && greeting
    ? Object.fromEntries(selectedChannels.map(selectedChannel => [selectedChannel, greeting])) as Partial<Record<CustomerChannel, string>>
    : undefined;

  let instructions = chosen.instructions;
  if (family === 'calling') {
    instructions = `You are ${name}, a calling assistant for the organization.

- Greet callers and identify what they need.
- Help with ${tasks.replace(/[.?!]+$/, '')}.
- Ask one clear question at a time.
- Use only information provided in these instructions or connected knowledge.
- Never claim that you checked a system unless a verified capability is connected.
- When you cannot complete a request, explain the limitation and offer a human handoff.
- Open the conversation with: "${greeting}"
- Communicate in ${language} using a warm, concise, professional style.`;
  } else if (family === 'contact_center') {
    const selectedChannelNames = selectedChannels?.map(selectedChannel => (
      selectedChannel.charAt(0).toUpperCase() + selectedChannel.slice(1)
    )) ?? [];
    const channelList = selectedChannelNames.length > 2
      ? `${selectedChannelNames.slice(0, -1).join(', ')}, and ${selectedChannelNames.at(-1)}`
      : selectedChannelNames.join(' and ');
    let channelInstruction = 'Maintain the configured tone and language across supported channels.';
    if (selectedChannels && selectedChannels.length > 1) {
      channelInstruction = `Support customers consistently across ${channelList.toLowerCase()} channels.`;
    } else if (selectedChannels?.includes('voice')) {
      channelInstruction = 'Support customers through natural, concise voice conversations.';
    } else if (selectedChannels?.includes('digital')) {
      channelInstruction = 'Support customers through clear, scannable digital conversations.';
    } else if (selectedChannels?.includes('video')) {
      channelInstruction = 'Support customers through clear video conversations.';
    }
    instructions = `You are ${name}, a Contact Center AI agent for the organization.

- Help customers with ${purpose.replace(/[.?!]+$/, '')}.
- ${channelInstruction}
- Follow approved knowledge and identity-verification requirements.
- Use connected actions only for their documented purpose.
- Explain limitations and escalate according to the configured handoff policy.
- Open the conversation with: "${greeting || `Hi, I am ${name}. How can I help today?`}"
- Maintain the configured tone and language throughout the conversation.`;
  } else if (mode === 'Contact Center Agent Assist') {
    instructions = `Help human agents during customer interactions by finding approved answers,
summarizing relevant context, and suggesting next steps.
Never send or execute anything on the employee's behalf unless a verified action is connected.`;
  } else if (mode === 'Meeting and Calling Companion') {
    instructions = `Help employees prepare for, participate in, and follow up on meetings and calls.
Summarize available context, surface relevant information, and draft follow-up actions
without implying that a message, task, or update was completed unless confirmed.`;
  } else if (family === 'internal_assistant' && mode === 'Employee Help') {
    instructions = `Help ${audience || 'employees'} with ${purpose}.
Give concise next steps, use only permission-appropriate sources, state uncertainty,
and direct sensitive or unsupported requests to the configured owner or process.`;
  } else if (family === 'internal_assistant' && purpose !== chosen.purpose) {
    instructions = chosen.instructions.replace('#### Primary Goals\n', `#### Primary Goals\n${purpose}\n\n`);
  }

  return {
    name,
    purpose,
    description,
    language,
    instructions,
    channel,
    greeting,
    selectedChannels,
    greetings,
  };
};

const createId = (prefix: string) => {
  const randomUUID = globalThis.crypto?.randomUUID?.();
  if (randomUUID) return `${prefix}-${randomUUID}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const initialProgress = (
  definition: CapabilityDefinition,
  entitlement: EntitlementState,
  proposal: StarterProposal,
): CapabilityProgress => {
  if (entitlement === 'unavailable' || definition.availability === 'cx_only') return 'blocked';
  if (definition.id === 'profile') {
    return proposal.name.trim() && proposal.purpose.trim() ? 'configured' : 'in_progress';
  }
  if (definition.id === 'instructions') {
    return proposal.instructions.trim() ? 'configured' : 'not_started';
  }
  if (definition.id === 'language') {
    return proposal.language.trim() ? 'configured' : 'not_started';
  }
  return 'not_started';
};

const createFamilyConfiguration = (
  family: AgentFamily,
  entitlement: EntitlementState,
  proposal: StarterProposal,
  now: string,
): Record<string, CapabilityState> =>
  Object.fromEntries(
    FAMILY_CAPABILITIES[family].map(definition => [
      definition.id,
      {
        ...definition,
        progress: definition.id === 'channels' && family === 'contact_center' && proposal.selectedChannels?.length
          ? 'configured'
          : initialProgress(definition, entitlement, proposal),
        values: definition.id === 'language'
          ? { defaultLanguage: proposal.language, additionalLanguages: [] }
          : definition.id === 'channels' && family === 'contact_center' && proposal.selectedChannels?.length
            ? {
                selectedChannels: [...proposal.selectedChannels],
                greetings: { ...(proposal.greetings ?? {}) },
              } satisfies ContactCenterChannelValues
            : {},
        updatedAt: now,
      },
    ]),
  );

const isResolved = (state: CapabilityState | undefined) =>
  state?.progress === 'configured' || state?.progress === 'skipped';

export const getCapabilityTrackerStatus = (
  progress: CapabilityProgress | undefined,
  isCurrent = false,
): CapabilityTrackerStatus => {
  if (progress === 'configured') return 'done';
  if (progress === 'skipped') return 'skipped';
  if (progress === 'blocked') return 'blocked';
  if (progress === 'in_progress' || isCurrent) return 'active';
  return 'queued';
};

const containsAny = (text: string, words: string[]) => words.some(word => text.includes(word));

interface RankedRecommendation extends AgentRecommendation {
  priority: number;
}

const recommendation = (
  draft: AgentDraft,
  id: string,
  priority: number,
  title: string,
  reason: string,
  benefit: string,
  requirement: CapabilityAvailability,
  targetSection: AgentCreationSection,
  actionKind: RecommendationActionKind = 'open_section',
): RankedRecommendation => ({
  id: `${draft.family}:${id}`,
  priority,
  title,
  reason,
  benefit,
  requirement,
  targetSection,
  actionKind,
});

export const getRankedRecommendations = (draft: AgentDraft): AgentRecommendation[] => {
  if (draft.entitlement === 'unavailable') {
    const entitlementRecommendation = recommendation(
      draft,
      'entitlement',
      100,
      `Review ${FAMILY_METADATA[draft.family].label} access`,
      'This agent family is not available with the current entitlement.',
      'Confirming access prevents configuration work from being blocked later.',
      'minimum',
      'basics',
      'review_entitlement',
    );
    return draft.dismissedRecommendationIds.includes(entitlementRecommendation.id)
      ? []
      : [entitlementRecommendation];
  }

  const text = normalizeForMatching(
    `${draft.basics.purpose} ${draft.basics.description} ${draft.instructions.content}`,
  );
  const candidates: RankedRecommendation[] = [];
  const capabilityState = draft.familyConfiguration;

  if (!isResolved(capabilityState.knowledge) && capabilityState.knowledge?.progress !== 'blocked') {
    candidates.push(recommendation(
      draft,
      'knowledge',
      draft.family === 'contact_center' ? 100 : 86,
      draft.family === 'internal_assistant' ? 'Connect internal knowledge' : 'Ground the agent in approved knowledge',
      containsAny(text, ['answer', 'policy', 'product', 'support', 'help', 'information'])
        ? 'The agent will answer questions that depend on trusted information.'
        : 'A knowledge source can make answers more accurate and easier to maintain.',
      'Grounded answers reduce unsupported responses and manual instruction updates.',
      'recommended',
      'knowledge',
    ));
  }

  if (!isResolved(capabilityState.actions) && capabilityState.actions?.progress !== 'blocked') {
    const actionSignal = containsAny(text, [
      'create', 'update', 'schedule', 'book', 'ticket', 'route', 'transfer', 'notify', 'track', 'resolve',
    ]);
    candidates.push(recommendation(
      draft,
      'actions',
      actionSignal ? 96 : 76,
      draft.family === 'internal_assistant'
        ? 'Add an internal action'
        : draft.family === 'contact_center'
          ? 'Connect actions'
          : 'Connect actions and handoff',
      actionSignal
        ? 'The requested outcome includes work the agent cannot complete with instructions alone.'
        : 'Actions let the agent complete a request or preserve context during handoff.',
      draft.family === 'calling'
        ? 'Callers can finish more tasks without repeating information.'
        : draft.family === 'internal_assistant'
          ? 'Employees can finish more tasks without repeating information.'
          : 'Customers can finish more tasks without repeating information.',
      capabilityState.actions?.availability ?? 'recommended',
      'actions',
    ));
  }

  if (!isResolved(capabilityState.security) && capabilityState.security?.progress !== 'blocked') {
    const sensitiveSignal = containsAny(text, [
      'customer', 'employee', 'account', 'password', 'payment', 'health', 'hr', 'incident', 'private', 'sensitive',
    ]);
    candidates.push(recommendation(
      draft,
      'security',
      sensitiveSignal ? 94 : draft.family === 'contact_center' ? 88 : 68,
      draft.family === 'internal_assistant' ? 'Review access and data controls' : 'Apply security guardrails',
      sensitiveSignal
        ? 'The use case may handle personal, account, or operational information.'
        : 'Explicit guardrails clarify how the agent should handle risky requests.',
      'The right controls protect data and make escalation behavior predictable.',
      capabilityState.security?.availability ?? 'recommended',
      capabilityState.security?.section ?? 'security',
      capabilityState.security?.availability === 'external' ? 'open_external' : 'open_section',
    ));
  }

  const identityResolvedByVisibleSection =
    draft.family === 'contact_center' && isResolved(capabilityState.security);
  if (
    capabilityState.identity
    && !isResolved(capabilityState.identity)
    && !identityResolvedByVisibleSection
    && capabilityState.identity.progress !== 'blocked'
  ) {
    const identitySignal = containsAny(text, [
      'account', 'customer', 'personal', 'payment', 'order', 'patient', 'member', 'verify', 'identity',
    ]);
    if (identitySignal) {
      candidates.push(recommendation(
        draft,
        'identity',
        95,
        'Define identity checks',
        'The use case may expose personal or account-specific information.',
        'Clear verification rules reduce accidental disclosure and make handoff safer.',
        'recommended',
        'identity',
      ));
    }
  }

  if (capabilityState.memory && !isResolved(capabilityState.memory) && capabilityState.memory.progress !== 'blocked') {
    const memorySignal = containsAny(text, [
      'remember', 'continuity', 'returning', 'personalize', 'preference', 'follow up', 'follow-up',
    ]);
    if (memorySignal) {
      candidates.push(recommendation(
        draft,
        'memory',
        92,
        'Decide whether memory is appropriate',
        'The requested experience depends on continuity or personalization across conversations.',
        'An explicit memory decision clarifies consent, retention, and user expectations.',
        'recommended',
        'memory',
      ));
    }
  }

  const handoffResolvedByVisibleSection =
    draft.family === 'contact_center' && isResolved(capabilityState.actions);
  if (
    capabilityState.handoff
    && !isResolved(capabilityState.handoff)
    && !handoffResolvedByVisibleSection
    && capabilityState.handoff.progress !== 'blocked'
  ) {
    const handoffSignal = containsAny(text, ['human', 'person', 'route', 'transfer', 'escalate', 'specialist']);
    candidates.push(recommendation(
      draft,
      'handoff',
      handoffSignal ? 93 : 78,
      'Define human handoff',
      handoffSignal
        ? 'The requested experience explicitly includes escalation or transfer.'
        : 'A clear fallback is useful when the agent reaches the edge of its scope.',
      'Callers and customers understand what happens when automation cannot finish the request.',
      'recommended',
      draft.family === 'contact_center' ? 'actions' : 'handoff',
    ));
  }

  if (capabilityState.channels && !isResolved(capabilityState.channels) && capabilityState.channels.progress !== 'blocked') {
    candidates.push(recommendation(
      draft,
      'channels',
      82,
      'Choose the first customer channel',
      'Contact Center supports voice, digital, and video without requiring every channel at once.',
      'A deliberate first channel makes preview and deployment planning more representative.',
      'recommended',
      'channels',
    ));
  }

  if (capabilityState.audience && !isResolved(capabilityState.audience) && capabilityState.audience.progress !== 'blocked') {
    candidates.push(recommendation(
      draft,
      'audience',
      90,
      'Confirm employee audience and access',
      'Internal assistants should respect the permissions of the employees using them.',
      'A clear audience makes knowledge and access decisions safer and more relevant.',
      'recommended',
      'audience',
    ));
  }

  if (capabilityState.placement && !isResolved(capabilityState.placement) && capabilityState.placement.progress !== 'blocked') {
    candidates.push(recommendation(
      draft,
      'placement',
      70,
      'Plan employee work-surface placement',
      'The assistant can later appear in one or more Webex employee work surfaces.',
      'Planning placement early helps preview the right employee context without deploying yet.',
      'recommended',
      'placement',
    ));
  }

  if (!isResolved(capabilityState.language)) {
    const languageSignal = containsAny(text, ['multilingual', 'language', 'spanish', 'french', 'german', 'global']);
    candidates.push(recommendation(
      draft,
      'language',
      languageSignal ? 98 : 58,
      draft.family === 'calling' ? 'Confirm language and voice' : 'Add language support',
      languageSignal
        ? 'The request suggests the agent will serve people in more than one language.'
        : 'Language settings can be refined after the first version is created.',
      'A deliberate language choice makes the experience consistent for the intended audience.',
      'recommended',
      'language',
    ));
  }

  if (draft.previewState.status !== 'passed' && !isResolved(capabilityState.testing)) {
    const testingSection = capabilityState.testing?.section ?? 'testing';
    candidates.push(recommendation(
      draft,
      testingSection,
      72,
      draft.family === 'calling' ? 'Try a voice preview' : 'Test a realistic request',
      'The generated instructions have not been validated in a representative conversation.',
      'A short preview can expose unclear answers, missing knowledge, or handoff gaps.',
      'recommended',
      testingSection,
    ));
  }

  if (draft.lifecycle !== 'draft' && draft.deploymentReferences.length === 0 && !isResolved(capabilityState.deployment)) {
    const external = capabilityState.deployment?.availability === 'external';
    candidates.push(recommendation(
      draft,
      'deployment',
      60,
      draft.family === 'calling'
        ? 'Connect a phone number'
        : draft.family === 'internal_assistant'
          ? 'Choose an employee channel'
          : 'Connect a customer entry point',
      'The agent has not been connected to an entry point yet.',
      'A deployment reference is the final bridge between the configuration and its audience.',
      external ? 'external' : 'recommended',
      'deployment',
      external ? 'open_external' : 'open_section',
    ));
  }

  return candidates
    .filter(candidate => !draft.dismissedRecommendationIds.includes(candidate.id))
    .sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id))
    .slice(0, 3);
};

export const getActionableStoredRecommendations = (
  draft: AgentDraft,
  recommendations: AgentRecommendation[] = draft.recommendations,
): AgentRecommendation[] =>
  recommendations.filter(item => {
    if (draft.dismissedRecommendationIds.includes(item.id)) return false;

    const capabilityId = item.id.split(':').at(-1) ?? '';
    if (capabilityId === 'entitlement') return draft.entitlement === 'unavailable';
    if (capabilityId === 'deployment') {
      return draft.lifecycle !== 'draft'
        && draft.deploymentReferences.length === 0
        && !isResolved(draft.familyConfiguration.deployment)
        && draft.familyConfiguration.deployment?.progress !== 'blocked';
    }
    if (capabilityId === 'identity' && draft.family === 'contact_center' && isResolved(draft.familyConfiguration.security)) {
      return false;
    }
    if (capabilityId === 'handoff' && draft.family === 'contact_center' && isResolved(draft.familyConfiguration.actions)) {
      return false;
    }
    if (capabilityId === 'testing' || capabilityId === 'preview') {
      return draft.previewState.status !== 'passed'
        && !isResolved(draft.familyConfiguration.testing)
        && draft.familyConfiguration.testing?.progress !== 'blocked';
    }

    const capability = draft.familyConfiguration[capabilityId];
    if (!capability) return true;
    return !isResolved(capability) && capability.progress !== 'blocked';
  });

export const getRecommendationSourceRevision = (draft: AgentDraft): string => JSON.stringify({
  family: draft.family,
  purpose: draft.basics.purpose.trim(),
  description: draft.basics.description.trim(),
  instructions: draft.instructions.content.trim(),
  defaultLanguage: draft.language.defaultLanguage,
  additionalLanguages: [...draft.language.additionalLanguages].sort(),
});

export const createDraftFromProposal = (
  family: AgentFamily,
  proposal: StarterProposal,
  chatHistory: DraftChatMessage[] = [],
): AgentDraft => {
  const now = new Date().toISOString();
  const entitlement = ALL_LICENSED_ENTITLEMENTS[family];
  const draft: AgentDraft = {
    id: createId('agent'),
    family,
    entitlement,
    basics: {
      name: proposal.name.trim(),
      purpose: proposal.purpose.trim(),
      description: proposal.description.trim(),
    },
    instructions: {
      content: proposal.instructions.trim(),
      applied: Boolean(proposal.instructions.trim()),
      sourceRevision: 'starter-v1',
    },
    language: {
      defaultLanguage: proposal.language.trim() || FAMILY_METADATA[family].defaultLanguage,
      additionalLanguages: [],
    },
    familyConfiguration: {},
    recommendations: [],
    recommendationsStale: false,
    recommendationSourceRevision: '',
    dismissedRecommendationIds: [],
    chatHistory: chatHistory.map(message => ({ ...message })),
    previewState: { status: 'not_started' },
    deploymentReferences: [],
    activeSection: 'basics',
    lifecycle: 'draft',
    version: 1,
    createdAt: now,
    updatedAt: now,
  };

  draft.familyConfiguration = createFamilyConfiguration(family, entitlement, proposal, now);
  draft.recommendationSourceRevision = getRecommendationSourceRevision(draft);
  draft.recommendations = getRankedRecommendations(draft);
  return draft;
};

/**
 * Applies the structured preset-intake answers before the draft is persisted.
 * Keeping this pure makes the first saved Draft independent of asynchronous
 * React state updates in the conversational experience.
 */
export const applyPresetAnswersToDraft = (
  draft: AgentDraft,
  proposal: StarterProposal,
  answers: Record<string, string>,
): AgentDraft => {
  const now = new Date().toISOString();
  const familyConfiguration = Object.fromEntries(
    Object.entries(draft.familyConfiguration).map(([id, capabilityState]) => [
      id,
      {
        ...capabilityState,
        values: { ...(capabilityState.values ?? {}) },
      },
    ]),
  );

  const applySelection = (capabilityId: 'knowledge' | 'actions', answer: string | undefined) => {
    const capabilityState = familyConfiguration[capabilityId];
    if (!capabilityState || capabilityState.progress === 'blocked') return;
    const skipped = answer === SKIPPED_INTAKE_ANSWER;
    const selection = skipped ? '' : normalize(answer);
    familyConfiguration[capabilityId] = {
      ...capabilityState,
      progress: skipped ? 'skipped' : selection ? 'configured' : 'not_started',
      values: { selections: selection ? [selection] : [] },
      updatedAt: now,
    };
  };

  applySelection('knowledge', answers.knowledge);
  applySelection('actions', answers.actions);

  let deploymentReferences = draft.deploymentReferences.map(reference => ({ ...reference }));
  if (draft.family === 'calling') {
    const destination = decodeVoiceDestinationAnswer(answers.voice_destination);
    const voiceCapability = familyConfiguration.voice;
    if (voiceCapability && destination) {
      familyConfiguration.voice = {
        ...voiceCapability,
        progress: 'configured',
        values: {
          ...(voiceCapability.values ?? {}),
          selectedChannels: ['voice'],
          greetings: proposal.greeting ? { voice: proposal.greeting } : {},
          voiceLocation: destination.location,
          voicePhoneNumber: destination.phoneNumber,
        } satisfies ContactCenterChannelValues,
        updatedAt: now,
      };
      deploymentReferences = [
        ...deploymentReferences.filter(reference => reference.kind !== 'phone_number'),
        {
          id: 'calling-phone-number',
          kind: 'phone_number',
          label: destination.phoneNumber,
          status: 'connected',
        },
      ];
      const deploymentCapability = familyConfiguration.deployment;
      if (deploymentCapability) {
        familyConfiguration.deployment = {
          ...deploymentCapability,
          progress: 'configured',
          values: {
            ...(deploymentCapability.values ?? {}),
            voiceLocation: destination.location,
            voicePhoneNumber: destination.phoneNumber,
          },
          updatedAt: now,
        };
      }
    }
  }

  return {
    ...draft,
    familyConfiguration,
    deploymentReferences,
    updatedAt: now,
  };
};

export const getMinimumPublishIssues = (draft: AgentDraft): string[] => {
  const issues: string[] = [];
  if (draft.entitlement !== 'licensed') issues.push('This agent family is not licensed.');
  if (!draft.basics.name.trim()) issues.push('Add an agent name.');
  if (!draft.basics.purpose.trim()) issues.push('Describe what the agent should help people do.');
  if (!draft.instructions.applied || !draft.instructions.content.trim()) {
    issues.push('Apply a set of agent instructions.');
  }
  if (!draft.language.defaultLanguage.trim()) issues.push('Choose a default language.');

  return issues;
};

export const isMinimumPublishable = (draft: AgentDraft): boolean =>
  getMinimumPublishIssues(draft).length === 0;

const compatibleCapabilityIds = new Set(['profile', 'instructions', 'language']);

export const duplicateDraftAs = (source: AgentDraft, target: AgentFamily): AgentDraft => {
  const proposal: StarterProposal = {
    name: `${source.basics.name} copy`,
    purpose: source.basics.purpose,
    description: source.basics.description,
    language: source.language.defaultLanguage,
    instructions: source.instructions.content,
  };
  const duplicate = createDraftFromProposal(target, proposal);

  duplicate.language.additionalLanguages = [...source.language.additionalLanguages];
  duplicate.instructions = { ...source.instructions };

  for (const capabilityId of compatibleCapabilityIds) {
    const sourceState = source.familyConfiguration[capabilityId];
    const targetState = duplicate.familyConfiguration[capabilityId];
    if (!sourceState || !targetState || targetState.progress === 'blocked') continue;
    duplicate.familyConfiguration[capabilityId] = {
      ...targetState,
      progress: sourceState.progress === 'blocked' ? 'not_started' : sourceState.progress,
      values: sourceState.values ? structuredClone(sourceState.values) : targetState.values,
      updatedAt: duplicate.updatedAt,
    };
  }

  duplicate.familyConfiguration.profile.progress = duplicate.basics.name && duplicate.basics.purpose
    ? 'configured'
    : 'in_progress';
  duplicate.familyConfiguration.instructions.progress = duplicate.instructions.applied
    ? 'configured'
    : 'not_started';
  duplicate.recommendations = getRankedRecommendations(duplicate);
  return duplicate;
};
