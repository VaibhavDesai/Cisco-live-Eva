import { Link, useNavigate } from 'react-router-dom';
import { AgentHeader } from '../../components/agents';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import { useApp, type Agent } from '../../contexts/AppContext';
import {
  FAMILY_METADATA,
  type AgentFamily,
} from '../../features/agent-creation/agentCreationModel';
import { Icon } from '../../icons';
import { useUpliftWorkspace } from '../../products/ai-agent-studio/UpliftWorkspaceContext';

const familyBadgeVariant = (family: AgentFamily) => {
  if (family === 'calling') return 'warning' as const;
  if (family === 'contact_center') return 'success' as const;
  return 'info' as const;
};

const lifecycleStatusLabel = (lifecycle: string) => {
  if (lifecycle === 'draft') return 'Draft';
  if (lifecycle === 'published') return 'Published';
  if (lifecycle === 'deployed') return 'Deployed';
  return 'Live';
};

interface AgentMonitorHeaderProps {
  agent: Agent;
  activeTab: 'analytics' | 'sessions' | 'history';
}

export default function AgentMonitorHeader({
  agent,
  activeTab,
}: AgentMonitorHeaderProps) {
  const navigate = useNavigate();
  const { agentDrafts, showToast } = useApp();
  const { state: upliftWorkspaceState, setSnap } = useUpliftWorkspace();
  const agentDraft = agentDrafts[agent.id];
  const family = agentDraft?.family ?? agent.family;
  const lifecycle = agentDraft?.lifecycle ?? agent.lifecycle ?? 'draft';
  const familyName = family ? FAMILY_METADATA[family].label : 'Agent family not assigned';
  const familyBadgeLabel = family === 'contact_center'
    ? 'CX Concierge'
    : family
      ? FAMILY_METADATA[family].label
      : familyName;
  const studioHeaderAgent = { ...agent, meta: agent.description };

  const headerStatus = (
    <div
      className="agent-studio-agent-metadata"
      aria-label={`${familyBadgeLabel}; ${lifecycleStatusLabel(lifecycle)}`}
    >
      {family && (
        <Badge className="agent-studio-family-badge" variant={familyBadgeVariant(family)}>
          {familyBadgeLabel}
        </Badge>
      )}
      <span className={`agent-studio-lifecycle-status agent-studio-lifecycle-status--${lifecycle}`}>
        <span className="agent-studio-lifecycle-status__dot" aria-hidden="true" />
        <span>{lifecycleStatusLabel(lifecycle)}</span>
      </span>
    </div>
  );

  const headerActions = (
    <div
      className="agent-studio-header-actions"
      role="group"
      aria-label={`${familyName}; monitor actions`}
    >
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="agent-studio-header-action agent-studio-header-action--icon"
        aria-label={upliftWorkspaceState.productSurface.snap === 'expanded'
          ? 'Switch AI Agent Studio to split view'
          : 'Expand AI Agent Studio workspace'}
        title={upliftWorkspaceState.productSurface.snap === 'expanded'
          ? 'Split view'
          : 'Expanded view'}
        aria-pressed={upliftWorkspaceState.productSurface.snap === 'expanded'}
        onClick={() => setSnap(
          upliftWorkspaceState.productSurface.snap === 'expanded' ? 'split' : 'expanded',
        )}
      >
        <Icon name="side-panel" weight="regular" size="sm" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="agent-studio-header-action"
        aria-label={`Open ${agent.name} preview`}
        onClick={() => navigate(`/agents/${agent.id}`)}
      >
        <Icon name="play" weight="bold" size="xs" />
        Preview
      </Button>
      <Button
        type="button"
        size="sm"
        className="agent-studio-header-action"
        aria-label={`Save ${agent.name} configuration`}
        onClick={() => showToast('No changes to save', 'info')}
      >
        Save
      </Button>
    </div>
  );

  return (
    <AgentHeader
      agent={studioHeaderAgent}
      activeTab={activeTab}
      showPublishButton={false}
      showTabs={false}
      headerTop={(
        <Link className="agent-studio-back-link" to="/agents">
          <Icon name="arrow-left" weight="bold" size="xs" />
          <span>Back to AI Agents</span>
        </Link>
      )}
      statusContent={headerStatus}
      headerRight={headerActions}
    />
  );
}
