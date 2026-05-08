import type { EvaGuidedStepId, EvaKnowledgeRecommendation, EvaTemplate } from './types';

/* Centralized catalog of recommended knowledge collections so multiple templates
   can share consistent metadata (counts, descriptions, last-updated). The
   `lastUpdatedAt` timestamps are anchored to module-load time so the relative
   labels ("3 hours ago", "2 days ago") stay believable across sessions. */
const isoMinutesAgo = (mins: number) =>
  new Date(Date.now() - mins * 60_000).toISOString();

const KB_CATALOG: Record<string, EvaKnowledgeRecommendation> = {
  'FAQ database': {
    name: 'FAQ database',
    description: 'Curated answers to the most common customer questions.',
    sources: 142,
    usedBy: 7,
    lastUpdatedAt: isoMinutesAgo(45),
  },
  'Support articles': {
    name: 'Support articles',
    description: 'Step-by-step troubleshooting articles maintained by the support team.',
    sources: 318,
    usedBy: 5,
    lastUpdatedAt: isoMinutesAgo(60 * 6),
  },
  'Product documentation': {
    name: 'Product documentation',
    description: 'Official user manuals, release notes, and product reference material.',
    sources: 254,
    usedBy: 12,
    lastUpdatedAt: isoMinutesAgo(60 * 24 * 2),
  },
  'Engineering wiki': {
    name: 'Engineering wiki',
    description: 'Internal architecture notes, runbooks, and design decisions.',
    sources: 487,
    usedBy: 4,
    lastUpdatedAt: isoMinutesAgo(60 * 3),
  },
  'HR policies': {
    name: 'HR policies',
    description: 'Employee handbook, benefits, leave, and people-ops procedures.',
    sources: 96,
    usedBy: 9,
    lastUpdatedAt: isoMinutesAgo(60 * 24 * 4),
  },
  'Process playbooks': {
    name: 'Process playbooks',
    description: 'Standard operating playbooks describing how teams execute routine workflows.',
    sources: 64,
    usedBy: 3,
    lastUpdatedAt: isoMinutesAgo(60 * 12),
  },
  'SOP library': {
    name: 'SOP library',
    description: 'Approved standard operating procedures across departments.',
    sources: 128,
    usedBy: 6,
    lastUpdatedAt: isoMinutesAgo(60 * 24),
  },
  'Compliance policy library': {
    name: 'Compliance policy library',
    description: 'Regulatory policies and internal compliance directives.',
    sources: 87,
    usedBy: 4,
    lastUpdatedAt: isoMinutesAgo(60 * 24 * 5),
  },
  'Security standards': {
    name: 'Security standards',
    description: 'Security policies, control frameworks, and data classification rules.',
    sources: 53,
    usedBy: 8,
    lastUpdatedAt: isoMinutesAgo(60 * 30),
  },
  'Audit guidance': {
    name: 'Audit guidance',
    description: 'Internal and external audit handbooks, evidence templates, and remediation guides.',
    sources: 41,
    usedBy: 2,
    lastUpdatedAt: isoMinutesAgo(60 * 24 * 9),
  },
  'Sales playbooks': {
    name: 'Sales playbooks',
    description: 'Account planning, opportunity progression, and pursuit strategies.',
    sources: 76,
    usedBy: 5,
    lastUpdatedAt: isoMinutesAgo(60 * 8),
  },
  'Product briefs': {
    name: 'Product briefs',
    description: 'One-pagers summarizing positioning, target buyers, and use cases.',
    sources: 45,
    usedBy: 11,
    lastUpdatedAt: isoMinutesAgo(60 * 24 * 3),
  },
  'Competitive guidance': {
    name: 'Competitive guidance',
    description: 'Battlecards, talking points, and competitor differentiators.',
    sources: 34,
    usedBy: 7,
    lastUpdatedAt: isoMinutesAgo(60 * 18),
  },
};

const kb = (name: keyof typeof KB_CATALOG): EvaKnowledgeRecommendation => KB_CATALOG[name];

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
    description: 'Choose the knowledge sources AI Assistant should ground the agent in.',
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
      name: 'Customer Support AI Assistant Agent',
      description: 'Answers customer questions, summarizes context, and escalates complex cases.',
      goals: ['Resolve common requests', 'Ground answers in approved support content', 'Escalate high-risk issues'],
      knowledgeBases: [kb('FAQ database'), kb('Support articles'), kb('Product documentation')],
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
      name: 'Knowledge Assistant AI Assistant Agent',
      description: 'Finds and explains trusted answers from connected enterprise knowledge.',
      goals: ['Search approved sources', 'Summarize with citations', 'Recommend next steps'],
      knowledgeBases: [kb('Engineering wiki'), kb('HR policies'), kb('Product documentation')],
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
      name: 'Workflow Automation AI Assistant Agent',
      description: 'Guides users through requests and executes approved workflow actions.',
      goals: ['Collect required fields', 'Validate request completeness', 'Run approved actions'],
      knowledgeBases: [kb('Process playbooks'), kb('SOP library')],
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
      name: 'Policy Compliance AI Assistant Agent',
      description: 'Helps users understand policy requirements and flags risky requests.',
      goals: ['Explain policy requirements', 'Identify missing evidence', 'Route exceptions'],
      knowledgeBases: [kb('Compliance policy library'), kb('Security standards'), kb('Audit guidance')],
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
      name: 'Sales Enablement AI Assistant Agent',
      description: 'Prepares sales teams with approved messaging and recommended next steps.',
      goals: ['Summarize account context', 'Suggest discovery questions', 'Recommend follow-up actions'],
      knowledgeBases: [kb('Sales playbooks'), kb('Product briefs'), kb('Competitive guidance')],
      actions: ['Draft follow-up', 'Create CRM note', 'Schedule next meeting'],
      security: ['Use approved messaging', 'Avoid unsupported claims', 'Protect customer-sensitive data'],
      language: 'English (US)',
      voiceName: 'Confident coach',
    },
  },
  {
    id: 'custom',
    name: 'Custom',
    summary: 'Start with a blank conversational guide and let AI Assistant structure the agent.',
    description: 'Best when your use case does not match a standard template.',
    recommendedFor: ['Custom workflows', 'Exploration', 'Advanced users'],
    draft: {
      name: 'Custom AI Assistant Agent',
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
