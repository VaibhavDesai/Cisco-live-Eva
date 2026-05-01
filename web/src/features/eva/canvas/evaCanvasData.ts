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
