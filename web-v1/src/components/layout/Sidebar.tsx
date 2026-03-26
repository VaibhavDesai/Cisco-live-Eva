import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { Icon } from '../../icons';
import type { IconName } from '../../icons';
import {
  SideNav,
  SideNavSection,
  SideNavItem,
  SideNavSubMenu,
  SideNavSubMenuItem,
  SideNavDivider,
} from '../shared/SideNav';

interface NavItem {
  path: string;
  label: string;
  iconName: IconName;
  expandable?: boolean;
  children?: { path: string; label: string }[];
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', iconName: 'home' },
  { path: '/agents', label: 'AI Agents', iconName: 'bot' },
  { path: '/assistant-skills', label: 'AI Assistant Skills', iconName: 'setup-assistant' },
  { path: '/knowledge', label: 'Knowledge', iconName: 'apps' },
  { path: '/connections', label: 'Integrations', iconName: 'extension-mobility' },
  { path: '/settings', label: 'AI Engine', iconName: 'tools' },
];

/** Shown in sidebar footer; opens Organization settings */
const ORGANIZATION_NAME = 'Renergize Healthcare';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { agents, openAgents, currentAgent, goToAgent, closeAgentNav } = useApp();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const isAgentPage = location.pathname.startsWith('/agents/') && location.pathname !== '/agents';

  const toggleSection = (path: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const isActive = (path: string, end = false) => {
    if (end) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleAgentClick = (agentId: string) => {
    goToAgent(agentId);
    navigate(`/agents/${agentId}`);
  };

  const handleCloseAgent = (e: React.MouseEvent, agentId: string) => {
    e.stopPropagation();
    closeAgentNav(agentId);
    if (location.pathname.startsWith(`/agents/${agentId}`)) {
      navigate('/agents');
    }
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-main">
        <SideNav aria-label="Main navigation">
          <SideNavSection>
            {navItems.map(item => {
              if (item.expandable) {
                const isExpanded = expandedSections.has(item.path);
                const isChildActive = item.children?.some(
                  child =>
                    location.pathname === child.path ||
                    location.pathname.startsWith(child.path + '/'),
                );

                return (
                  <div key={item.path}>
                    <SideNavItem
                      icon={item.iconName}
                      active={!!isChildActive}
                      hasChildren
                      expanded={isExpanded}
                      onClick={() => toggleSection(item.path)}
                    >
                      {item.label}
                    </SideNavItem>
                    {isExpanded && item.children && (
                      <SideNavSubMenu>
                        {item.children.map(child => (
                          <SideNavSubMenuItem
                            key={child.path}
                            active={isActive(child.path, true)}
                            onClick={() => navigate(child.path)}
                          >
                            {child.label}
                          </SideNavSubMenuItem>
                        ))}
                      </SideNavSubMenu>
                    )}
                  </div>
                );
              }

              const itemActive =
                item.path === '/agents' && isAgentPage
                  ? false
                  : item.path === '/settings'
                    ? location.pathname === '/settings'
                    : isActive(
                        item.path,
                        item.path === '/agents' || item.path === '/',
                      );

              return (
                <SideNavItem
                  key={item.path}
                  icon={item.iconName}
                  active={itemActive}
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </SideNavItem>
              );
            })}
          </SideNavSection>

          {openAgents.length > 0 && (
            <>
              <SideNavDivider />
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
                      </button>
                      <button
                        type="button"
                        className="nav-close-btn"
                        onClick={e => handleCloseAgent(e, agentId)}
                        title="Remove shortcut"
                        aria-label={`Close ${agent.name}`}
                      >
                        <Icon name="cancel" weight="bold" size="xs" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
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
            <Icon
              name="company"
              weight="bold"
              size={16}
              color="var(--color-theme-common-text-primary-normal)"
            />
          </span>
          <span className="sidebar-org-pill__label">{ORGANIZATION_NAME}</span>
        </button>
      </div>
    </nav>
  );
}
