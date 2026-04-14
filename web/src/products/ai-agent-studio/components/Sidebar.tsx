import type { MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../../contexts/AppContext';
import SideNav from '../../../components/shared/SideNav';
import { Icon } from '../../../icons/Icon';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: 'home-bold' },
  { path: '/agents', label: 'AI Agents', icon: 'bot-bold' },
  { path: '/assistant-skills', label: 'AI Assistant Skills', icon: 'setup-assistant-bold' },
  { path: '/knowledge', label: 'Knowledge', icon: 'apps-bold' },
  { path: '/connections', label: 'Integrations', icon: 'extension-mobility-bold' },
  { path: '/settings', label: 'AI Engine', icon: 'tools-bold' },
];

/** Shown in sidebar footer; opens Organization settings */
const ORGANIZATION_NAME = 'Renergize Healthcare';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { agents, openAgents, currentAgent, goToAgent, closeAgentNav } = useApp();
  const isAgentPage = location.pathname.startsWith('/agents/') && location.pathname !== '/agents';

  const isActive = (path: string, end = false) => {
    if (end) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleAgentClick = (agentId: string) => {
    goToAgent(agentId);
    navigate(`/agents/${agentId}`);
  };

  const handleCloseAgent = (e: MouseEvent, agentId: string) => {
    e.stopPropagation();
    closeAgentNav(agentId);
    if (location.pathname.startsWith(`/agents/${agentId}`)) {
      navigate('/agents');
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-main">
        <SideNav aria-label="Main navigation">
          <SideNav.Upper>
            <SideNav.Section>
              {navItems.map(item => {
                const itemActive =
                  item.path === '/agents' && isAgentPage
                    ? false
                    : item.path === '/settings'
                      ? location.pathname === '/settings'
                      : isActive(item.path, item.path === '/agents' || item.path === '/');

                return (
                  <SideNav.Item
                    key={item.path}
                    icon={item.icon}
                    label={item.label}
                    active={itemActive}
                    onClick={() => navigate(item.path)}
                  />
                );
              })}
            </SideNav.Section>

            {openAgents.length > 0 && (
              <>
                <SideNav.Divider />
                <div className="agent-menu-container">
                  {openAgents.map(agentId => {
                    const agent = agents[agentId];
                    if (!agent) return null;
                    const agentActive = currentAgent && currentAgent.id === agentId && isAgentPage;

                    return (
                      <div
                        key={agentId}
                        className={`sidenav-item agent-shortcut${agentActive ? ' active' : ''}`}
                      >
                        <div className="sidenav-marker" aria-hidden>
                          <div className="sidenav-marker-dot" />
                        </div>
                        <button
                          type="button"
                          className="sidenav-tab"
                          title={agent.name}
                          onClick={() => handleAgentClick(agentId)}
                        >
                          <span
                            className="agent-shortcut-icon"
                            style={{ background: agent.gradient }}
                            aria-hidden
                          >
                            {agent.initials}
                          </span>
                          <span className="sidenav-tab-label">{agent.name}</span>
                          <span
                            role="button"
                            tabIndex={0}
                            className="nav-close-btn"
                            onClick={(e) => { e.stopPropagation(); handleCloseAgent(e as unknown as MouseEvent, agentId); }}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); handleCloseAgent(e as unknown as MouseEvent, agentId); } }}
                            title="Remove shortcut"
                            aria-label={`Close ${agent.name}`}
                          >
                            <Icon name="cancel" size={12} />
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
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
