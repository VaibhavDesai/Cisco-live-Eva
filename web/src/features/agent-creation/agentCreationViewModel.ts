import type { IconName } from '../../icons/types';
import {
  FAMILY_METADATA,
  getActionableStoredRecommendations,
  isMinimumPublishable,
  type AgentDraft,
  type AgentFamily,
  type AgentRecommendation,
} from './agentCreationModel.ts';

export type AgentFamilyKey = AgentFamily;
export type AgentFamilyFilter = 'all' | AgentFamily;
export type AgentLifecycleKey = AgentDraft['lifecycle'];

export interface FamilyViewModel {
  key: AgentFamily;
  label: string;
  shortLabel: string;
  description: string;
  icon: IconName;
  color: string;
}

export interface LifecycleViewModel {
  key: AgentLifecycleKey;
  label: string;
  icon: IconName;
  rank: number;
}

export interface AgentListViewModel {
  id: string;
  name: string;
  description: string;
  family: FamilyViewModel;
  lifecycle: LifecycleViewModel;
  updatedLabel: string;
}

export interface MinimumRequirementViewModel {
  id: string;
  label: string;
  complete: boolean;
}

export interface RecommendationViewModel {
  id: string;
  title: string;
  why: string;
  benefit: string;
  requirement: string;
  target: string;
  targetLabel: string;
  actionLabel: 'Set up' | 'Edit';
  icon: IconName;
}

export interface PreviewViewModel {
  title: string;
  description: string;
  modeLabel: string;
  icon: IconName;
  agentMessage: string;
  userMessage: string;
  responseMessage: string;
  inputPlaceholder: string;
}

export interface AgentDraftOverviewViewModel {
  id: string;
  name: string;
  description: string;
  family: FamilyViewModel;
  lifecycle: LifecycleViewModel;
  versionLabel: string;
  updatedLabel: string;
  canPublish: boolean;
  publishButtonLabel: string;
  minimumIntro: string;
  minimumRequirements: MinimumRequirementViewModel[];
  recommendations: RecommendationViewModel[];
  recommendationsStale: boolean;
  preview: PreviewViewModel;
}

interface AgentListRecord {
  id?: string;
  name?: string;
  description?: string;
  status?: string;
  family?: AgentFamily;
  createdAt?: string;
  updatedAt?: string;
}

const FAMILY_PRESENTATION: Record<AgentFamily, Pick<FamilyViewModel, 'icon' | 'color'>> = {
  calling: { icon: 'phone', color: '#a65f00' },
  contact_center: { icon: 'headset', color: '#087f72' },
  internal_assistant: { icon: 'people', color: '#1769aa' },
};

const FAMILY_ORDER: AgentFamily[] = ['calling', 'contact_center', 'internal_assistant'];

export const AGENT_FAMILY_FILTERS: Array<{
  key: AgentFamilyFilter;
  label: string;
  icon: IconName;
}> = [
  { key: 'all', label: 'All', icon: 'bot' },
  ...FAMILY_ORDER.map(key => ({
    key,
    label: FAMILY_METADATA[key].label,
    icon: FAMILY_PRESENTATION[key].icon,
  })),
];

const LIFECYCLE_PRESENTATION: Record<AgentLifecycleKey, LifecycleViewModel> = {
  draft: { key: 'draft', label: 'Draft', icon: 'edit', rank: 0 },
  published: { key: 'published', label: 'Published version', icon: 'check-circle', rank: 1 },
  deployed: { key: 'deployed', label: 'Deployed', icon: 'link', rank: 2 },
  live: { key: 'live', label: 'Live', icon: 'launch', rank: 3 },
};

const REQUIREMENT_LABELS = {
  minimum: 'Minimum',
  recommended: 'Recommended',
  cx_only: 'CX only',
  external: 'External',
} as const;

export const AGENT_LIFECYCLE_STAGES: Array<LifecycleViewModel & { explanation: string }> = [
  {
    ...LIFECYCLE_PRESENTATION.draft,
    explanation: 'Editable working configuration. Only creators can access it.',
  },
  {
    ...LIFECYCLE_PRESENTATION.published,
    label: 'Published version',
    explanation: 'An approved, versioned configuration. It is not connected yet.',
  },
  {
    ...LIFECYCLE_PRESENTATION.deployed,
    explanation: 'Connected to a destination, number, entry point, or workspace.',
  },
  {
    ...LIFECYCLE_PRESENTATION.live,
    explanation: 'Enabled at its deployment destination and available to users.',
  },
];

function familyViewModel(key: AgentFamily): FamilyViewModel {
  const metadata = FAMILY_METADATA[key];
  return {
    key,
    label: metadata.label,
    shortLabel: metadata.shortLabel,
    description: metadata.description,
    ...FAMILY_PRESENTATION[key],
  };
}

function normalizeDrafts(agentDrafts: Record<string, AgentDraft> | AgentDraft[] | undefined) {
  if (!agentDrafts) return {} as Record<string, AgentDraft>;
  if (Array.isArray(agentDrafts)) {
    return Object.fromEntries(agentDrafts.map(draft => [draft.id, draft]));
  }
  return agentDrafts;
}

function getExplicitFamily(agent: AgentListRecord | undefined): AgentFamily | null {
  const family = agent?.family;
  return family === 'calling' || family === 'contact_center' || family === 'internal_assistant'
    ? family
    : null;
}

function inferLegacyLifecycle(agent: AgentListRecord | undefined): AgentLifecycleKey {
  const status = String(agent?.status ?? '').toLowerCase();
  if (status.includes('live')) return 'live';
  if (status.includes('deploy')) return 'deployed';
  if (status.includes('publish') && !status.includes('ready')) return 'published';
  return 'draft';
}

function lifecycleViewModel(key: AgentLifecycleKey): LifecycleViewModel {
  return LIFECYCLE_PRESENTATION[key] ?? LIFECYCLE_PRESENTATION.draft;
}

function formatUpdatedLabel(value?: string) {
  if (!value) return 'Updated recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Updated recently';
  return `Updated ${new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  }).format(date)}`;
}

export function buildAgentListViewModels(
  agents: Record<string, AgentListRecord> | undefined,
  agentDrafts: Record<string, AgentDraft> | AgentDraft[] | undefined,
): AgentListViewModel[] {
  const drafts = normalizeDrafts(agentDrafts);
  const ids = new Set([...Object.keys(agents ?? {}), ...Object.keys(drafts)]);

  return Array.from(ids)
    .flatMap(id => {
      const agent = agents?.[id];
      const draft = drafts[id];
      const family = draft?.family ?? getExplicitFamily(agent);
      /* Family is an entitlement boundary, not a label we can safely infer
         from an agent's name or description. Older unassigned records stay
         out of the family-aware list until they are explicitly classified. */
      if (!family) return [];
      const name = draft?.basics.name || String(agent?.name ?? 'Untitled AI Agent');
      const description = draft?.basics.description
        || draft?.basics.purpose
        || String(agent?.description ?? FAMILY_METADATA[family].summary);
      const lifecycle = draft?.lifecycle ?? inferLegacyLifecycle(agent);
      return [{
        id,
        name,
        description,
        family: familyViewModel(family),
        lifecycle: lifecycleViewModel(lifecycle),
        updatedLabel: formatUpdatedLabel(draft?.updatedAt ?? String(agent?.updatedAt ?? '')),
        sortValue: draft?.updatedAt ?? String(agent?.updatedAt ?? agent?.createdAt ?? ''),
      }];
    })
    .sort((a, b) => b.sortValue.localeCompare(a.sortValue) || a.name.localeCompare(b.name))
    .map(({ sortValue: _sortValue, ...item }) => item);
}

function hasConfiguredTarget(draft: AgentDraft, targetSection: string) {
  const normalizedTarget = targetSection.trim().toLowerCase();
  return Object.values(draft.familyConfiguration ?? {}).some(capability => {
    const section = capability.section?.trim().toLowerCase();
    const id = capability.id?.trim().toLowerCase();
    return (section === normalizedTarget || id === normalizedTarget)
      && capability.progress !== 'not_started';
  });
}

function recommendationIcon(targetSection: string): IconName {
  const normalized = targetSection.toLowerCase();
  if (normalized.includes('knowledge')) return 'bookmark';
  if (normalized.includes('action') || normalized.includes('tool')) return 'tools';
  if (normalized.includes('security') || normalized.includes('guard')) return 'shield';
  if (normalized.includes('language')) return 'language';
  if (normalized.includes('channel') || normalized.includes('deploy')) return 'chat';
  if (normalized.includes('test') || normalized.includes('preview')) return 'play-circle';
  return 'sparkle';
}

function prettifySection(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
}

function recommendationViewModel(
  draft: AgentDraft,
  recommendation: AgentRecommendation,
): RecommendationViewModel {
  return {
    id: recommendation.id,
    title: recommendation.title,
    why: recommendation.reason,
    benefit: recommendation.benefit,
    requirement: REQUIREMENT_LABELS[recommendation.requirement],
    target: recommendation.targetSection,
    targetLabel: prettifySection(recommendation.targetSection),
    actionLabel: hasConfiguredTarget(draft, recommendation.targetSection) ? 'Edit' : 'Set up',
    icon: recommendationIcon(recommendation.targetSection),
  };
}

function minimumRequirements(draft: AgentDraft): MinimumRequirementViewModel[] {
  const requirements: MinimumRequirementViewModel[] = [
    {
      id: 'entitlement',
      label: `${FAMILY_METADATA[draft.family].label} entitlement is licensed`,
      complete: draft.entitlement === 'licensed',
    },
    {
      id: 'name',
      label: 'Agent name is set',
      complete: Boolean(draft.basics.name.trim()),
    },
    {
      id: 'purpose',
      label: 'Purpose is clear',
      complete: Boolean(draft.basics.purpose.trim()),
    },
    {
      id: 'instructions',
      label: 'Starter instructions are applied',
      complete: draft.instructions.applied && Boolean(draft.instructions.content.trim()),
    },
    {
      id: 'language',
      label: 'Default language is selected',
      complete: Boolean(draft.language.defaultLanguage.trim()),
    },
  ];

  return requirements;
}

function previewViewModel(family: AgentFamily, name: string): PreviewViewModel {
  if (family === 'calling') {
    return {
      title: 'Try a voice call',
      description: 'Hear how the draft greets callers, gathers intent, and explains the next step.',
      modeLabel: 'Calling preview',
      icon: 'phone',
      agentMessage: `Thanks for calling. I’m ${name}. How can I help today?`,
      userMessage: 'I have a question and I’m not sure which team I need.',
      responseMessage: 'I can help narrow that down. Tell me briefly what you are trying to accomplish.',
      inputPlaceholder: 'Speak or type a caller response',
    };
  }
  if (family === 'contact_center') {
    return {
      title: 'Try a customer conversation',
      description: 'Preview the draft in a routed customer-service conversation before choosing an entry point.',
      modeLabel: 'Contact Center preview',
      icon: 'headset',
      agentMessage: `Hi, I’m ${name}. What can I help you resolve today?`,
      userMessage: 'I need help with an order, but I do not have all the details.',
      responseMessage: 'No problem. I’ll start with the information you have and explain when a person needs to step in.',
      inputPlaceholder: 'Type a customer message',
    };
  }
  return {
    title: 'Try an employee question',
    description: 'Preview concise internal guidance without placing the assistant in a workspace yet.',
    modeLabel: 'Internal assistant preview',
    icon: 'people',
    agentMessage: `Hi, I’m ${name}. What would you like help getting done?`,
    userMessage: 'Where should I start with a request I have not handled before?',
    responseMessage: 'I can give you the approved starting steps and direct you to the right owner if more access is required.',
    inputPlaceholder: 'Ask an employee question',
  };
}

export function buildAgentDraftOverviewViewModel(
  agentId: string,
  agents: Record<string, AgentListRecord> | undefined,
  agentDrafts: Record<string, AgentDraft> | AgentDraft[] | undefined,
): AgentDraftOverviewViewModel | null {
  const drafts = normalizeDrafts(agentDrafts);
  const draft = drafts[agentId];
  const agent = agents?.[agentId];
  if (!draft && !agent) return null;

  if (!draft) {
    const family = getExplicitFamily(agent);
    if (!family) return null;
    const lifecycle = inferLegacyLifecycle(agent);
    const name = String(agent?.name ?? 'Untitled AI Agent');
    return {
      id: agentId,
      name,
      description: String(agent?.description ?? FAMILY_METADATA[family].summary),
      family: familyViewModel(family),
      lifecycle: lifecycleViewModel(lifecycle),
      versionLabel: lifecycle === 'draft' ? 'Draft only' : 'Published version',
      updatedLabel: formatUpdatedLabel(String(agent?.updatedAt ?? '')),
      canPublish: true,
      publishButtonLabel: 'Publish version 1',
      minimumIntro: 'The existing profile is ready to publish. Optional capabilities can be reviewed before deployment.',
      minimumRequirements: [
        { id: 'legacy-profile', label: 'Existing agent profile is ready', complete: true },
      ],
      recommendations: [],
      recommendationsStale: false,
      preview: previewViewModel(family, name),
    };
  }

  const lifecycle = lifecycleViewModel(draft.lifecycle);
  const visibleRecommendations = getActionableStoredRecommendations(draft);
  const publishVersion = draft.lifecycle === 'draft'
    ? Math.max(1, draft.version)
    : Math.max(1, draft.version + 1);

  return {
    id: draft.id,
    name: draft.basics.name,
    description: draft.basics.description || draft.basics.purpose,
    family: familyViewModel(draft.family),
    lifecycle,
    versionLabel: draft.lifecycle === 'draft'
      ? `Draft version ${Math.max(1, draft.version)}`
      : `Published version ${Math.max(1, draft.version)}`,
    updatedLabel: formatUpdatedLabel(draft.updatedAt),
    canPublish: isMinimumPublishable(draft),
    publishButtonLabel: `Publish version ${publishVersion}`,
    minimumIntro: 'These basics are enough to publish a version. Knowledge, actions, security, testing, and deployment remain advisory.',
    minimumRequirements: minimumRequirements(draft),
    recommendations: visibleRecommendations.map(recommendation => recommendationViewModel(draft, recommendation)),
    recommendationsStale: Boolean(draft.recommendationsStale),
    preview: previewViewModel(draft.family, draft.basics.name),
  };
}

export function familyOptionsExcept(family: AgentFamily) {
  return FAMILY_ORDER
    .filter(candidate => candidate !== family)
    .map(familyViewModel);
}

export function getCreatedAgentId(created: unknown): string | null {
  if (typeof created === 'string') return created;
  if (created && typeof created === 'object' && 'id' in created) {
    const id = (created as { id?: unknown }).id;
    return typeof id === 'string' ? id : null;
  }
  return null;
}
