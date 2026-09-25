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
  AMIT_WEBEX_ONE_MERIDIAN_AGENT_ID,
  AMIT_WEBEX_ONE_SELECTED_360_AGENT_ID,
} from '../../demo/ciscoLiveSeed';
import { CISCO_LIVE_PRIMARY_AGENT_ID } from '../../demo/ciscoLiveDemo';
import {
  FAMILY_METADATA,
  type AgentDraft,
  type AgentFamily,
  type AgentLifecycle,
} from '../agent-creation/agentCreationModel';

type AgentDisplayType = 'AI receptionist' | 'CX concierge' | 'CX specialist' | 'Personal agent';
type AgentTypeFilter = 'all' | AgentDisplayType;

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

const FIGMA_AGENT_PRESENTATION: Record<string, {
  familyLabel: string;
  avatarClass: string;
  updatedOn: string;
  order: number;
}> = {
  'technical-support-concierge': {
    familyLabel: 'CX specialist',
    avatarClass: 'technical-support',
    updatedOn: 'Aug 31, 26',
    order: 0,
  },
  'golftop-event-operations': {
    familyLabel: 'AI receptionist',
    avatarClass: 'event-operations',
    updatedOn: 'Aug 28, 26',
    order: 1,
  },
  [AMIT_WEBEX_ONE_MERIDIAN_AGENT_ID]: {
    familyLabel: 'AI receptionist',
    avatarClass: 'event-operations',
    updatedOn: 'Aug 28, 26',
    order: 1,
  },
  'golftop-servicenow-coordinator': {
    familyLabel: 'Personal agent',
    avatarClass: 'servicenow',
    updatedOn: 'Aug 28, 26',
    order: 2,
  },
  'golftop-vip-reservations': {
    familyLabel: 'CX concierge',
    avatarClass: 'vip-reservations',
    updatedOn: 'Aug 28, 26',
    order: 3,
  },
};

const FAMILY_PRESENTATION = {
  calling: {
    label: 'AI receptionist',
    icon: 'phone',
    avatarClass: 'receptionist',
  },
  contact_center: {
    label: 'CX concierge',
    icon: 'headset',
    avatarClass: 'scripted',
  },
  internal_assistant: {
    label: 'Personal agent',
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

const getAgentDisplayType = (tile: Pick<AgentTile, 'id' | 'family'>): AgentDisplayType => {
  const presentation = FIGMA_AGENT_PRESENTATION[tile.id];
  if (presentation?.familyLabel) return presentation.familyLabel as AgentDisplayType;
  return FAMILY_PRESENTATION[tile.family].label as AgentDisplayType;
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

export default function EvaAgentsTable() {
  const navigate = useNavigate();
  const { agents, agentDrafts, selectAgent, showToast } = useApp();
  const { setMode: setAgentHomeMode } = useAgentHomeScenario();
  const [searchQuery, setSearchQuery] = useState('');
  const [agentTypeFilter, setAgentTypeFilter] = useState<AgentTypeFilter>('all');
  const [creatorFilter, setCreatorFilter] = useState('All creators');

  const agentTiles = useMemo<AgentTile[]>(() => {
    const ids = new Set([...Object.keys(agents), ...Object.keys(agentDrafts)]);

    const allTiles = Array.from(ids)
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
      .sort((left, right) => {
        const leftOrder = FIGMA_AGENT_PRESENTATION[left.id]?.order;
        const rightOrder = FIGMA_AGENT_PRESENTATION[right.id]?.order;
        if (leftOrder !== undefined || rightOrder !== undefined) {
          return (leftOrder ?? Number.MAX_SAFE_INTEGER) - (rightOrder ?? Number.MAX_SAFE_INTEGER);
        }
        return right.sortValue.localeCompare(left.sortValue) || left.name.localeCompare(right.name);
      })
      .map(({ sortValue: _sortValue, ...tile }) => tile);

    // The AmitWebexOne list is a three-agent demo. Keep every other saved
    // agent intact so its existing detail URL and configuration still work.
    const tilesById = new Map(allTiles.map(tile => [tile.id, tile]));
    const savedMeridian = tilesById.get('golftop-event-operations');
    const meridianId = savedMeridian?.name === 'Meridian Aria'
      && savedMeridian.lifecycle === 'published'
      ? savedMeridian.id
      : AMIT_WEBEX_ONE_MERIDIAN_AGENT_ID;
    return [
      AMIT_WEBEX_ONE_SELECTED_360_AGENT_ID,
      meridianId,
      CISCO_LIVE_PRIMARY_AGENT_ID,
    ].flatMap(id => {
      const tile = tilesById.get(id);
      return tile ? [tile] : [];
    });
  }, [agentDrafts, agents]);

  const openAgentSummary = (tile: AgentTile) => {
    const agent = tile.agent;
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

  const agentTypeOptions = useMemo(() => [
    { value: 'all' as const, label: 'All agent types', count: agentTiles.length },
    ...(['AI receptionist', 'CX concierge', 'CX specialist', 'Personal agent'] as AgentDisplayType[]).map(agentType => ({
      value: agentType,
      label: agentType,
      count: agentTiles.filter(tile => getAgentDisplayType(tile) === agentType).length,
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

  const filteredAgents = agentTiles.filter(tile => {
    const {
      name,
      description,
      lifecycle,
      updatedBy,
    } = tile;
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const agentTypeLabel = getAgentDisplayType(tile);
    const matchesSearch =
      normalizedSearch.length === 0 ||
      name.toLowerCase().includes(normalizedSearch) ||
      description.toLowerCase().includes(normalizedSearch) ||
      agentTypeLabel.toLowerCase().includes(normalizedSearch) ||
      LIFECYCLE_STATUS_LABELS[lifecycle].toLowerCase().includes(normalizedSearch) ||
      updatedBy.toLowerCase().includes(normalizedSearch);
    const matchesAgentType = agentTypeFilter === 'all' || agentTypeLabel === agentTypeFilter;
    const matchesCreator = creatorFilter === 'All creators' || updatedBy === creatorFilter;
    return matchesSearch && matchesAgentType && matchesCreator;
  });

  return (
    <div className="primary-content ai-agents-page">
      <div className="page-header ai-agents-header">
        <div>
          <h1 className="page-title">AI agents</h1>
        </div>
        <div className="eva-form-builder__compact-header-actions ai-agents-header-actions">
          <Button variant="secondary" onClick={() => showToast('Agent import is not available in this demo.', 'info')}>
            Import Agent
          </Button>
          <Button onClick={handleCreateAgent}>
            Create Agent
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
            options={agentTypeOptions}
            value={agentTypeFilter}
            onChange={value => setAgentTypeFilter(value as AgentTypeFilter)}
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
              const presentation = FIGMA_AGENT_PRESENTATION[tile.id];
              const agentTypeLabel = getAgentDisplayType(tile);
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
                  aria-label={`Open ${tile.name}, ${agentTypeLabel}, ${LIFECYCLE_STATUS_LABELS[tile.lifecycle]}`}
                />
                <div slot="body" className="ai-agents-agent-card-slot">
                  <div className="ai-agents-agent-card-head">
                    <span
                      className={`ai-agents-agent-avatar ai-agents-agent-avatar--${presentation?.avatarClass ?? family.avatarClass}`}
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
                          {LIFECYCLE_STATUS_LABELS[tile.lifecycle]}
                        </span>
                        <span className="ai-agents-agent-lifecycle-separator" aria-hidden="true">|</span>
                        <span className="ai-agents-agent-updated">{presentation?.updatedOn ?? tile.updatedOn} by {tile.updatedBy}</span>
                      </div>
                    </div>
                  </div>
                  <span className="ai-agents-agent-family-chip">{agentTypeLabel}</span>
                  <div className="ai-agents-agent-content">
                    <p className="ai-agents-agent-description">{tile.description}</p>
                  </div>
                  <div className="ai-agents-agent-footer">
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
