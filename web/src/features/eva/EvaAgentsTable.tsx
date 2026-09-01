import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card as MomentumCard } from '@momentum-design/components/react';
import { useApp, type Agent } from '../../contexts/AppContext';
import { useAgentHomeScenario } from '../agent-home/AgentHomeScenarioContext';
import Button from '../../components/shared/Button';
import {
  Card as SharedCard,
  Dropdown,
  Input,
  MenuItem,
  MenuOverlay,
  useMenu,
} from '../../components/shared';
import { Icon } from '../../icons';
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
    icon: 'phone',
    avatarClass: 'receptionist',
  },
  contact_center: {
    label: FAMILY_METADATA.contact_center.label,
    icon: 'headset',
    avatarClass: 'scripted',
  },
  internal_assistant: {
    label: FAMILY_METADATA.internal_assistant.label,
    icon: 'people',
    avatarClass: 'autonomous',
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

const formatUpdatedOn = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return 'Recently';
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  }).format(date);
};

export default function EvaAgentsTable() {
  const navigate = useNavigate();
  const { agents, agentDrafts, selectAgent, showToast } = useApp();
  const { setMode: setAgentHomeMode } = useAgentHomeScenario();
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
    selectAgent(tile.id);
    navigate(`/agents/${encodeURIComponent(tile.id)}?preview=1`);
  };

  const handleCreateAgent = () => {
    setAgentHomeMode('first-time');
    navigate('/new-agent');
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
              <MomentumCard
                key={tile.id}
                orientation="vertical"
                variant="border"
                className="ai-agents-agent-card ai-agents-agent-card--clickable"
              >
                <button
                  type="button"
                  className="ai-agents-agent-card__hit-area"
                  onClick={() => handleAgentClick(tile)}
                  aria-label={`Open ${tile.name}, ${family.label}, ${LIFECYCLE_STATUS_LABELS[tile.lifecycle]}`}
                />
                <div slot="body" className="ai-agents-agent-card-slot">
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
                        <span className={`ai-agents-agent-lifecycle ai-agents-agent-lifecycle--${tile.lifecycle}`}>
                          <span className="ai-agents-agent-lifecycle-dot" aria-hidden="true" />
                          {LIFECYCLE_STATUS_LABELS[tile.lifecycle]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ai-agents-agent-content">
                    <p className="ai-agents-agent-description">{tile.description}</p>
                  </div>
                  <div className="ai-agents-agent-footer">
                    <p className="ai-agents-agent-meta">
                      <span>Updated {tile.updatedOn}</span>
                      <span>by {tile.updatedBy}</span>
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      aria-label={`Preview ${tile.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handlePreviewClick(tile);
                      }}
                    >
                      Preview
                    </Button>
                  </div>
                </div>
              </MomentumCard>
              );
            })}
          </div>
        ) : (
          <SharedCard className="ai-agents-empty-card">
            <strong>No agents found</strong>
            <span>Try changing the search or filters.</span>
          </SharedCard>
        )}
      </div>

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
