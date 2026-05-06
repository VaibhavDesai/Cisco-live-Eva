import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import Button from '../../components/shared/Button';
import {
  AiFooter,
  Badge,
  Dropdown,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/shared';
import { AgentCard } from '../../components/agents';
import { Icon } from '../../icons';
import { STARTER_PROMPTS } from './evaFormConfig';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

/* The dashboard variation now opens with the same hero/composer/templates
   landing as the form-builder and chat-based variations, then falls into
   the agents table once the user describes a need or picks a template.
   We persist the phase in sessionStorage so that, after a refresh, the
   user lands back where they last were instead of being kicked to the
   intro screen every time they navigate. The flag is per-tab — that
   matches the rest of the Eva session state which all uses
   sessionStorage. */
const PHASE_STORAGE_KEY = 'eva-agents-table-phase';
type Phase = 'landing' | 'table';

const readStoredPhase = (): Phase => {
  try {
    const raw = window.sessionStorage.getItem(PHASE_STORAGE_KEY);
    return raw === 'table' ? 'table' : 'landing';
  } catch {
    return 'landing';
  }
};

export default function EvaAgentsTable() {
  const navigate = useNavigate();
  const { agents, selectAgent, setIsCreateModalOpen } = useApp();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [phase, setPhase] = useState<Phase>(() => readStoredPhase());
  const [voiceActive, setVoiceActive] = useState(false);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(PHASE_STORAGE_KEY, phase);
    } catch {
      /* sessionStorage may be disabled (private mode / quota) — phase
         just won't survive a reload, which is acceptable. */
    }
  }, [phase]);

  const handleAgentClick = (agentId: string) => {
    selectAgent(agentId);
    navigate(`/agents/${agentId}`);
  };

  const handleConfigureClick = (agentId: string) => {
    selectAgent(agentId);
    navigate(`/agents/${agentId}/configure`);
  };

  /* Both landing entry points (free-text composer + template card click)
     drop the user into the table view. From there, the standard
     "+ Create Agent" affordance is the natural next step — wiring the
     prompt directly into the create-agent modal would need new prefill
     props on `CreateAgentModal`, which is out of scope for this design
     pass. The "Start with Eva" button in the table header restores the
     landing whenever the user wants to step back. */
  const handleLandingSubmit = (_text: string) => {
    setPhase('table');
  };

  const handleLandingTemplateClick = () => {
    setPhase('table');
  };

  const handleStartWithEva = () => {
    setPhase('landing');
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

  const getBadgeVariant = (statusClass: string): 'success' | 'warning' | 'default' => {
    if (statusClass === 'badge-success') return 'success';
    if (statusClass === 'badge-warning') return 'warning';
    return 'default';
  };

  const filteredAgents = Object.values(agents).filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && agent.status === 'Published') ||
      (statusFilter === 'draft' && agent.status !== 'Published');
    return matchesSearch && matchesStatus;
  });

  if (phase === 'landing') {
    return (
      <div className="primary-content eva-agents-landing eva-agents-landing--flush">
        <div className="eva-first-interface eva-first-interface--landing eva-landing-shell">
          <section
            className="eva-first-interface__hero"
            aria-labelledby="eva-agents-landing-hero"
          >
            <h1 id="eva-agents-landing-hero">Hi I&rsquo;m Eva!</h1>
            <h2>Build smart agent anytime, anywhere.</h2>
            <p>
              Describe the business need, persona, tools, data, routing, or guardrails. Pick a
              template to jump straight into the agents table, or open the create flow with
              your own brief.
            </p>
          </section>

          <div className="eva-landing-composer" aria-label="Talk to Eva">
            <AiFooter
              className="eva-ai-footer"
              fillContainer
              onSend={handleLandingSubmit}
              onVoiceToggle={() => setVoiceActive(active => !active)}
              processing={false}
              placeholder="Type with Eva. Try: Create an AI agent for customer onboarding..."
              suggestions={[]}
              voiceActive={voiceActive}
            />
          </div>

          <section className="eva-prompt-examples" aria-label="Quick templates">
            {STARTER_PROMPTS.slice(0, 4).map(prompt => (
              <button
                key={prompt.templateId}
                type="button"
                className="eva-prompt-card"
                onClick={handleLandingTemplateClick}
              >
                <span className="eva-prompt-card__icon" aria-hidden="true">
                  <Icon name={prompt.icon} weight="bold" size="md" />
                </span>
                <strong>{prompt.title}</strong>
                <span>{prompt.description}</span>
                <small>Use this example</small>
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
    <div className="primary-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Agents</h1>
          <p className="page-subtitle">Manage your AI agents</p>
        </div>
        <div className="eva-form-builder__compact-header-actions">
          <Button variant="secondary" size="sm" onClick={handleStartWithEva}>
            <Icon name="sparkle" weight="bold" size="sm" />
            Start with Eva
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>+ Create Agent</Button>
        </div>
      </div>

      <div className="secondary-content">
        <div className="filter-bar">
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            leadingIcon="search"
            clearable
            onClear={() => setSearchQuery('')}
            className="filter-bar-search"
          />
          <Dropdown
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <div className="view-switcher">
            <button
              type="button"
              className={`view-switcher-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              aria-label="Show table view"
            >
              <Icon name="view-list" weight="bold" size="sm" />
            </button>
            <button
              type="button"
              className={`view-switcher-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Show grid view"
            >
              <Icon name="view-thumbnail" weight="bold" size="sm" />
            </button>
          </div>
        </div>

        {viewMode === 'table' && (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Agent</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Sessions</TableHeader>
                <TableHeader>Success Rate</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody empty={filteredAgents.length === 0} colSpan={5}>
              {filteredAgents.map(agent => (
                <TableRow key={agent.id} onClick={() => handleAgentClick(agent.id)}>
                  <TableCell>
                    <div className="agents-table-agent">
                      <div
                        className="agents-table-agent__avatar"
                        style={{ background: agent.gradient }}
                      >
                        {agent.initials}
                      </div>
                      <div>
                        <div className="agents-table-agent__name">{agent.name}</div>
                        <div className="agents-table-agent__description">
                          {agent.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(agent.statusClass)}>{agent.status}</Badge>
                  </TableCell>
                  <TableCell>{agent.sessions}</TableCell>
                  <TableCell>{agent.successRate}</TableCell>
                  <TableCell>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={event => {
                        event.stopPropagation();
                        handleConfigureClick(agent.id);
                      }}
                    >
                      Configure
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {viewMode === 'grid' && (
          <div className="agents-card-grid">
            {filteredAgents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onSelect={() => handleAgentClick(agent.id)}
                onConfigure={() => handleConfigureClick(agent.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
