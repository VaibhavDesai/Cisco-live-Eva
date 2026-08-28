import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import Button from '../components/shared/Button';
import { Icon } from '../icons';
import EvaChatExperience from '../features/eva/EvaChatExperience';
import AgentHomeDashboard from '../features/agent-home/AgentHomeDashboard';
import { useAgentHomeScenario } from '../features/agent-home/AgentHomeScenarioContext';
import {
  buildAgentHomeSnapshot,
  type AgentHomeAction,
  type FleetAgentSummary,
  type WorkflowActivity,
} from '../features/agent-home/agentHomeModel';
import type {
  AgentHomeDemoMessage,
  AgentHomeFirstTimeFlow,
  AgentHomeTemplateSetup,
} from '../features/agent-home/AgentHomeFirstTimeFlows';
import {
  createDraftFromHomeTemplate,
  getAgentHomeTemplate,
  type AgentHomeTemplateId,
} from '../features/agent-home/agentHomeTemplateCatalog';
import '../features/agent-home/agent-home.css';

type DashboardSurface = 'home' | 'guided';

const buildDemoReply = (templateId: AgentHomeTemplateId, text: string): string => {
  const request = text.toLowerCase();
  const template = getAgentHomeTemplate(templateId);
  const fixture = template?.demo?.fixture;

  if (fixture === 'retail') {
    if (request.includes('stock') || request.includes('backpack')) {
      return 'The preview inventory shows 6 TrailPro backpacks at the downtown store. I can answer availability questions and route the caller to the store for purchase help.';
    }
    if (request.includes('close') || request.includes('hour')) {
      return 'The preview store directory lists the downtown store as open today from 9 AM to 7 PM.';
    }
    return 'I can answer store, product, and returns questions from approved retail sources, then route the caller when a person is needed.';
  }

  if (fixture === 'cx-desktop') {
    if (request.includes('coaching') || request.includes('opportunit')) {
      return 'The preview review shows a strong greeting and accurate resolution. The clearest coaching opportunity is to confirm the next step before closing the interaction.';
    }
    return 'The preview interaction review highlights accurate guidance, a clear handoff, and one follow-up on closing confirmation. I can prepare a coaching task for supervisor review.';
  }

  if (fixture === 'incident') {
    if (request.includes('owner')) {
      return 'The preview service directory lists Commerce Platform as the owner, with Site Reliability Engineering as the current escalation partner.';
    }
    return 'I would triage this as a checkout-service incident, surface the latest deployment context, and prepare a stakeholder update. Remediation actions still require confirmation.';
  }

  if (fixture === 'property') {
    if (request.includes('schedule') || request.includes('tomorrow')) {
      return 'The preview schedule has technician windows at 10 AM and 2 PM tomorrow. I can prepare one after identity and location are verified; booking requires confirmation.';
    }
    if (request.includes('status')) {
      return 'The preview service request is assigned and awaiting a technician window. No external system has been changed during this demo.';
    }
    return 'I can verify the tenant and location, triage the maintenance issue, and prepare a ServiceNow request and technician visit for confirmation.';
  }

  if (!template) {
    return 'This template preview is unavailable. Choose another template and try again.';
  }

  const useCase = template.useCase.replace(/\.$/, '').toLowerCase();
  const workflow = template.workflow.map(step => `${step.charAt(0).toLowerCase()}${step.slice(1)}`);
  const knowledge = template.draft.knowledgeBases.slice(0, 2).map(source => source.name).join(' and ');
  if (request.includes('source') || request.includes('know')) {
    return `I use ${knowledge || 'the configured knowledge sources'} to answer questions about ${useCase}. I only use approved information and keep consequential actions ready for confirmation.`;
  }
  if (request.includes('person') || request.includes('human') || request.includes('handoff') || request.includes('transfer')) {
    return `I can hand the conversation to the right person with the relevant context when ${template.draft.name} reaches its configured boundary.`;
  }
  return `I can help with ${useCase}. I’ll ${workflow.join(', then ')}, while keeping the configured guardrails in place.`;
};

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    agents,
    agentDrafts,
    entitlements,
    createAgentDraft,
    selectAgent,
    showToast,
    setIsQuickCreateModalOpen,
  } = useApp();
  const { mode } = useAgentHomeScenario();
  const [surface, setSurface] = useState<DashboardSurface>('home');
  const [agentHomeFlow, setAgentHomeFlow] = useState<AgentHomeFirstTimeFlow>('home');
  const [guidedPrompt, setGuidedPrompt] = useState('');

  useEffect(() => {
    setSurface('home');
    setAgentHomeFlow('home');
    setGuidedPrompt('');
  }, [mode]);

  const resumableDraft = useMemo(
    () => Object.values(agentDrafts).find(draft => draft.lifecycle === 'draft') ?? null,
    [agentDrafts],
  );
  const permissionGranted = Object.values(entitlements).some(state => state === 'licensed');
  const snapshot = useMemo(
    () => buildAgentHomeSnapshot(mode, {
      permissionGranted,
      draft: mode === 'recurring' ? resumableDraft : null,
    }),
    [mode, permissionGranted, resumableDraft],
  );
  const openGuidedIntake = (prompt = '') => {
    setAgentHomeFlow('home');
    setGuidedPrompt(prompt.trim());
    setSurface('guided');
  };
  const existingAgents = useMemo(
    () => Object.values(agents).map(agent => ({
      id: agent.id,
      name: agent.name,
      initials: agent.initials,
      status: agent.status,
      sessions: agent.sessions,
    })),
    [agents],
  );

  const handleAction = (action: AgentHomeAction) => {
    if (action.requiresConfirmation) {
      showToast(`${action.label} is ready for review. Confirm it before applying changes.`, 'warning');
      return;
    }
    if (action.intent === 'start-intake') {
      openGuidedIntake();
      return;
    }
    if (action.intent === 'ask') {
      showToast('The latest portfolio summary is already reflected in the dashboard cards.', 'info');
      return;
    }
    if (action.href) navigate(action.href);
  };

  const handleUseTemplate = (
    templateId: AgentHomeTemplateId,
    setup?: AgentHomeTemplateSetup,
  ) => {
    const template = getAgentHomeTemplate(templateId);
    if (!template) {
      showToast('This template is unavailable. Choose another template and try again.', 'error');
      return;
    }
    if (entitlements[template.family] !== 'licensed') {
      showToast(`${template.name} is not available with the current license.`, 'warning');
      return;
    }

    const draft = createDraftFromHomeTemplate(templateId);
    const agentName = setup?.name.trim() || template.draft.name;
    const agentGoal = setup?.goal.trim() || template.proposal.purpose;
    draft.basics = {
      ...draft.basics,
      name: agentName,
      purpose: agentGoal,
    };
    const agent = createAgentDraft(draft);
    selectAgent(agent.id);
    showToast(`Created ${agentName} as a draft.`, 'success');
    navigate(`/agents/${agent.id}/configure?section=Profile`);
  };

  const handleDemoMessage = async (
    templateId: AgentHomeTemplateId,
    _history: AgentHomeDemoMessage[],
    text: string,
  ) => buildDemoReply(templateId, text);

  const openFleetAgent = (agent: FleetAgentSummary) => navigate(agent.href);
  const openWorkflowActivity = (activity: WorkflowActivity) => {
    if (activity.href) navigate(activity.href);
  };

  if (location.pathname.endsWith('/eva-canvas')) {
    return <EvaChatExperience />;
  }

  if (surface === 'guided') {
    return (
      <div className="new-mvo-home new-mvo-home--guided">
        <div className="new-mvo-home__guided-toolbar">
          <Button variant="tertiary" size="sm" onClick={() => setSurface('home')}>
            <Icon name="arrow-left" weight="bold" size="sm" />
            Back to agent home
          </Button>
        </div>
        <EvaChatExperience
          key={`guided-${mode}-${guidedPrompt}`}
          resetSessionOnInitialMount
          choiceOnlyGuidedFlow
          initialGuidedPrompt={guidedPrompt}
        />
      </div>
    );
  }

  return (
    <div className={`new-mvo-home new-mvo-home--landing${agentHomeFlow !== 'home' ? ' new-mvo-home--subflow' : ''} primary-content eva-agents-landing eva-agents-landing--flush`}>
      <div className="eva-first-interface eva-first-interface--landing eva-landing-shell new-mvo-home__landing-shell">
        {agentHomeFlow === 'home' && (
          <section
            className={`eva-first-interface__hero new-mvo-home__hero${mode === 'recurring' ? ' new-mvo-home__hero--recurring' : ''}`}
            aria-labelledby="agent-home-title"
          >
            <div className="eva-landing-hero-brand">
              <h1 id="agent-home-title">{mode === 'recurring' ? 'Hi Jackie' : 'AI Agent Studio'}</h1>
            </div>
            {mode === 'first-time' && (
              <h2>Build, deploy, and manage AI agents for every interaction.</h2>
            )}
          </section>
        )}
        <div className="new-mvo-home__dashboard">
          <AgentHomeDashboard
            mode={mode}
            creationAudience={mode}
            showGreeting={false}
            onFirstTimeFlowChange={setAgentHomeFlow}
            snapshot={snapshot}
            onAction={handleAction}
            onGuidedComposerSend={openGuidedIntake}
            onStartFromScratch={() => setIsQuickCreateModalOpen(true)}
            onUseTemplate={handleUseTemplate}
            onSendDemoMessage={handleDemoMessage}
            onOpenFleetAgent={openFleetAgent}
            onOpenWorkflowActivity={openWorkflowActivity}
            existingAgents={existingAgents}
          />
        </div>
      </div>
    </div>
  );
}
