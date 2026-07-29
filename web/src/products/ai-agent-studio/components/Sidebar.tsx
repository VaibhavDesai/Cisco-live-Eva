import type { ReactNode } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import SideNav from '../../../components/shared/SideNav';
import { KnowledgeBookIcon } from '../../../components/shared/ConfigurationCategoryIcon';
import { Icon } from '../../../icons/Icon';
import { useApp } from '../../../contexts/AppContext';
import { useDesignVariation } from '../../../contexts/DesignVariationContext';
import { type AgentFamily } from '../../../features/agent-creation/agentCreationModel';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'New agent', icon: 'home-bold' },
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
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setVariation } = useDesignVariation();
  const { agents, agentDrafts, selectAgent } = useApp();

  const agentId = parseAgentId(location.pathname);
  const agent = agentId ? agents[agentId] : undefined;

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

    return (
      <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
        <div className="sidebar-main">
          <SideNav collapsed={collapsed} aria-label="Agent navigation" className="sidebar-agent-nav">
            <SideNav.Upper>
              <button
                type="button"
                className="sidebar-agent-back"
                onClick={() => navigate('/agents')}
                title="Back to AI Agents"
              >
                <span className="sidebar-agent-back__icon" aria-hidden>
                  <Icon name="arrow-left" size={16} />
                </span>
                <span className="sidebar-agent-back__label">Back to AI Agents</span>
              </button>

              <button
                type="button"
                className={`sidebar-agent-pill${isOverviewRoute ? ' sidebar-agent-pill--active' : ''}`}
                onClick={() => {
                  selectAgent(agentId);
                  navigate(`/agents/${agentId}`);
                }}
                title={`${agent.name} overview`}
              >
                <span className="sidebar-agent-pill__avatar" style={{ background: agent.gradient }} aria-hidden>
                  {agent.initials}
                </span>
                <span className="sidebar-agent-pill__text">
                  <span className="sidebar-agent-pill__name">{agent.name}</span>
                  <span className="sidebar-agent-pill__meta">CX concierge</span>
                </span>
              </button>

              <SideNav.Section header="Configure" className="sidebar-agent-section--first">
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

  /* Map canvas overlay routes back onto the parent tab so the sidebar
     highlight stays put while the canvas is open. /eva-canvas opens
     over the Dashboard root, /agents/eva-canvas opens over AI Agents —
     both already match via the standard isActive check, but we treat
     /eva-canvas explicitly as Dashboard so the index ('/') item stays
     highlighted instead of going inactive. */
  const isDashboardActive = location.pathname === '/' || location.pathname === '/eva-canvas';

  return (
    <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
      <div className="sidebar-main">
        <SideNav collapsed={collapsed} aria-label="Main navigation">
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
                    : item.path === '/'
                      ? isDashboardActive
                      : isActive(item.path, item.path === '/');

                return (
                  <SideNav.Item
                    key={item.path}
                    icon={item.icon}
                    label={item.label}
                    active={itemActive}
                    onClick={() => {
                      if (item.path === '/') {
                        setVariation('dashboard');
                      }
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
