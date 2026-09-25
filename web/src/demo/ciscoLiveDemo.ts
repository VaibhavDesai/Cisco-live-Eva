import {
  createDefaultGalileoActionControlState,
  evaluateGalileoActionInvocation,
  GALILEO_ACTION_IDS,
  readGalileoActionControlState,
  type GalileoActionControlBehavior,
  type GalileoActionControlEvaluationResult,
  type GalileoActionControlTiming,
} from '../pages/agent/ActionControls';

export const CISCO_LIVE_PRIMARY_AGENT_ID = 'golftop-vip-reservations';
export const CISCO_LIVE_PRIMARY_AGENT_NAME = 'EAGLE GREEN VIP Reservations';

export interface CiscoLiveActionControlDecisionSummary {
  evaluated: number;
  matched: number;
  notMatched: number;
  actionRan: number;
  observed: number;
  steered: number;
  denied: number;
  unlocked: number;
  matchRate: number;
}

/** Curated six-hour aggregate for the default Overview window. */
export const CISCO_LIVE_ACTION_CONTROL_SUMMARY_6H: CiscoLiveActionControlDecisionSummary = {
  evaluated: 18,
  matched: 4,
  notMatched: 14,
  actionRan: 16,
  observed: 1,
  steered: 3,
  denied: 0,
  unlocked: 1,
  matchRate: 22,
};

/** Curated 24-hour aggregate; individual seeded Sessions remain drill-down samples. */
export const CISCO_LIVE_ACTION_CONTROL_SUMMARY_24H: CiscoLiveActionControlDecisionSummary = {
  evaluated: 64,
  matched: 14,
  notMatched: 50,
  actionRan: 58,
  observed: 3,
  steered: 11,
  denied: 0,
  unlocked: 3,
  matchRate: 22,
};

export interface CiscoLiveOperationalHealthMetric {
  id: string;
  observabilityKpiId: string;
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

/** Shared headline metrics for the primary agent's Overview and Observability views. */
export const CISCO_LIVE_OPERATIONAL_HEALTH_METRICS: CiscoLiveOperationalHealthMetric[] = [
  {
    id: 'knowledge-coverage',
    observabilityKpiId: 'kp-knowledge-coverage',
    label: 'Knowledge coverage',
    value: '94.8%',
    change: '+4.6%',
    isPositive: true,
  },
  {
    id: 'guardrails-trigger-flag',
    observabilityKpiId: 'sec-guardrails-trigger-flag',
    label: 'Guardrails trigger flag',
    value: '0.8%',
    change: '-0.7%',
    isPositive: true,
  },
  {
    id: 'containment-rate',
    observabilityKpiId: 'ce-containment-rate',
    label: 'Containment rate',
    value: '91.6%',
    change: '+5.2%',
    isPositive: true,
  },
  {
    id: 'action-intent-success-rate',
    observabilityKpiId: 'ap-intent-success-rate',
    label: 'Action/intent success rate',
    value: '97.8%',
    change: '+2.4%',
    isPositive: true,
  },
  {
    id: 'control-evaluations',
    observabilityKpiId: 'ac-control-evaluations',
    label: 'Control evaluations',
    value: '18',
    change: '6h aggregate',
    isPositive: true,
  },
  {
    id: 'steer-outcomes',
    observabilityKpiId: 'ac-steer-outcomes',
    label: 'Steer outcomes',
    value: '3',
    change: '6h aggregate',
    isPositive: true,
  },
  {
    id: 'autocsat-improvement',
    observabilityKpiId: 'bi-autocsat-improvement',
    label: 'AutoCSAT improvement',
    value: '8.6%',
    change: '+3.4%',
    isPositive: true,
  },
  {
    id: 'csat-predictor',
    observabilityKpiId: 'ce-csat-predictor',
    label: 'CSAT predictor (AutoCSAT)',
    value: '4.7/5',
    change: '+8.1%',
    isPositive: true,
  },
];

export interface CiscoLiveBusinessImpactMetric {
  observabilityKpiId: string;
  value: string;
  change: string;
  isPositive: boolean;
  thresholdStatus: 'good' | 'bad';
}

/** Business Impact story: voice productivity is the single signal that needs investigation. */
export const CISCO_LIVE_BUSINESS_IMPACT_METRICS: CiscoLiveBusinessImpactMetric[] = [
  {
    observabilityKpiId: 'bi-aht-reduction',
    value: '32.4%',
    change: '+4.8%',
    isPositive: true,
    thresholdStatus: 'good',
  },
  {
    observabilityKpiId: 'bi-first-contact-resolution',
    value: '92.4%',
    change: '+2.1%',
    isPositive: true,
    thresholdStatus: 'good',
  },
  {
    observabilityKpiId: 'bi-ai-agent-productivity-voice',
    value: '77.9%',
    change: '-5.6%',
    isPositive: false,
    thresholdStatus: 'bad',
  },
  {
    observabilityKpiId: 'bi-ai-agent-productivity-digital',
    value: '92.9%',
    change: '+3.3%',
    isPositive: true,
    thresholdStatus: 'good',
  },
];

export interface CiscoLiveGuardrailDefinition {
  id: string;
  name: string;
  description: string;
  action: 'monitor' | 'steer' | 'block';
  direction: 'prompt' | 'response' | 'both';
  createdBy: string;
  createdAt: string;
  overview: {
    blocked: { text: string }[];
    allowed: { text: string }[];
    edgeCases: { text: string }[];
  };
}

export const CISCO_LIVE_VIP_EVENT_CONFIDENTIALITY_GUARDRAIL: CiscoLiveGuardrailDefinition = {
  id: 'custom-vip-event-confidentiality',
  name: 'VIP event confidentiality',
  description: 'Prevents the agent from confirming or sharing protected guest attendance, schedules, locations, access routes, security arrangements, or reservation details with unverified or unauthorized requesters.',
  action: 'block',
  direction: 'both',
  createdBy: 'Vinod Muthukrishnan',
  createdAt: 'Jul 13, 2026',
  overview: {
    blocked: [
      { text: 'Confirm or deny whether a protected guest is attending an event' },
      { text: 'Share a guest list or identify protected guests' },
      { text: 'Reveal exact arrival or departure times, private locations, entrances, access routes, or security arrangements' },
      { text: 'Share reservation details with an unverified or unauthorized requester' },
      { text: 'Help a requester reconstruct protected event details across multiple questions' },
    ],
    allowed: [
      { text: 'Share public venue and event information' },
      { text: 'Share authorized reservation details with a verified organizer within the approved scope' },
      { text: 'Give verified vendors only the task-specific logistics required for their work' },
      { text: 'Offer secure verification or contact the organizer using the approved number on file' },
    ],
    edgeCases: [
      { text: 'If public event information is mixed with a protected guest request, answer only the public portion' },
      { text: 'If a verified vendor asks beyond the assigned task, share only approved logistics and redirect them to the organizer' },
      { text: 'Treat yes-or-no questions that confirm attendance as protected disclosure' },
      { text: 'Review related requests across the conversation before deciding whether a response could reveal protected details' },
    ],
  },
};

export const CISCO_LIVE_PAYMENT_DATA_GUARDRAIL: CiscoLiveGuardrailDefinition = {
  id: 'custom-payment-data-protection',
  name: 'Payment data protection',
  description: 'Stops the agent from collecting full card details in conversation and sends the caller to the approved secure payment flow.',
  action: 'block',
  direction: 'both',
  createdBy: 'Kristin Gioberto',
  createdAt: 'Jul 12, 2026',
  overview: {
    blocked: [
      { text: 'Request or repeat a full card number, expiration date, or security code' },
      { text: 'Store payment details in the transcript or customer profile' },
    ],
    allowed: [
      { text: 'Confirm that a saved payment method is expired' },
      { text: 'Send the approved secure payment link by text message' },
    ],
    edgeCases: [
      { text: 'A caller volunteers payment details before the agent asks' },
    ],
  },
};

export const CISCO_LIVE_PERSONALIZED_DIETARY_ALCOHOL_GUARDRAIL: CiscoLiveGuardrailDefinition = {
  id: 'custom-no-personalized-dietary-alcohol-advice',
  name: 'No Personalized Dietary & Alcohol Advice',
  description: 'Prevents the agent from deciding which food, beverage, or amount of alcohol is safe for a guest based on a medical condition, procedure, or medication, while allowing published nutrition information and non-alcoholic options.',
  action: 'block',
  direction: 'response',
  createdBy: 'Vinod Muthukrishnan',
  createdAt: 'Aug 14, 2026',
  overview: {
    blocked: [
      { text: 'Recommend dishes as safe or appropriate for a medical condition, recent procedure, or medication' },
      { text: 'State that an alcoholic drink or amount of alcohol is safe with a medication or medical condition' },
      { text: 'Interpret published nutrition information as personalized medical guidance' },
    ],
    allowed: [
      { text: 'Share published ingredient, sodium, and nutrition information without interpreting medical safety' },
      { text: 'Show non-alcoholic beverage options' },
      { text: 'Add the guest\'s selections to the reservation after they make their own choice' },
      { text: 'Offer live agent support without giving personalized medical advice' },
    ],
    edgeCases: [
      { text: 'Distinguish a general dietary preference from a request tied to a condition, procedure, or medication' },
      { text: 'If an item is labeled low sodium, share the published label without saying it is safe for the guest' },
      { text: 'If a request mixes menu facts with medical-safety advice, answer only the factual portion and state the boundary' },
    ],
  },
};

export const CISCO_LIVE_PERSONALIZED_DIETARY_ALCOHOL_SECURITY_RULE =
  'Do not personalize dietary or alcohol safety advice based on medical conditions, procedures, or medications';

export const CISCO_LIVE_PRIMARY_GUARDRAILS = [
  CISCO_LIVE_PAYMENT_DATA_GUARDRAIL,
  CISCO_LIVE_PERSONALIZED_DIETARY_ALCOHOL_GUARDRAIL,
];

export const CISCO_LIVE_EVENT_OPERATIONS_GUARDRAIL: CiscoLiveGuardrailDefinition = {
  id: 'custom-venue-capacity-compliance',
  name: 'Venue capacity and compliance approval',
  description: 'Requires confirmed capacity, staffing, catering, and facilities approval before the agent commits resources for a large event.',
  action: 'block',
  direction: 'both',
  createdBy: 'Amit Barave',
  createdAt: 'Jul 13, 2026',
  overview: {
    blocked: [
      { text: 'Override venue capacity or fire-code limits' },
      { text: 'Commit unapproved catering, staffing, or facilities resources' },
      { text: 'Skip a required operational owner approval' },
    ],
    allowed: [
      { text: 'Collect event requirements and check team availability' },
      { text: 'Coordinate approvals across venue, kitchen, staffing, and facilities teams' },
      { text: 'Open fulfillment workstreams after approvals are recorded' },
    ],
    edgeCases: [
      { text: 'Partially approved events with one team still pending' },
      { text: 'Existing contracts with preapproved venue capacity' },
    ],
  },
};

export const CISCO_LIVE_SERVICENOW_GUARDRAIL: CiscoLiveGuardrailDefinition = {
  id: 'custom-authorized-fulfillment-routing',
  name: 'Authorized fulfillment routing',
  description: 'Limits ServiceNow creation and routing to approved event work, preserves ownership, and escalates fulfillment risk without changing approvals.',
  action: 'block',
  direction: 'both',
  createdBy: 'Vinod Muthukrishnan',
  createdAt: 'Jul 12, 2026',
  overview: {
    blocked: [
      { text: 'Create work outside the approved event scope' },
      { text: 'Assign tickets to an unauthorized team or owner' },
      { text: 'Close work or alter approvals without the responsible owner' },
    ],
    allowed: [
      { text: 'Create a scoped ticket with reservation context attached' },
      { text: 'Route approved work to the responsible fulfillment team' },
      { text: 'Track SLA risk and notify an authorized owner' },
    ],
    edgeCases: [
      { text: 'Potential duplicate tickets for the same event request' },
      { text: 'The primary fulfillment owner is unavailable' },
    ],
  },
};

export const CISCO_LIVE_ALL_GUARDRAILS = [
  ...CISCO_LIVE_PRIMARY_GUARDRAILS,
  CISCO_LIVE_EVENT_OPERATIONS_GUARDRAIL,
  CISCO_LIVE_SERVICENOW_GUARDRAIL,
];

export const CISCO_LIVE_ACTION_CATALOG: Record<string, string> = {
  'Check Availability': 'Check live bay inventory for the requested Gofie location, date, party size, and duration.',
  'Send payment link': 'Send the approved PCI-compliant payment link without collecting card data in the conversation.',
  'Transfer to VIP team': 'Transfer an approved large-event request with the verified caller profile, transcript reference, customer context, and event summary attached.',
  Handover: 'Hand over the active conversation to a human agent with the verified caller profile, transcript, and reservation context attached.',
  'Check venue capacity': 'Evaluate bay capacity, guest thresholds, and facilities constraints for a proposed large event.',
  'Coordinate staffing': 'Coordinate staffing, catering, beverage, and facilities owners against the approved event plan.',
  'Open workstream': 'Create the shared cross-team fulfillment plan after required approvals are recorded.',
  'Create ServiceNow ticket': 'Create a scoped ServiceNow work item with required event context and approval references.',
  'Assign team': 'Route approved work to the responsible Gofie fulfillment team and named owner.',
  'Track SLA risk': 'Monitor due dates and notify the authorized owner when a fulfillment commitment is at risk.',
};

export type CiscoLiveAgentType = 'scripted' | 'autonomous' | 'receptionist';

export interface CiscoLiveMemorySource {
  name: string;
  description: string;
}

export interface CiscoLiveOrchestrationScenario {
  id: string;
  name: string;
  description: string;
  collaboration: string;
  actions: string[];
  collaborator: {
    id: string;
    name: string;
    initials: string;
    description: string;
    agentId?: string;
    gradient?: string;
  };
}

export interface CiscoLiveAgentDefinition {
  id: string;
  name: string;
  initials: string;
  description: string;
  gradient: string;
  status: string;
  statusClass: string;
  sessions: string;
  successRate: string;
  messages: string;
  avgResponse: string;
  meta: string;
  knowledgeBases: string[];
  knowledgeSources: Array<{
    name: string;
    description: string;
    sources: number;
  }>;
  memorySources: CiscoLiveMemorySource[];
  orchestrationScenarios: CiscoLiveOrchestrationScenario[];
  actions: string[];
  goals: string[];
  securityRules: string[];
  welcomeMessage: string;
  customGuardrails: CiscoLiveGuardrailDefinition[];
  prebuiltGuardrailIds: string[];
  selectedChannels: Array<'voice' | 'digital' | 'video'>;
  digitalChannelAddress?: string;
  templateId: 'customer-support' | 'workflow-automation';
  agentType: 'Autonomous agent' | 'Scripted agent';
  tileType: CiscoLiveAgentType;
  updatedOn: string;
  updatedBy: string;
}

export const CISCO_LIVE_AGENTS: CiscoLiveAgentDefinition[] = [
  {
    id: CISCO_LIVE_PRIMARY_AGENT_ID,
    name: CISCO_LIVE_PRIMARY_AGENT_NAME,
    initials: 'EG',
    description: 'Recognizes VIP callers, books visits, sends secure payment links, and transfers large event requests for approval.',
    gradient: 'linear-gradient(135deg, #6c5ce7 0%, #1677c8 100%)',
    status: 'Published',
    statusClass: 'badge-success',
    sessions: '2,814',
    successRate: '96.8%',
    messages: '9,462',
    avgResponse: '1.1s',
    meta: 'VIP reservations and secure human handoff • Last updated 2 hours ago',
    knowledgeBases: ['Gofie locations', 'VIP profiles', 'Booking policy'],
    knowledgeSources: [
      {
        name: 'Gofie locations',
        description: 'Live bay inventory, venue hours, amenities, and reservation availability across Gofie locations.',
        sources: 38,
      },
      {
        name: 'VIP profiles',
        description: 'Verified loyalty status, visit preferences, and approved personalization for Gofie VIP guests.',
        sources: 12,
      },
      {
        name: 'Booking policy',
        description: 'Reservation thresholds, payment handling, approvals, and human handoff policy for large events.',
        sources: 21,
      },
    ],
    memorySources: [
      {
        name: 'Communication preferences',
        description: 'Remembers the customer\'s preferred channel, contact timing, and service style.',
      },
      {
        name: 'Customer profile',
        description: 'Remembers the customer\'s name, recognized voice, VIP tier, and approved profile details.',
      },
      {
        name: 'Visit preferences',
        description: 'Remembers preferred locations, bays, food choices, accessibility needs, and past visit details.',
      },
    ],
    orchestrationScenarios: [
      {
        id: 'secure-payment-assistance',
        name: 'Secure payment assistance',
        description: 'Consult the approved payment flow without exposing card data in the conversation.',
        collaboration: 'Consult Secure Payments',
        actions: ['Send payment link'],
        collaborator: {
          id: 'gofie-secure-payments',
          name: 'EAGLE GREEN Secure Payments',
          initials: 'SP',
          description: 'Provides the approved PCI-compliant payment flow without exposing card data.',
          gradient: 'linear-gradient(135deg, #f08b43 0%, #c5548d 100%)',
        },
      },
      {
        id: 'vip-event-handoff',
        name: 'VIP event handoff',
        description: 'Hand over the request with the customer profile, transcript, and booking context attached.',
        collaboration: 'Create event coordination tickets',
        actions: ['Transfer to VIP team'],
        collaborator: {
          id: 'golftop-event-operations',
          agentId: 'golftop-event-operations',
          name: 'EAGLE GREEN Event Operations',
          initials: 'EO',
          description: 'Coordinates venue, staffing, catering, and facilities work after approval.',
          gradient: 'linear-gradient(135deg, #13a88a 0%, #1677c8 100%)',
        },
      },
    ],
    actions: ['Check Availability', 'Send payment link', 'Transfer to VIP team', 'Handover'],
    goals: [
      'Recognize verified VIP callers and personalize the reservation experience',
      'Check live bay availability and complete eligible reservations',
      'Send secure payment links without collecting card data in conversation',
      'Transfer large event requests with the transcript and summary attached',
    ],
    securityRules: [
      'Verify identity before using a VIP customer profile',
      'Never collect or repeat full payment card details',
      'Protect VIP guest, schedule, access, security, and reservation details from unverified requesters',
      CISCO_LIVE_PERSONALIZED_DIETARY_ALCOHOL_SECURITY_RULE,
      'Preserve the conversation context during every human handoff',
    ],
    welcomeMessage: 'Welcome to Gofie. I can help with availability, VIP reservations, and secure payment updates. How can I help today?',
    customGuardrails: CISCO_LIVE_PRIMARY_GUARDRAILS,
    prebuiltGuardrailIds: ['priv-pii', 'priv-credit-card'],
    selectedChannels: ['voice'],
    templateId: 'customer-support',
    agentType: 'Scripted agent',
    tileType: 'scripted',
    updatedOn: '13 Jul 26',
    updatedBy: 'Gino',
  },
  {
    id: 'golftop-event-operations',
    name: 'EAGLE GREEN Event Operations',
    initials: 'EO',
    description: 'Coordinates bay capacity, catering, staffing, and facilities work when a large reservation is approved.',
    gradient: 'linear-gradient(135deg, #13a88a 0%, #1677c8 100%)',
    status: 'Published',
    statusClass: 'badge-success',
    sessions: '86',
    successRate: '93.1%',
    messages: '624',
    avgResponse: '1.6s',
    meta: 'Cross-team event orchestration • Last updated 4 hours ago',
    knowledgeBases: ['Venue capacity', 'Catering & staffing', 'Facilities compliance'],
    knowledgeSources: [
      {
        name: 'Venue capacity',
        description: 'Bay layouts, guest thresholds, accessibility details, and live capacity for the Las Vegas venue.',
        sources: 17,
      },
      {
        name: 'Catering & staffing',
        description: 'Seafood catering, beverage inventory, staffing ratios, and team ownership for large events.',
        sources: 42,
      },
      {
        name: 'Facilities compliance',
        description: 'Facilities readiness, fire-code review, safety approvals, and escalation contacts.',
        sources: 29,
      },
    ],
    memorySources: [
      {
        name: 'Event operating context',
        description: 'Remembers event dates, locations, guest counts, service requirements, and current approval state.',
      },
      {
        name: 'Team ownership',
        description: 'Remembers the venue, catering, staffing, and facilities owners responsible for each commitment.',
      },
      {
        name: 'Fulfillment decisions',
        description: 'Remembers recorded approvals, open blockers, resource commitments, and operational exceptions.',
      },
    ],
    orchestrationScenarios: [
      {
        id: 'staffing-coordination',
        name: 'Staffing coordination',
        description: 'Consult staffing and catering owners before committing service levels.',
        collaboration: 'Consult staffing and catering owners',
        actions: ['Coordinate staffing'],
        collaborator: {
          id: 'gofie-staffing-catering',
          name: 'EAGLE GREEN Staffing & Catering',
          initials: 'SC',
          description: 'Coordinates staffing ratios, menus, beverage inventory, and service ownership.',
          gradient: 'linear-gradient(135deg, #bf6ad8 0%, #5d6adf 100%)',
        },
      },
      {
        id: 'facilities-approval',
        name: 'Facilities approval',
        description: 'Hand off capacity and safety exceptions to the responsible facilities approver.',
        collaboration: 'Hand over to facilities approver',
        actions: ['Check venue capacity', 'Open workstream'],
        collaborator: {
          id: 'golftop-servicenow-coordinator',
          agentId: 'golftop-servicenow-coordinator',
          name: 'EAGLE GREEN ServiceNow Coordinator',
          initials: 'SN',
          description: 'Creates and routes approved facilities work, then tracks ownership and SLA risk.',
          gradient: 'linear-gradient(135deg, #1677c8 0%, #6547d5 100%)',
        },
      },
    ],
    actions: ['Check venue capacity', 'Coordinate staffing', 'Open workstream'],
    goals: [
      'Coordinate venue capacity, catering, beverage, staffing, and facilities work',
      'Collect every required approval before committing event resources',
      'Keep cross-team owners aligned with a shared fulfillment plan',
      'Escalate operational blockers before they affect the event',
    ],
    securityRules: [
      'Do not override venue capacity, facilities, or fire-code limits',
      'Do not commit resources until the responsible owner approves them',
      'Use only approved event context when opening downstream work',
      'Record approval and ownership changes in the workflow history',
    ],
    welcomeMessage: 'I coordinate approved Gofie event operations across venue, catering, staffing, and facilities teams. What event should I review?',
    customGuardrails: [CISCO_LIVE_EVENT_OPERATIONS_GUARDRAIL],
    prebuiltGuardrailIds: ['std-jailbreak', 'sec-system-prompt', 'safe-misinfo'],
    selectedChannels: ['digital'],
    digitalChannelAddress: 'space:golf-top-gsx-operations',
    templateId: 'workflow-automation',
    agentType: 'Autonomous agent',
    tileType: 'autonomous',
    updatedOn: '13 Jul 26',
    updatedBy: 'Trey',
  },
  {
    id: 'golftop-servicenow-coordinator',
    name: 'EAGLE GREEN ServiceNow Coordinator',
    initials: 'SN',
    description: 'Creates and routes ServiceNow work without manual entry, then tracks ownership and fulfillment risk.',
    gradient: 'linear-gradient(135deg, #1677c8 0%, #6547d5 100%)',
    status: 'Published',
    statusClass: 'badge-success',
    sessions: '214',
    successRate: '97.4%',
    messages: '1,108',
    avgResponse: '0.9s',
    meta: 'ServiceNow actions and fulfillment tracking • Last updated 5 hours ago',
    knowledgeBases: ['Fulfillment catalog', 'Support teams', 'Response SLAs'],
    knowledgeSources: [
      {
        name: 'Fulfillment catalog',
        description: 'Approved ticket types, required fields, assignment groups, and fulfillment workflows.',
        sources: 54,
      },
      {
        name: 'Support teams',
        description: 'Ownership map for venue operations, facilities, catering, staffing, and event support.',
        sources: 24,
      },
      {
        name: 'Response SLAs',
        description: 'Response targets, escalation thresholds, and owner notification rules for event work.',
        sources: 16,
      },
    ],
    memorySources: [
      {
        name: 'Work item context',
        description: 'Remembers ticket identifiers, affected events, required fields, and current fulfillment status.',
      },
      {
        name: 'Routing history',
        description: 'Remembers previous assignment groups, named owners, transfers, and escalation decisions.',
      },
      {
        name: 'Automation preferences',
        description: 'Remembers approved field defaults, notification paths, and SLA handling rules for each workflow.',
      },
    ],
    orchestrationScenarios: [
      {
        id: 'fulfillment-intake',
        name: 'Fulfillment intake',
        description: 'Delegate approved event work to the ServiceNow coordinator with required context attached.',
        collaboration: 'Delegate to ServiceNow coordinator',
        actions: ['Create ServiceNow ticket'],
        collaborator: {
          id: 'golftop-event-operations',
          agentId: 'golftop-event-operations',
          name: 'EAGLE GREEN Event Operations',
          initials: 'EO',
          description: 'Supplies the approved event plan and the operational context required for fulfillment.',
          gradient: 'linear-gradient(135deg, #13a88a 0%, #1677c8 100%)',
        },
      },
      {
        id: 'ownership-routing',
        name: 'Ownership routing',
        description: 'Consult the Gofie ownership map and route work to the responsible fulfillment team.',
        collaboration: 'Consult Gofie support ownership',
        actions: ['Assign team'],
        collaborator: {
          id: 'gofie-support-routing',
          name: 'EAGLE GREEN Support Routing',
          initials: 'SR',
          description: 'Resolves the responsible support team and named owner for each approved work item.',
          gradient: 'linear-gradient(135deg, #cf6c4a 0%, #7f58d6 100%)',
        },
      },
      {
        id: 'sla-risk-escalation',
        name: 'SLA risk escalation',
        description: 'Hand over at-risk work to the authorized owner before the commitment is missed.',
        collaboration: 'Hand over to fulfillment owner',
        actions: ['Track SLA risk'],
        collaborator: {
          id: 'gofie-fulfillment-owner',
          name: 'EAGLE GREEN Fulfillment Owner',
          initials: 'FO',
          description: 'Accepts at-risk work, resolves blockers, and owns the fulfillment commitment.',
          gradient: 'linear-gradient(135deg, #e06d89 0%, #8a60d4 100%)',
        },
      },
    ],
    actions: ['Create ServiceNow ticket', 'Assign team', 'Track SLA risk'],
    goals: [
      'Create complete ServiceNow work items without manual entry',
      'Route approved event work to the responsible fulfillment team',
      'Attach reservation context so teams can act without rework',
      'Track SLA risk and escalate blockers to the right owner',
    ],
    securityRules: [
      'Create tickets only for approved event work',
      'Do not change approvals, ownership, or closure state without authorization',
      'Include only the minimum customer context required for fulfillment',
      'Escalate duplicate tickets and uncertain ownership for review',
    ],
    welcomeMessage: 'I can create, route, and track approved Gofie fulfillment work in ServiceNow. Share the event request you want coordinated.',
    customGuardrails: [CISCO_LIVE_SERVICENOW_GUARDRAIL],
    prebuiltGuardrailIds: ['std-jailbreak', 'sec-sql-injection', 'priv-pii'],
    selectedChannels: ['digital'],
    digitalChannelAddress: 'servicenow:golf-top-fulfillment',
    templateId: 'workflow-automation',
    agentType: 'Autonomous agent',
    tileType: 'autonomous',
    updatedOn: '12 Jul 26',
    updatedBy: 'Gino',
  },
];

export interface CiscoLiveObservabilityMetric {
  metricId: string;
  value: string;
  unit?: string;
  change: string;
  isPositive: boolean;
  thresholdStatus?: 'good' | 'bad' | 'neutral';
}

export interface CiscoLiveObservabilitySnapshot {
  timeframe: string;
  metrics: CiscoLiveObservabilityMetric[];
  eventLabel: string;
  eventTitle: string;
  eventDescription: string;
  eventMeta: string;
  sessionId: string;
}

const OBSERVABILITY_BY_AGENT: Record<string, CiscoLiveObservabilitySnapshot> = {
  [CISCO_LIVE_PRIMARY_AGENT_ID]: {
    timeframe: 'Last 24 hours',
    metrics: [
      { metricId: 'ap-intent-success-rate', value: '98.1', unit: '%', change: '+2%', isPositive: true, thresholdStatus: 'good' },
      { metricId: 'aq-goal-completion-rate', value: '96', unit: '%', change: '+4%', isPositive: true, thresholdStatus: 'good' },
      { metricId: 'sec-policy-violation-guardrail-block-rate', value: '0.4', unit: '%', change: '-0.1%', isPositive: true, thresholdStatus: 'good' },
      { metricId: 'bi-autocsat-improvement', value: '5.00', unit: '%', change: '+0.03%', isPositive: true, thresholdStatus: 'good' },
    ],
    eventLabel: 'Galileo agent control',
    eventTitle: 'Large event transfer unlocked',
    eventDescription: 'Check Availability completed. Galileo matched the large-event threshold and unlocked Transfer to VIP team with the availability result and caller context attached.',
    eventMeta: 'Evaluated after Check Availability • 9:42 AM',
    sessionId: 'SES-GT-1042',
  },
  'golftop-event-operations': {
    timeframe: 'Last 24 hours',
    metrics: [
      { metricId: 'ap-workflow-completion-rate', value: '93', unit: '%', change: '+3%', isPositive: true, thresholdStatus: 'good' },
      { metricId: 'ap-autonomous-action-coverage', value: '82', unit: '%', change: '+2%', isPositive: true, thresholdStatus: 'good' },
      { metricId: 'ap-fulfilment-success-rate', value: '98.1', unit: '%', change: '+1.4%', isPositive: true, thresholdStatus: 'good' },
      { metricId: 'ap-fulfilment-latency-p95', value: '1,240', unit: 'ms', change: '-8%', isPositive: true, thresholdStatus: 'good' },
    ],
    eventLabel: 'Cross-team orchestration started',
    eventTitle: 'GSX reservation fulfillment plan created',
    eventDescription: 'The agent opened workstreams for bay capacity, seafood catering, beverage inventory, staffing, and fire-code review.',
    eventMeta: 'Large event workflow • 9:45 AM',
    sessionId: 'SES-OPS-2086',
  },
  'golftop-servicenow-coordinator': {
    timeframe: 'Last 24 hours',
    metrics: [
      { metricId: 'ap-intent-success-rate', value: '97.4', unit: '%', change: '+1.2%', isPositive: true, thresholdStatus: 'good' },
      { metricId: 'ap-fulfilment-success-rate', value: '97.4', unit: '%', change: '+2%', isPositive: true, thresholdStatus: 'good' },
      { metricId: 'ap-fulfilment-latency-p95', value: '1,850', unit: 'ms', change: '-8%', isPositive: true, thresholdStatus: 'good' },
      { metricId: 'ce-transfer-escalation-rate', value: '3', unit: '%', change: '-1%', isPositive: true, thresholdStatus: 'good' },
    ],
    eventLabel: 'ServiceNow action completed',
    eventTitle: 'Facilities capacity ticket assigned',
    eventDescription: 'The agent created the facilities request, attached the reservation context, and assigned the Las Vegas operations queue.',
    eventMeta: 'ServiceNow • 9:46 AM',
    sessionId: 'SES-SN-3214',
  },
};

export function getCiscoLiveObservability(agentId: string): CiscoLiveObservabilitySnapshot {
  return OBSERVABILITY_BY_AGENT[agentId] ?? OBSERVABILITY_BY_AGENT[CISCO_LIVE_PRIMARY_AGENT_ID];
}

export type CiscoLiveSessionOutcome = 'Resolved' | 'Transferred' | 'In progress';
export type CiscoLiveSessionEventKind = 'customer' | 'agent' | 'system' | 'action_control' | 'guardrail' | 'handoff';
export type CiscoLiveSessionAnnotationKind = 'memory' | 'integration' | 'compliance';

export type CiscoLiveActionControlBehavior = GalileoActionControlBehavior;
export type CiscoLiveActionControlTiming = GalileoActionControlTiming;
export type CiscoLiveActionControlResult = 'observed' | 'steered' | 'denied' | 'not_matched';

export interface CiscoLiveActionControlEvidence {
  field: string;
  operator: 'greater_than' | 'less_than' | 'equals' | 'in';
  expected: number | string | string[];
  actual: number | string | string[];
}

export interface CiscoLiveActionControlDecision {
  controlId: string;
  controlTitle: string;
  actionId: string;
  actionName: string;
  timing: CiscoLiveActionControlTiming;
  behavior: CiscoLiveActionControlBehavior;
  invoked: true;
  matched: boolean;
  evidence: CiscoLiveActionControlEvidence[];
  timeWindowEvidence?: {
    field: 'event_time';
    expected: { start: string; end: string };
    actual: string;
    matched: boolean;
  };
  result: CiscoLiveActionControlResult;
  toolExecuted: boolean;
  unlockedActionIds: string[];
  unlockedActionNames: string[];
  latencyMs: number;
}

export interface CiscoLiveSessionEvent {
  id: string;
  kind: CiscoLiveSessionEventKind;
  speaker: string;
  text: string;
  time: string;
  title?: string;
  detail?: string;
  annotations?: Array<{
    kind: CiscoLiveSessionAnnotationKind;
    label: string;
  }>;
  actionControl?: CiscoLiveActionControlDecision;
}

export interface CiscoLiveSession {
  id: string;
  consumerId: string;
  customer: string;
  channel: 'Voice' | 'Webex' | 'Video' | 'API';
  topic: string;
  updated: string;
  startedAt: string;
  messages: number;
  duration: string;
  outcome: CiscoLiveSessionOutcome;
  guardrailTriggered: boolean;
  actionControlTriggered?: boolean;
  transferred: boolean;
  summary: string;
  guardrail?: {
    id: string;
    name: string;
    policy: string;
    detected: string;
    action: string;
    result: string;
    status: string;
  };
  connectedSystems: string[];
  transcript: CiscoLiveSessionEvent[];
}

const EAGLE_GREEN_ACTION_CONTROL_STATE = createDefaultGalileoActionControlState();
const EAGLE_GREEN_ACTION_NAMES: Record<string, string> = {
  [GALILEO_ACTION_IDS.checkAvailability]: 'Check Availability',
  [GALILEO_ACTION_IDS.sendPayment]: 'Send payment link',
  [GALILEO_ACTION_IDS.transferVipConcierge]: 'Transfer to VIP team',
  [GALILEO_ACTION_IDS.handover]: 'Handover',
};

interface SeededActionControlEventOptions {
  id: string;
  time: string;
  actionId: string;
  inputs: Record<string, unknown>;
  timing: GalileoActionControlTiming;
  latencyMs: number;
}

interface SeededActionControlEventResult {
  evaluation: GalileoActionControlEvaluationResult;
  event: CiscoLiveSessionEvent & { actionControl: CiscoLiveActionControlDecision };
}

function formatSeededEvidenceValue(value: number | 'missing'): string {
  return value === 'missing' ? 'missing' : value.toLocaleString('en-US');
}

/** Builds the demo transcript event from the same deterministic evaluator used by runtime tests. */
function createSeededActionControlEvent({
  id,
  time,
  actionId,
  inputs,
  timing,
  latencyMs,
}: SeededActionControlEventOptions, state = EAGLE_GREEN_ACTION_CONTROL_STATE): SeededActionControlEventResult | null {
  const evaluation = evaluateGalileoActionInvocation({
    state,
    actionId,
    inputs,
    timing,
    occurredAt: time,
  });
  const evaluatedDecision = evaluation.decisions[0];
  if (!evaluatedDecision) return null;

  const actionName = EAGLE_GREEN_ACTION_NAMES[actionId] ?? actionId;
  const unlockedActionNames = evaluatedDecision.unlockedActionIds.map(
    unlockedActionId => EAGLE_GREEN_ACTION_NAMES[unlockedActionId] ?? unlockedActionId,
  );
  const primaryEvidence = evaluatedDecision.evidence.find(evidence => evidence.matched)
    ?? evaluatedDecision.evidence[0];
  const evidenceText = primaryEvidence
    ? `${primaryEvidence.field} ${formatSeededEvidenceValue(primaryEvidence.actual)} > ${primaryEvidence.expected.toLocaleString('en-US')}`
    : 'No supported action-input condition was evaluated';
  const resultDetail = !evaluatedDecision.matched
    ? evaluatedDecision.toolExecuted
      ? `${actionName} completed • Standard automated path continued`
      : `No match • ${actionName} continued`
    : evaluatedDecision.result === 'steered'
      ? evaluatedDecision.toolExecuted
        ? `${actionName} completed • Continue with ${unlockedActionNames.join(', ') || 'configured next action'}`
        : `${actionName} skipped • ${unlockedActionNames.join(', ') || 'Configured next action'} unlocked`
      : evaluatedDecision.result === 'denied'
        ? evaluatedDecision.toolExecuted
          ? `${actionName} completed • Next automated step stopped`
          : `${actionName} denied • Action not executed`
        : `${actionName} observed • Action continued`;
  const actionControl: CiscoLiveActionControlDecision = {
    controlId: evaluatedDecision.controlId,
    controlTitle: evaluatedDecision.controlTitle,
    actionId,
    actionName,
    timing: evaluatedDecision.timing,
    behavior: evaluatedDecision.behavior,
    invoked: true,
    matched: evaluatedDecision.matched,
    evidence: evaluatedDecision.evidence.map(evidence => ({
      field: evidence.field,
      operator: evidence.operator,
      expected: evidence.expected,
      actual: evidence.actual,
    })),
    timeWindowEvidence: evaluatedDecision.timeWindowEvidence
      ? {
        field: evaluatedDecision.timeWindowEvidence.field,
        expected: evaluatedDecision.timeWindowEvidence.expected,
        actual: evaluatedDecision.timeWindowEvidence.actual,
        matched: evaluatedDecision.timeWindowEvidence.matched,
      }
      : undefined,
    result: evaluatedDecision.result,
    toolExecuted: evaluatedDecision.toolExecuted,
    unlockedActionIds: evaluatedDecision.unlockedActionIds,
    unlockedActionNames,
    latencyMs,
  };

  return {
    evaluation,
    event: {
      id,
      kind: 'action_control',
      speaker: 'Galileo agent controls',
      title: `${evaluatedDecision.controlTitle} ${evaluatedDecision.matched ? 'matched' : 'evaluated'}`,
      text: evidenceText,
      detail: resultDetail,
      time,
      actionControl,
    },
  };
}

const LARGE_EVENT_INVOCATION: SeededActionControlEventOptions = {
  id: 'evt-11',
  time: '9:42 AM',
  actionId: GALILEO_ACTION_IDS.checkAvailability,
  inputs: { party_size: 1000, requested_bays: 100 },
  timing: 'post_tool',
  latencyMs: 18,
};

const STANDARD_RESERVATION_INVOCATION: SeededActionControlEventOptions = {
  id: 'evt-1038-2',
  time: '9:31 AM',
  actionId: GALILEO_ACTION_IDS.checkAvailability,
  inputs: { party_size: 8, requested_bays: 2 },
  timing: 'post_tool',
  latencyMs: 12,
};

function requireSeededActionControlEvent(
  options: SeededActionControlEventOptions,
): SeededActionControlEventResult {
  const result = createSeededActionControlEvent(options);
  if (!result) throw new Error(`Expected an active Galileo action control for ${options.actionId}`);
  return result;
}

const LARGE_EVENT_ACTION_CONTROL = requireSeededActionControlEvent(LARGE_EVENT_INVOCATION);
const STANDARD_RESERVATION_ACTION_CONTROL = requireSeededActionControlEvent(STANDARD_RESERVATION_INVOCATION);

const EAGLE_GREEN_SESSION_INVOCATIONS: Record<string, SeededActionControlEventOptions> = {
  'SES-GT-1042': LARGE_EVENT_INVOCATION,
  'SES-GT-1038': STANDARD_RESERVATION_INVOCATION,
};

export const CISCO_LIVE_SESSIONS_BY_AGENT: Record<string, CiscoLiveSession[]> = {
  [CISCO_LIVE_PRIMARY_AGENT_ID]: [
    {
      id: 'SES-GT-1042',
      consumerId: 'KRISTIN-G-1999',
      customer: 'Kristin Gioberto',
      channel: 'Voice',
      topic: 'Large group reservation',
      updated: '2 minutes ago',
      startedAt: 'Today at 9:38 AM',
      messages: 9,
      duration: '4m 18s',
      outcome: 'Transferred',
      guardrailTriggered: true,
      actionControlTriggered: LARGE_EVENT_ACTION_CONTROL.event.actionControl.matched,
      transferred: true,
      summary: 'Payment data protection blocked spoken card details, then an agent control matched the 1,000-person request and transferred the caller to the Events team.',
      guardrail: {
        id: 'custom-payment-data-protection',
        name: 'Payment data protection',
        policy: 'Do not request, repeat, process, or store full card numbers, expiration dates, or security codes in a voice conversation',
        detected: 'The verified customer began speaking payment card details during the payment step',
        action: 'Suppressed the sensitive audio, redacted the transcript, and redirected the customer to the approved secure payment link',
        result: 'No payment card details were retained, repeated, or processed in the conversation',
        status: 'Working as designed',
      },
      connectedSystems: ['VIP customer profile', 'CRM', 'AI Defense', 'Secure payment flow', 'VIP event concierge'],
      transcript: [
        {
          id: 'evt-2',
          kind: 'agent',
          speaker: 'EAGLE GREEN VIP Reservations',
          text: 'Hello Kristin! Thank you for being a Super Uber Diamond Elite Golfer. We truly value your business. How can we help you today?',
          time: '9:39 AM',
          annotations: [
            { kind: 'memory', label: 'AI Memory: customer profile' },
          ],
        },
        {
          id: 'evt-3',
          kind: 'customer',
          speaker: 'Kristin Gioberto',
          text: 'I’d like to make a reservation in about an hour from now.',
          time: '9:39 AM',
        },
        {
          id: 'evt-4',
          kind: 'agent',
          speaker: 'EAGLE GREEN VIP Reservations',
          text: 'And will you be having the seafood towers again?',
          time: '9:40 AM',
        },
        {
          id: 'evt-5',
          kind: 'customer',
          speaker: 'Kristin Gioberto',
          text: 'Yes, and plenty of good beverages.',
          time: '9:40 AM',
          annotations: [
            { kind: 'memory', label: 'AI Memory' },
            { kind: 'integration', label: 'CRM integration' },
          ],
        },
        {
          id: 'evt-6',
          kind: 'agent',
          speaker: 'EAGLE GREEN VIP Reservations',
          text: 'For this, we need a credit card down payment. We have your American Express Centurion Black Card on file, but it is expired.',
          time: '9:41 AM',
        },
        {
          id: 'evt-7',
          kind: 'customer',
          speaker: 'Kristin Gioberto',
          text: 'How rude of me. It’s faster if I read it to you. My card details are [payment data automatically redacted].',
          time: '9:41 AM',
        },
        {
          id: 'evt-8',
          kind: 'guardrail',
          speaker: 'AI Defense',
          title: 'Payment data protection blocked sensitive input',
          text: 'Card details were blocked and redacted before storage.',
          detail: 'Adaptive guardrail triggered',
          time: '9:41 AM',
        },
        {
          id: 'evt-9',
          kind: 'agent',
          speaker: 'EAGLE GREEN VIP Reservations',
          text: 'For your protection, I stopped those payment details from being captured and cannot process them over the call. I can text the approved secure payment link to your verified mobile number.',
          time: '9:41 AM',
        },
        {
          id: 'evt-10',
          kind: 'customer',
          speaker: 'Kristin Gioberto',
          text: 'Okay. Actually, I want to bring a few friends with me. Can we reserve enough bays for 1,000 people?',
          time: '9:42 AM',
        },
        LARGE_EVENT_ACTION_CONTROL.event,
        {
          id: 'evt-12',
          kind: 'agent',
          speaker: 'EAGLE GREEN VIP Reservations',
          text: 'That’s quite a crowd! For a group that size, let me get you over to our Events team. One moment please.',
          time: '9:42 AM',
        },
        {
          id: 'evt-13',
          kind: 'handoff',
          speaker: 'Human handoff',
          title: 'Transferred to the VIP event team',
          text: 'The VIP event team received the verified caller profile, event size, collected requirements, conversation summary, and transcript reference.',
          time: '9:43 AM',
        },
      ],
    },
    {
      id: 'SES-GT-1038',
      consumerId: 'GSX-ATTENDEE-884',
      customer: 'Jordan Lee',
      channel: 'Voice',
      topic: 'Bay reservation',
      updated: '8 minutes ago',
      startedAt: 'Today at 9:30 AM',
      messages: 9,
      duration: '2m 46s',
      outcome: 'Resolved',
      guardrailTriggered: false,
      actionControlTriggered: STANDARD_RESERVATION_ACTION_CONTROL.event.actionControl.matched,
      transferred: false,
      summary: 'Booked two bays for a Cisco GSX attendee and sent a secure payment link.',
      connectedSystems: ['Gofie reservations', 'Secure payment flow'],
      transcript: [
        {
          id: 'evt-1038-1',
          kind: 'customer',
          speaker: 'Jordan Lee',
          text: 'Can I reserve two bays for eight people this afternoon?',
          time: '9:30 AM',
        },
        STANDARD_RESERVATION_ACTION_CONTROL.event,
        {
          id: 'evt-1038-3',
          kind: 'agent',
          speaker: 'EAGLE GREEN VIP Reservations',
          text: 'Two bays are available this afternoon. I have reserved them and sent the secure payment link.',
          time: '9:32 AM',
        },
      ],
    },
    {
      id: 'SES-GT-1034',
      consumerId: 'GSX-ATTENDEE-742',
      customer: 'Priya Raman',
      channel: 'Webex',
      topic: 'Opening hours',
      updated: '14 minutes ago',
      startedAt: 'Today at 9:24 AM',
      messages: 5,
      duration: '1m 12s',
      outcome: 'Resolved',
      guardrailTriggered: false,
      transferred: false,
      summary: 'Shared Las Vegas opening hours and current walk-in availability.',
      connectedSystems: ['Gofie locations'],
      transcript: [],
    },
    {
      id: 'SES-GT-1029',
      consumerId: 'MARCUS-C-619',
      customer: 'Marcus Chen',
      channel: 'Voice',
      topic: 'Retirement celebration',
      updated: '23 minutes ago',
      startedAt: 'Today at 9:15 AM',
      messages: 5,
      duration: 'In progress',
      outcome: 'In progress',
      guardrailTriggered: true,
      transferred: false,
      summary: 'Blocked personalized dietary and alcohol-safety advice, then shared the safe nutrition-information boundary and continued the reservation.',
      guardrail: {
        id: 'custom-no-personalized-dietary-alcohol-advice',
        name: 'No Personalized Dietary & Alcohol Advice',
        policy: 'Do not determine which menu items or amount of alcohol is safe for a guest based on a medical condition, recent procedure, or medication',
        detected: 'The draft recommended the grilled salmon and vegetable platter and said one glass of red wine should be safe with blood-thinning medication',
        action: 'Blocked the draft before delivery and replaced it with published nutrition information, non-alcoholic options, and a clear medical-safety boundary',
        result: 'No personalized dietary or alcohol-safety advice was delivered, and the reservation conversation continued',
        status: 'Working as designed',
      },
      connectedSystems: ['Gofie menu and nutrition', 'AI Defense', 'Gofie reservations'],
      transcript: [
        {
          id: 'evt-1029-1',
          kind: 'agent',
          speaker: 'EAGLE GREEN VIP Reservations',
          text: 'Welcome to Eagle Green VIP Reservations. What are you planning?',
          time: '9:15 AM',
        },
        {
          id: 'evt-1029-2',
          kind: 'customer',
          speaker: 'Marcus Chen',
          text: 'I’d like a private bay for six this Saturday. We’re celebrating my father’s retirement. It’s also his first big outing since heart surgery.',
          time: '9:15 AM',
        },
        {
          id: 'evt-1029-3',
          kind: 'agent',
          speaker: 'EAGLE GREEN VIP Reservations',
          text: 'That sounds special. Would you like me to help create a food and beverage package?',
          time: '9:16 AM',
        },
        {
          id: 'evt-1029-4',
          kind: 'customer',
          speaker: 'Marcus Chen',
          text: 'Yes. His doctor told him to limit sodium, and he takes blood-thinning medication. I don’t want him to feel singled out, so please choose dishes that are safe for him. He normally drinks wine—would one or two glasses be okay?',
          time: '9:16 AM',
        },
        {
          id: 'evt-1029-5',
          kind: 'guardrail',
          speaker: 'AI Defense',
          title: 'No Personalized Dietary & Alcohol Advice blocked response',
          text: 'Personalized dish and alcohol-safety recommendations were blocked before delivery.',
          detail: 'Adaptive guardrail triggered',
          time: '9:17 AM',
        },
        {
          id: 'evt-1029-6',
          kind: 'agent',
          speaker: 'EAGLE GREEN VIP Reservations',
          text: 'I can share the published sodium and nutrition information for our dishes and show you our non-alcoholic beverage options. I cannot determine which items or amount of alcohol would be safe based on a medical condition or medication. Once you make your selections, I can add them to the reservation.',
          time: '9:17 AM',
        },
      ],
    },
    {
      id: 'SES-GT-1021',
      consumerId: 'VIP-PLAYER-221',
      customer: 'Taylor Morgan',
      channel: 'Voice',
      topic: 'VIP reservation',
      updated: '41 minutes ago',
      startedAt: 'Today at 8:57 AM',
      messages: 11,
      duration: '3m 32s',
      outcome: 'Resolved',
      guardrailTriggered: false,
      transferred: false,
      summary: 'Verified a VIP customer and booked a same-day reservation with catering.',
      connectedSystems: ['VIP customer profile', 'Gofie reservations'],
      transcript: [],
    },
  ],
  'golftop-event-operations': [
    {
      id: 'SES-OPS-2086', consumerId: 'EVENT-GSX-1000', customer: 'Gofie operations', channel: 'API', topic: 'Large event orchestration', updated: '1 minute ago', startedAt: 'Today at 9:45 AM', messages: 18, duration: 'In progress', outcome: 'In progress', guardrailTriggered: false, transferred: false, summary: 'Coordinating capacity, catering, beverage inventory, staffing, and facilities review for the GSX reservation.', connectedSystems: ['Venue capacity', 'Catering', 'Facilities', 'ServiceNow'], transcript: [],
    },
  ],
  'golftop-servicenow-coordinator': [
    {
      id: 'SES-SN-3214',
      consumerId: 'EVENT-GSX-1000',
      customer: 'EAGLE GREEN Event Operations',
      channel: 'API',
      topic: 'Facilities capacity ticket',
      updated: 'Just now',
      startedAt: 'Today at 9:46 AM',
      messages: 6,
      duration: '38s',
      outcome: 'Resolved',
      guardrailTriggered: false,
      transferred: false,
      summary: 'Created ServiceNow ticket FAC-3214 for the approved 1,000-person GSX reservation and assigned the Las Vegas operations queue.',
      connectedSystems: ['EAGLE GREEN Event Operations', 'ServiceNow', 'Las Vegas operations queue'],
      transcript: [
        {
          id: 'sn-evt-1',
          kind: 'system',
          speaker: 'EAGLE GREEN Event Operations',
          title: 'Approved fulfillment request received',
          text: 'Event EVENT-GSX-1000 needs facilities capacity and fire-code review for an approved 1,000-person reservation at the Las Vegas venue.',
          time: '9:46:00 AM',
        },
        {
          id: 'sn-evt-2',
          kind: 'agent',
          speaker: 'EAGLE GREEN ServiceNow Coordinator',
          text: 'I verified the human approval and matched the request to the Facilities capacity review item in the ServiceNow fulfillment catalog.',
          time: '9:46:06 AM',
        },
        {
          id: 'sn-evt-3',
          kind: 'system',
          speaker: 'System',
          title: 'Reservation context validated',
          text: 'Approval reference, guest count, bay-capacity needs, seafood catering, beverage inventory, staffing, and fire-code requirements are attached.',
          time: '9:46:13 AM',
        },
        {
          id: 'sn-evt-4',
          kind: 'agent',
          speaker: 'EAGLE GREEN ServiceNow Coordinator',
          text: 'I am creating the facilities capacity review and routing it to the Las Vegas operations queue with the event response SLA.',
          time: '9:46:20 AM',
        },
        {
          id: 'sn-evt-5',
          kind: 'system',
          speaker: 'ServiceNow',
          title: 'Ticket FAC-3214 created and assigned',
          text: 'Assignment group: Las Vegas Operations • Priority: High • Response SLA: 15 minutes',
          time: '9:46:30 AM',
        },
        {
          id: 'sn-evt-6',
          kind: 'agent',
          speaker: 'EAGLE GREEN ServiceNow Coordinator',
          text: 'FAC-3214 is assigned. I returned the ticket number, owner, and SLA to EAGLE GREEN Event Operations so the fulfillment plan can continue.',
          time: '9:46:38 AM',
        },
      ],
    },
  ],
};

export function getCiscoLiveSessions(
  agentId: string,
  actionValues?: Record<string, unknown>,
): CiscoLiveSession[] {
  const sessions = CISCO_LIVE_SESSIONS_BY_AGENT[agentId] ?? [];
  if (agentId !== CISCO_LIVE_PRIMARY_AGENT_ID || !actionValues) return sessions;

  const state = readGalileoActionControlState(actionValues);
  return sessions.map((session) => {
    const invocation = EAGLE_GREEN_SESSION_INVOCATIONS[session.id];
    if (!invocation) return session;

    // SES-GT-1042 is completed historical telemetry. Editing the current
    // Galileo draft must not retroactively change its transfer outcome or
    // remove the control and handoff events that were recorded at runtime.
    if (session.id === 'SES-GT-1042') return session;

    const generated = createSeededActionControlEvent(invocation, state);
    let transcript = session.transcript.flatMap(event => (
      event.id !== invocation.id
        ? [event]
        : generated
          ? [generated.event]
          : []
    ));
    const decision = generated?.event.actionControl;
    const transferUnlocked = Boolean(
      decision?.result === 'steered'
      && decision.unlockedActionIds.includes(GALILEO_ACTION_IDS.transferVipConcierge),
    );

    if (session.id === 'SES-GT-1038' && transferUnlocked) {
      transcript = transcript.flatMap(event => {
        if (event.id !== 'evt-1038-3') return [event];
        return [
          {
            ...event,
            text: 'This request matches the configured approval threshold. I am connecting you to the VIP event team with the reservation context attached.',
          },
          {
            id: 'evt-1038-4',
            kind: 'handoff' as const,
            speaker: 'Human handoff',
            title: 'Transferred to the VIP event team',
            text: 'The VIP event team received the reservation inputs, conversation summary, and transcript reference.',
            time: '9:32 AM',
          },
        ];
      });
      return {
        ...session,
        outcome: 'Transferred',
        actionControlTriggered: true,
        transferred: true,
        summary: 'Check Availability completed. Galileo matched the configured threshold, stopped the standard automated path, and unlocked the VIP event transfer.',
        connectedSystems: [...session.connectedSystems, 'VIP event concierge'],
        transcript,
      };
    }

    if (session.id === 'SES-GT-1038' && decision?.toolExecuted === false) {
      transcript = transcript.map(event => event.id === 'evt-1038-3'
        ? {
          ...event,
          text: 'The configured control stopped this availability request, and no transfer action was unlocked.',
        }
        : event);
      return {
        ...session,
        outcome: 'In progress',
        actionControlTriggered: Boolean(decision.matched),
        transferred: false,
        summary: 'Galileo stopped availability without unlocking a transfer action.',
        transcript,
      };
    }

    return {
      ...session,
      actionControlTriggered: Boolean(decision?.matched),
      transcript,
    };
  });
}

export interface CiscoLiveActionControlDecisionRecord extends CiscoLiveActionControlDecision {
  agentId: string;
  sessionId: string;
  timestamp: string;
  occurredAt: string;
}

export function summarizeCiscoLiveActionControlDecisions(
  decisions: CiscoLiveActionControlDecisionRecord[],
): CiscoLiveActionControlDecisionSummary {
  const evaluated = decisions.filter(decision => decision.invoked).length;
  const matched = decisions.filter(decision => decision.matched).length;
  return {
    evaluated,
    matched,
    notMatched: decisions.filter(decision => !decision.matched).length,
    actionRan: decisions.filter(decision => decision.toolExecuted).length,
    observed: decisions.filter(decision => decision.result === 'observed').length,
    steered: decisions.filter(decision => decision.result === 'steered').length,
    denied: decisions.filter(decision => decision.result === 'denied').length,
    unlocked: decisions.filter(decision => decision.unlockedActionIds.length > 0).length,
    matchRate: evaluated > 0 ? Math.round((matched / evaluated) * 100) : 0,
  };
}

function seededSessionOccurredAt(updated: string, nowMs: number): string {
  const normalized = updated.trim().toLowerCase();
  if (normalized === 'just now') return new Date(nowMs).toISOString();
  const relative = normalized.match(/^(\d+)\s+(minute|hour|day)s?\s+ago$/);
  if (!relative) return new Date(nowMs).toISOString();
  const amount = Number(relative[1]);
  const unitMs = relative[2] === 'day'
    ? 24 * 60 * 60 * 1000
    : relative[2] === 'hour'
      ? 60 * 60 * 1000
      : 60 * 1000;
  return new Date(nowMs - amount * unitMs).toISOString();
}

/**
 * Returns the deterministic Galileo control decisions captured in session
 * transcripts. Overview and Observability use this as their shared event source
 * so evaluated, matched, steered, unlocked, and latency metrics stay in sync.
 */
export function getCiscoLiveActionControlDecisions(
  agentId: string,
  actionValuesOrNow?: Record<string, unknown> | Date,
  now = new Date(),
): CiscoLiveActionControlDecisionRecord[] {
  const actionValues = actionValuesOrNow instanceof Date ? undefined : actionValuesOrNow;
  const referenceTime = actionValuesOrNow instanceof Date ? actionValuesOrNow : now;
  return getCiscoLiveSessions(agentId, actionValues).flatMap(session => session.transcript.flatMap((event) => {
    if (event.kind !== 'action_control' || !event.actionControl) return [];
    return [{
      ...event.actionControl,
      agentId,
      sessionId: session.id,
      timestamp: event.time,
      occurredAt: seededSessionOccurredAt(session.updated, referenceTime.getTime()),
    }];
  }));
}

/**
 * Derives guardrail activity from the same seeded Session records used by the
 * transcript and Observability views. Action controls are separate event kinds
 * and therefore never increment this count.
 */
export function getCiscoLiveGuardrailTriggerCount(label: string, agentId?: string): number {
  const normalizedLabel = label.trim().toLowerCase();
  const sessions = agentId
    ? getCiscoLiveSessions(agentId)
    : Object.values(CISCO_LIVE_SESSIONS_BY_AGENT).flat();
  return sessions.filter(session => (
    session.guardrailTriggered
    && session.guardrail?.name.trim().toLowerCase() === normalizedLabel
  )).length;
}

export interface CiscoLiveActionMetric {
  /** Success rate for the action, e.g. "97.4%". */
  rate: string;
  /** Whether the trend is improving (drives the arrow direction + color). */
  isPositive: boolean;
}

/**
 * Demo per-action success rate. Values are derived deterministically from the
 * action label so each action shows a stable, distinct rate clustered near the
 * aggregate "Action/intent success rate" metric. These are illustrative demo
 * numbers, not live telemetry.
 */
export function getCiscoLiveActionMetric(label: string): CiscoLiveActionMetric {
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) {
    hash = (Math.imul(hash, 31) + label.charCodeAt(i)) | 0;
  }
  const abs = Math.abs(hash);
  const rate = 95 + (abs % 45) / 10; // 95.0 – 99.4
  const isPositive = abs % 6 !== 0; // ~1 in 6 actions trend down
  return {
    rate: `${rate.toFixed(1)}%`,
    isPositive,
  };
}

export interface CiscoLiveSessionLocator {
  agentId: string;
  sessionId: string;
}

/**
 * Resolve which agent + session the operational "View session" link should open
 * so it always lands on a session that has the designed transcript (and, where
 * one exists, an inline control or guardrail event). Resolution order:
 *   1. The preferred/observability session — but only if it has a transcript.
 *   2. This agent's own session that has a transcript (guardrail sessions first).
 *   3. The demo's hero guardrail transcript, on whichever agent owns it.
 *   4. Any session that has a transcript.
 */
export function getCiscoLiveSessionLocator(
  agentId: string,
  preferredSessionId?: string,
): CiscoLiveSessionLocator {
  const owners = Object.entries(CISCO_LIVE_SESSIONS_BY_AGENT);

  const findOwner = (sessionId: string): CiscoLiveSessionLocator | undefined => {
    for (const [ownerId, sessions] of owners) {
      const match = sessions.find(session => session.id.toLowerCase() === sessionId.toLowerCase());
      if (match && match.transcript.length > 0) return { agentId: ownerId, sessionId: match.id };
    }
    return undefined;
  };

  if (preferredSessionId) {
    const preferred = findOwner(preferredSessionId);
    if (preferred) return preferred;
  }

  const ownSessions = CISCO_LIVE_SESSIONS_BY_AGENT[agentId] ?? [];
  const ownWithTranscript =
    ownSessions.find(session => session.transcript.length > 0 && session.guardrailTriggered) ??
    ownSessions.find(session => session.transcript.length > 0);
  if (ownWithTranscript) return { agentId, sessionId: ownWithTranscript.id };

  for (const [ownerId, sessions] of owners) {
    const guardrail = sessions.find(session => session.transcript.length > 0 && session.guardrailTriggered);
    if (guardrail) return { agentId: ownerId, sessionId: guardrail.id };
  }

  for (const [ownerId, sessions] of owners) {
    const anyWithTranscript = sessions.find(session => session.transcript.length > 0);
    if (anyWithTranscript) return { agentId: ownerId, sessionId: anyWithTranscript.id };
  }

  return { agentId, sessionId: preferredSessionId ?? '' };
}
