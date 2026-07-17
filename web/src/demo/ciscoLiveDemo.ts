export const CISCO_LIVE_PRIMARY_AGENT_ID = 'golftop-vip-reservations';
export const CISCO_LIVE_PRIMARY_AGENT_NAME = 'Gofie VIP Reservations';

export interface CiscoLiveGuardrailDefinition {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  overview: {
    blocked: { text: string }[];
    allowed: { text: string }[];
    edgeCases: { text: string }[];
  };
}

export const CISCO_LIVE_LARGE_RESERVATION_GUARDRAIL: CiscoLiveGuardrailDefinition = {
  id: 'custom-large-reservation-approval',
  name: 'Large reservation approval',
  description: 'Requires human approval before the agent confirms reservations for more than 100 guests or more than 20 bays.',
  createdBy: 'Vinod Muthukrishnan',
  createdAt: 'Jul 13, 2026',
  overview: {
    blocked: [
      { text: 'Automatically confirm a reservation for more than 100 guests' },
      { text: 'Override venue capacity, staffing, or fire-code limits' },
      { text: 'Split a large request into smaller bookings to bypass approval' },
    ],
    allowed: [
      { text: 'Check availability and collect event requirements' },
      { text: 'Prepare a transcript and summary for the event concierge' },
      { text: 'Transfer the verified caller to an authorized approver' },
    ],
    edgeCases: [
      { text: 'VIP requests at or near the approval threshold' },
      { text: 'Existing contracts that include preapproved large events' },
    ],
  },
};

export const CISCO_LIVE_PAYMENT_DATA_GUARDRAIL: CiscoLiveGuardrailDefinition = {
  id: 'custom-payment-data-protection',
  name: 'Payment data protection',
  description: 'Stops the agent from collecting full card details in conversation and sends the caller to the approved secure payment flow.',
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

export const CISCO_LIVE_PRIMARY_GUARDRAILS = [
  CISCO_LIVE_LARGE_RESERVATION_GUARDRAIL,
  CISCO_LIVE_PAYMENT_DATA_GUARDRAIL,
];

export const CISCO_LIVE_EVENT_OPERATIONS_GUARDRAIL: CiscoLiveGuardrailDefinition = {
  id: 'custom-venue-capacity-compliance',
  name: 'Venue capacity and compliance approval',
  description: 'Requires confirmed capacity, staffing, catering, and facilities approval before the agent commits resources for a large event.',
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
  'Check bay availability': 'Check live bay inventory for the requested Gofie location, date, party size, and duration.',
  'Send secure payment link': 'Send the approved PCI-compliant payment link without collecting card data in the conversation.',
  'Transfer to VIP event concierge': 'Transfer the verified caller with the transcript, customer context, and event summary attached.',
  'Check venue capacity': 'Evaluate bay capacity, guest thresholds, and facilities constraints for a proposed large event.',
  'Coordinate staffing': 'Coordinate staffing, catering, beverage, and facilities owners against the approved event plan.',
  'Open fulfillment workstream': 'Create the shared cross-team fulfillment plan after required approvals are recorded.',
  'Create ServiceNow ticket': 'Create a scoped ServiceNow work item with required event context and approval references.',
  'Assign fulfillment team': 'Route approved work to the responsible Gofie fulfillment team and named owner.',
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
    initials: 'GV',
    description: 'Recognizes VIP callers, books visits, sends secure payment links, and transfers large event requests for approval.',
    gradient: 'linear-gradient(135deg, #6c5ce7 0%, #1677c8 100%)',
    status: 'Published',
    statusClass: 'badge-success',
    sessions: '2,814',
    successRate: '96.8%',
    messages: '9,462',
    avgResponse: '1.1s',
    meta: 'VIP reservations and secure human handoff • Last updated 2 hours ago',
    knowledgeBases: ['Gofie locations and availability', 'VIP customer profiles', 'Event booking policy'],
    knowledgeSources: [
      {
        name: 'Gofie locations and availability',
        description: 'Live bay inventory, venue hours, amenities, and reservation availability across Gofie locations.',
        sources: 38,
      },
      {
        name: 'VIP customer profiles',
        description: 'Verified loyalty status, visit preferences, and approved personalization for Gofie VIP guests.',
        sources: 12,
      },
      {
        name: 'Event booking policy',
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
        actions: ['Send secure payment link'],
        collaborator: {
          id: 'gofie-secure-payments',
          name: 'Gofie Secure Payments',
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
        actions: ['Transfer to VIP event concierge'],
        collaborator: {
          id: 'golftop-event-operations',
          agentId: 'golftop-event-operations',
          name: 'Gofie Event Operations',
          initials: 'EO',
          description: 'Coordinates venue, staffing, catering, and facilities work after approval.',
          gradient: 'linear-gradient(135deg, #13a88a 0%, #1677c8 100%)',
        },
      },
    ],
    actions: ['Check bay availability', 'Send secure payment link', 'Transfer to VIP event concierge'],
    goals: [
      'Recognize verified VIP callers and personalize the reservation experience',
      'Check live bay availability and complete eligible reservations',
      'Send secure payment links without collecting card data in conversation',
      'Transfer large event requests with the transcript and summary attached',
    ],
    securityRules: [
      'Verify identity before using a VIP customer profile',
      'Never collect or repeat full payment card details',
      'Require human approval for more than 100 guests or more than 20 bays',
      'Preserve the conversation context during every human handoff',
    ],
    welcomeMessage: 'Welcome to Gofie. I can help with availability, VIP reservations, and secure payment updates. How can I help today?',
    customGuardrails: CISCO_LIVE_PRIMARY_GUARDRAILS,
    prebuiltGuardrailIds: ['std-toxicity', 'std-jailbreak', 'priv-pii', 'priv-credit-card'],
    selectedChannels: ['voice'],
    templateId: 'customer-support',
    agentType: 'Scripted agent',
    tileType: 'scripted',
    updatedOn: '13 Jul 26',
    updatedBy: 'Gino',
  },
  {
    id: 'golftop-event-operations',
    name: 'Gofie Event Operations',
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
    knowledgeBases: ['Las Vegas venue capacity', 'Catering and staffing playbooks', 'Facilities compliance'],
    knowledgeSources: [
      {
        name: 'Las Vegas venue capacity',
        description: 'Bay layouts, guest thresholds, accessibility details, and live capacity for the Las Vegas venue.',
        sources: 17,
      },
      {
        name: 'Catering and staffing playbooks',
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
          name: 'Gofie Staffing & Catering',
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
        actions: ['Check venue capacity', 'Open fulfillment workstream'],
        collaborator: {
          id: 'golftop-servicenow-coordinator',
          agentId: 'golftop-servicenow-coordinator',
          name: 'Gofie ServiceNow Coordinator',
          initials: 'SN',
          description: 'Creates and routes approved facilities work, then tracks ownership and SLA risk.',
          gradient: 'linear-gradient(135deg, #1677c8 0%, #6547d5 100%)',
        },
      },
    ],
    actions: ['Check venue capacity', 'Coordinate staffing', 'Open fulfillment workstream'],
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
    name: 'Gofie ServiceNow Coordinator',
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
    knowledgeBases: ['ServiceNow fulfillment catalog', 'Gofie support teams', 'Event response SLAs'],
    knowledgeSources: [
      {
        name: 'ServiceNow fulfillment catalog',
        description: 'Approved ticket types, required fields, assignment groups, and fulfillment workflows.',
        sources: 54,
      },
      {
        name: 'Gofie support teams',
        description: 'Ownership map for venue operations, facilities, catering, staffing, and event support.',
        sources: 24,
      },
      {
        name: 'Event response SLAs',
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
          name: 'Gofie Event Operations',
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
        actions: ['Assign fulfillment team'],
        collaborator: {
          id: 'gofie-support-routing',
          name: 'Gofie Support Routing',
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
          name: 'Gofie Fulfillment Owner',
          initials: 'FO',
          description: 'Accepts at-risk work, resolves blockers, and owns the fulfillment commitment.',
          gradient: 'linear-gradient(135deg, #e06d89 0%, #8a60d4 100%)',
        },
      },
    ],
    actions: ['Create ServiceNow ticket', 'Assign fulfillment team', 'Track SLA risk'],
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
      { metricId: 'aq-goal-completion-rate', value: '96', unit: '%', change: '+4%', isPositive: true, thresholdStatus: 'good' },
      { metricId: 'ap-fulfilment-success-rate', value: '98.1', unit: '%', change: '+2%', isPositive: true, thresholdStatus: 'good' },
      { metricId: 'ce-transfer-escalation-rate', value: '0.4', unit: '%', change: '-0.1%', isPositive: true, thresholdStatus: 'good' },
      { metricId: 'sec-guardrails-trigger-flag', value: '5.00', unit: '%', change: '+0.03%', isPositive: false, thresholdStatus: 'good' },
    ],
    eventLabel: 'Guardrail working as designed',
    eventTitle: '1,000-person reservation routed to a human',
    eventDescription: 'The large reservation approval guardrail stopped automated booking and transferred Kristin to another agent with the transcript and summary attached.',
    eventMeta: 'Guardrail triggered • 9:42 AM',
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
export type CiscoLiveSessionEventKind = 'customer' | 'agent' | 'system' | 'guardrail' | 'handoff';

export interface CiscoLiveSessionEvent {
  id: string;
  kind: CiscoLiveSessionEventKind;
  speaker: string;
  text: string;
  time: string;
  title?: string;
  detail?: string;
}

export interface CiscoLiveSession {
  id: string;
  consumerId: string;
  customer: string;
  channel: 'Voice' | 'Webex' | 'API';
  topic: string;
  updated: string;
  startedAt: string;
  messages: number;
  duration: string;
  outcome: CiscoLiveSessionOutcome;
  guardrailTriggered: boolean;
  transferred: boolean;
  summary: string;
  guardrail?: {
    name: string;
    policy: string;
    detected: string;
    action: string;
    status: string;
  };
  connectedSystems: string[];
  transcript: CiscoLiveSessionEvent[];
}

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
      messages: 14,
      duration: '4m 18s',
      outcome: 'Transferred',
      guardrailTriggered: true,
      transferred: true,
      summary: 'VIP caller requested enough bays for 1,000 people. The agent stopped automated booking and transferred the request to another agent for approval.',
      guardrail: {
        name: 'Large reservation approval',
        policy: 'Reservations for more than 100 guests or more than 20 bays require human approval',
        detected: 'Requested party size: 1,000 guests',
        action: 'Stopped booking and transferred to VIP event concierge',
        status: 'Working as designed',
      },
      connectedSystems: ['VIP customer profile', 'Gofie reservations', 'Secure payment flow'],
      transcript: [
        {
          id: 'evt-1',
          kind: 'system',
          speaker: 'System',
          text: 'VIP profile matched by phone number. Date-of-birth verification completed.',
          time: '9:38 AM',
        },
        {
          id: 'evt-2',
          kind: 'agent',
          speaker: 'Gofie VIP Reservations',
          text: 'Hello Kristin. Thank you for being a Super Uber Diamond Elite Golfer. How can we help you today?',
          time: '9:39 AM',
        },
        {
          id: 'evt-3',
          kind: 'customer',
          speaker: 'Kristin Gioberto',
          text: 'I want to make a reservation right after this session. And yes, we will have the seafood towers again.',
          time: '9:40 AM',
        },
        {
          id: 'evt-4',
          kind: 'agent',
          speaker: 'Gofie VIP Reservations',
          text: 'I found availability. Your card on file has expired, so I will send a secure link to update it.',
          time: '9:41 AM',
        },
        {
          id: 'evt-5',
          kind: 'customer',
          speaker: 'Kristin Gioberto',
          text: 'Actually, I want to bring a few friends. Can we reserve enough bays for 1,000 people?',
          time: '9:42 AM',
        },
        {
          id: 'evt-6',
          kind: 'guardrail',
          speaker: 'AI Defense',
          title: 'Large reservation approval guardrail triggered',
          text: 'The requested party size exceeds the automated booking limit.',
          detail: 'Booking paused • Human approval required • Transcript and summary prepared',
          time: '9:42 AM',
        },
        {
          id: 'evt-7',
          kind: 'agent',
          speaker: 'Gofie VIP Reservations',
          text: 'A reservation of that size needs approval from our VIP event team. I am connecting you to another agent now. They will already have the details.',
          time: '9:42 AM',
        },
        {
          id: 'evt-8',
          kind: 'handoff',
          speaker: 'Human handoff',
          title: 'Transferred to another agent',
          text: 'Gino received the verified caller profile, full transcript, reservation request, and AI-generated summary.',
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
      transferred: false,
      summary: 'Booked two bays for a Cisco GSX attendee and sent a secure payment link.',
      connectedSystems: ['Gofie reservations', 'Secure payment flow'],
      transcript: [],
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
      connectedSystems: ['Gofie locations and availability'],
      transcript: [],
    },
    {
      id: 'SES-GT-1029',
      consumerId: 'GSX-ATTENDEE-619',
      customer: 'Marcus Chen',
      channel: 'Voice',
      topic: 'Payment update',
      updated: '23 minutes ago',
      startedAt: 'Today at 9:15 AM',
      messages: 7,
      duration: '2m 08s',
      outcome: 'Resolved',
      guardrailTriggered: true,
      transferred: false,
      summary: 'Prevented card data collection in the call and sent a secure payment update link.',
      guardrail: {
        name: 'Payment data protection',
        policy: 'Never collect full payment card details in conversation',
        detected: 'Caller offered a card number by voice',
        action: 'Stopped data collection and sent a secure payment link',
        status: 'Working as designed',
      },
      connectedSystems: ['Secure payment flow'],
      transcript: [],
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
      customer: 'Gofie Event Operations',
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
      connectedSystems: ['Gofie Event Operations', 'ServiceNow', 'Las Vegas operations queue'],
      transcript: [
        {
          id: 'sn-evt-1',
          kind: 'system',
          speaker: 'Gofie Event Operations',
          title: 'Approved fulfillment request received',
          text: 'Event EVENT-GSX-1000 needs facilities capacity and fire-code review for an approved 1,000-person reservation at the Las Vegas venue.',
          time: '9:46:00 AM',
        },
        {
          id: 'sn-evt-2',
          kind: 'agent',
          speaker: 'Gofie ServiceNow Coordinator',
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
          speaker: 'Gofie ServiceNow Coordinator',
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
          speaker: 'Gofie ServiceNow Coordinator',
          text: 'FAC-3214 is assigned. I returned the ticket number, owner, and SLA to Gofie Event Operations so the fulfillment plan can continue.',
          time: '9:46:38 AM',
        },
      ],
    },
  ],
};

export function getCiscoLiveSessions(agentId: string): CiscoLiveSession[] {
  return CISCO_LIVE_SESSIONS_BY_AGENT[agentId] ?? [];
}
