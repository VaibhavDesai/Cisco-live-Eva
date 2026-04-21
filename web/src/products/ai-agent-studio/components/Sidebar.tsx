import { useLocation, useNavigate } from 'react-router-dom';
import SideNav from '../../../components/shared/SideNav';
import { Icon } from '../../../icons/Icon';
import Toggle from '../../../components/shared/Toggle';
import { useReview } from '../../../features/review/ReviewProvider';

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

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    configured: reviewConfigured,
    active: reviewActive,
    toggleActive: toggleReview,
    openCommentsModal,
  } = useReview();

  const isActive = (path: string, end = false) => {
    if (end) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-main">
        <SideNav aria-label="Main navigation">
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
          className="sidebar-comment-toggle"
          data-review-ui
          title={
            !reviewConfigured
              ? 'Comment mode unavailable — Supabase is not configured.'
              : reviewActive
                ? 'Comment mode is on — click any element to leave feedback.'
                : 'Turn on to leave inline comments on any element.'
          }
        >
          <span className="sidebar-comment-toggle__icon" aria-hidden>
            <Icon name="chat" size={14} />
          </span>
          <span className="sidebar-comment-toggle__label">Comment</span>
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
          <Toggle
            size="compact"
            checked={reviewActive}
            disabled={!reviewConfigured}
            onChange={() => {
              void toggleReview();
            }}
            aria-label={reviewActive ? 'Turn off comment mode' : 'Turn on comment mode'}
          />
        </div>
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
