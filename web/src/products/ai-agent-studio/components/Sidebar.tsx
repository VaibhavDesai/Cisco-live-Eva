import { useLocation, useNavigate } from 'react-router-dom';
import SideNav from '../../../components/shared/SideNav';
import { Icon } from '../../../icons/Icon';
import Toggle from '../../../components/shared/Toggle';
import Dropdown from '../../../components/shared/Dropdown';
import { useReview } from '../../../features/review/ReviewProvider';
import { useV2Mode } from '../../../contexts/V2ModeContext';

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

const ORGANIZATION_NAME = 'Renergize Healthcare';

const DESIGN_VARIATION_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'crosslaunch-v2', label: 'CrossLaunch V2' },
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
  const { active: v2Active, setActive: setV2Active } = useV2Mode();

  const isActive = (path: string, end = false) => {
    if (end) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

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
          value={v2Active ? 'crosslaunch-v2' : 'none'}
          size="compact"
          menuPlacement="top"
          onChange={value => setV2Active(value === 'crosslaunch-v2')}
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
