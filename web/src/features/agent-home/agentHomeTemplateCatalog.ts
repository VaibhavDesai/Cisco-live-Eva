import type { IconName } from '../../icons/types.ts';
import {
  createDraftFromProposal,
  getRankedRecommendations,
  getRecommendationSourceRevision,
  STARTER_TEMPLATES,
  type AgentDraft,
  type AgentFamily,
  type CustomerChannel,
  type StarterProposal,
} from '../agent-creation/agentCreationModel.ts';
import type { EvaAgentDraft, EvaKnowledgeRecommendation } from '../eva/types.ts';

export type AgentHomeTemplateId =
  | 'calling:voice-receptionist'
  | 'calling:visitor-services'
  | 'calling:appointment-scheduler'
  | 'calling:service-reminder'
  | 'calling:retail-store-assistant'
  | 'calling:pickup-availability'
  | 'contact_center:cx-concierge'
  | 'contact_center:technical-support'
  | 'contact_center:reservation-scheduler'
  | 'contact_center:order-management'
  | 'contact_center:returns-exchanges'
  | 'contact_center:product-discovery'
  | 'contact_center:property-service'
  | 'contact_center:resident-support'
  | 'contact_center:patient-care'
  | 'contact_center:clinical-intake'
  | 'contact_center:banking-service'
  | 'contact_center:funds-transfer'
  | 'contact_center:airline-support'
  | 'contact_center:travel-booking'
  | 'internal_assistant:it-help-desk'
  | 'internal_assistant:employee-policy'
  | 'internal_assistant:candidate-feedback'
  | 'internal_assistant:incident-command'
  | 'internal_assistant:webex-meeting'
  | 'internal_assistant:webex-workspace';

export type AgentHomePreviewChannel = 'voice' | 'digital' | 'both';
export type AgentHomeDemoFixture = 'retail' | 'cx-desktop' | 'incident' | 'property';

export interface AgentHomeTemplateFamily {
  id: AgentFamily;
  label: string;
  icon: IconName;
}

export interface AgentHomeTemplatePreset {
  capabilityId: string;
  label: string;
  items: readonly string[];
  values: Record<string, unknown>;
}

export interface AgentHomeTemplateDemo {
  fixture: AgentHomeDemoFixture;
  prompts: readonly [string, string, string];
}

export interface AgentHomeTemplateWorkflowStep {
  label: string;
  actions?: readonly string[];
}

export interface AgentHomeTemplateWorkflowBranch {
  branches: readonly AgentHomeTemplateWorkflowStep[];
}

export interface AgentHomeTemplateWorkflowDiagram {
  layout: 'tree';
  stages: readonly (AgentHomeTemplateWorkflowStep | AgentHomeTemplateWorkflowBranch)[];
}

export interface AgentHomeTemplateDefinition {
  id: AgentHomeTemplateId;
  family: AgentFamily;
  name: string;
  industry: string;
  useCase: string;
  icon: IconName;
  workflow: readonly string[];
  workflowDiagram?: AgentHomeTemplateWorkflowDiagram;
  previewChannel: AgentHomePreviewChannel;
  responseStyleLabel: 'Voice' | 'Response style';
  responseStyle: string;
  proposal: StarterProposal;
  presets: readonly AgentHomeTemplatePreset[];
  draft: EvaAgentDraft;
  demo?: AgentHomeTemplateDemo;
}

export const AGENT_HOME_TEMPLATE_FAMILIES: readonly AgentHomeTemplateFamily[] = [
  {
    id: 'contact_center',
    label: 'Customer service agent',
    icon: 'headset',
  },
  {
    id: 'calling',
    label: 'Phone receptionist',
    icon: 'phone',
  },
  {
    id: 'internal_assistant',
    label: 'Employee assistant',
    icon: 'people',
  },
] as const;

const KNOWLEDGE_UPDATED_AT = '2026-08-09T09:43:00-07:00';

const KNOWLEDGE_DESCRIPTIONS: Record<string, string> = {
  'Store FAQ': 'Store hours, locations, returns, pickup options, and frequently asked retail questions.',
  'Inventory system': 'Current stock levels, store availability, and fulfillment constraints.',
  'Product catalog': 'Approved product descriptions, specifications, and pricing guidance.',
  'FAQ database': 'Curated answers to common customer and business questions.',
  'Process playbooks': 'Approved steps for common service and operational workflows.',
  'Service provider availability': 'Available appointment windows, skills, and scheduling constraints.',
  'Support articles': 'Step-by-step troubleshooting maintained by the support team.',
  'Product documentation': 'Official user guidance, release notes, and product reference material.',
  'Tenant directory': 'Tenant records, property assignments, and support preferences.',
  'Maintenance playbooks': 'Troubleshooting scripts, urgency rules, and service policies.',
  'Engineering wiki': 'Internal architecture notes, runbooks, and design decisions.',
  'SOP library': 'Approved standard operating procedures across departments.',
  'HR policies': 'Employee handbook, benefits, leave, and people-operations procedures.',
  'Interview feedback': 'Approved panel feedback, scorecards, and hiring notes.',
  'Candidate profiles': 'Candidate background, role alignment, and interview-stage context.',
  'Hiring process guide': 'Recruiting workflows, approval paths, and follow-up timing.',
  'Incident runbooks': 'Operational runbooks, escalation paths, and mitigation steps.',
  'Deployment logs': 'Recent release events, rollback markers, and environment changes.',
  'Service ownership directory': 'Service teams, on-call contacts, escalation owners, and dependencies.',
  'Control Hub administration guide': 'Approved setup, licensing, user, device, and service-management guidance for Control Hub.',
  'Control Hub audit events': 'Recent administrative changes, alerts, and service events available for operational review.',
  'CX Desktop guide': 'Approved desktop workflows, interaction controls, wrap-up steps, and agent productivity guidance.',
  'Quality review rubric': 'Evaluation criteria, coaching guidance, and approved examples for customer interactions.',
  'Webex help center': 'Approved guidance for meetings, messaging, calling, devices, and common Webex tasks.',
  'Workspace directory': 'Rooms, devices, support contacts, and workplace resources available to employees.',
  'Meeting policies': 'Approved meeting settings, security requirements, recording rules, and participation guidance.',
  'Account servicing guide': 'Approved account servicing, card support, authentication, and escalation procedures.',
  'Card and payment policy': 'Card controls, payment posting, dispute timing, and approved customer communications.',
  'Fraud response playbook': 'Verified fraud-reporting, card-security, and urgent escalation procedures.',
  'Transfer policy': 'Transfer eligibility, limits, recipient verification, review requirements, and confirmation rules.',
  'Flight schedule and disruption status': 'Current flight status, schedule changes, disruption guidance, and rebooking eligibility.',
  'Fare and baggage policy': 'Published fare rules, baggage allowances, change conditions, and fee guidance.',
  'Loyalty program guide': 'Approved loyalty-tier benefits, redemption rules, and account servicing guidance.',
  'Airport service directory': 'Airport contacts, accessibility support, check-in guidance, and local service information.',
};

const knowledgeSource = (name: string): EvaKnowledgeRecommendation => ({
  name,
  description: KNOWLEDGE_DESCRIPTIONS[name] ?? 'Approved information for this agent workflow.',
  sources: 1,
  usedBy: 0,
  lastUpdatedAt: KNOWLEDGE_UPDATED_AT,
});

const starterProposal = (family: AgentFamily, starterId: string): StarterProposal => {
  const starter = STARTER_TEMPLATES[family].find(candidate => candidate.id === starterId);
  if (!starter) throw new Error(`Missing ${family} starter template: ${starterId}`);
  return { ...starter.proposal };
};

const selectionsPreset = (
  capabilityId: string,
  label: string,
  items: readonly string[],
): AgentHomeTemplatePreset => ({
  capabilityId,
  label,
  items,
  values: { selections: [...items] },
});

interface TemplateBlueprint extends Omit<AgentHomeTemplateDefinition, 'draft' | 'proposal'> {
  starterId: string;
  proposalOverrides?: Partial<StarterProposal>;
  domainRules?: readonly string[];
}

const buildOperationalInstructions = ({
  name,
  purpose,
  workflow,
  responseStyle,
  knowledge,
  actions,
  identityChecks,
  handoff,
  guardrails,
  domainRules = [],
}: {
  name: string;
  purpose: string;
  workflow: readonly string[];
  responseStyle: string;
  knowledge: readonly string[];
  actions: readonly string[];
  identityChecks: readonly string[];
  handoff: readonly string[];
  guardrails: readonly string[];
  domainRules?: readonly string[];
}) => {
  const approvedKnowledge = knowledge.length > 0 ? knowledge.join(', ') : 'the approved knowledge sources available to you';
  const availableActions = actions.length > 0 ? actions.join(', ') : 'the approved workflow actions available to you';
  const verification = identityChecks.length > 0 ? identityChecks.join('; ') : 'verify the information needed for the request before continuing';
  const escalation = handoff.length > 0 ? handoff.join('; ') : 'escalate to the appropriate team with the relevant context';
  const safety = guardrails.length > 0 ? guardrails.join('; ') : 'protect private information and follow applicable company policy';

  return [
    '#### Role & purpose',
    `You are ${name}. ${purpose} Own the conversation from the first request through a clear next step, while staying within the approved workflow.`,
    '#### Operating procedure',
    workflow.map((step, index) => `${index + 1}. ${step}.`).join('\n'),
    '#### Approved information and actions',
    `Use only these approved sources when answering: ${approvedKnowledge}. Use these actions only when they are needed and permitted: ${availableActions}. Do not guess, invent a policy, or imply that an action has completed until it is confirmed.`,
    '#### Verification and escalation',
    `Before sharing account-specific, appointment-specific, or sensitive details, ${verification}. When the request is outside your scope, information is missing, or a specialist is required, ${escalation}. Include the request, facts already confirmed, actions taken, and the unresolved question in the handoff.`,
    '#### Privacy and safety',
    `Follow these guardrails: ${safety}. Minimize personal data in the conversation, do not expose private records or internal-only information, and pause for confirmation before any consequential action.`,
    ...(domainRules.length > 0 ? [
      '#### Domain-specific rules',
      domainRules.map((rule, index) => `${index + 1}. ${rule}`).join('\n'),
    ] : []),
    '#### Response format',
    `Use a ${responseStyle.toLowerCase()} tone. Ask one focused follow-up question at a time when context is missing. Give clear, ordered next steps, distinguish verified information from suggestions, and close with a brief summary of the outcome or handoff.`,
  ].join('\n\n');
};

const defineTemplate = (blueprint: TemplateBlueprint): AgentHomeTemplateDefinition => {
  const { starterId, proposalOverrides, domainRules, ...definition } = blueprint;
  const baseProposal = {
    ...starterProposal(definition.family, starterId),
    ...proposalOverrides,
  };
  const selectedChannels: CustomerChannel[] = definition.previewChannel === 'both'
    ? ['voice', 'digital']
    : definition.previewChannel === 'voice'
      ? ['voice']
      : ['digital'];
  const knowledgeNames = definition.presets.find(preset => preset.capabilityId === 'knowledge')?.items ?? [];
  const actions = definition.presets.find(preset => preset.capabilityId === 'actions')?.items ?? [];
  const identityChecks = definition.presets.find(preset => preset.capabilityId === 'identity')?.items ?? [];
  const handoff = definition.presets.find(preset => preset.capabilityId === 'handoff')?.items ?? [];
  const security = definition.presets.find(preset => preset.capabilityId === 'security')?.items ?? [];
  const greeting = `Hi, I’m ${baseProposal.name}. How can I help?`;
  const proposal: StarterProposal = definition.family === 'contact_center'
    ? {
        ...baseProposal,
        instructions: buildOperationalInstructions({
          name: baseProposal.name,
          purpose: baseProposal.purpose,
          workflow: definition.workflow,
          responseStyle: definition.responseStyle,
          knowledge: knowledgeNames,
          actions,
          identityChecks,
          handoff,
          guardrails: security,
          domainRules,
        }),
        channel: definition.previewChannel === 'both'
          ? 'Both'
          : definition.previewChannel === 'voice'
            ? 'Voice'
            : 'Digital',
        greeting,
        selectedChannels,
        greetings: Object.fromEntries(selectedChannels.map(channel => [channel, greeting])),
      }
    : {
        ...baseProposal,
        instructions: buildOperationalInstructions({
          name: baseProposal.name,
          purpose: baseProposal.purpose,
          workflow: definition.workflow,
          responseStyle: definition.responseStyle,
          knowledge: knowledgeNames,
          actions,
          identityChecks,
          handoff,
          guardrails: security,
          domainRules,
        }),
      };

  return {
    ...definition,
    proposal,
    draft: {
      name: proposal.name,
      description: proposal.description,
      goals: [...definition.workflow],
      knowledgeBases: knowledgeNames.map(knowledgeSource),
      actions: [...actions],
      security: [...security],
      language: proposal.language,
      voiceName: definition.responseStyle,
    },
  };
};

export const AGENT_HOME_TEMPLATE_OPTIONS: readonly AgentHomeTemplateDefinition[] = [
  defineTemplate({
    id: 'calling:voice-receptionist',
    family: 'calling',
    starterId: 'voice-receptionist',
    name: 'Voice receptionist',
    industry: 'Front desk',
    useCase: 'Questions, messages, and call routing',
    icon: 'phone',
    workflow: ['Welcome and understand the caller', 'Answer from approved business information', 'Route or take a message with context'],
    previewChannel: 'voice',
    responseStyleLabel: 'Voice',
    responseStyle: 'Warm professional',
    presets: [
      { capabilityId: 'voice', label: 'Voice experience', items: ['Warm professional'], values: { voiceName: 'Warm professional' } },
      selectionsPreset('knowledge', 'Knowledge', ['FAQ database', 'Process playbooks']),
      selectionsPreset('handoff', 'Call routing', ['Transfer with the caller context']),
    ],
  }),
  defineTemplate({
    id: 'calling:visitor-services',
    family: 'calling',
    starterId: 'voice-receptionist',
    name: 'Visitor services receptionist',
    industry: 'Front desk',
    useCase: 'Visitor questions, directions, and host routing',
    icon: 'phone',
    workflow: ['Understand the visitor request', 'Share approved location and arrival details', 'Connect the visitor with the right host'],
    previewChannel: 'voice',
    responseStyleLabel: 'Voice',
    responseStyle: 'Friendly and concise',
    proposalOverrides: {
      name: 'Visitor Services Receptionist',
      purpose: 'Answer visitor questions and connect callers with the right host or location.',
      description: 'A front-desk agent for visitor information, arrival guidance, directions, and host routing.',
      instructions: '#### Role & Identity\nYou are a visitor services receptionist.\n\n#### Primary Goals\nShare approved arrival and location information, then connect visitors with the right host.\n\n#### Guardrails\nDo not reveal private schedules or employee details. Escalate access and safety questions.\n\n#### Output Rules\nKeep spoken responses friendly, brief, and easy to follow.',
    },
    presets: [
      { capabilityId: 'voice', label: 'Voice experience', items: ['Friendly and concise'], values: { voiceName: 'Friendly and concise' } },
      selectionsPreset('knowledge', 'Knowledge', ['FAQ database', 'Workspace directory', 'Process playbooks']),
      selectionsPreset('identity', 'Caller identity', ['Verify hosts before sharing arrival details']),
      selectionsPreset('handoff', 'Call routing', ['Connect visitors with the right host']),
    ],
  }),
  defineTemplate({
    id: 'calling:appointment-scheduler',
    family: 'calling',
    starterId: 'appointment-scheduler',
    name: 'Appointment scheduler',
    industry: 'Appointments',
    useCase: 'Booking, rescheduling, and cancellations',
    icon: 'calendar-month',
    workflow: ['Understand the appointment request', 'Check services and available times', 'Confirm details or route urgent requests'],
    previewChannel: 'voice',
    responseStyleLabel: 'Voice',
    responseStyle: 'Calm and reassuring',
    presets: [
      { capabilityId: 'voice', label: 'Voice experience', items: ['Calm and reassuring'], values: { voiceName: 'Calm and reassuring' } },
      selectionsPreset('knowledge', 'Knowledge', ['FAQ database', 'Service provider availability', 'Process playbooks']),
      selectionsPreset('identity', 'Caller identity', ['Verify before changing a booking']),
      selectionsPreset('handoff', 'Call routing', ['Transfer urgent or sensitive requests']),
    ],
  }),
  defineTemplate({
    id: 'calling:service-reminder',
    family: 'calling',
    starterId: 'appointment-scheduler',
    name: 'Service reminder caller',
    industry: 'Appointments',
    useCase: 'Appointment reminders and confirmation',
    icon: 'calendar-month',
    workflow: ['Confirm the intended recipient', 'Share the approved appointment reminder', 'Record confirmation or route a change request'],
    previewChannel: 'voice',
    responseStyleLabel: 'Voice',
    responseStyle: 'Clear and reassuring',
    proposalOverrides: {
      name: 'Service Reminder Caller',
      purpose: 'Remind callers about upcoming appointments and capture their confirmation.',
      description: 'A voice agent for appointment reminders, confirmations, and routing change requests.',
      instructions: '#### Role & Identity\nYou are a service reminder agent.\n\n#### Primary Goals\nShare approved appointment details, record confirmation, and route change requests.\n\n#### Guardrails\nVerify the recipient before sharing details. Do not provide professional advice.\n\n#### Output Rules\nBe clear, reassuring, and concise.',
    },
    presets: [
      { capabilityId: 'voice', label: 'Voice experience', items: ['Clear and reassuring'], values: { voiceName: 'Clear and reassuring' } },
      selectionsPreset('knowledge', 'Knowledge', ['Service provider availability', 'FAQ database', 'Process playbooks']),
      selectionsPreset('identity', 'Caller identity', ['Verify before sharing appointment details']),
      selectionsPreset('handoff', 'Call routing', ['Route cancellations and change requests']),
    ],
  }),
  defineTemplate({
    id: 'calling:retail-store-assistant',
    family: 'calling',
    starterId: 'retail-store-assistant',
    name: 'Retail store assistant',
    industry: 'Retail',
    useCase: 'Product questions, availability, and returns',
    icon: 'headset',
    workflow: ['Understand the caller request', 'Check store and inventory knowledge', 'Answer or route the caller with context'],
    previewChannel: 'voice',
    responseStyleLabel: 'Voice',
    responseStyle: 'Warm professional',
    domainRules: [
      'Treat inventory as a point-in-time signal: share the approved result, but never promise that an item is reserved, held, or available until the store confirms it.',
      'Give factual product and return-policy guidance only. Do not invent compatibility, price-match, warranty, or promotion terms.',
      'For order, payment, fraud, or account-specific requests, verify only the minimum required information and route exceptions to the store or specialist team.',
    ],
    presets: [
      { capabilityId: 'voice', label: 'Voice experience', items: ['Warm professional'], values: { voiceName: 'Warm professional' } },
      selectionsPreset('knowledge', 'Knowledge', ['Store FAQ', 'Inventory system', 'Product catalog']),
      selectionsPreset('identity', 'Caller identity', ['Verify only for account-specific help']),
      selectionsPreset('handoff', 'Call routing', ['Transfer sensitive requests']),
    ],
    demo: {
      fixture: 'retail',
      prompts: ['Do you have the TrailPro backpack in stock?', 'What time does the downtown store close?', 'Can you tell me about the return policy?'],
    },
  }),
  defineTemplate({
    id: 'calling:pickup-availability',
    family: 'calling',
    starterId: 'retail-store-assistant',
    name: 'Pickup and availability assistant',
    industry: 'Retail',
    useCase: 'Store inventory, pickup, and substitutions',
    icon: 'headset',
    workflow: ['Understand the product request', 'Check store inventory and pickup guidance', 'Offer an approved option or route to the store'],
    previewChannel: 'voice',
    responseStyleLabel: 'Voice',
    responseStyle: 'Direct and helpful',
    proposalOverrides: {
      name: 'Pickup and Availability Assistant',
      purpose: 'Help callers check store inventory and understand pickup options.',
      description: 'A retail voice agent for product availability, pickup guidance, and approved substitutions.',
      instructions: '#### Role & Identity\nYou are a retail pickup and availability assistant.\n\n#### Primary Goals\nCheck approved inventory information and explain pickup or substitution options.\n\n#### Guardrails\nDo not promise inventory holds or purchases. Route exceptions to the store.\n\n#### Output Rules\nGive direct availability summaries and clear next steps.',
    },
    presets: [
      { capabilityId: 'voice', label: 'Voice experience', items: ['Direct and helpful'], values: { voiceName: 'Direct and helpful' } },
      selectionsPreset('knowledge', 'Knowledge', ['Inventory system', 'Product catalog', 'Store FAQ']),
      selectionsPreset('identity', 'Caller identity', ['Verify only for order-specific help']),
      selectionsPreset('handoff', 'Call routing', ['Route inventory exceptions to the store']),
    ],
  }),
  defineTemplate({
    id: 'contact_center:cx-concierge',
    family: 'contact_center',
    starterId: 'cx-concierge',
    name: 'CX concierge',
    industry: 'Customer service',
    useCase: 'Answers, resolution, and contextual handoff',
    icon: 'headset',
    workflow: ['Understand and verify the customer', 'Resolve with approved knowledge and actions', 'Hand off with the conversation context'],
    previewChannel: 'both',
    responseStyleLabel: 'Response style',
    responseStyle: 'Warm and empathetic',
    presets: [
      selectionsPreset('knowledge', 'Knowledge', ['FAQ database', 'Support articles', 'Product documentation']),
      selectionsPreset('actions', 'Actions', ['Create support case', 'Check account status', 'Prepare specialist handoff']),
      selectionsPreset('handoff', 'Handoff', ['Transfer with customer context']),
      selectionsPreset('security', 'Guardrails', ['Protect customer data', 'Use approved sources', 'Confirm actions before applying them']),
    ],
  }),
  defineTemplate({
    id: 'contact_center:technical-support',
    family: 'contact_center',
    starterId: 'cx-concierge',
    name: 'Technical support concierge',
    industry: 'Customer service',
    useCase: 'Troubleshooting, service status, and escalation',
    icon: 'headset',
    workflow: [
      'Identify the issue and confirm the service context',
      'Check service status and known incidents',
      'Guide approved troubleshooting steps',
      'Confirm the outcome and document diagnostics',
      'Escalate with the complete conversation history',
    ],
    workflowDiagram: {
      layout: 'tree',
      stages: [
        { label: 'Identify the issue and confirm the service context' },
        { label: 'Check service status and known incidents', actions: ['Check service status'] },
        {
          branches: [
            { label: 'Known incident: share a verified service update' },
            { label: 'No incident: guide approved troubleshooting' },
          ],
        },
        { label: 'Confirm the outcome and document diagnostics', actions: ['Create support case'] },
        { label: 'Escalate with the complete conversation history', actions: ['Prepare specialist handoff'] },
      ],
    },
    previewChannel: 'both',
    responseStyleLabel: 'Response style',
    responseStyle: 'Patient and precise',
    proposalOverrides: {
      name: 'Technical Support Concierge',
      purpose: 'Help customers troubleshoot common issues and prepare complete escalations.',
      description: 'A customer-service agent for guided troubleshooting, service updates, and specialist escalation.',
      instructions: '#### Role & Identity\nYou are a technical support concierge.\n\n#### Primary Goals\nGuide approved troubleshooting and preserve diagnostic context when escalating.\n\n#### Guardrails\nUse approved support content, protect customer data, and never claim an unverified fix.\n\n#### Output Rules\nUse patient, precise steps and summarize the result.',
    },
    presets: [
      selectionsPreset('knowledge', 'Knowledge', ['Support articles', 'Product documentation', 'FAQ database']),
      selectionsPreset('actions', 'Actions', ['Create support case', 'Check service status', 'Prepare specialist handoff']),
      selectionsPreset('handoff', 'Handoff', ['Transfer with diagnostics and customer context']),
      selectionsPreset('security', 'Guardrails', ['Protect customer data', 'Use approved troubleshooting', 'Confirm actions before applying them']),
    ],
  }),
  defineTemplate({
    id: 'contact_center:reservation-scheduler',
    family: 'contact_center',
    starterId: 'cx-concierge',
    name: 'Reservation book & schedule agent',
    industry: 'Customer service',
    useCase: 'Reservations, scheduling, and confirmation',
    icon: 'calendar-month',
    workflow: ['Understand the reservation request', 'Check approved availability and scheduling policies', 'Book or update the reservation and confirm details'],
    previewChannel: 'both',
    responseStyleLabel: 'Response style',
    responseStyle: 'Warm and organized',
    domainRules: [
      'Repeat the service, date, time, location, and attendee details before creating or changing a reservation.',
      'Use live availability and published policies as the source of truth. Never create an exception, waive a fee, or promise an upgrade without an approved action and confirmation.',
      'Route accessibility, safety, group, or policy-exception requests with the collected details so the customer does not need to repeat them.',
    ],
    proposalOverrides: {
      name: 'Reservation Book and Schedule Agent',
      purpose: 'Help customers book, change, and confirm reservations using current availability.',
      description: 'A customer-service agent for reservations, scheduling changes, confirmations, and exception routing.',
      instructions: '#### Role & Identity\nYou are a reservation and scheduling concierge.\n\n#### Primary Goals\nUnderstand the request, check current availability, and confirm every reservation detail before applying a change.\n\n#### Guardrails\nNever invent availability or promise an exception. Protect customer information and route policy exceptions.\n\n#### Output Rules\nBe warm, organized, and explicit about dates, times, and next steps.',
    },
    presets: [
      selectionsPreset('knowledge', 'Knowledge', ['Service provider availability', 'FAQ database', 'Process playbooks']),
      selectionsPreset('actions', 'Actions', ['Check availability', 'Create reservation', 'Send confirmation']),
      selectionsPreset('handoff', 'Handoff', ['Escalate scheduling exceptions']),
      selectionsPreset('security', 'Guardrails', ['Protect customer data', 'Confirm reservation details', 'Use current availability only']),
    ],
  }),
  defineTemplate({
    id: 'contact_center:order-management',
    family: 'contact_center',
    starterId: 'order-management',
    name: 'Order management concierge',
    industry: 'Commerce',
    useCase: 'Order status, delivery, and returns',
    icon: 'automation',
    workflow: ['Verify the customer and order', 'Check status, delivery, or return policy', 'Prepare the approved resolution'],
    previewChannel: 'digital',
    responseStyleLabel: 'Response style',
    responseStyle: 'Direct and helpful',
    presets: [
      selectionsPreset('knowledge', 'Knowledge', ['Inventory system', 'Product catalog', 'FAQ database']),
      selectionsPreset('actions', 'Actions', ['Check order status', 'Create return request', 'Send delivery update']),
      selectionsPreset('handoff', 'Handoff', ['Escalate order exceptions']),
      selectionsPreset('security', 'Guardrails', ['Verify before sharing order details', 'Protect payment data', 'Confirm changes before applying them']),
    ],
  }),
  defineTemplate({
    id: 'contact_center:returns-exchanges',
    family: 'contact_center',
    starterId: 'order-management',
    name: 'Returns and exchanges concierge',
    industry: 'Commerce',
    useCase: 'Return eligibility, exchanges, and next steps',
    icon: 'automation',
    workflow: ['Verify the customer and purchase', 'Check return or exchange eligibility', 'Prepare the approved resolution and next step'],
    previewChannel: 'digital',
    responseStyleLabel: 'Response style',
    responseStyle: 'Clear and practical',
    proposalOverrides: {
      name: 'Returns and Exchanges Concierge',
      purpose: 'Help customers understand return eligibility and prepare approved exchanges.',
      description: 'A commerce agent for return policies, exchange options, labels, and exception routing.',
      instructions: '#### Role & Identity\nYou are a returns and exchanges concierge.\n\n#### Primary Goals\nExplain approved eligibility, prepare the correct next step, and route exceptions.\n\n#### Guardrails\nVerify the purchase before sharing details or preparing a change. Protect payment information.\n\n#### Output Rules\nUse clear eligibility summaries and practical next steps.',
    },
    presets: [
      selectionsPreset('knowledge', 'Knowledge', ['FAQ database', 'Product catalog', 'Process playbooks']),
      selectionsPreset('actions', 'Actions', ['Check return eligibility', 'Create return request', 'Prepare exchange options']),
      selectionsPreset('handoff', 'Handoff', ['Escalate policy exceptions']),
      selectionsPreset('security', 'Guardrails', ['Verify before sharing order details', 'Protect payment data', 'Confirm changes before applying them']),
    ],
  }),
  defineTemplate({
    id: 'contact_center:product-discovery',
    family: 'contact_center',
    starterId: 'order-management',
    name: 'Product discovery assistant',
    industry: 'Commerce',
    useCase: 'Personalized recommendations, comparisons, and wish lists',
    icon: 'automation',
    workflow: ['Understand the customer needs and preferences', 'Compare approved products and current availability', 'Recommend options and save the next step'],
    previewChannel: 'digital',
    responseStyleLabel: 'Response style',
    responseStyle: 'Curious and helpful',
    proposalOverrides: {
      name: 'Product Discovery Assistant',
      purpose: 'Help customers discover and compare products that fit their needs.',
      description: 'A commerce assistant for personalized recommendations, product comparisons, availability, and wish lists.',
      instructions: '#### Role & Identity\nYou are a product discovery assistant.\n\n#### Primary Goals\nUnderstand customer preferences, compare approved product information, and recommend relevant options.\n\n#### Guardrails\nDo not invent product claims, pricing, or availability. Clearly distinguish known facts from suggestions.\n\n#### Output Rules\nBe curious, helpful, and concise, and explain why each recommendation fits.',
    },
    presets: [
      selectionsPreset('knowledge', 'Knowledge', ['Product catalog', 'Inventory system', 'Store FAQ']),
      selectionsPreset('actions', 'Actions', ['Search product catalog', 'Check inventory', 'Save to wish list']),
      selectionsPreset('handoff', 'Handoff', ['Escalate product and purchase questions']),
      selectionsPreset('security', 'Guardrails', ['Use approved product data', 'Protect customer preferences', 'Confirm actions before applying them']),
    ],
  }),
  defineTemplate({
    id: 'contact_center:property-service',
    family: 'contact_center',
    starterId: 'property-service',
    name: 'Property service concierge',
    industry: 'Property management',
    useCase: 'Maintenance requests and technician scheduling',
    icon: 'shield',
    workflow: ['Verify the tenant and service location', 'Create and classify the service request', 'Schedule a qualified technician'],
    previewChannel: 'both',
    responseStyleLabel: 'Response style',
    responseStyle: 'Measured advisor',
    presets: [
      selectionsPreset('knowledge', 'Knowledge', ['Tenant directory', 'Maintenance playbooks', 'Service provider availability']),
      selectionsPreset('actions', 'Actions', ['Create ServiceNow ticket', 'Schedule technician visit', 'Notify tenant']),
      selectionsPreset('handoff', 'Handoff', ['Escalate urgent safety issues']),
      selectionsPreset('security', 'Guardrails', ['Verify tenant identity', 'Protect tenant information', 'Log service request summaries']),
    ],
    demo: {
      fixture: 'property',
      prompts: ['The air conditioning in my unit stopped working', 'Can you schedule a technician tomorrow?', 'What is the status of my maintenance request?'],
    },
  }),
  defineTemplate({
    id: 'contact_center:resident-support',
    family: 'contact_center',
    starterId: 'property-service',
    name: 'Resident support concierge',
    industry: 'Property management',
    useCase: 'Resident questions, amenities, and service follow-up',
    icon: 'shield',
    workflow: ['Verify the resident and property', 'Answer from approved property information', 'Route requests with the resident context'],
    previewChannel: 'both',
    responseStyleLabel: 'Response style',
    responseStyle: 'Helpful and reassuring',
    proposalOverrides: {
      name: 'Resident Support Concierge',
      purpose: 'Answer resident questions and coordinate property support requests.',
      description: 'A resident-service agent for property information, amenities, and service follow-up.',
      instructions: '#### Role & Identity\nYou are a resident support concierge.\n\n#### Primary Goals\nAnswer approved property questions and route service requests with useful context.\n\n#### Guardrails\nVerify the resident before sharing account details. Escalate safety and access issues.\n\n#### Output Rules\nBe helpful, reassuring, and explicit about next steps.',
    },
    presets: [
      selectionsPreset('knowledge', 'Knowledge', ['Tenant directory', 'FAQ database', 'Maintenance playbooks']),
      selectionsPreset('actions', 'Actions', ['Check service request status', 'Notify property team', 'Prepare resident follow-up']),
      selectionsPreset('handoff', 'Handoff', ['Escalate access and safety issues']),
      selectionsPreset('security', 'Guardrails', ['Verify resident identity', 'Protect resident information', 'Log service request summaries']),
    ],
  }),
  defineTemplate({
    id: 'contact_center:patient-care',
    family: 'contact_center',
    starterId: 'property-service',
    name: 'Patient care navigator',
    industry: 'Healthcare',
    useCase: 'Appointment scheduling, benefits inquiry, and care coordination',
    icon: 'headset',
    workflow: ['Verify the patient and understand the request', 'Check approved scheduling and benefits information', 'Coordinate the next care step or handoff'],
    previewChannel: 'both',
    responseStyleLabel: 'Response style',
    responseStyle: 'Compassionate and clear',
    domainRules: [
      'Provide administrative and scheduling support only. Do not diagnose conditions, interpret symptoms, recommend treatment, or assess whether care can wait.',
      'If someone describes a possible emergency or asks for urgent clinical advice, state the safety boundary clearly and direct them to local emergency services or the approved clinical escalation path.',
      'Keep health information to the minimum needed for the request, and never disclose a patient record until the required identity verification is complete.',
    ],
    proposalOverrides: {
      name: 'Patient Care Navigator',
      purpose: 'Help patients coordinate appointments, benefits questions, and approved next steps.',
      description: 'A healthcare service agent for appointment scheduling, benefits inquiries, and care coordination.',
      instructions: '#### Role & Identity\nYou are a patient care navigator.\n\n#### Primary Goals\nHelp patients coordinate appointments and approved administrative next steps while preserving context.\n\n#### Guardrails\nVerify identity before sharing private information. Do not diagnose, prescribe, or provide medical advice. Escalate urgent symptoms.\n\n#### Output Rules\nBe compassionate, clear, and explicit about the next care step.',
    },
    presets: [
      selectionsPreset('knowledge', 'Knowledge', ['Service provider availability', 'FAQ database', 'Process playbooks']),
      selectionsPreset('actions', 'Actions', ['Schedule appointment', 'Check benefits status', 'Prepare care-team handoff']),
      selectionsPreset('handoff', 'Handoff', ['Escalate urgent or clinical questions']),
      selectionsPreset('security', 'Guardrails', ['Verify patient identity', 'Protect patient information', 'Do not provide medical advice']),
    ],
  }),
  defineTemplate({
    id: 'contact_center:clinical-intake',
    family: 'contact_center',
    starterId: 'property-service',
    name: 'Clinical intake assistant',
    industry: 'Healthcare',
    useCase: 'Symptom intake, prior authorization, and provider matching',
    icon: 'people',
    workflow: ['Verify the patient and collect intake details', 'Check approved routing and authorization guidance', 'Prepare a structured provider handoff'],
    previewChannel: 'both',
    responseStyleLabel: 'Response style',
    responseStyle: 'Calm and precise',
    domainRules: [
      'Collect only the approved intake fields and record the patient’s words accurately; do not interpret, rank, or diagnose symptoms.',
      'If the conversation indicates a possible emergency, stop routine intake and direct the patient to emergency services or the designated clinical escalation path.',
      'Explain that a clinician, not this agent, makes treatment, diagnosis, and care-priority decisions.',
    ],
    proposalOverrides: {
      name: 'Clinical Intake Assistant',
      purpose: 'Collect structured intake information and route patients to the appropriate provider workflow.',
      description: 'A healthcare intake agent for structured symptom collection, prior authorization status, and provider matching.',
      instructions: '#### Role & Identity\nYou are a clinical intake assistant.\n\n#### Primary Goals\nCollect complete intake details, use approved routing guidance, and prepare a structured handoff.\n\n#### Guardrails\nDo not diagnose or recommend treatment. Protect patient information and immediately escalate emergency indicators.\n\n#### Output Rules\nUse calm, precise questions and clearly summarize the collected information.',
    },
    presets: [
      selectionsPreset('knowledge', 'Knowledge', ['Service provider availability', 'FAQ database', 'Process playbooks']),
      selectionsPreset('actions', 'Actions', ['Create intake summary', 'Check authorization status', 'Prepare provider handoff']),
      selectionsPreset('handoff', 'Handoff', ['Escalate emergency and clinical decisions']),
      selectionsPreset('security', 'Guardrails', ['Verify patient identity', 'Protect patient information', 'Do not diagnose or recommend treatment']),
    ],
  }),
  defineTemplate({
    id: 'contact_center:banking-service',
    family: 'contact_center',
    starterId: 'cx-concierge',
    name: 'Banking service agent',
    industry: 'Banking',
    useCase: 'Account service, card support, and dispute guidance',
    icon: 'shield',
    workflow: [
      'Understand the service request without collecting sensitive credentials',
      'Complete the required identity verification before opening account-specific details',
      'Use approved account, card, and policy information to explain the available next step',
      'Prepare the permitted service action or specialist handoff and summarize what happens next',
    ],
    previewChannel: 'both',
    responseStyleLabel: 'Response style',
    responseStyle: 'Calm and reassuring',
    domainRules: [
      'Never request or repeat a full card number, PIN, password, one-time code, or security-answer value. Direct the customer to an approved secure channel when it is needed.',
      'Do not provide investment, tax, legal, credit, or personalized financial advice. Explain published account terms and route advice requests to a qualified specialist.',
      'For suspected fraud, lost cards, or account compromise, use the approved urgent path immediately and do not disclose additional account details before verification.',
    ],
    proposalOverrides: {
      name: 'Banking Service Agent',
      purpose: 'Help customers complete approved account and card-service tasks while protecting sensitive financial information.',
      description: 'A banking service agent for verified account help, card support, dispute guidance, and secure specialist handoff.',
    },
    presets: [
      selectionsPreset('knowledge', 'Knowledge', ['Account servicing guide', 'Card and payment policy', 'Fraud response playbook']),
      selectionsPreset('actions', 'Actions', ['Check account status', 'Lock or replace card', 'Prepare dispute case']),
      selectionsPreset('identity', 'Identity verification', ['Verify customer before account-specific service']),
      selectionsPreset('handoff', 'Handoff', ['Escalate fraud, disputes, and financial-advice requests with context']),
      selectionsPreset('security', 'Guardrails', ['Protect financial information', 'Never request credentials', 'Confirm consequential actions before applying them']),
    ],
  }),
  defineTemplate({
    id: 'contact_center:funds-transfer',
    family: 'contact_center',
    starterId: 'cx-concierge',
    name: 'Funds transfer specialist',
    industry: 'Banking',
    useCase: 'Transfer setup, status, limits, and secure exception routing',
    icon: 'automation',
    workflow: [
      'Verify the customer and identify the transfer type',
      'Check approved transfer eligibility, status, limits, and review requirements',
      'Confirm the source, destination, amount, timing, and any disclosed fees before preparing a transfer',
      'Submit only the approved action after the customer confirms, or route the exception with a structured summary',
    ],
    previewChannel: 'digital',
    responseStyleLabel: 'Response style',
    responseStyle: 'Precise and transparent',
    domainRules: [
      'Never accept sensitive banking credentials or use unverified recipient details. If required information is missing, explain the secure next step instead of guessing.',
      'Read back the transfer details and require explicit confirmation before submitting a transfer, changing a recipient, or cancelling a pending instruction.',
      'Do not promise funds availability, waive a limit, or override a review. Explain the published status and escalate sanctions, fraud, or policy-review cases.',
    ],
    proposalOverrides: {
      name: 'Funds Transfer Specialist',
      purpose: 'Help customers complete approved money-transfer requests with clear verification, confirmation, and exception handling.',
      description: 'A banking operations agent for transfer status, setup, limits, confirmations, and secure escalation.',
    },
    presets: [
      selectionsPreset('knowledge', 'Knowledge', ['Transfer policy', 'Account servicing guide', 'Fraud response playbook']),
      selectionsPreset('actions', 'Actions', ['Check transfer status', 'Prepare transfer', 'Cancel pending transfer']),
      selectionsPreset('identity', 'Identity verification', ['Verify customer and recipient details before transfer actions']),
      selectionsPreset('handoff', 'Handoff', ['Escalate fraud, sanctions, limits, and transfer-review exceptions']),
      selectionsPreset('security', 'Guardrails', ['Protect financial information', 'Require transfer confirmation', 'Never override compliance review']),
    ],
  }),
  defineTemplate({
    id: 'contact_center:airline-support',
    family: 'contact_center',
    starterId: 'cx-concierge',
    name: 'Airline guest support agent',
    industry: 'Air travel',
    useCase: 'Flight status, disruptions, baggage, and traveler support',
    icon: 'headset',
    workflow: [
      'Identify the traveler request and verify the booking before sharing itinerary-specific details',
      'Check current flight, disruption, baggage, loyalty, and airport-service information',
      'Explain the published options, eligibility, and next action in plain language',
      'Prepare the approved update or hand off complex, safety, or exception cases with the full context',
    ],
    previewChannel: 'both',
    responseStyleLabel: 'Response style',
    responseStyle: 'Warm and composed',
    domainRules: [
      'Use current operational status and published policy as the source of truth. Never promise a seat, upgrade, voucher, compensation, connection, or baggage outcome before the approved action confirms it.',
      'For safety, security, medical, immigration, unaccompanied-minor, or accessibility situations that need a specialist, provide the approved immediate direction and hand off without delay.',
      'Keep passports, payment details, loyalty records, and booking information private; collect only what the approved workflow requires.',
    ],
    proposalOverrides: {
      name: 'Airline Guest Support Agent',
      purpose: 'Help travelers find verified flight information, understand their available options, and reach the right support path during disruptions.',
      description: 'An airline service agent for flight status, disruption support, baggage guidance, loyalty questions, and contextual handoff.',
    },
    presets: [
      selectionsPreset('knowledge', 'Knowledge', ['Flight schedule and disruption status', 'Fare and baggage policy', 'Loyalty program guide']),
      selectionsPreset('actions', 'Actions', ['Check flight status', 'Prepare rebooking options', 'Open baggage case']),
      selectionsPreset('identity', 'Identity verification', ['Verify traveler before itinerary-specific service']),
      selectionsPreset('handoff', 'Handoff', ['Escalate safety, accessibility, and policy exceptions with traveler context']),
      selectionsPreset('security', 'Guardrails', ['Protect traveler information', 'Use live operational status only', 'Confirm changes before applying them']),
    ],
  }),
  defineTemplate({
    id: 'contact_center:travel-booking',
    family: 'contact_center',
    starterId: 'cx-concierge',
    name: 'Travel booking concierge',
    industry: 'Air travel',
    useCase: 'Flight search, booking changes, and travel confirmation',
    icon: 'calendar-month',
    workflow: [
      'Collect the travel request, including dates, route, passengers, and constraints',
      'Check current availability, published fare conditions, and applicable baggage or service rules',
      'Present approved options with the material differences and ask one clear decision question',
      'Read back the final itinerary and cost details, then complete the approved booking action only after confirmation',
    ],
    previewChannel: 'digital',
    responseStyleLabel: 'Response style',
    responseStyle: 'Organized and helpful',
    domainRules: [
      'Do not infer travel-document eligibility, immigration requirements, medical fitness to travel, or visa status. Direct travelers to the authoritative source or specialist.',
      'Use only confirmed availability and published fare rules. Never state that a booking, hold, refund, or change is complete until the system action returns a confirmation.',
      'Before any purchase or itinerary change, read back the complete itinerary, traveler count, fare or fee, and any important restrictions, then obtain explicit confirmation.',
    ],
    proposalOverrides: {
      name: 'Travel Booking Concierge',
      purpose: 'Help travelers compare approved flight options and complete confirmed booking or change requests accurately.',
      description: 'An air-travel booking agent for flight options, itinerary changes, fare conditions, confirmations, and exception routing.',
    },
    presets: [
      selectionsPreset('knowledge', 'Knowledge', ['Flight schedule and disruption status', 'Fare and baggage policy', 'Airport service directory']),
      selectionsPreset('actions', 'Actions', ['Search flight options', 'Prepare itinerary change', 'Send itinerary confirmation']),
      selectionsPreset('identity', 'Identity verification', ['Verify traveler before booking-specific service']),
      selectionsPreset('handoff', 'Handoff', ['Escalate complex fares, accessibility, and travel-document questions']),
      selectionsPreset('security', 'Guardrails', ['Protect traveler information', 'Require booking confirmation', 'Use published fare rules only']),
    ],
  }),
  defineTemplate({
    id: 'internal_assistant:it-help-desk',
    family: 'internal_assistant',
    starterId: 'it-help-desk',
    name: 'Control Hub administrator assistant',
    industry: 'Control Hub Assistant',
    useCase: 'Users, licenses, devices, and service setup',
    icon: 'automation',
    workflow: ['Understand the administrator task', 'Find the approved Control Hub steps', 'Guide the change or prepare an escalation'],
    previewChannel: 'digital',
    responseStyleLabel: 'Response style',
    responseStyle: 'Clear administrator',
    proposalOverrides: {
      name: 'Control Hub Administrator Assistant',
      purpose: 'Help administrators complete common Control Hub setup and management tasks.',
      description: 'An employee assistant for Control Hub users, licenses, devices, and service configuration.',
      instructions: '#### Role & Identity\nYou are a Control Hub administrator assistant.\n\n#### Primary Goals\nGuide approved user, license, device, and service-management tasks.\n\n#### Guardrails\nRespect administrator permissions and require confirmation before consequential changes.\n\n#### Output Rules\nUse clear steps and identify any required role or prerequisite.',
    },
    presets: [
      selectionsPreset('audience', 'Audience', ['Control Hub administrators']),
      selectionsPreset('knowledge', 'Knowledge', ['Control Hub administration guide', 'Webex help center', 'SOP library']),
      selectionsPreset('actions', 'Actions', ['Check license status', 'Prepare configuration change', 'Create administrator task']),
      selectionsPreset('security', 'Prebuilt guardrails', ['Prompt injection', 'PII detection', 'Jailbreak']),
    ],
  }),
  defineTemplate({
    id: 'internal_assistant:incident-command',
    family: 'internal_assistant',
    starterId: 'incident-command',
    name: 'Control Hub incident assistant',
    industry: 'Control Hub Assistant',
    useCase: 'Service alerts, ownership, and status updates',
    icon: 'automation',
    workflow: ['Triage the Control Hub service alert', 'Identify owners and recent changes', 'Prepare the approved response and status update'],
    previewChannel: 'digital',
    responseStyleLabel: 'Response style',
    responseStyle: 'Concise operator',
    proposalOverrides: {
      name: 'Control Hub Incident Assistant',
      purpose: 'Help operations teams investigate Control Hub service alerts and coordinate follow-up.',
      description: 'An employee assistant for Control Hub incidents, ownership, change context, and stakeholder updates.',
      instructions: '#### Role & Identity\nYou are a Control Hub incident assistant.\n\n#### Primary Goals\nSurface service context, ownership, and approved response steps for Control Hub alerts.\n\n#### Guardrails\nRequire confirmation before remediation and escalate critical operational changes.\n\n#### Output Rules\nBe concise, factual, and explicit about owners and next steps.',
    },
    presets: [
      selectionsPreset('audience', 'Audience', ['Control Hub operations teams']),
      selectionsPreset('knowledge', 'Knowledge', ['Control Hub audit events', 'Incident runbooks', 'Service ownership directory']),
      selectionsPreset('actions', 'Actions', ['Create remediation task', 'Notify service owner', 'Draft stakeholder update']),
      selectionsPreset('security', 'Prebuilt guardrails', ['Prompt injection', 'Misinformation', 'System prompt extraction']),
    ],
    demo: {
      fixture: 'incident',
      prompts: ['Control Hub is showing a service alert', 'Who owns the affected service?', 'Prepare a stakeholder update'],
    },
  }),
  defineTemplate({
    id: 'internal_assistant:employee-policy',
    family: 'internal_assistant',
    starterId: 'employee-policy',
    name: 'CX Desktop agent assistant',
    industry: 'CX Desktop Assistant',
    useCase: 'Interaction controls, wrap-up, and daily workflows',
    icon: 'people',
    workflow: ['Understand the agent task', 'Find the approved desktop workflow', 'Guide the agent or route a platform issue'],
    previewChannel: 'digital',
    responseStyleLabel: 'Response style',
    responseStyle: 'Direct and supportive',
    proposalOverrides: {
      name: 'CX Desktop Agent Assistant',
      purpose: 'Help contact-center agents complete common CX Desktop workflows.',
      description: 'An employee assistant for interaction controls, wrap-up steps, availability states, and desktop guidance.',
      instructions: '#### Role & Identity\nYou are a CX Desktop agent assistant.\n\n#### Primary Goals\nHelp agents find and complete approved desktop workflows without interrupting customer interactions.\n\n#### Guardrails\nRespect agent permissions and never expose customer information outside the active interaction.\n\n#### Output Rules\nGive short, ordered steps that are easy to follow during a live interaction.',
    },
    presets: [
      selectionsPreset('audience', 'Audience', ['Contact-center agents']),
      selectionsPreset('knowledge', 'Knowledge', ['CX Desktop guide', 'Support articles', 'Process playbooks']),
      selectionsPreset('actions', 'Actions', ['Open desktop support request', 'Prepare interaction summary', 'Route platform issue']),
      selectionsPreset('security', 'Prebuilt guardrails', ['PII detection', 'Prompt injection', 'Toxicity']),
    ],
  }),
  defineTemplate({
    id: 'internal_assistant:candidate-feedback',
    family: 'internal_assistant',
    starterId: 'candidate-feedback',
    name: 'CX Desktop supervisor assistant',
    industry: 'CX Desktop Assistant',
    useCase: 'Interaction review, coaching, and follow-up',
    icon: 'people',
    workflow: ['Collect approved interaction signals', 'Summarize coaching themes and evidence', 'Prepare the next supervisor action'],
    previewChannel: 'digital',
    responseStyleLabel: 'Response style',
    responseStyle: 'Concise coach',
    proposalOverrides: {
      name: 'CX Desktop Supervisor Assistant',
      purpose: 'Help supervisors review interactions and prepare focused coaching follow-up.',
      description: 'An employee assistant for CX Desktop interaction summaries, quality signals, and coaching actions.',
      instructions: '#### Role & Identity\nYou are a CX Desktop supervisor assistant.\n\n#### Primary Goals\nSummarize approved interaction evidence and prepare useful coaching follow-up.\n\n#### Guardrails\nRespect customer and employee permissions. Keep final evaluations with the supervisor.\n\n#### Output Rules\nSeparate observed evidence from suggested coaching actions.',
    },
    presets: [
      selectionsPreset('audience', 'Audience', ['Contact-center supervisors']),
      selectionsPreset('knowledge', 'Knowledge', ['Quality review rubric', 'CX Desktop guide', 'Process playbooks']),
      selectionsPreset('actions', 'Actions', ['Prepare coaching summary', 'Create follow-up task', 'Flag interaction for review']),
      selectionsPreset('security', 'Prebuilt guardrails', ['PII detection', 'Toxicity', 'Misinformation']),
    ],
    demo: {
      fixture: 'cx-desktop',
      prompts: ['Summarize the latest interaction review', 'What coaching opportunities did you find?', 'Prepare a follow-up coaching task'],
    },
  }),
  defineTemplate({
    id: 'internal_assistant:webex-meeting',
    family: 'internal_assistant',
    starterId: 'employee-policy',
    name: 'Webex meeting concierge',
    industry: 'Webex Concierge',
    useCase: 'Meeting setup, controls, and troubleshooting',
    icon: 'people',
    workflow: ['Understand the meeting task', 'Find the approved Webex guidance', 'Guide the user or prepare support follow-up'],
    previewChannel: 'digital',
    responseStyleLabel: 'Response style',
    responseStyle: 'Friendly guide',
    proposalOverrides: {
      name: 'Webex Meeting Concierge',
      purpose: 'Help employees set up, manage, and troubleshoot Webex meetings.',
      description: 'An employee concierge for meeting settings, participation controls, recordings, and common issues.',
      instructions: '#### Role & Identity\nYou are a Webex meeting concierge.\n\n#### Primary Goals\nHelp employees prepare meetings, use approved controls, and resolve common issues.\n\n#### Guardrails\nFollow meeting security and recording policies. Route account-specific issues to support.\n\n#### Output Rules\nUse friendly, direct steps and call out any host-only control.',
    },
    presets: [
      selectionsPreset('audience', 'Audience', ['All Webex users']),
      selectionsPreset('knowledge', 'Knowledge', ['Webex help center', 'Meeting policies', 'Support articles']),
      selectionsPreset('actions', 'Actions', ['Prepare meeting checklist', 'Open Webex support request', 'Route account issue']),
      selectionsPreset('security', 'Prebuilt guardrails', ['Prompt injection', 'PII detection', 'Toxicity']),
    ],
  }),
  defineTemplate({
    id: 'internal_assistant:webex-workspace',
    family: 'internal_assistant',
    starterId: 'it-help-desk',
    name: 'Webex workspace concierge',
    industry: 'Webex Concierge',
    useCase: 'Spaces, devices, rooms, and workplace help',
    icon: 'people',
    workflow: ['Understand the workplace request', 'Check approved Webex and workspace information', 'Guide the employee or connect the right support team'],
    previewChannel: 'digital',
    responseStyleLabel: 'Response style',
    responseStyle: 'Helpful coordinator',
    proposalOverrides: {
      name: 'Webex Workspace Concierge',
      purpose: 'Help employees use Webex spaces, shared devices, and workplace resources.',
      description: 'An employee concierge for Webex spaces, room devices, workplace information, and support routing.',
      instructions: '#### Role & Identity\nYou are a Webex workspace concierge.\n\n#### Primary Goals\nHelp employees find approved Webex and workplace guidance, then connect the right support team.\n\n#### Guardrails\nRespect workspace access and employee permissions. Do not expose private space information.\n\n#### Output Rules\nBe helpful, concise, and explicit about the next support step.',
    },
    presets: [
      selectionsPreset('audience', 'Audience', ['All employees']),
      selectionsPreset('knowledge', 'Knowledge', ['Webex help center', 'Workspace directory', 'Support articles']),
      selectionsPreset('actions', 'Actions', ['Find room support contact', 'Open device support request', 'Prepare workspace guidance']),
      selectionsPreset('security', 'Prebuilt guardrails', ['Prompt injection', 'PII detection', 'Jailbreak']),
    ],
  }),
] as const;

const AGENT_HOME_DEMO_IDS: readonly AgentHomeTemplateId[] = [
  'calling:retail-store-assistant',
  'internal_assistant:candidate-feedback',
  'internal_assistant:incident-command',
  'contact_center:property-service',
];

export const AGENT_HOME_DEMO_OPTIONS = AGENT_HOME_DEMO_IDS.map(templateId => (
  AGENT_HOME_TEMPLATE_OPTIONS.find(template => template.id === templateId)
)).filter(
  (template): template is AgentHomeTemplateDefinition & { demo: AgentHomeTemplateDemo } => Boolean(template?.demo),
);

export const getAgentHomeTemplatesForFamily = (family: AgentFamily) =>
  AGENT_HOME_TEMPLATE_OPTIONS.filter(template => template.family === family);

export const getAgentHomeTemplate = (templateId: AgentHomeTemplateId) =>
  AGENT_HOME_TEMPLATE_OPTIONS.find(template => template.id === templateId);

export const getAgentHomePreviewChannelLabel = (channel: AgentHomePreviewChannel) => {
  if (channel === 'voice') return 'Voice';
  if (channel === 'digital') return 'Digital';
  return 'Voice + digital';
};

export const createDraftFromHomeTemplate = (templateId: AgentHomeTemplateId): AgentDraft => {
  const template = getAgentHomeTemplate(templateId);
  if (!template) throw new Error(`Unknown agent home template: ${templateId}`);

  const draft = createDraftFromProposal(template.family, template.proposal);
  const updatedAt = draft.updatedAt;

  for (const preset of template.presets) {
    const capability = draft.familyConfiguration[preset.capabilityId];
    if (!capability || capability.progress === 'blocked' || capability.availability === 'cx_only') {
      throw new Error(`${template.id} cannot configure ${preset.capabilityId}`);
    }
    draft.familyConfiguration[preset.capabilityId] = {
      ...capability,
      progress: 'configured',
      values: { ...preset.values },
      updatedAt,
    };
  }

  draft.activeSection = 'basics';
  draft.recommendationSourceRevision = getRecommendationSourceRevision(draft);
  draft.recommendations = getRankedRecommendations(draft);
  return draft;
};
