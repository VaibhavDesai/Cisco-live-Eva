import type { EvaGuidedStepId, EvaTemplate } from './types';

export const EVA_GUIDED_STEPS: Array<{
  id: EvaGuidedStepId;
  label: string;
  description: string;
}> = [
  {
    id: 'profile',
    label: 'Basic profile',
    description: 'Define the agent purpose, audience, tone, language, and voice.',
  },
  {
    id: 'knowledge',
    label: 'Available knowledge',
    description: 'Choose the knowledge sources Eva should ground the agent in.',
  },
  {
    id: 'actions',
    label: 'Actions',
    description: 'Pick integrations, fulfillment steps, and escalation paths.',
  },
  {
    id: 'security',
    label: 'Security settings',
    description: 'Apply guardrails, policy checks, and risk controls.',
  },
];

export const EVA_TEMPLATES: EvaTemplate[] = [
  {
    id: 'customer-support',
    name: 'Customer support',
    summary: 'Resolve customer questions with grounded answers and escalation paths.',
    description: 'Best for help centers, contact center deflection, and guided support flows.',
    recommendedFor: ['Support teams', 'FAQ automation', 'Case triage'],
    draft: {
      name: 'Customer Support Eva Agent',
      description: 'Answers customer questions, summarizes context, and escalates complex cases.',
      goals: ['Resolve common requests', 'Ground answers in approved support content', 'Escalate high-risk issues'],
      knowledgeBases: ['FAQ database', 'Support articles', 'Product documentation'],
      actions: ['Create case', 'Update ticket', 'Route to live agent'],
      security: ['PII redaction', 'Escalation for account changes', 'Answer only from approved sources'],
      language: 'English (US)',
      voiceName: 'Warm professional',
    },
  },
  {
    id: 'knowledge-assistant',
    name: 'Knowledge assistant',
    summary: 'Help employees find answers across curated knowledge bases.',
    description: 'Best for internal search, policy lookup, and documentation guidance.',
    recommendedFor: ['Internal helpdesk', 'Policy lookup', 'Documentation search'],
    draft: {
      name: 'Knowledge Assistant Eva Agent',
      description: 'Finds and explains trusted answers from connected enterprise knowledge.',
      goals: ['Search approved sources', 'Summarize with citations', 'Recommend next steps'],
      knowledgeBases: ['Engineering wiki', 'HR policies', 'Product documentation'],
      actions: ['Open source document', 'Collect feedback', 'Create follow-up task'],
      security: ['Respect source permissions', 'Show citation confidence', 'Block unsupported claims'],
      language: 'English (US)',
      voiceName: 'Clear expert',
    },
  },
  {
    id: 'workflow-automation',
    name: 'Workflow automation',
    summary: 'Collect information and run approved actions across business systems.',
    description: 'Best for repeatable operational tasks with clear approval checkpoints.',
    recommendedFor: ['Operations teams', 'Task routing', 'Approvals'],
    draft: {
      name: 'Workflow Automation Eva Agent',
      description: 'Guides users through requests and executes approved workflow actions.',
      goals: ['Collect required fields', 'Validate request completeness', 'Run approved actions'],
      knowledgeBases: ['Process playbooks', 'SOP library'],
      actions: ['Create task', 'Send approval request', 'Notify owner'],
      security: ['Require confirmation before execution', 'Log action summaries', 'Escalate exceptions'],
      language: 'English (US)',
      voiceName: 'Concise operator',
    },
  },
  {
    id: 'policy-compliance',
    name: 'Policy and compliance',
    summary: 'Guide users through governed decisions with policy-aware guardrails.',
    description: 'Best for regulated workflows, policy interpretation, and risk review.',
    recommendedFor: ['Compliance teams', 'Risk review', 'Governed workflows'],
    draft: {
      name: 'Policy Compliance Eva Agent',
      description: 'Helps users understand policy requirements and flags risky requests.',
      goals: ['Explain policy requirements', 'Identify missing evidence', 'Route exceptions'],
      knowledgeBases: ['Compliance policy library', 'Security standards', 'Audit guidance'],
      actions: ['Create review request', 'Notify compliance owner', 'Attach evidence'],
      security: ['Use strict policy grounding', 'Require human approval for exceptions', 'Retain audit trail'],
      language: 'English (US)',
      voiceName: 'Measured advisor',
    },
  },
  {
    id: 'sales-enablement',
    name: 'Sales enablement',
    summary: 'Coach sellers with approved positioning, discovery prompts, and next actions.',
    description: 'Best for account planning, prospect research, and guided follow-up.',
    recommendedFor: ['Sales teams', 'Discovery support', 'Account planning'],
    draft: {
      name: 'Sales Enablement Eva Agent',
      description: 'Prepares sales teams with approved messaging and recommended next steps.',
      goals: ['Summarize account context', 'Suggest discovery questions', 'Recommend follow-up actions'],
      knowledgeBases: ['Sales playbooks', 'Product briefs', 'Competitive guidance'],
      actions: ['Draft follow-up', 'Create CRM note', 'Schedule next meeting'],
      security: ['Use approved messaging', 'Avoid unsupported claims', 'Protect customer-sensitive data'],
      language: 'English (US)',
      voiceName: 'Confident coach',
    },
  },
  {
    id: 'custom',
    name: 'Custom',
    summary: 'Start with a blank conversational guide and let Eva structure the agent.',
    description: 'Best when your use case does not match a standard template.',
    recommendedFor: ['Custom workflows', 'Exploration', 'Advanced users'],
    draft: {
      name: 'Custom Eva Agent',
      description: 'A guided custom agent draft ready for configuration.',
      goals: ['Clarify the target user', 'Define success criteria', 'Identify required systems'],
      knowledgeBases: [],
      actions: [],
      security: ['Review data access', 'Define escalation behavior', 'Confirm launch readiness'],
      language: 'English (US)',
      voiceName: 'Helpful guide',
    },
  },
];

export const getEvaTemplate = (templateId: string) =>
  EVA_TEMPLATES.find(template => template.id === templateId) ?? EVA_TEMPLATES[EVA_TEMPLATES.length - 1];
