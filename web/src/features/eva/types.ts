export type EvaTemplateId =
  | 'customer-support'
  | 'knowledge-assistant'
  | 'workflow-automation'
  | 'policy-compliance'
  | 'sales-enablement'
  | 'custom';

export type EvaGuidedStepId = 'profile' | 'knowledge' | 'actions' | 'security';

export interface EvaTemplate {
  id: EvaTemplateId;
  name: string;
  summary: string;
  description: string;
  recommendedFor: string[];
  draft: EvaAgentDraft;
}

export interface EvaAgentDraft {
  name: string;
  description: string;
  goals: string[];
  knowledgeBases: string[];
  actions: string[];
  security: string[];
  language: string;
  voiceName: string;
}

export type EvaOperation =
  | { type: 'selectTemplate'; templateId: EvaTemplateId }
  | { type: 'createAgentFromDraft'; draft: EvaAgentDraft }
  | { type: 'setActiveSection'; section: 'Profile' | 'Knowledge' | 'Action' | 'Security' | 'Language' | 'Instructions' }
  | { type: 'openCanvas' };

export interface EvaMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: string;
  followups?: string[];
}

export interface EvaCanvasNode {
  id: string;
  type: 'agent' | 'knowledge' | 'language' | 'mcp' | 'decision' | 'voice' | 'exit' | 'metrics';
  title: string;
  description: string;
  x: number;
  y: number;
}

export interface EvaCanvasConnection {
  id: string;
  from: string;
  to: string;
  fromSide: 'left' | 'right' | 'top' | 'bottom';
  toSide: 'left' | 'right' | 'top' | 'bottom';
  label?: string;
}
