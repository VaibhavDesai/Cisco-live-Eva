import { type ReactNode } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { KnowledgeBookIcon } from '../../../components/shared/ConfigurationCategoryIcon';
import type { IconName } from '../../../icons/types';
import { useApp } from '../../../contexts/AppContext';
import { type AgentFamily } from '../../../features/agent-creation/agentCreationModel';
import { getAgentDisplayType } from '../../../features/agent-creation/agentDisplayType';
import AssistantControlRail from './AssistantControlRail';

interface NavItem {
  path: string;
  label: string;
  icon: IconName;
}

const navItems: NavItem[] = [
  { path: '/new-agent', label: 'Home', icon: 'home' },
  { path: '/agents', label: 'AI Agents', icon: 'bot' },
  { path: '/observability', label: 'Observability', icon: 'multiline-chart' },
  { path: '/knowledge', label: 'Knowledge', icon: 'apps' },
  { path: '/settings', label: 'AI Engine', icon: 'instant-schedule' },
];

const ORGANIZATION_NAME = 'Eagle Green';

/* Agent-scoped navigation. `section` maps to the ?section= query param that
   ActionConfigureV2 reads; `families` gates which agent families surface the
   item (omit to always show). */
interface ConfigureItem {
  section: string;
  label: string;
  icon: string | ReactNode;
  families?: AgentFamily[];
  familyLabels?: Partial<Record<AgentFamily, string>>;
}

const CONFIGURE_ITEMS: ConfigureItem[] = [
  { section: 'Profile', label: 'Profile', icon: 'contact-card-bold' },
  { section: 'Instructions', label: 'Instructions', icon: 'document-bold' },
  { section: 'Knowledge', label: 'Knowledge & Memory', icon: <KnowledgeBookIcon size={24} />, familyLabels: { calling: 'Knowledge' } },
  { section: 'Action', label: 'Actions', icon: 'tools-bold', families: ['calling', 'contact_center', 'internal_assistant'] },
  { section: 'Security', label: 'Security', icon: 'shield-bold', families: ['contact_center', 'internal_assistant'] },
  { section: 'Conversation', label: 'Conversation', icon: 'chat-bold', families: ['contact_center', 'internal_assistant'] },
];

const DEPLOY_ITEMS: ConfigureItem[] = [
  { section: 'Channels', label: 'Channels', icon: 'headset-bold', families: ['calling', 'contact_center'] },
  { section: 'Flow', label: 'Flow', icon: 'workflow-deployments-bold', families: ['contact_center'] },
];

interface MonitorItem {
  path: string;
  label: string;
  icon: string;
}

const TESTING_ITEM: MonitorItem = { path: 'analytics', label: 'Testing', icon: 'test-tube-bold' };

const MONITOR_ITEMS: MonitorItem[] = [
  { path: 'sessions', label: 'Sessions', icon: 'chat-bold' },
  { path: 'history', label: 'History', icon: 'recents-bold' },
];

/* Returns the agent id when the current route is scoped to a specific agent
   (e.g. /agents/:id, /agents/:id/configure). Excludes the /agents list and the
   /agents/eva-canvas overlay, which stay on the workspace navigation. */
function parseAgentId(pathname: string): string | null {
  const match = pathname.match(/^\/agents\/([^/]+)/);
  if (!match) return null;
  const id = match[1];
  if (id === 'eva-canvas') return null;
  return id;
}

interface SidebarProps {
  collapsed?: boolean;
  agentPanelOpen?: boolean;
  onAgentPanelOpenChange?: (open: boolean) => void;
}

export default function Sidebar({
  collapsed = false,
  agentPanelOpen = true,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { agents, agentDrafts, selectAgent } = useApp();

  const agentId = parseAgentId(location.pathname);
  const agent = agentId ? agents[agentId] : undefined;

  const isActive = (path: string, end = false) => {
    if (end) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isNewAgentActive = location.pathname === '/new-agent';
  const railItems = navItems.map((item, index) => {
    const itemActive =
      item.path === '/settings'
        ? location.pathname === '/settings'
        : item.path === '/observability'
          ? location.pathname === '/observability' ||
            location.pathname === '/kpi-dashboard' ||
            location.pathname.endsWith('/kpi-dashboard')
          : item.path === '/new-agent'
            ? isNewAgentActive
            : isActive(item.path, item.path === '/');

    return {
      id: item.path,
      label: item.label,
      icon: item.icon,
      active: itemActive,
      dividerBefore: index === 3,
      onClick: () => navigate(item.path),
    };
  });

  /* ── Agent-scoped navigation ─────────────────────────────────────── */
  if (agentId && agent) {
    const family = agent.family ?? agentDrafts[agentId]?.family;
    const is360FeedbackAgent = agentDrafts[agentId]?.familyConfiguration.channels?.values?.scenario === 'feedback360';
    const agentDisplayType = getAgentDisplayType({
      id: agentId,
      family,
      displayType: agent.displayType,
    });
    const hidesAdvancedConfiguration = ['AI receptionist', 'Personal agent'].includes(agentDisplayType);
    const configureItems = CONFIGURE_ITEMS.filter(
      item => (!item.families || !family || item.families.includes(family))
        && !(hidesAdvancedConfiguration && ['Security', 'Conversation'].includes(item.section)),
    );
    const hidesDeployment = !is360FeedbackAgent && ['CX concierge', 'CX specialist'].includes(agentDisplayType);
    const deployItems = hidesDeployment
      ? []
      : DEPLOY_ITEMS.filter(
        item => (!item.families || !family || item.families.includes(family))
          && !(agentDisplayType === 'Personal agent' && item.section === 'Channels')
          && !(hidesAdvancedConfiguration && item.section === 'Flow'),
      );

    // The bare /agents/:id route is the agent Overview (agent-name view);
    // configuration sections live under /configure with a ?section= param.
    const isOverviewRoute = location.pathname === `/agents/${agentId}`;
    const onConfigureRoute = location.pathname === `/agents/${agentId}/configure`;
    const activeSection = searchParams.get('section') || 'Profile';
    const activeRoutePath = [TESTING_ITEM, ...MONITOR_ITEMS].find(
      item => location.pathname === `/agents/${agentId}/${item.path}`,
    )?.path;

    const overviewItem = {
      id: 'overview',
      label: 'Overview',
      active: isOverviewRoute,
      onClick: () => {
        selectAgent(agentId);
        navigate(`/agents/${agentId}`);
      },
    };
    const configureNavItems = [
      ...configureItems.map(item => ({
        id: `configure-${item.section}`,
        label: agentDisplayType === 'AI receptionist' && item.section === 'Knowledge'
          ? 'Knowledge'
          : item.familyLabels?.[family ?? 'contact_center'] ?? item.label,
        active: onConfigureRoute && activeSection === item.section,
        onClick: () => {
          selectAgent(agentId);
          navigate(`/agents/${agentId}/configure?section=${item.section}`);
        },
      })),
      ...(family !== 'calling' && !hidesAdvancedConfiguration ? [{
        id: TESTING_ITEM.path,
        label: TESTING_ITEM.label,
        active: activeRoutePath === TESTING_ITEM.path,
        onClick: () => {
          selectAgent(agentId);
          navigate(`/agents/${agentId}/${TESTING_ITEM.path}`);
        },
      }] : []),
    ];
    const deployNavItems = [
      ...deployItems.map(item => ({
        id: `deploy-${item.section}`,
        label: item.label,
        active: onConfigureRoute && activeSection === item.section,
        onClick: () => {
          selectAgent(agentId);
          navigate(`/agents/${agentId}/configure?section=${item.section}`);
        },
      })),
    ];
    const monitorNavItems = MONITOR_ITEMS.map(item => ({
      id: item.path,
      label: item.label,
      active: activeRoutePath === item.path,
      onClick: () => {
        selectAgent(agentId);
        navigate(`/agents/${agentId}/${item.path}`);
      },
    }));
    const navigationGroups = [
      { label: 'Configure', items: configureNavItems },
      { label: 'Deploy', items: deployNavItems },
      { label: 'Monitor', items: monitorNavItems },
    ].filter(group => group.items.length > 0);

    if (!agentPanelOpen) {
      return (
        <aside className="sidebar agent-shell-navigation agent-shell-navigation--level-one-only">
          <AssistantControlRail
            type="Collapsed"
            contentPanel="Closed"
            items={railItems}
            footerLabel={ORGANIZATION_NAME}
            footerActive={location.pathname === '/settings/organization'}
            onFooterClick={() => navigate('/settings/organization')}
          />
        </aside>
      );
    }

    return (
      <aside className="sidebar agent-shell-navigation">
        <div className="agent-shell-navigation__level-one">
          <AssistantControlRail
            type="Collapsed"
            contentPanel="Open"
            items={railItems}
            footerLabel={ORGANIZATION_NAME}
            footerActive={location.pathname === '/settings/organization'}
            onFooterClick={() => navigate('/settings/organization')}
          />
        </div>
        <nav className="agent-level-two-nav" aria-label="Agent navigation">
          <button
            type="button"
            className={`agent-level-two-nav__item${overviewItem.active ? ' agent-level-two-nav__item--active' : ''}`}
            aria-current={overviewItem.active ? 'page' : undefined}
            onClick={overviewItem.onClick}
          >
            {overviewItem.label}
          </button>
          {navigationGroups.map(group => (
            <div className="agent-level-two-nav__section" key={group.label}>
              <span className="agent-level-two-nav__section-label">{group.label}</span>
              {group.items.map(item => (
            <button
              key={item.id}
              type="button"
              className={`agent-level-two-nav__item${item.active ? ' agent-level-two-nav__item--active' : ''}`}
              aria-current={item.active ? 'page' : undefined}
              onClick={item.onClick}
            >
              {item.label}
            </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>
    );
  }

  /* ── Workspace navigation ────────────────────────────────────────── */
  return (
    <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
      <AssistantControlRail
        type={collapsed ? 'Collapsed' : 'Expanded'}
        contentPanel="Closed"
        items={railItems}
        footerLabel={ORGANIZATION_NAME}
        footerActive={location.pathname === '/settings/organization'}
        onFooterClick={() => navigate('/settings/organization')}
      />
    </aside>
  );
}
