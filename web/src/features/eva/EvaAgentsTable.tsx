import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, type Agent } from '../../contexts/AppContext';
import Button from '../../components/shared/Button';
import {
  AiFooter,
  Badge,
  Card,
  Dropdown,
  Input,
  MenuItem,
  MenuOverlay,
  useMenu,
} from '../../components/shared';
import { Icon } from '../../icons';
import { STARTER_PROMPTS } from './evaFormConfig';
import { CISCO_LIVE_AGENTS } from '../../demo/ciscoLiveDemo';

type AgentTileType = 'scripted' | 'autonomous' | 'receptionist';

const TYPE_OPTIONS = [
  { value: 'All types', label: 'All types' },
  { value: 'Autonomous', label: 'Autonomous' },
  { value: 'CX Concierge', label: 'CX Concierge' },
  { value: 'Receptionist', label: 'Receptionist' },
];

type Phase = 'landing' | 'table';

type AgentTile = {
  id: string;
  name: string;
  type: AgentTileType;
  updatedOn: string;
  updatedBy: string;
  description: string;
  editable?: boolean;
};

const REFERENCE_AGENT_TILES: AgentTile[] = CISCO_LIVE_AGENTS.map((agent) => ({
  id: agent.id,
  name: agent.name,
  type: agent.tileType,
  updatedOn: agent.updatedOn,
  updatedBy: agent.updatedBy,
  description: agent.description,
  editable: true,
}));

function getAgentTypeLabel(type: AgentTileType) {
  if (type === 'autonomous') return 'Autonomous';
  if (type === 'receptionist') return 'Receptionist';
  return 'CX Concierge';
}

function getAgentTypeIcon(type: AgentTileType) {
  if (type === 'autonomous') return 'automation' as const;
  if (type === 'receptionist') return 'desk-phone' as const;
  return 'headset' as const;
}

function getAgentStatusLabel(status: string) {
  return status === 'Published' ? 'Published' : 'Draft';
}

export default function EvaAgentsTable() {
  const navigate = useNavigate();
  const { agents, selectAgent, setIsCreateModalOpen, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All types');
  const [creatorFilter, setCreatorFilter] = useState('All creators');
  /* The Dashboard variation uses the Dashboard route itself as the Eva
     landing experience. The sidebar "AI Agents" destination should
     therefore always open to the existing-agents table, not remember a
     prior Eva landing state from sessionStorage. The table still keeps a
     local "Start with Eva" escape hatch, but route entry starts here. */
  const [phase, setPhase] = useState<Phase>('table');
  const [voiceActive, setVoiceActive] = useState(false);

  const tileToAgent = (tile: AgentTile): Agent => ({
    id: tile.id,
    name: tile.name,
    initials: tile.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'AI',
    description: tile.description,
    gradient: 'linear-gradient(135deg, var(--accent-bg), var(--bg-glass-light))',
    status: 'Published',
    statusClass: 'badge-success',
    sessions: '—',
    successRate: '—',
    messages: '—',
    avgResponse: '—',
    meta: `${tile.description} • Last updated ${tile.updatedOn}`,
    agentType: tile.type === 'scripted' ? 'Scripted agent' : 'Autonomous agent',
  });

  const openAgentSummary = (tile: AgentTile) => {
    const agent = agents[tile.id] ?? tileToAgent(tile);
    selectAgent(agent.id);
    navigate(`/agents/${agent.id}/studio`);
  };

  const handleAgentClick = (tile: AgentTile) => {
    openAgentSummary(tile);
  };

  const handleConfigureClick = (tile: AgentTile) => {
    openAgentSummary(tile);
  };

  const handlePreviewClick = (tile: AgentTile) => {
    openAgentSummary(tile);
  };

  /* Both landing entry points (free-text composer + template card click)
     drop the user into the table view. From there, the standard
     "+ Create Agent" affordance is the natural next step — wiring the
     prompt directly into the create-agent modal would need new prefill
     props on `CreateAgentModal`, which is out of scope for this design
     pass. */
  const handleLandingSubmit = (_text: string) => {
    setPhase('table');
  };

  const handleLandingTemplateClick = () => {
    setPhase('table');
  };

  /* "Existing agent" landing button — drops the user straight into the
     agents table for this variation. They're already on the dashboard
     variation, so there's no design-variation switch to do; just exit
     the landing phase. Mirrors the same secondary entry point on the
     form-builder and chat-based landings. */
  const handleGoToExistingAgents = () => {
    setPhase('table');
  };

  /* "Start from scratch" landing button — opens the global Create
     Agent modal so the user can configure a fresh agent without going
     through Eva's templated waterfall. */
  const handleStartFromScratch = () => {
    setIsCreateModalOpen(true);
  };

  const agentTiles = useMemo(() => REFERENCE_AGENT_TILES, []);

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

  const filteredAgents = agentTiles.filter(({ name, type, updatedBy }) => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const typeLabel = getAgentTypeLabel(type);
    const matchesSearch =
      normalizedSearch.length === 0 ||
      name.toLowerCase().includes(normalizedSearch) ||
      updatedBy.toLowerCase().includes(normalizedSearch);
    const matchesType = typeFilter === 'All types' || typeLabel === typeFilter;
    const matchesCreator = creatorFilter === 'All creators' || updatedBy === creatorFilter;
    return matchesSearch && matchesType && matchesCreator;
  });

  if (phase === 'landing') {
    return (
      <div className="primary-content eva-agents-landing eva-agents-landing--flush">
        <div className="eva-first-interface eva-first-interface--landing eva-landing-shell">
          <section
            className="eva-first-interface__hero"
            aria-labelledby="eva-agents-landing-hero"
          >
            <div className="eva-landing-hero-brand">
              <h1 id="eva-agents-landing-hero">AI Agent Studio</h1>
            </div>
            <h2>Build, deploy, and manage AI agents for every interaction.</h2>
          </section>

          <div className="eva-landing-composer" aria-label="Talk to AI Assistant">
            <AiFooter
              className="eva-ai-footer"
              fillContainer
              onSend={handleLandingSubmit}
              onVoiceToggle={() => setVoiceActive(active => !active)}
              processing={false}
              placeholder={'Describe the agent you want to build.\ne.g. A friendly banking assistant that helps customers check their balance, dispute charges, and get account help — always calm and reassuring.'}
              suggestions={[]}
              voiceActive={voiceActive}
              showDisclaimer={false}
            />
          </div>

          <div className="eva-landing-divider eva-landing-template-divider" role="separator" aria-label="quick start with">
            <span className="eva-landing-divider-line" aria-hidden="true" />
            <span className="eva-landing-divider-text">Quick start with</span>
            <span className="eva-landing-divider-line" aria-hidden="true" />
          </div>

          <section className="eva-prompt-examples" aria-label="Quick templates">
            {STARTER_PROMPTS.slice(0, 4).map(prompt => (
              <button
                key={prompt.templateId}
                type="button"
                className="eva-prompt-card"
                onClick={handleLandingTemplateClick}
              >
                <span className="eva-prompt-card__header">
                  <span className="eva-prompt-card__icon" aria-hidden="true">
                    <Icon name={prompt.icon} weight="bold" size="md" />
                  </span>
                  <strong>{prompt.title}</strong>
                </span>
                <span className="eva-prompt-card__copy">
                  <strong>{prompt.summary}</strong>
                  <span>{prompt.description}</span>
                </span>
                <small>Start here</small>
              </button>
            ))}
          </section>

          {/* Secondary entry points — mirrors the divider + buttons on
              the form-builder and chat-based landings so all three
              variations expose the same shortcuts: jump straight to the
              existing-agents table, or open the bare Create Agent modal. */}
          <div className="eva-landing-divider" role="separator" aria-label="or">
            <span className="eva-landing-divider-line" aria-hidden="true" />
            <span className="eva-landing-divider-text">Or</span>
            <span className="eva-landing-divider-line" aria-hidden="true" />
          </div>

          <div className="eva-landing-secondary-actions">
            <Button variant="secondary" onClick={handleGoToExistingAgents}>
              <Icon name="user" weight="bold" size="sm" />
              Existing agent
            </Button>

            <Button variant="secondary" onClick={handleStartFromScratch}>
              <Icon name="plus" weight="bold" size="sm" />
              Start from scratch
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Icon name="plus" weight="bold" size="sm" />
            Create agent
          </Button>
        </div>
      </div>

      <div className="secondary-content ai-agents-dashboard">
        <div className="ai-agents-toolbar">
          <Input
            placeholder="Search by agent name"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            leadingIcon="search"
            clearable
            onClear={() => setSearchQuery('')}
            className="ai-agents-search-wrap"
          />
          <Dropdown
            options={TYPE_OPTIONS}
            value={typeFilter}
            onChange={setTypeFilter}
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
              const typeLabel = getAgentTypeLabel(tile.type);
              const typeIcon = getAgentTypeIcon(tile.type);
              const agentRecord = agents[tile.id] ?? tileToAgent(tile);
              const statusLabel = getAgentStatusLabel(agentRecord.status);
              return (
              <Card key={tile.id} className="ai-agents-agent-card ai-agents-agent-card--clickable">
                <button
                  type="button"
                  className="ai-agents-agent-card__hit-area"
                  onClick={() => handleAgentClick(tile)}
                  aria-label={`Open ${tile.name}`}
                />
                <div className="ai-agents-agent-card-slot">
                  <div className="ai-agents-agent-card-head">
                    <span
                      className={`ai-agents-agent-avatar ai-agents-agent-avatar--${tile.type}`}
                      aria-hidden="true"
                    >
                      <Icon
                        name={
                          tile.type === 'autonomous'
                            ? 'bot-customer-assistant'
                            : tile.type === 'receptionist'
                              ? 'desk-phone'
                              : 'workflow-deployments'
                        }
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
                        <AgentCardActions agent={agentRecord} onNotify={showToast} />
                      </div>
                      <div className="ai-agents-agent-metadata" aria-label={`${statusLabel}, ${typeLabel}`}>
                        <Badge variant={statusLabel === 'Published' ? 'success' : 'warning'}>
                          {statusLabel}
                        </Badge>
                        <span className="ai-agents-agent-type">
                          <Icon name={typeIcon} weight="regular" size={14} />
                          {typeLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ai-agents-agent-content">
                    <p className="ai-agents-agent-description">{tile.description}</p>
                    <p className="ai-agents-agent-meta">
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
                      onClick={(event) => {
                        event.stopPropagation();
                        handlePreviewClick(tile);
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
