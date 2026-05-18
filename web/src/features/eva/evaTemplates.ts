import type { EvaGuidedStepId, EvaKnowledgeRecommendation, EvaTemplate } from './types';

/* Centralized catalog of recommended knowledge collections so multiple templates
   can share consistent metadata (counts, descriptions, last-updated). The
   `lastUpdatedAt` timestamps are anchored to module-load time so the relative
   labels ("3 hours ago", "2 days ago") stay believable across sessions. */
const isoMinutesAgo = (mins: number) =>
  new Date(Date.now() - mins * 60_000).toISOString();

const KB_CATALOG = {
  'Store FAQ': {
    name: 'Store FAQ',
    description: 'Store hours, locations, returns, pickup options, and frequently asked retail questions.',
    sources: 86,
    usedBy: 6,
    lastUpdatedAt: isoMinutesAgo(60 * 2),
  },
  'Inventory system': {
    name: 'Inventory system',
    description: 'Current stock levels, SKU metadata, store availability, and fulfillment constraints.',
    sources: 524,
    usedBy: 10,
    lastUpdatedAt: isoMinutesAgo(20),
  },
  'Product catalog': {
    name: 'Product catalog',
    description: 'Product descriptions, pricing guidance, specifications, and compatibility details.',
    sources: 412,
    usedBy: 14,
    lastUpdatedAt: isoMinutesAgo(60 * 4),
  },
  'Interview feedback': {
    name: 'Interview feedback',
    description: 'Structured panel feedback, scorecards, hiring notes, and debrief summaries.',
    sources: 73,
    usedBy: 4,
    lastUpdatedAt: isoMinutesAgo(60 * 5),
  },
  'Candidate profiles': {
    name: 'Candidate profiles',
    description: 'Candidate resumes, role alignment notes, interview stages, and recruiter context.',
    sources: 129,
    usedBy: 5,
    lastUpdatedAt: isoMinutesAgo(60 * 7),
  },
  'Hiring process guide': {
    name: 'Hiring process guide',
    description: 'Recruiting workflows, approval paths, follow-up timing, and decision criteria.',
    sources: 58,
    usedBy: 3,
    lastUpdatedAt: isoMinutesAgo(60 * 24 * 2),
  },
  'Incident runbooks': {
    name: 'Incident runbooks',
    description: 'Operational runbooks, escalation paths, service checks, and mitigation steps.',
    sources: 112,
    usedBy: 8,
    lastUpdatedAt: isoMinutesAgo(35),
  },
  'Deployment logs': {
    name: 'Deployment logs',
    description: 'Recent release events, build notes, rollback markers, and environment changes.',
    sources: 689,
    usedBy: 9,
    lastUpdatedAt: isoMinutesAgo(15),
  },
  'Service ownership directory': {
    name: 'Service ownership directory',
    description: 'Service teams, on-call contacts, escalation owners, and dependency maps.',
    sources: 94,
    usedBy: 7,
    lastUpdatedAt: isoMinutesAgo(60 * 9),
  },
  'Tenant directory': {
    name: 'Tenant directory',
    description: 'Tenant records, lease contacts, property assignments, and support preferences.',
    sources: 238,
    usedBy: 5,
    lastUpdatedAt: isoMinutesAgo(60 * 3),
  },
  'Maintenance playbooks': {
    name: 'Maintenance playbooks',
    description: 'Troubleshooting scripts, maintenance procedures, urgency rules, and service policies.',
    sources: 147,
    usedBy: 6,
    lastUpdatedAt: isoMinutesAgo(60 * 10),
  },
  'Service provider availability': {
    name: 'Service provider availability',
    description: 'Technician schedules, vendor coverage windows, skills, and appointment constraints.',
    sources: 61,
    usedBy: 4,
    lastUpdatedAt: isoMinutesAgo(50),
  },
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
} satisfies Record<string, EvaKnowledgeRecommendation>;

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
    name: 'Retail store agent',
    summary: 'Turn inbound store calls into AI-powered product help, follow-ups, and demand insights.',
    description: 'Answers availability questions with inventory data, shares store details, and sends SMS or email product follow-ups.',
    recommendedFor: ['Retail stores', 'Phone support', 'Inventory questions'],
    draft: {
      name: 'Retail Store AI Agent',
      description: 'Answers store calls, checks product availability, sends follow-ups, and captures regional demand signals.',
      goals: ['Improve lead conversion', 'Reduce missed-call sales loss', 'Provide inventory-backed answers'],
      knowledgeBases: [kb('Store FAQ'), kb('Inventory system'), kb('Product catalog')],
      actions: ['Check inventory', 'Send SMS follow-up', 'Send email follow-up'],
      security: ['PII redaction', 'Escalation for sensitive requests', 'Answer only from approved retail sources'],
      language: 'English (US)',
      voiceName: 'Warm professional',
    },
  },
  {
    id: 'knowledge-assistant',
    name: 'Candidate feedback loop agent',
    summary: 'Synthesize interviewer feedback and move hiring decisions forward.',
    description: 'Best for hiring debriefs, interview follow-ups, and final decision logging.',
    recommendedFor: ['Recruiting teams', 'Hiring panels', 'Interview follow-up'],
    draft: {
      name: 'Candidate Feedback Loop Agent',
      description: 'Synthesizes feedback from hiring meetings and executes approved follow-up actions.',
      goals: ['Join hiring debriefs', 'Analyze interviewer feedback', 'Structure hiring decisions'],
      knowledgeBases: [kb('Interview feedback'), kb('Candidate profiles'), kb('Hiring process guide')],
      actions: ['Schedule follow-up interview', 'Log hiring decision', 'Create recruiter task'],
      security: ['Respect HR data permissions', 'Summarize feedback from approved sources', 'Require human confirmation before final decisions'],
      language: 'English (US)',
      voiceName: 'Concise coordinator',
    },
  },
  {
    id: 'workflow-automation',
    name: 'AI Incident Command Agent',
    summary: 'Coordinate outages with live operational context, stakeholder updates, Jira tasks, and post-mortem notes.',
    description: 'Monitors alerts, joins incident rooms, surfaces deployment data, notifies stakeholders, and documents resolution work.',
    recommendedFor: ['Incident response', 'SRE teams', 'Outage coordination'],
    draft: {
      name: 'AI Incident Command Agent',
      description: 'Coordinates technical outages with real-time alerts, deployment context, stakeholder updates, and remediation tracking.',
      goals: ['Reduce coordination overhead', 'Eliminate lag between decisions and execution', 'Keep incident communication consistent'],
      knowledgeBases: [kb('Incident runbooks'), kb('Deployment logs'), kb('Service ownership directory')],
      actions: ['Create Jira remediation task', 'Notify stakeholders', 'Draft post-mortem summary'],
      security: ['Require confirmation before remediation actions', 'Log incident updates', 'Escalate critical operational changes'],
      language: 'English (US)',
      voiceName: 'Concise operator',
    },
  },
  {
    id: 'policy-compliance',
    name: 'Property Management Service Agent',
    summary: 'Autonomously triage tenant requests, create ServiceNow tickets, and coordinate technician scheduling.',
    description: 'Verifies caller identity, handles maintenance issues like A/C repairs, and schedules service without human handoff.',
    recommendedFor: ['Property managers', 'Tenant support', 'Maintenance coordination'],
    draft: {
      name: 'Property Management Service Agent',
      description: 'Handles tenant service requests from identity verification and issue triage through ticket creation and technician scheduling.',
      goals: ['Provide 24/7 tenant support', 'Increase CSAT', 'Reduce manual coordination for service managers'],
      knowledgeBases: [kb('Tenant directory'), kb('Maintenance playbooks'), kb('Service provider availability')],
      actions: ['Create ServiceNow ticket', 'Schedule technician visit', 'Notify tenant'],
      security: ['Verify caller identity before account-specific help', 'Escalate urgent safety issues', 'Log service request summaries'],
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
