import type { AgentFamily } from './agentCreationModel';

export type AgentDisplayType =
  | 'AI receptionist'
  | 'CX concierge'
  | 'CX specialist'
  | 'Personal agent';

interface AgentDisplayTypeSource {
  id: string;
  family?: AgentFamily;
  displayType?: AgentDisplayType;
}

export const CX_AGENT_DISPLAY_TYPES: AgentDisplayType[] = [
  'CX concierge',
  'CX specialist',
];

export const getAgentDisplayType = (agent: AgentDisplayTypeSource): AgentDisplayType => {
  if (agent.displayType) return agent.displayType;
  if (agent.id === 'technical-support-concierge') return 'CX specialist';
  if (agent.id === 'golftop-event-operations') return 'AI receptionist';
  if (agent.id === 'golftop-servicenow-coordinator') return 'Personal agent';
  if (agent.id === 'golftop-vip-reservations') return 'CX concierge';
  if (agent.family === 'calling') return 'AI receptionist';
  if (agent.family === 'internal_assistant') return 'Personal agent';
  return 'CX concierge';
};

export const getAgentDisplayTypeClass = (agentType: AgentDisplayType) => (
  `agent-type-badge--${agentType.toLowerCase().replaceAll(' ', '-')}`
);
