import type { EvaCanvasConnection, EvaCanvasNode } from '../types';
import type { IconName } from '../../../icons/types';

export const EVA_CANVAS_NODE_WIDTH = 256;
export const EVA_CANVAS_NODE_HEIGHT = 300;
export const EVA_CANVAS_COMPACT_SIZE = 60;
export const EVA_CANVAS_GRID = 20;

export const EVA_CANVAS_NODE_TYPES: Array<{
  type: EvaCanvasNode['type'];
  label: string;
}> = [
  { type: 'agent', label: 'Secondary agent' },
  { type: 'knowledge', label: 'Knowledge base' },
  { type: 'language', label: 'Language' },
  { type: 'mcp', label: 'Action' },
  { type: 'decision', label: 'Delegate' },
  { type: 'voice', label: 'Voice' },
  { type: 'exit', label: 'Exit' },
  { type: 'metrics', label: 'Metrics' },
];

export const EVA_CANVAS_NODE_META: Record<EvaCanvasNode['type'], {
  label: string;
  icon: IconName;
  badge: 'info' | 'success' | 'warning' | 'default';
  fields: Array<{ id: string; label: string; value: string }>;
}> = {
  agent: {
    label: 'Agent',
    icon: 'bot',
    badge: 'info',
    fields: [
      { id: 'welcome', label: 'Welcome message', value: 'Hi, I am here to help with this request.' },
      { id: 'overview', label: 'Background and context', value: 'Owns the conversation and coordinates specialists.' },
      { id: 'tasks', label: 'Instructions', value: 'Classify intent, gather context, answer, or delegate.' },
      { id: 'guardrails', label: 'Security', value: 'Stay grounded in approved sources and escalate risky requests.' },
    ],
  },
  knowledge: {
    label: 'Knowledge',
    icon: 'document',
    badge: 'success',
    fields: [
      { id: 'sources', label: 'Sources', value: 'FAQ, product docs, policies, and runbooks.' },
      { id: 'retrieval', label: 'Retrieval behavior', value: 'Return cited answers and show uncertainty.' },
    ],
  },
  language: {
    label: 'Language',
    icon: 'language',
    badge: 'default',
    fields: [
      { id: 'locale', label: 'Locale', value: 'English (US), Spanish, French.' },
      { id: 'tone', label: 'Tone adaptation', value: 'Maintain professional tone across locales.' },
    ],
  },
  mcp: {
    label: 'Action',
    icon: 'workflow-deployments',
    badge: 'warning',
    fields: [
      { id: 'provider', label: 'Provider', value: 'Ticketing, CRM, approvals, and notification tools.' },
      { id: 'confirmation', label: 'Confirmation', value: 'Require user confirmation before state-changing actions.' },
    ],
  },
  decision: {
    label: 'Delegate',
    icon: 'blind-transfer',
    badge: 'info',
    fields: [
      { id: 'conditions', label: 'Conditions', value: 'Route billing, technical, or compliance requests to specialists.' },
      { id: 'handoff', label: 'Handoff behavior', value: 'Summarize context before transfer.' },
    ],
  },
  voice: {
    label: 'Voice',
    icon: 'call-voicemail',
    badge: 'default',
    fields: [
      { id: 'voiceName', label: 'Voice name', value: 'Warm professional' },
      { id: 'dtmf', label: 'DTMF handling', value: 'Collect account or case numbers only when needed.' },
    ],
  },
  exit: {
    label: 'Exit',
    icon: 'sign-out',
    badge: 'default',
    fields: [
      { id: 'summary', label: 'Summary', value: 'Share conversation summary and next steps.' },
      { id: 'survey', label: 'Wrap up', value: 'Ask whether the user needs anything else.' },
    ],
  },
  metrics: {
    label: 'Metrics',
    icon: 'area-chart',
    badge: 'success',
    fields: [
      { id: 'success', label: 'Success signal', value: 'Resolution rate, escalation rate, and answer confidence.' },
      { id: 'quality', label: 'Quality signal', value: 'Grounding quality and policy compliance.' },
    ],
  },
};

export const initialEvaCanvasNodes: EvaCanvasNode[] = [
  {
    id: 'agent-1',
    type: 'agent',
    title: 'AI Agent',
    description: 'Lead agent',
    x: 420,
    y: 220,
  },
  {
    id: 'knowledge-1',
    type: 'knowledge',
    title: 'Knowledge Base',
    description: 'Approved content and retrieval grounding',
    x: 80,
    y: 80,
  },
  {
    id: 'mcp-1',
    type: 'mcp',
    title: 'Action',
    description: 'Ticket and workflow execution',
    x: 80,
    y: 440,
  },
  {
    id: 'voice-1',
    type: 'voice',
    title: 'Voice',
    description: 'Spoken experience and DTMF handling',
    x: 780,
    y: 120,
  },
  {
    id: 'decision-1',
    type: 'decision',
    title: 'Delegate',
    description: 'Route complex work to a specialist agent',
    x: 780,
    y: 420,
  },
  {
    id: 'metrics-1',
    type: 'metrics',
    title: 'Metrics',
    description: 'Quality, safety, and resolution signals',
    x: 1120,
    y: 260,
  },
];

export const initialEvaCanvasConnections: EvaCanvasConnection[] = [
  { id: 'conn-kb-agent', from: 'knowledge-1', to: 'agent-1', fromSide: 'right', toSide: 'left', label: 'grounds' },
  { id: 'conn-action-agent', from: 'mcp-1', to: 'agent-1', fromSide: 'right', toSide: 'left', label: 'executes' },
  { id: 'conn-agent-voice', from: 'agent-1', to: 'voice-1', fromSide: 'right', toSide: 'left', label: 'speaks' },
  { id: 'conn-agent-decision', from: 'agent-1', to: 'decision-1', fromSide: 'right', toSide: 'left', label: 'delegates' },
  { id: 'conn-decision-metrics', from: 'decision-1', to: 'metrics-1', fromSide: 'right', toSide: 'left', label: 'measures' },
];

export function snapToEvaCanvasGrid(value: number) {
  return Math.round(value / EVA_CANVAS_GRID) * EVA_CANVAS_GRID;
}

// Which target node types each source type can connect to. The map is kept
// symmetric so that compatibility doesn't depend on which end the user grabs
// first while dragging. The `agent` node is the orchestration hub and can talk
// to anything; capability nodes (knowledge, language, mcp, voice, exit) only
// attach to an agent; `decision` (delegate) bridges agent ↔ metrics so that
// routing decisions stay measurable.
export const EVA_CANVAS_CONNECTION_RULES: Record<EvaCanvasNode['type'], Array<EvaCanvasNode['type']>> = {
  agent: ['agent', 'knowledge', 'language', 'mcp', 'decision', 'voice', 'exit', 'metrics'],
  knowledge: ['agent'],
  language: ['agent'],
  mcp: ['agent'],
  voice: ['agent'],
  exit: ['agent'],
  decision: ['agent', 'metrics'],
  metrics: ['agent', 'decision'],
};

export function isEvaConnectionCompatible(
  sourceType: EvaCanvasNode['type'],
  targetType: EvaCanvasNode['type'],
): boolean {
  return EVA_CANVAS_CONNECTION_RULES[sourceType]?.includes(targetType) ?? false;
}

/* Demo canvas that the "Load example" button drops onto a fresh tab. The
   layout illustrates the prompt copy: a lead agent fronts a delegate
   ("Triage") that routes between two specialist agents (Medical Qs and
   Insurance Qs). Each specialist is grounded by its own knowledge base
   and backed by its own action node so it can execute domain workflows.
   The two specialist stacks are arranged vertically (medical on top,
   insurance below) so each action node can plug into the agent's bottom
   without the connection line cutting across the knowledge node sitting
   to its right. Lead/Triage are vertically centered between the two
   specialist stacks. */
export const EVA_CANVAS_TRIAGE_EXAMPLE_NODES: EvaCanvasNode[] = [
  {
    id: 'example-agent-lead',
    type: 'agent',
    title: 'Lead agent',
    description: 'Greets the user and hands off to the right specialist via the Triage delegate.',
    x: 80,
    y: 590,
  },
  {
    id: 'example-decision-triage',
    type: 'decision',
    title: 'Triage',
    description: 'Routes medical questions to Medical Qs and insurance questions to Insurance Qs.',
    x: 460,
    y: 590,
  },
  {
    id: 'example-agent-medical',
    type: 'agent',
    title: 'Medical Qs',
    description: 'Specialist for medical and clinical questions. Shares persona with Insurance Qs.',
    x: 820,
    y: 80,
  },
  {
    id: 'example-knowledge-medical',
    type: 'knowledge',
    title: 'Medical knowledge',
    description: 'Clinical guidelines, condition library, and triage protocols.',
    x: 1180,
    y: 80,
  },
  {
    id: 'example-mcp-medical',
    type: 'mcp',
    title: 'Medical actions',
    description: 'Schedule appointments, refill prescriptions, and trigger clinical workflows.',
    x: 1180,
    y: 420,
  },
  {
    id: 'example-agent-insurance',
    type: 'agent',
    title: 'Insurance Qs',
    description: 'Specialist for insurance, claims, and coverage questions. Shares persona with Medical Qs.',
    x: 820,
    y: 760,
  },
  {
    id: 'example-knowledge-insurance',
    type: 'knowledge',
    title: 'Insurance FAQs',
    description: 'Plan documents, claim flows, and coverage policies.',
    x: 1180,
    y: 760,
  },
  {
    id: 'example-mcp-insurance',
    type: 'mcp',
    title: 'Insurance actions',
    description: 'File claims, look up coverage, and dispatch policy updates.',
    x: 1180,
    y: 1100,
  },
];

export const EVA_CANVAS_TRIAGE_EXAMPLE_CONNECTIONS: EvaCanvasConnection[] = [
  {
    id: 'example-conn-lead-triage',
    from: 'example-agent-lead',
    to: 'example-decision-triage',
    fromSide: 'right',
    toSide: 'left',
    label: 'delegates',
  },
  {
    id: 'example-conn-triage-medical',
    from: 'example-decision-triage',
    to: 'example-agent-medical',
    fromSide: 'right',
    toSide: 'left',
    label: 'medical',
  },
  {
    id: 'example-conn-triage-insurance',
    from: 'example-decision-triage',
    to: 'example-agent-insurance',
    fromSide: 'right',
    toSide: 'left',
    label: 'insurance',
  },
  {
    id: 'example-conn-medical-kb',
    from: 'example-knowledge-medical',
    to: 'example-agent-medical',
    fromSide: 'left',
    toSide: 'right',
    label: 'grounds',
  },
  {
    id: 'example-conn-medical-action',
    from: 'example-mcp-medical',
    to: 'example-agent-medical',
    fromSide: 'top',
    toSide: 'bottom',
    label: 'executes',
  },
  {
    id: 'example-conn-insurance-kb',
    from: 'example-knowledge-insurance',
    to: 'example-agent-insurance',
    fromSide: 'left',
    toSide: 'right',
    label: 'grounds',
  },
  {
    id: 'example-conn-insurance-action',
    from: 'example-mcp-insurance',
    to: 'example-agent-insurance',
    fromSide: 'top',
    toSide: 'bottom',
    label: 'executes',
  },
];

export const EVA_CANVAS_TRIAGE_EXAMPLE_PROMPT =
  'Add two agents, one to handle medical queries and one to handle insurance questions. Use the same persona so it\u2019s seamless. Give each agent a knowledge base and respective actions to execute.';
