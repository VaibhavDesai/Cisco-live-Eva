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
import EvaHeroAnimation from './EvaHeroAnimation';
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

type AgentTileType = 'Autonomous agent' | 'Scripted agent';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'Autonomous agent', label: 'Autonomous agent' },
  { value: 'Scripted agent', label: 'Scripted agent' },
];

type Phase = 'landing' | 'table';

const AGENT_TILE_META: Record<string, { type: AgentTileType; updatedOn: string; updatedBy: string }> = {
  cs: { type: 'Autonomous agent', updatedOn: '17 Apr, 26', updatedBy: 'newstartup_imi' },
  sa: { type: 'Autonomous agent', updatedOn: '12 Apr, 26', updatedBy: 'Team Alpha' },
  it: { type: 'Scripted agent', updatedOn: '15 Apr, 26', updatedBy: 'svc-bot-builder' },
  'webex-elec': { type: 'Autonomous agent', updatedOn: 'Just now', updatedBy: 'Matt' },
};

const INITIAL_AGENT_IDS = new Set(['cs', 'sa', 'it']);

function formatAgentTimestamp(timestamp?: string) {
  if (!timestamp) return undefined;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
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
    channelPhoneNumber: '+1 415 555 0198',
    standardGuardrails: EVA_STANDARD_GUARDRAILS,
    advancedGuardrails: EVA_ADVANCED_GUARDRAIL_GROUPS,
    customRules: [],
  };
}

function getAgentTileMeta(agent: Agent, index: number) {
  const fallback = AGENT_TILE_META[agent.id];
  const updatedOn = formatAgentTimestamp(agent.updatedAt ?? agent.createdAt);

  if (agent.createdAt || agent.updatedAt || agent.agentType || !INITIAL_AGENT_IDS.has(agent.id)) {
    return {
      type: agent.agentType ?? 'Autonomous agent',
      updatedOn: updatedOn ?? fallback?.updatedOn ?? formatAgentTimestamp(new Date().toISOString()) ?? 'Just now',
      updatedBy: fallback?.updatedBy ?? 'Matt',
    };
  }

  return AGENT_TILE_META[agent.id] ?? {
    type: agent.status === 'Published' ? 'Autonomous agent' : 'Scripted agent',
    updatedOn: ['17 Apr, 26', '15 Apr, 26', '14 Apr, 26', '12 Apr, 26'][index % 4],
    updatedBy: ['newstartup_imi', 'svc-bot-builder', 'Team Alpha', 'Ayesh Reddy'][index % 4],
  };
}

function getAgentSortTime(agent: Agent) {
  const timestamp = agent.updatedAt ?? agent.createdAt;
  if (!timestamp) return INITIAL_AGENT_IDS.has(agent.id) ? 0 : Date.now();
  const time = new Date(timestamp).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export default function EvaAgentsTable() {
  const navigate = useNavigate();
  const { agents, selectAgent, setIsCreateModalOpen, showToast } = useApp();
  const { setVariation } = useDesignVariation();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [creatorFilter, setCreatorFilter] = useState('all');
  /* The Dashboard variation uses the Dashboard route itself as the Eva
     landing experience. The sidebar "AI Agents" destination should
     therefore always open to the existing-agents table, not remember a
     prior Eva landing state from sessionStorage. The table still keeps a
     local "Start with Eva" escape hatch, but route entry starts here. */
  const [phase, setPhase] = useState<Phase>('table');
  const [voiceActive, setVoiceActive] = useState(false);

  const handleAgentClick = (agentId: string) => {
    selectAgent(agentId);
    navigate(`/agents/${agentId}`);
  };

  const handleConfigureClick = (agentId: string) => {
    selectAgent(agentId);
    navigate(`/agents/${agentId}/studio`);
  };

  const handlePreviewClick = (agent: Agent) => {
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

  const handleStartWithEva = () => {
    setVariation('dashboard');
    navigate('/');
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

  const agentTiles = useMemo(
    () =>
      Object.values(agents)
        .map((agent, index) => ({
          agent,
          ...getAgentTileMeta(agent, index),
        }))
        .sort((a, b) => {
          const byTime = getAgentSortTime(b.agent) - getAgentSortTime(a.agent);
          if (byTime !== 0) return byTime;
          if (a.agent.id === 'webex-elec') return -1;
          if (b.agent.id === 'webex-elec') return 1;
          return a.agent.name.localeCompare(b.agent.name);
        }),
    [agents],
  );

  const creatorOptions = useMemo(
    () => [
      { value: 'all', label: 'All creators' },
      ...Array.from(new Set(agentTiles.map(tile => tile.updatedBy))).map(creator => ({
        value: creator,
        label: creator,
      })),
    ],
    [agentTiles],
  );

  const filteredAgents = agentTiles.filter(({ agent, type, updatedBy }) => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 ||
      agent.name.toLowerCase().includes(normalizedSearch) ||
      updatedBy.toLowerCase().includes(normalizedSearch);
    const matchesType = typeFilter === 'all' || type === typeFilter;
    const matchesCreator = creatorFilter === 'all' || updatedBy === creatorFilter;
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
              <EvaHeroAnimation />
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
          <p className="page-subtitle">Manage and preview your AI agents</p>
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
          <div className="eva-form-builder__compact-header-actions ai-agents-header-actions ai-agents-toolbar-actions">
            <Button variant="secondary" onClick={handleStartWithEva}>
              <Icon name="sparkle" weight="bold" size="sm" />
              Start with AI Assistant
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>+ Create Agent</Button>
          </div>
        </div>

        {filteredAgents.length > 0 ? (
          <div className="ai-agents-grid">
            {filteredAgents.map(({ agent, type, updatedOn, updatedBy }) => (
              <Card key={agent.id} className="ai-agents-agent-card ai-agents-agent-card--clickable">
                <button
                  type="button"
                  className="ai-agents-agent-card__hit-area"
                  onClick={() => handleAgentClick(agent.id)}
                  aria-label={`Open ${agent.name}`}
                />
                <div className="ai-agents-agent-card-slot">
                  <div className="ai-agents-agent-card-head">
                    <span
                      className={`ai-agents-agent-avatar ${
                        type === 'Autonomous agent' ? 'ai-agents-agent-avatar--purple' : 'ai-agents-agent-avatar--teal'
                      }`}
                      aria-hidden="true"
                    >
                      <Icon name={type === 'Autonomous agent' ? 'sparkle' : 'ucm-cloud'} weight="bold" size="md" />
                    </span>
                    <div className="ai-agents-agent-card-head-text">
                      <div className="ai-agents-agent-title-row">
                        <button
                          type="button"
                          className="ai-agents-agent-name-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleConfigureClick(agent.id);
                          }}
                        >
                          {agent.name}
                        </button>
                        <AgentCardActions agent={agent} onNotify={showToast} />
                      </div>
                      <Badge variant={type === 'Autonomous agent' ? 'success' : 'info'}>
                        {type}
                      </Badge>
                    </div>
                  </div>
                  <div className="ai-agents-agent-content">
                    <p className="ai-agents-agent-meta">
                      Updated on {updatedOn}
                      <br />
                      by {updatedBy}
                    </p>
                  </div>
                  <div className="ai-agents-agent-footer">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        handlePreviewClick(agent);
                      }}
                    >
                      Preview
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
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
