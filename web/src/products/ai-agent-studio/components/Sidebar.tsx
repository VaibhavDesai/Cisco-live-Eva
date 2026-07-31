import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import SideNav from '../../../components/shared/SideNav';
import { KnowledgeBookIcon } from '../../../components/shared/ConfigurationCategoryIcon';
import { Icon } from '../../../icons/Icon';
import { useApp } from '../../../contexts/AppContext';
import { type AgentFamily } from '../../../features/agent-creation/agentCreationModel';
import { useUpliftWorkspace } from '../UpliftWorkspaceContext';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/agents', label: 'AI Agents', icon: 'bot-bold' },
  { path: '/observability', label: 'Observability', icon: 'multiline-chart-regular' },
  { path: '/knowledge', label: 'Knowledge', icon: 'apps-bold' },
  { path: '/settings', label: 'AI Engine', icon: 'tools-bold' },
];

const ORGANIZATION_NAME = 'Renergize Healthcare';

/* Agent-scoped navigation. `section` maps to the ?section= query param that
   ActionConfigureV2 reads; `families` gates which agent families surface the
   item (omit to always show). */
interface ConfigureItem {
  section: string;
  label: string;
  icon: string | ReactNode;
  families?: AgentFamily[];
}

const CONFIGURE_ITEMS: ConfigureItem[] = [
  { section: 'Profile', label: 'Profile', icon: 'contact-card-bold' },
  { section: 'Channels', label: 'Channels', icon: 'headset-bold', families: ['calling', 'contact_center'] },
  { section: 'Instructions', label: 'Instructions', icon: 'document-bold' },
  { section: 'Knowledge', label: 'Knowledge & Memory', icon: <KnowledgeBookIcon size={24} /> },
  { section: 'Action', label: 'Actions', icon: 'tools-bold', families: ['contact_center', 'internal_assistant'] },
  { section: 'Security', label: 'Security', icon: 'shield-bold', families: ['contact_center', 'internal_assistant'] },
];

interface MonitorItem {
  path: string;
  label: string;
  icon: string;
}

const MONITOR_ITEMS: MonitorItem[] = [
  { path: 'analytics', label: 'Testing', icon: 'test-tube-bold' },
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
  surfaceCompact?: boolean;
  onAgentPanelOpenChange?: (open: boolean) => void;
}

export default function Sidebar({
  collapsed = false,
  agentPanelOpen = true,
  surfaceCompact = false,
  onAgentPanelOpenChange,
}: SidebarProps) {
  const [workspaceNavHovered, setWorkspaceNavHovered] = useState(false);
  const [workspaceNavFocusWithin, setWorkspaceNavFocusWithin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { agents, agentDrafts, selectAgent } = useApp();
  const { setSnap } = useUpliftWorkspace();

  const agentId = parseAgentId(location.pathname);
  const agent = agentId ? agents[agentId] : undefined;
  const openAgentPanel = (restoreFocus = false) => {
    if (surfaceCompact) setSnap('expanded');
    onAgentPanelOpenChange?.(true);
    if (restoreFocus) {
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLButtonElement>('.uplift-agent-panel__collapse')?.focus();
      });
    }
  };

  /* ── Agent-scoped navigation ─────────────────────────────────────── */
  if (agentId && agent) {
    const family = agent.family ?? agentDrafts[agentId]?.family;
    const configureItems = CONFIGURE_ITEMS.filter(
      item => !item.families || !family || item.families.includes(family),
    );

    // The bare /agents/:id route is the agent Overview (agent-name view);
    // configuration sections live under /configure with a ?section= param.
    const isOverviewRoute = location.pathname === `/agents/${agentId}`;
    const onConfigureRoute = location.pathname === `/agents/${agentId}/configure`;
    const activeSection = searchParams.get('section') || 'Profile';
    const activeMonitorPath = MONITOR_ITEMS.find(
      item => location.pathname === `/agents/${agentId}/${item.path}`,
    )?.path;

    if (surfaceCompact) {
      return (
        <aside className="sidebar sidebar--collapsed uplift-agent-compact-rail">
          <div className="sidebar-main">
            <SideNav collapsed aria-label="Compact agent navigation">
              <SideNav.Upper>
                <SideNav.Section>
                  <SideNav.Item
                    icon={<Icon name="dashboard" weight="bold" size={24} />}
                    label="Configuration"
                    active={isOverviewRoute}
                    onClick={() => {
                      selectAgent(agentId);
                      setSnap('expanded');
                      navigate(`/agents/${agentId}`);
                    }}
                  />
                </SideNav.Section>

                <SideNav.Section divider>
                  {configureItems.map(item => (
                    <SideNav.Item
                      key={item.section}
                      icon={item.icon}
                      label={item.label}
                      active={onConfigureRoute && activeSection === item.section}
                      onClick={() => {
                        selectAgent(agentId);
                        setSnap('expanded');
                        navigate(`/agents/${agentId}/configure?section=${item.section}`);
                      }}
                    />
                  ))}
                </SideNav.Section>

                <SideNav.Section divider>
                  {MONITOR_ITEMS.map(item => (
                    <SideNav.Item
                      key={item.path}
                      icon={item.icon}
                      label={item.label}
                      active={activeMonitorPath === item.path}
                      onClick={() => {
                        selectAgent(agentId);
                        setSnap('expanded');
                        navigate(`/agents/${agentId}/${item.path}`);
                      }}
                    />
                  ))}
                </SideNav.Section>
              </SideNav.Upper>
            </SideNav>
          </div>
        </aside>
      );
    }

    if (!agentPanelOpen) {
      return (
        <button
          type="button"
          className="uplift-agent-panel-handle"
          aria-label="Open agent navigation"
          title="Open agent navigation"
          onClick={() => openAgentPanel(true)}
        >
          <span className="uplift-agent-panel__grabber-dots" aria-hidden>
            <span />
            <span />
            <span />
          </span>
        </button>
      );
    }

    return (
      <aside className="sidebar uplift-agent-panel">
        <button
          type="button"
          className="uplift-agent-panel__collapse"
          aria-label="Collapse agent navigation"
          title="Collapse agent navigation"
          onClick={() => {
            onAgentPanelOpenChange?.(false);
            window.requestAnimationFrame(() => {
              document.querySelector<HTMLButtonElement>('.uplift-agent-panel-handle')?.focus();
            });
          }}
        >
          <span className="uplift-agent-panel__grabber-dots" aria-hidden>
            <span />
            <span />
            <span />
          </span>
        </button>
        <div className="sidebar-main">
          <Link
            className="sidebar-agent-back-link"
            to="/agents"
            onClick={() => onAgentPanelOpenChange?.(false)}
          >
            <Icon name="arrow-left" weight="bold" size="xs" />
            <span>Back to AI Agents</span>
          </Link>
          <div className="sidebar-agent-progress-title">
            <Icon name="list-menu" weight="bold" size={20} />
            <h2>Progress</h2>
          </div>
          <SideNav aria-label="Agent navigation" className="sidebar-agent-nav">
            <SideNav.Upper>
              <SideNav.Item
                icon="dashboard-bold"
                label="Overview"
                active={isOverviewRoute}
                onClick={() => {
                  selectAgent(agentId);
                  navigate(`/agents/${agentId}`);
                }}
              />

              <SideNav.Section header="Configure">
                {configureItems.map(item => (
                  <SideNav.Item
                    key={item.section}
                    icon={item.icon}
                    label={item.label}
                    active={onConfigureRoute && activeSection === item.section}
                    onClick={() => {
                      selectAgent(agentId);
                      navigate(`/agents/${agentId}/configure?section=${item.section}`);
                    }}
                  />
                ))}
              </SideNav.Section>

              <SideNav.Section header="Monitor">
                {MONITOR_ITEMS.map(item => (
                  <SideNav.Item
                    key={item.path}
                    icon={item.icon}
                    label={item.label}
                    active={activeMonitorPath === item.path}
                    onClick={() => {
                      selectAgent(agentId);
                      navigate(`/agents/${agentId}/${item.path}`);
                    }}
                  />
                ))}
              </SideNav.Section>
            </SideNav.Upper>
          </SideNav>
        </div>
      </aside>
    );
  }

  /* ── Workspace navigation ────────────────────────────────────────── */
  const isActive = (path: string, end = false) => {
    if (end) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  const workspaceNavCollapsed =
    collapsed || (!workspaceNavHovered && !workspaceNavFocusWithin);

  return (
    <aside
      className={`sidebar workspace-sidebar${workspaceNavCollapsed ? ' sidebar--collapsed' : ' workspace-sidebar--expanded'}`}
      onMouseEnter={() => setWorkspaceNavHovered(true)}
      onMouseLeave={() => setWorkspaceNavHovered(false)}
      onFocusCapture={() => setWorkspaceNavFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setWorkspaceNavFocusWithin(false);
        }
      }}
    >
      <div className="sidebar-main">
        <SideNav collapsed={workspaceNavCollapsed} aria-label="Main navigation">
          <SideNav.Upper>
            <SideNav.Section>
              {navItems.map(item => {
                const itemActive =
                  item.path === '/settings'
                    ? location.pathname === '/settings'
                    : item.path === '/observability'
                      ? location.pathname === '/observability' ||
                        location.pathname === '/kpi-dashboard' ||
                        location.pathname.endsWith('/kpi-dashboard')
                    : isActive(item.path);

                return (
                  <SideNav.Item
                    key={item.path}
                    icon={item.icon}
                    label={item.label}
                    active={itemActive}
                    onClick={() => {
                      if (collapsed) setSnap('expanded');
                      navigate(item.path);
                    }}
                  />
                );
              })}
            </SideNav.Section>
          </SideNav.Upper>
        </SideNav>
      </div>
      <div className="sidebar-bottom">
        <button
          type="button"
          className={`sidebar-org-pill${location.pathname === '/settings/organization' ? ' sidebar-org-pill--active' : ''}`}
          onClick={() => navigate('/settings/organization')}
          title="Organization settings"
        >
          <span className="sidebar-org-pill__icon" aria-hidden>
            <Icon name="company" size={16} />
          </span>
          <span className="sidebar-org-pill__label">{ORGANIZATION_NAME}</span>
        </button>
      </div>
    </aside>
  );
}
