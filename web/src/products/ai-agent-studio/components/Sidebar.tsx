import { useLocation, useNavigate } from 'react-router-dom';
import SideNav from '../../../components/shared/SideNav';
import { Icon } from '../../../icons/Icon';
import Toggle from '../../../components/shared/Toggle';
import Dropdown from '../../../components/shared/Dropdown';
import { useReview } from '../../../features/review/ReviewProvider';
import { useDesignVariation } from '../../../contexts/DesignVariationContext';
import type { DesignVariation } from '../../../contexts/designVariationStore';

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
  { path: '/connections', label: 'Integrations', icon: 'extension-mobility-bold' },
  { path: '/settings', label: 'AI Engine', icon: 'tools-bold' },
];

const ORGANIZATION_NAME = 'Renergize Healthcare';

const DESIGN_VARIATION_OPTIONS: Array<{ value: DesignVariation; label: string }> = [
  { value: 'landing', label: 'Chat-based in Ai Agent' },
  { value: 'dashboard', label: 'Chat-based in Dashboard' },
  { value: 'form-bases', label: 'Form-based in Ai Agent' },
];

interface SidebarProps {
  collapsed?: boolean;
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    configured: reviewConfigured,
    active: reviewActive,
    toggleActive: toggleReview,
    openCommentsModal,
  } = useReview();
  const { variation, setVariation } = useDesignVariation();

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
                    onClick={() => navigate(item.path)}
                  />
                );
              })}
            </SideNav.Section>
          </SideNav.Upper>
        </SideNav>
      </div>
      <div className="sidebar-bottom">
        <div
          className="sidebar-comment-toggle sidebar-comment-toggle--with-hint"
          data-review-ui
          title={
            !reviewConfigured
              ? 'Comment mode unavailable — Supabase is not configured.'
              : reviewActive
                ? 'Comment mode is on — click any element to leave feedback.'
                : 'Turn on to leave inline comments on any element.'
          }
        >
          <span className="sidebar-comment-toggle__copy">
            <span className="sidebar-comment-toggle__label">Comment mode</span>
            <span className="sidebar-comment-toggle__hint">Press C to turn on/off</span>
          </span>
          <Toggle
            size="compact"
            checked={reviewActive}
            disabled={!reviewConfigured}
            onChange={() => {
              void toggleReview();
            }}
            aria-label={reviewActive ? 'Turn off comment mode' : 'Turn on comment mode'}
          />
          <button
            type="button"
            className="sidebar-comment-toggle__view-all"
            data-review-ui
            onClick={openCommentsModal}
            disabled={!reviewConfigured}
            title="View all comments"
            aria-label="View all comments"
          >
            <Icon name="list-menu" size={14} />
          </button>
        </div>
        <Dropdown
          className="sidebar-design-variation-select"
          label="Design Variations"
          options={DESIGN_VARIATION_OPTIONS}
          value={variation}
          size="compact"
          menuPlacement="top"
          onChange={value => setVariation(value as DesignVariation)}
        />
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
