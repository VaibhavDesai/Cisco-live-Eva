import { useLocation, useNavigate } from 'react-router-dom';
import SideNav from '../../../components/shared/SideNav';
import { Icon } from '../../../icons/Icon';
import { useDesignVariation } from '../../../contexts/DesignVariationContext';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: 'home-bold' },
  { path: '/agents', label: 'AI Agents', icon: 'bot-bold' },
  { path: '/observability', label: 'Observability', icon: 'multiline-chart-regular' },
  { path: '/assistant-skills', label: 'AI Assistant Skills', icon: 'setup-assistant-bold' },
  { path: '/knowledge', label: 'Knowledge', icon: 'apps-bold' },
  { path: '/settings', label: 'AI Engine', icon: 'tools-bold' },
];

const ORGANIZATION_NAME = 'Renergize Healthcare';

interface SidebarProps {
  collapsed?: boolean;
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { setVariation } = useDesignVariation();

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
