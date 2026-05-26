import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, type Agent } from '../../contexts/AppContext';
import { useDesignVariation } from '../../contexts/DesignVariationContext';
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
import {
  buildInstructionPrompt,
  buildWelcomeMessage,
  EVA_ACTION_ROWS,
  EVA_ADVANCED_GUARDRAIL_GROUPS,
  EVA_AUTO_START_VOICE_PREVIEW_KEY,
  EVA_SESSION_STORAGE_KEY,
  EVA_STANDARD_GUARDRAILS,
  STARTER_PROMPTS,
  type EvaSessionState,
} from './evaFormConfig';
import { EVA_TEMPLATES } from './evaTemplates';
import type { EvaAgentDraft, EvaKnowledgeRecommendation } from './types';

type AgentTileType = 'scripted' | 'autonomous' | 'receptionist';

const TYPE_OPTIONS = [
  { value: 'All types', label: 'All types' },
  { value: 'Specialist', label: 'Specialist' },
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

const REFERENCE_AGENT_TILES: AgentTile[] = [
  {
    id: 'billing-support',
    name: 'Webex Bank Support',
    type: 'scripted',
    updatedOn: '17 Apr 26',
    updatedBy: 'Austen Jones',
    description: 'Handles billing and account inquiries.',
    editable: true,
  },
  {
    id: 'reenergize-healthcare-concierge',
    name: 'Reenergize Healthcare Concierge',
    type: 'scripted',
    updatedOn: '17 Apr 26',
    updatedBy: 'Austen Jones',
    description: 'Guides patients through care navigation, appointment support, and safe clinical handoffs.',
    editable: true,
  },
  {
    id: 'front-door',
    name: 'Front door',
    type: 'scripted',
    updatedOn: '17 Apr 26',
    updatedBy: 'Clarissa Smith',
    description: 'Routes finance customers to the right specialist.',
    editable: true,
  },
  {
    id: 'webex-finance-concierge',
    name: 'Webex Finance Concierge',
    type: 'scripted',
    updatedOn: '22 May 26',
    updatedBy: 'You',
    description: 'Coordinates high-value banking requests, account servicing, and compliant handoffs.',
    editable: true,
  },
  {
    id: 'payment-dispute',
    name: 'Payment dispute specialist',
    type: 'receptionist',
    updatedOn: '15 Apr 26',
    updatedBy: 'Darren Owens',
    description: 'Triages charge disputes and duplicate payment requests.',
  },
  {
    id: 'claims-routing',
    name: 'Claims intake agent',
    type: 'autonomous',
    updatedOn: '12 Apr 26',
    updatedBy: 'Isabelle Brennan',
    description: 'Collects initial claim details and determines next steps.',
  },
  {
    id: 'mortgage-servicing',
    name: 'Mortgage servicing agent',
    type: 'autonomous',
    updatedOn: '11 Apr 26',
    updatedBy: 'Kevin Woo',
    description: 'Supports mortgage servicing requests and account changes.',
  },
  {
    id: 'advisor-scheduling',
    name: 'Advisor scheduling assistant',
    type: 'autonomous',
    updatedOn: '10 Apr 26',
    updatedBy: 'Austen Jones',
    description: 'Schedules advisor callbacks and branch appointments.',
  },
  {
    id: 'finance-faq',
    name: 'Finance FAQ agent',
    type: 'receptionist',
    updatedOn: '8 Apr 26',
    updatedBy: 'Clarissa Smith',
    description: 'Answers frequently asked finance questions.',
  },
  {
    id: 'fraud-escalation',
    name: 'Fraud escalation handoff',
    type: 'autonomous',
    updatedOn: '5 Apr 26',
    updatedBy: 'Darren Owens',
    description: 'Escalates suspected fraud cases to the right team.',
  },
];

function getAgentTypeLabel(type: AgentTileType) {
  if (type === 'autonomous') return 'Specialist';
  if (type === 'receptionist') return 'Receptionist';
  return 'CX Concierge';
}

const RETAIL_AGENT_PREVIEW_DETAILS = {
  description: 'Answers store calls for Acme Electronics in San Jose, checks product availability, handles FAQs, and escalates to Matt when needed.',
  welcomeMessage: 'Hi, thanks for calling Acme Electronics in San Jose. I can help with store hours, directions, product availability, common questions, or connect you with Matt when needed.',
  knowledgeBases: [
    {
      name: 'Acme Electronics store profile',
      description: 'Store hours, address, parking, warranty policy, escalation rules, and local FAQs.',
      sources: 26,
      usedBy: 1,
      lastUpdatedAt: new Date().toISOString(),
    },
    {
      name: 'Inventory Manager integration',
      description: 'Live product availability and hold-for-pickup status for the San Jose location.',
      sources: 84,
      usedBy: 1,
      lastUpdatedAt: new Date().toISOString(),
    },
  ] satisfies EvaKnowledgeRecommendation[],
  actions: ['Check product availability', 'Route manager escalation', 'Create follow-up task'],
};

function buildPreviewDraft(agent: Agent): EvaAgentDraft {
  const baseDraft = EVA_TEMPLATES.find(template => template.id === 'customer-support')?.draft ?? EVA_TEMPLATES[0].draft;
  const isRetailAgent = agent.id === 'webex-elec';

  return {
    ...baseDraft,
    name: agent.name,
    description: isRetailAgent ? RETAIL_AGENT_PREVIEW_DETAILS.description : agent.description,
    goals: isRetailAgent
      ? [
          'Answer incoming calls with a warm receptionist experience',
          'Confirm store hours, directions, FAQs, and current inventory status',
          'Escalate urgent or manager-specific requests to Matt',
        ]
      : baseDraft.goals,
    knowledgeBases: isRetailAgent
      ? RETAIL_AGENT_PREVIEW_DETAILS.knowledgeBases
      : baseDraft.knowledgeBases,
    actions: isRetailAgent
      ? RETAIL_AGENT_PREVIEW_DETAILS.actions
      : baseDraft.actions,
    language: 'English (US)',
    voiceName: 'Ava',
  };
}

function buildPreviewSession(agent: Agent): EvaSessionState {
  const draft = buildPreviewDraft(agent);
  const welcomeMessage = agent.id === 'webex-elec'
    ? RETAIL_AGENT_PREVIEW_DETAILS.welcomeMessage
    : buildWelcomeMessage(draft);

  return {
    landingMode: 'build',
    selectedTemplateId: 'customer-support',
    draft,
    messages: [
      {
        role: 'assistant',
        text: `I opened the live preview for ${agent.name}. The voice preview is starting now so you can hear how the agent greets callers.`,
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
    timezone: agent.id === 'webex-elec' ? 'America/Los_Angeles' : 'Europe/London',
    aiEngine: 'Webex AI Pro 1.0',
    welcomeMessage,
    instructionPrompt: buildInstructionPrompt(draft),
    selectedKnowledgeBases: draft.knowledgeBases.map(kb => kb.name),
    selectedActions: draft.actions.filter(action => EVA_ACTION_ROWS.some(row => row.name === action)),
    optimizeAccepted: true,
    preOptimizeText: '',
    optimizeSummary: {
      changes: ['Preview session loaded from the published agent card.'],
      reasoning: ['This reuses the same generated preview panel and voice runtime used in AI Assistant Studio.'],
    },
    securityTier: 'standard',
    channelType: 'voice',
    digitalChannel: 'chat',
    digitalChannelAddress: 'acme-electronics-chat',
    channelPhoneNumber: '+1 629 263 5773',
    standardGuardrails: EVA_STANDARD_GUARDRAILS,
    advancedGuardrails: EVA_ADVANCED_GUARDRAIL_GROUPS,
    customRules: [],
  };
}

export default function EvaAgentsTable() {
  const navigate = useNavigate();
  const { agents, selectAgent, setIsCreateModalOpen, showToast } = useApp();
  const { setVariation } = useDesignVariation();
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

  const handleAgentClick = (tile: AgentTile) => {
    if (agents[tile.id]) {
      selectAgent(tile.id);
      navigate(`/agents/${tile.id}`);
      return;
    }

    handlePreviewClick(tile);
  };

  const handleConfigureClick = (tile: AgentTile) => {
    if (agents[tile.id]) {
      selectAgent(tile.id);
      navigate(`/agents/${tile.id}/studio`);
      return;
    }

    handlePreviewClick(tile);
  };

  const handlePreviewClick = (tile: AgentTile) => {
    const agent = agents[tile.id] ?? tileToAgent(tile);
    selectAgent(agent.id);

    try {
      window.sessionStorage.setItem(EVA_SESSION_STORAGE_KEY, JSON.stringify(buildPreviewSession(agent)));
      window.sessionStorage.setItem(EVA_AUTO_START_VOICE_PREVIEW_KEY, '1');
    } catch {
      /* If storage is blocked, still switch the user into Eva's preview surface. */
    }

    setVariation('landing');
    navigate('/agents');
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
    <div className="primary-content">
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
                        <AgentCardActions agent={tileToAgent(tile)} onNotify={showToast} />
                      </div>
                      <Badge
                        variant={
                          tile.type === 'autonomous'
                            ? 'success'
                            : tile.type === 'receptionist'
                              ? 'warning'
                              : 'info'
                        }
                      >
                        {typeLabel}
                      </Badge>
                    </div>
                  </div>
                  <div className="ai-agents-agent-content">
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
                      Preview
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
