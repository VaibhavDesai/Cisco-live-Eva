import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, type Agent } from '../../contexts/AppContext';
import Button from '../../components/shared/Button';
import {
  Badge,
  Card,
  Dropdown,
  Input,
  MenuItem,
  MenuOverlay,
  useMenu,
} from '../../components/shared';
import { Icon } from '../../icons';
import {
  buildInstructionPrompt,
  buildWelcomeMessage,
  EVA_ADVANCED_GUARDRAIL_GROUPS,
  EVA_AUTO_START_VOICE_PREVIEW_KEY,
  PROFILE_LANGUAGE_OPTIONS,
  EVA_SESSION_STORAGE_KEY,
  EVA_STANDARD_GUARDRAILS,
  type EvaSessionState,
} from './evaFormConfig';
import { EVA_TEMPLATES } from './evaTemplates';
import type { EvaAgentDraft } from './types';
import {
  FAMILY_METADATA,
  type AgentDraft,
  type AgentFamily,
  type AgentLifecycle,
} from '../agent-creation/agentCreationModel';

type FamilyFilter = 'all' | AgentFamily;

type AgentTile = {
  id: string;
  name: string;
  family: AgentFamily;
  lifecycle: AgentLifecycle;
  updatedOn: string;
  updatedBy: string;
  description: string;
  agent: Agent;
  draft?: AgentDraft;
};

const FAMILY_PRESENTATION = {
  calling: {
    label: FAMILY_METADATA.calling.label,
    badgeLabel: FAMILY_METADATA.calling.label,
    icon: 'phone',
    avatarClass: 'receptionist',
    badgeVariant: 'warning',
  },
  contact_center: {
    label: FAMILY_METADATA.contact_center.label,
    badgeLabel: 'CX Concierge',
    icon: 'headset',
    avatarClass: 'scripted',
    badgeVariant: 'success',
  },
  internal_assistant: {
    label: FAMILY_METADATA.internal_assistant.label,
    badgeLabel: FAMILY_METADATA.internal_assistant.label,
    icon: 'people',
    avatarClass: 'autonomous',
    badgeVariant: 'info',
  },
} as const;

const LIFECYCLE_STATUS_LABELS: Record<AgentLifecycle, string> = {
  draft: 'Draft',
  published: 'Published',
  deployed: 'Deployed',
  live: 'Live',
};

const isAgentFamily = (value: unknown): value is AgentFamily =>
  value === 'calling' || value === 'contact_center' || value === 'internal_assistant';

const getSelections = (draft: AgentDraft | undefined, capabilityId: string) => {
  const selections = draft?.familyConfiguration[capabilityId]?.values?.selections;
  return Array.isArray(selections)
    ? selections.filter((selection): selection is string => typeof selection === 'string')
    : [];
};

const formatUpdatedOn = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return 'Recently';
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  }).format(date);
};

function buildPreviewDraft(agent: Agent, agentDraft?: AgentDraft): EvaAgentDraft {
  const baseDraft = EVA_TEMPLATES.find(template => template.id === 'customer-support')?.draft ?? EVA_TEMPLATES[0].draft;
  const knowledgeBases = getSelections(agentDraft, 'knowledge').map(name => ({
    name,
    description: 'Knowledge selected for this agent.',
    sources: 0,
    usedBy: 1,
    lastUpdatedAt: agentDraft?.updatedAt ?? new Date().toISOString(),
  }));

  return {
    ...baseDraft,
    name: agent.name,
    description: agentDraft?.basics.purpose || agent.description,
    goals: agentDraft?.basics.purpose ? [agentDraft.basics.purpose] : baseDraft.goals,
    knowledgeBases,
    actions: getSelections(agentDraft, 'actions'),
    language: agentDraft?.language.defaultLanguage || 'English (US)',
    voiceName: 'Ava',
  };
}

function buildPreviewSession(agent: Agent, agentDraft?: AgentDraft): EvaSessionState {
  const draft = buildPreviewDraft(agent, agentDraft);
  const family = agentDraft?.family ?? agent.family;
  const savedChannelValues = agentDraft?.familyConfiguration.channels?.values;
  const savedChannels = Array.isArray(savedChannelValues?.selectedChannels)
    ? savedChannelValues.selectedChannels.filter(
        (channel): channel is 'voice' | 'digital' | 'video' => (
          channel === 'voice' || channel === 'digital' || channel === 'video'
        ),
      )
    : [];
  const selectedChannels = savedChannels.length > 0
    ? savedChannels
    : [family === 'internal_assistant' ? 'digital' : 'voice'];
  const primaryChannel = selectedChannels.includes('voice') ? 'voice' : 'digital';
  const savedGreetings = savedChannelValues?.greetings && typeof savedChannelValues.greetings === 'object'
    ? savedChannelValues.greetings as Partial<Record<'voice' | 'digital', string>>
    : {};
  const isVoicePreview = primaryChannel === 'voice';
  const welcomeMessage = savedGreetings[primaryChannel] || buildWelcomeMessage(draft);
  const languageValue = PROFILE_LANGUAGE_OPTIONS.find(option =>
    option.value === draft.language || option.label === draft.language,
  )?.value ?? 'en-US';

  return {
    configurationMode: 'edit',
    landingMode: 'build',
    selectedTemplateId: 'customer-support',
    draft,
    messages: [
      {
        role: 'assistant',
        text: isVoicePreview
          ? `I opened the voice preview for ${agent.name}. Start a representative call when you're ready.`
          : `I opened the chat preview for ${agent.name}. Try a representative employee request when you're ready.`,
        originStep: 'preview',
      },
    ],
    guidanceVisible: true,
    orchestrationSuggested: false,
    freeChatActive: false,
    conversationalOnboardingStep: 'idle',
    evaStep: 'preview',
    agentName: draft.name,
    agentDescription: draft.description,
    avatarUrl: 'https://us.webexbotbuilder.com/static/assets/images/agent-avatar-eva.png',
    timezone: 'America/Los_Angeles',
    aiEngine: 'Webex AI Pro 1.0',
    welcomeMessage,
    instructionPrompt: agentDraft?.instructions.content || buildInstructionPrompt(draft),
    selectedKnowledgeBases: draft.knowledgeBases.map(kb => kb.name),
    selectedActions: draft.actions,
    optimizeAccepted: true,
    preOptimizeText: '',
    optimizeSummary: {
      changes: ['Preview session loaded from the selected agent card.'],
      reasoning: ['This reuses the same generated preview panel and voice runtime used in AI Assistant Studio.'],
    },
    securityTier: 'standard',
    channelType: primaryChannel,
    selectedChannels,
    digitalChannel: 'chat',
    selectedDigitalChannels: ['chat'],
    digitalChannelAddress: '',
    channelPhoneNumber: '',
    phoneNumberDeferred: true,
    standardGuardrails: EVA_STANDARD_GUARDRAILS,
    advancedGuardrailGroups: EVA_ADVANCED_GUARDRAIL_GROUPS,
    expandedAdvancedGroups: [],
    personality: {
      llm: 'Webex AI Pro 1.0',
      voice: 'ava',
      language: languageValue,
      gender: 'neutral',
    },
    customRules: [],
    selectedAgentFamily: family,
    familyIntakeAnswers: {},
    familyProposal: null,
    familyProposalApplied: Boolean(agentDraft?.instructions.applied),
    activeDraftAgentId: agentDraft?.id ?? null,
  };
}

export default function EvaAgentsTable() {
  const navigate = useNavigate();
  const { agents, agentDrafts, selectAgent, showToast } = useApp();
  const { setVariation } = useDesignVariation();
  const [searchQuery, setSearchQuery] = useState('');
  const [familyFilter, setFamilyFilter] = useState<FamilyFilter>('all');
  const [creatorFilter, setCreatorFilter] = useState('All creators');

  const agentTiles = useMemo<AgentTile[]>(() => {
    const ids = new Set([...Object.keys(agents), ...Object.keys(agentDrafts)]);

    return Array.from(ids)
      .flatMap(id => {
        const contextAgent = agents[id];
        const draft = agentDrafts[id];
        const family = draft?.family ?? contextAgent?.family;

        // Family is an explicit agent boundary. Legacy records without one
        // are intentionally excluded rather than classified from their copy.
        if (!isAgentFamily(family)) return [];

        const lifecycle = draft?.lifecycle ?? contextAgent?.lifecycle ?? 'draft';
        const name = draft?.basics.name || contextAgent?.name || 'Untitled AI Agent';
        const description = draft?.basics.description
          || draft?.basics.purpose
          || contextAgent?.description
          || FAMILY_METADATA[family].summary;
        const updatedAt = draft?.updatedAt ?? contextAgent?.updatedAt ?? contextAgent?.createdAt;
        const agent: Agent = contextAgent ?? {
          id,
          name,
          initials: name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0]?.toUpperCase())
            .join('') || 'AI',
          description,
          gradient: 'linear-gradient(135deg, var(--accent-bg), var(--bg-glass-light))',
          status: LIFECYCLE_STATUS_LABELS[lifecycle],
          statusClass: lifecycle === 'draft' ? 'badge-warning' : 'badge-success',
          sessions: '—',
          successRate: '—',
          messages: '—',
          avgResponse: '—',
          meta: description,
          family,
          lifecycle,
          draftId: draft?.id,
          version: draft?.version,
          updatedAt,
        };

        return [{
          id,
          name,
          family,
          lifecycle,
          updatedOn: formatUpdatedOn(updatedAt),
          updatedBy: 'You',
          description,
          agent,
          draft,
          sortValue: updatedAt ?? '',
        }];
      })
      .sort((left, right) => right.sortValue.localeCompare(left.sortValue) || left.name.localeCompare(right.name))
      .map(({ sortValue: _sortValue, ...tile }) => tile);
  }, [agentDrafts, agents]);

  const openAgentSummary = (tile: AgentTile) => {
    const agent = agents[tile.id] ?? tileToAgent(tile);
    selectAgent(agent.id);
    navigate(`/agents/${agent.id}/studio`);
  };

  const handleAgentClick = (tile: AgentTile) => {
    openAgentSummary(tile);
  };

  const handleConfigureClick = (tile: AgentTile) => {
    if (agents[tile.id]) {
      selectAgent(tile.id);
      navigate(`/agents/${tile.id}`);
      return;
    }

    handlePreviewClick(tile);
  };

  const handlePreviewClick = (tile: AgentTile) => {
    if (agents[tile.id]) selectAgent(tile.id);

    try {
      window.sessionStorage.setItem(
        EVA_SESSION_STORAGE_KEY,
        JSON.stringify(buildPreviewSession(tile.agent, tile.draft)),
      );
      if (tile.family === 'internal_assistant') {
        window.sessionStorage.removeItem(EVA_AUTO_START_VOICE_PREVIEW_KEY);
      } else {
        window.sessionStorage.setItem(EVA_AUTO_START_VOICE_PREVIEW_KEY, '1');
      }
    } catch {
      /* If storage is blocked, still switch the user into Eva's preview surface. */
    }

    setVariation('landing');
    navigate('/agents');
  };

  const handleCreateAgent = () => {
    try {
      window.sessionStorage.removeItem(EVA_SESSION_STORAGE_KEY);
      window.sessionStorage.removeItem(EVA_AUTO_START_VOICE_PREVIEW_KEY);
    } catch {
      /* If storage is blocked, the canonical chat still opens. */
    }
    setVariation('landing');
    navigate('/agents');
  };

  const familyOptions = useMemo(() => [
    { value: 'all', label: 'All families', count: agentTiles.length },
    ...(['calling', 'contact_center', 'internal_assistant'] as AgentFamily[]).map(family => ({
      value: family,
      label: FAMILY_PRESENTATION[family].label,
      count: agentTiles.filter(tile => tile.family === family).length,
    })),
  ], [agentTiles]);

  const creatorOptions = useMemo(
    () => [
      { value: 'All creators', label: 'All creators' },
      ...Array.from(new Set(agentTiles.map(tile => tile.updatedBy))).map(creator => ({
        value: creator,
        label: creator,
      })),
    ],
    [agentTiles],
  );

  const filteredAgents = agentTiles.filter(({
    name,
    description,
    family,
    lifecycle,
    updatedBy,
  }) => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const familyLabel = FAMILY_PRESENTATION[family].label;
    const matchesSearch =
      normalizedSearch.length === 0 ||
      name.toLowerCase().includes(normalizedSearch) ||
      description.toLowerCase().includes(normalizedSearch) ||
      familyLabel.toLowerCase().includes(normalizedSearch) ||
      LIFECYCLE_STATUS_LABELS[lifecycle].toLowerCase().includes(normalizedSearch) ||
      updatedBy.toLowerCase().includes(normalizedSearch);
    const matchesFamily = familyFilter === 'all' || family === familyFilter;
    const matchesCreator = creatorFilter === 'All creators' || updatedBy === creatorFilter;
    return matchesSearch && matchesFamily && matchesCreator;
  });

  return (
    <div className="primary-content ai-agents-page">
      <div className="page-header ai-agents-header">
        <div>
          <h1 className="page-title">AI Agents</h1>
        </div>
        <div className="eva-form-builder__compact-header-actions ai-agents-header-actions">
          <Button variant="secondary" onClick={() => showToast('Agent import is not available in this demo.', 'info')}>
            <Icon name="download" weight="bold" size="sm" />
            Import agent
          </Button>
          <Button onClick={handleCreateAgent}>
            <Icon name="plus" weight="bold" size="sm" />
            Create agent
          </Button>
        </div>
      </div>

      <div className="secondary-content ai-agents-dashboard">
        <div className="ai-agents-toolbar">
          <Input
            placeholder="Search by agent name"
            aria-label="Search agents"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            leadingIcon="search"
            clearable
            onClear={() => setSearchQuery('')}
            className="ai-agents-search-wrap"
          />
          <Dropdown
            options={familyOptions}
            value={familyFilter}
            onChange={value => setFamilyFilter(value as FamilyFilter)}
            leadingIcon="filter"
          />
          <Dropdown
            options={creatorOptions}
            value={creatorFilter}
            onChange={setCreatorFilter}
          />
        </div>

        {filteredAgents.length > 0 ? (
          <div className="ai-agents-grid">
            {filteredAgents.map(tile => {
              const family = FAMILY_PRESENTATION[tile.family];
              return (
              <Card key={tile.id} className="ai-agents-agent-card ai-agents-agent-card--clickable">
                <button
                  type="button"
                  className="ai-agents-agent-card__hit-area"
                  onClick={() => handleAgentClick(tile)}
                  aria-label={`Open ${tile.name}, ${family.label}, ${LIFECYCLE_STATUS_LABELS[tile.lifecycle]}`}
                />
                <div className="ai-agents-agent-card-slot">
                  <div className="ai-agents-agent-card-head">
                    <span
                      className={`ai-agents-agent-avatar ai-agents-agent-avatar--${family.avatarClass}`}
                      aria-hidden="true"
                    >
                      <Icon
                        name={family.icon}
                        weight="bold"
                        size="md"
                      />
                    </span>
                    <div className="ai-agents-agent-card-head-text">
                      <div className="ai-agents-agent-title-row">
                        <button
                          type="button"
                          className="ai-agents-agent-name-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleConfigureClick(tile);
                          }}
                        >
                          {tile.name}
                        </button>
                        <AgentCardActions agent={tile.agent} onNotify={showToast} />
                      </div>
                      <div className="ai-agents-agent-labels">
                        <Badge variant={family.badgeVariant}>
                          {family.badgeLabel}
                        </Badge>
                        <span className={`ai-agents-agent-lifecycle ai-agents-agent-lifecycle--${tile.lifecycle}`}>
                          <span className="ai-agents-agent-lifecycle-dot" aria-hidden="true" />
                          {LIFECYCLE_STATUS_LABELS[tile.lifecycle]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ai-agents-agent-content">
                    <p className="ai-agents-agent-description">{tile.description}</p>
                    <p className="ai-agents-agent-meta">
                      {tile.description}
                      <br />
                      Updated on {tile.updatedOn}
                      <br />
                      by {tile.updatedBy}
                    </p>
                  </div>
                  <div className="ai-agents-agent-footer">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="ai-agents-agent-preview-button"
                      aria-label={`Preview ${tile.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handlePreviewClick(tile);
                      }}
                    >
                      <Icon name="play" weight="bold" size={16} />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAgentClick(tile);
                      }}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </Card>
              );
            })}
          </div>
        ) : (
          <Card className="ai-agents-empty-card">
            <strong>No agents found</strong>
            <span>Try changing the search or filters.</span>
          </Card>
        )}
      </div>

      {previewTile && (() => {
        const previewAgent = agents[previewTile.id] ?? tileToAgent(previewTile);
        const typeLabel = getAgentTypeLabel(previewTile.type);
        const statusLabel = getAgentStatusLabel(previewAgent.status);
        return (
          <aside
            className="ai-agents-preview-panel"
            aria-labelledby="ai-agents-preview-title"
          >
            <header className="ai-agents-preview-panel__header">
              <div>
                <span className="ai-agents-preview-panel__eyebrow">Preview</span>
                <h2 id="ai-agents-preview-title">{previewTile.name}</h2>
              </div>
              <button
                ref={previewCloseRef}
                type="button"
                className="ai-agents-preview-panel__close"
                aria-label="Close preview"
                onClick={closePreview}
              >
                <Icon name="cancel" weight="bold" size={16} />
              </button>
            </header>

            <div className="ai-agents-preview-panel__agent">
              <span className={`ai-agents-agent-avatar ai-agents-agent-avatar--${previewTile.type}`} aria-hidden="true">
                <Icon
                  name={previewTile.type === 'autonomous' ? 'bot-customer-assistant' : previewTile.type === 'receptionist' ? 'desk-phone' : 'workflow-deployments'}
                  weight="bold"
                  size="md"
                />
              </span>
              <div>
                <div className="ai-agents-preview-panel__metadata">
                  <Badge variant={statusLabel === 'Published' ? 'success' : 'warning'}>{statusLabel}</Badge>
                  <span>{typeLabel}</span>
                </div>
                <p>{previewTile.description}</p>
              </div>
            </div>

            <section className="ai-agents-preview-panel__call" aria-label="Voice preview">
              <div className="ai-agents-preview-panel__call-heading">
                <div>
                  <strong>Voice preview</strong>
                  <span>Ava · Friendly and professional</span>
                </div>
                <span className={`ai-agents-preview-panel__status${previewCallActive ? ' is-active' : ''}`}>
                  {previewCallActive ? 'Call in progress' : 'Ready'}
                </span>
              </div>
              <div className={`ai-agents-preview-panel__waveform${previewCallActive ? ' is-active' : ''}`} aria-hidden="true">
                {Array.from({ length: 22 }, (_, index) => (
                  <span
                    key={index}
                    style={{ '--wave-index': index, height: `${8 + (index % 6) * 4}px` } as CSSProperties}
                  />
                ))}
              </div>
              <p className="ai-agents-preview-panel__welcome">
                “Welcome to Gofie. I can help with availability, VIP reservations, and secure payment updates. How can I help today?”
              </p>
              <Button
                type="button"
                className="ai-agents-preview-panel__call-button"
                variant={previewCallActive ? 'secondary' : 'primary'}
                onClick={() => setPreviewCallActive(active => !active)}
              >
                <Icon name={previewCallActive ? 'cancel' : 'play'} weight="bold" size={16} />
                {previewCallActive ? 'End call' : 'Start call'}
              </Button>
            </section>

            <p className="ai-agents-preview-panel__hint">This preview stays with the agent list, so you can compare agents without losing your place.</p>
          </aside>
        );
      })()}
    </div>
  );
}

function AgentCardActions({
  agent,
  onNotify,
}: {
  agent: Agent;
  onNotify: (message: string, type?: 'default' | 'info' | 'success' | 'warning' | 'error') => void;
}) {
  const { open, anchorRef, toggle, close } = useMenu();

  const copyToClipboard = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      onNotify(successMessage, 'success');
    } catch {
      onNotify('Unable to copy to clipboard.', 'error');
    }
  };

  const exportAgent = () => {
    const blob = new Blob([JSON.stringify(agent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${agent.id}-agent.json`;
    link.click();
    URL.revokeObjectURL(url);
    onNotify('Agent exported.', 'success');
  };

  return (
    <span
      ref={anchorRef}
      className="ai-agents-agent-actions"
      onClick={(event) => event.stopPropagation()}
    >
      <Button
        type="button"
        variant="tertiary"
        size="sm"
        className="ai-agents-agent-action-button"
        aria-label={`More actions for ${agent.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event?.stopPropagation();
          toggle();
        }}
      >
        <span className="btn-icon" aria-hidden>
          <Icon name="more" weight="bold" size={16} />
        </span>
      </Button>
      <MenuOverlay
        open={open}
        anchorRef={anchorRef}
        align="right"
        onClose={close}
        className="ai-agents-actions-menu"
      >
        <MenuItem
          icon="copy"
          label="Copy agent ID"
          onClick={() => {
            void copyToClipboard(agent.id, 'Agent ID copied.');
            close();
          }}
        />
        <MenuItem
          icon="copy"
          label="Copy access token"
          onClick={() => {
            onNotify('Access token is not available for this local agent record.', 'warning');
            close();
          }}
        />
        <MenuItem
          icon="export"
          label="Export agent"
          onClick={() => {
            exportAgent();
            close();
          }}
        />
        <MenuItem
          icon="pin"
          label="Pin"
          onClick={() => {
            onNotify('Pin action is not connected yet.', 'info');
            close();
          }}
        />
        <MenuItem
          icon="delete"
          label="Delete"
          danger
          onClick={() => {
            onNotify('Delete action is not connected yet.', 'warning');
            close();
          }}
        />
      </MenuOverlay>
    </span>
  );
}
