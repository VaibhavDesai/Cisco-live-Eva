export type UpdateStatus = 'upToDate' | 'updateAvailable' | 'incompatible';
export type RiskLevel = 'low' | 'medium' | 'breaking';

export type CapabilityRecord = {
  id: number;
  sourceActionId?: number | string;
  name: string;
  type: 'MCP' | 'Action' | 'Handoff';
  enabled: boolean;
  description?: string;
  currentVersion?: string;
  latestVersion?: string;
  updateStatus?: UpdateStatus;
  riskLevel?: RiskLevel;
  changeSummary?: string[];
  requiresConnectorReconfiguration?: boolean;
  requiresReconfiguration?: boolean;
  lastCheckedAt?: string;
};

export type VersionMeta = {
  currentVersion: string;
  latestVersion: string;
  updateStatus: UpdateStatus;
  riskLevel: RiskLevel;
  requiresConnectorReconfiguration: boolean;
  changeSummary: string[];
  lastCheckedAt?: string;
};

export const KNOWLEDGE_BASES = [
  { id: 1, name: 'Product Documentation', count: '2,847 articles' },
  { id: 2, name: 'FAQ Database', count: '156 Q&A pairs' },
  { id: 3, name: 'Support Articles', count: '1,234 articles' },
];

export const CAPABILITIES: CapabilityRecord[] = [
  { id: 1, name: 'Customer Data Lookup', type: 'MCP', enabled: true, description: 'Get customer record details from CRM' },
  { id: 2, name: 'Order Status Check', type: 'MCP', enabled: true, description: 'Check live order status by customer/order ID' },
  { id: 3, name: 'Ticket Creation', type: 'Action', enabled: true, description: 'Create a support ticket with collected data' },
  { id: 4, name: 'Transfer to Agent', type: 'Handoff', enabled: true, description: 'Transfer conversation to a live specialist' },
  { id: 5, name: 'Schedule Callback', type: 'Action', enabled: false, description: 'Schedule a callback for follow-up' },
];

export const INTEGRATIONS = [
  {
    id: 'salesforce',
    name: 'Salesforce',
    logo: 'salesforce',
    description: '9 actions available',
    actions: [
      { id: 'sf-1', name: 'Create a lead', description: 'Create a new lead in Salesforce CRM' },
      { id: 'sf-2', name: 'Find record', description: 'Find a record of a specific Salesforce object by up to two fields and values you choose' },
      { id: 'sf-3', name: 'Find child records', description: 'Find child record for a given Parent ID, and returns the child record as line-item' },
      { id: 'sf-4', name: 'Find record(s)', description: 'Find a record of a specific Salesforce object by a field and values you choose' },
      { id: 'sf-5', name: 'Find record(s) by Query', description: 'Find one or more records of a Salesforce object using a Salesforce Object Query where clause' },
      { id: 'sf-6', name: 'Get record attachment', description: 'Get all notes and attachments for a record' },
      { id: 'sf-7', name: 'Add contact to Campaign', description: 'Add an existing contact to an existing campaign' },
      { id: 'sf-8', name: 'Update record', description: 'Update an existing Salesforce record' },
      { id: 'sf-9', name: 'Delete record', description: 'Delete a Salesforce record by ID' },
    ]
  },
  {
    id: 'servicenow',
    name: 'ServiceNow',
    logo: 'servicenow',
    description: '6 actions available',
    actions: [
      { id: 'sn-1', name: 'Create ticket', description: 'Create a new incident ticket' },
      { id: 'sn-2', name: 'Update ticket status', description: 'Update the status of an existing ticket' },
      { id: 'sn-3', name: 'Get ticket details', description: 'Retrieve details of a specific ticket' },
      { id: 'sn-4', name: 'Add comment', description: 'Add a comment to an existing ticket' },
      { id: 'sn-5', name: 'Assign ticket', description: 'Assign a ticket to a specific user or group' },
      { id: 'sn-6', name: 'Close ticket', description: 'Close an existing ticket' },
    ]
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    logo: 'zendesk',
    description: '4 actions available',
    actions: [
      { id: 'zd-1', name: 'Get customer info', description: 'Retrieve customer information' },
      { id: 'zd-2', name: 'Create ticket', description: 'Create a new support ticket' },
      { id: 'zd-3', name: 'Update ticket', description: 'Update an existing ticket' },
      { id: 'zd-4', name: 'Search tickets', description: 'Search for tickets by criteria' },
    ]
  },
];

export const MCP_SERVERS = [
  { id: 'mcp-1', name: 'Insurance verification', source: 'Infinitus', description: 'Verify insurance coverage and benefits', logo: 'infinitus' },
  { id: 'mcp-2', name: 'Payment processing', source: 'Stripe', description: 'Process payments and refunds', logo: 'stripe' },
  { id: 'mcp-3', name: 'Document analysis', source: 'DocAI', description: 'Extract information from documents', logo: 'docai' },
];

export const A2A_AGENTS = [
  { id: 'a2a-1', name: 'Transfer to specialist', source: 'Agent Transfer', description: 'Transfer to a specialist agent', logo: 'a2a' },
  { id: 'a2a-2', name: 'Escalate to supervisor', source: 'Agent Transfer', description: 'Escalate to supervisor', logo: 'a2a' },
  { id: 'a2a-3', name: 'Billing specialist', source: 'Agent Transfer', description: 'Transfer to billing specialist', logo: 'a2a' },
];

export const APP_CONNECTORS = [
  { id: 'connector-1', name: 'Production Salesforce', isDefault: true },
  { id: 'connector-2', name: 'Sandbox Salesforce', isDefault: false },
  { id: 'connector-3', name: 'Development Environment', isDefault: false },
];

export const ACTION_UPDATE_FEATURES = {
  enabled: true,
  showBulkReview: false,
  telemetry: true,
};

export const ACTION_VERSION_REGISTRY_BY_ID: Record<string, Omit<VersionMeta, 'lastCheckedAt'>> = {
  'sf-2': {
    currentVersion: '2.1.0',
    latestVersion: '2.3.0',
    updateStatus: 'updateAvailable',
    riskLevel: 'medium',
    requiresConnectorReconfiguration: false,
    changeSummary: [
      'Added optional "recordType" filter.',
      'Improved matching rules for partial IDs.',
      'Updated response payload includes "matchedFields".',
    ],
  },
  'sf-8': {
    currentVersion: '1.4.2',
    latestVersion: '2.0.0',
    updateStatus: 'incompatible',
    riskLevel: 'breaking',
    requiresConnectorReconfiguration: true,
    changeSummary: [
      'Breaking: field validation now rejects unknown keys.',
      'OAuth scope changed from "read_write" to "records:write".',
      'Payload key "statusText" renamed to "status_label".',
    ],
  },
  'mcp-1': {
    currentVersion: '1.0.3',
    latestVersion: '1.1.0',
    updateStatus: 'updateAvailable',
    riskLevel: 'low',
    requiresConnectorReconfiguration: false,
    changeSummary: [
      'Expanded supported insurance carriers.',
      'Minor response formatting improvements.',
    ],
  },
  '2': {
    currentVersion: '2.1.0',
    latestVersion: '2.3.0',
    updateStatus: 'updateAvailable',
    riskLevel: 'medium',
    requiresConnectorReconfiguration: false,
    changeSummary: [
      'Added optional "recordType" filter.',
      'Improved matching rules for partial IDs.',
      'Updated response payload includes "matchedFields".',
    ],
  },
  '3': {
    currentVersion: '1.4.2',
    latestVersion: '2.0.0',
    updateStatus: 'incompatible',
    riskLevel: 'breaking',
    requiresConnectorReconfiguration: true,
    changeSummary: [
      'Breaking: field validation now rejects unknown keys.',
      'OAuth scope changed from "read_write" to "records:write".',
      'Payload key "statusText" renamed to "status_label".',
    ],
  },
};

export const ACTION_VERSION_REGISTRY_BY_NAME: Record<string, Omit<VersionMeta, 'lastCheckedAt'>> = {
  'Order Status Check': {
    currentVersion: '1.5.1',
    latestVersion: '1.6.0',
    updateStatus: 'updateAvailable',
    riskLevel: 'low',
    requiresConnectorReconfiguration: false,
    changeSummary: [
      'Added support for split shipment statuses.',
      'Improved timeout handling for carrier fallback.',
    ],
  },
  'Customer Data Lookup': {
    currentVersion: '1.0.0',
    latestVersion: '1.0.0',
    updateStatus: 'upToDate',
    riskLevel: 'low',
    requiresConnectorReconfiguration: false,
    changeSummary: [],
  },
};

export const DEFAULT_VERSION_META: VersionMeta = {
  currentVersion: '1.0.0',
  latestVersion: '1.0.0',
  updateStatus: 'upToDate',
  riskLevel: 'low',
  requiresConnectorReconfiguration: false,
  changeSummary: [],
};

export const AVAILABLE_ACTIONS = [
  { id: 1, name: 'Consult with "Symptom Triage" agent', source: 'Infermedica', type: 'MCP', category: 'mcp', logo: 'infermedica', description: 'Route patient queries through triage' },
  { id: 2, name: 'Insurance verification', source: 'Infinitus', type: 'MCP', category: 'mcp', logo: 'infinitus', description: 'Verify insurance coverage and benefits' },
  { id: 3, name: 'Create ticket', source: 'ServiceNow', type: 'MCP', category: 'mcp', logo: 'servicenow', description: 'Create a new incident ticket' },
  { id: 4, name: 'Create case', source: 'Salesforce', type: 'MCP', category: 'mcp', logo: 'salesforce', description: 'Create a new case in Salesforce' },
  { id: 5, name: 'Find record', source: 'Salesforce', type: 'Action', category: 'integration', logo: 'salesforce', description: 'Find a record of a specific Salesforce object' },
  { id: 6, name: 'Update record', source: 'Salesforce', type: 'Action', category: 'integration', logo: 'salesforce', description: 'Update an existing Salesforce record' },
  { id: 7, name: 'Get customer info', source: 'Zendesk', type: 'Integration', category: 'integration', logo: 'zendesk', description: 'Retrieve customer information' },
  { id: 8, name: 'Create a lead', source: 'Salesforce', type: 'Action', category: 'integration', logo: 'salesforce', description: 'Create a new lead in Salesforce CRM' },
  { id: 9, name: 'Update ticket status', source: 'ServiceNow', type: 'MCP', category: 'mcp', logo: 'servicenow', description: 'Update the status of an existing ticket' },
];

export const buildSeededVersionCache = (nowIso: string): Record<string, VersionMeta> => {
  const seedEntries = [
    ...Object.entries(ACTION_VERSION_REGISTRY_BY_ID),
    ...Object.entries(ACTION_VERSION_REGISTRY_BY_NAME),
  ];

  return seedEntries.reduce((acc, [key, value]) => {
    acc[key] = { ...DEFAULT_VERSION_META, ...value, lastCheckedAt: nowIso };
    return acc;
  }, {} as Record<string, VersionMeta>);
};

export const resolveVersionMetaFromCache = (
  cache: Record<string, VersionMeta>,
  actionId: number | string,
  actionName: string,
): VersionMeta => {
  const byId = cache[String(actionId)];
  const byName = cache[actionName];
  return { ...DEFAULT_VERSION_META, ...(byName || {}), ...(byId || {}) };
};
