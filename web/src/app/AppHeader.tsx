import React, { useEffect, useRef, useState } from 'react';
import {
  Avatar,
  Button,
  Icon,
  Toggle,
} from '@momentum-design/components/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useThemeMode } from './ThemeContext';
import { useProjects } from '../projects/useProjects';
import { getProjectDefaultPath } from '../projects/project-routing';
import { publicAssetUrl } from './publicAsset';
import { useCoBuilder } from './CoBuilderContext';
import { useStatesVersions } from './StatesVersionsContext';
import { useSideNav } from './SideNavContext';

/** Icon button styled per Figma CX Studio App Header */
function HeaderIconButton({
  icon,
  ariaLabel,
  onClick,
}: {
  icon: string;
  ariaLabel: string;
  onClick?: () => void;
}) {
  return (
    <Button
      variant="primary"
      size={32}
      prefixIcon={icon as React.ComponentProps<typeof Button>['prefixIcon']}
      aria-label={ariaLabel}
      onClick={onClick}
      className="app-header-icon-btn"
    />
  );
}

function VerticalDividerLine() {
  return <div className="app-header-divider" />;
}

export function AppHeader() {
  const { theme, toggleTheme } = useThemeMode();
  const { projects, currentProjectId, setCurrentProjectId } = useProjects();
  const { coBuilderEnabled, setCoBuilderEnabled } = useCoBuilder();
  const { toolbarEnabled, setToolbarEnabled } = useStatesVersions();
  const { isOpen: sideNavOpen, toggle: toggleSideNav } = useSideNav();
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const projectMenuRef = useRef<HTMLDivElement | null>(null);
  const avatarMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!projectMenuOpen && !avatarMenuOpen) {
      return;
    }
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }
      if (projectMenuOpen && projectMenuRef.current && !projectMenuRef.current.contains(target)) {
        setProjectMenuOpen(false);
      }
      if (avatarMenuOpen && avatarMenuRef.current && !avatarMenuRef.current.contains(target)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [projectMenuOpen, avatarMenuOpen]);

  const switchProject = (nextProjectId: string) => {
    if (nextProjectId === currentProjectId) {
      setProjectMenuOpen(false);
      return;
    }
    const nextProject = projects.find((project) => project.id === nextProjectId);
    setCurrentProjectId(nextProjectId);
    if (nextProject) {
      navigate(getProjectDefaultPath(nextProjectId, nextProject.navSectionIds));
    } else {
      navigate(`/${nextProjectId}`);
    }
    setProjectMenuOpen(false);
  };

  return (
    <header className="app-header">
      {/* Left: nav toggle (narrow only) + wordmark */}
      <div className="app-header-left">
        <Button
          variant="primary"
          size={32}
          prefixIcon={
            (sideNavOpen ? 'cancel-bold' : 'list-menu-bold') as React.ComponentProps<
              typeof Button
            >['prefixIcon']
          }
          aria-label={sideNavOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={sideNavOpen}
          aria-controls="app-side-nav"
          onClick={toggleSideNav}
          className="app-header-icon-btn app-header-nav-toggle"
        />
        <img
          src={publicAssetUrl('images/webex-suite-wordmark.png')}
          alt="Webex"
          className="app-header-wordmark"
        />
      </div>

      {/* Spacer */}
      <div className="app-header-spacer" />

      {/* Right: announcement, help, notifications, waffle, avatar (theme in avatar menu) */}
      <div className="app-header-right">
        <HeaderIconButton icon="announcement-bold" ariaLabel="Announcements" />
        <HeaderIconButton icon="help-circle-bold" ariaLabel="Help" />
        <HeaderIconButton icon="alert-bold" ariaLabel="Notifications" />
        <VerticalDividerLine />
        <div className="app-project-menu-wrapper" ref={projectMenuRef}>
          <HeaderIconButton
            icon="waffle-menu-bold"
            ariaLabel="App launcher"
            onClick={() => {
              setAvatarMenuOpen(false);
              setProjectMenuOpen((open) => !open);
            }}
          />
          {projectMenuOpen && (
            <div className="app-project-menu" role="menu" aria-label="Projects">
              <div className="app-project-menu-title">Projects</div>
              {routeProjectId && (
                <button
                  type="button"
                  className="app-project-menu-back"
                  onClick={() => {
                    setProjectMenuOpen(false);
                    navigate('/');
                  }}
                >
                  <Icon name="arrow-left-bold" size={16} lengthUnit="px" aria-hidden />
                  <span>Back to dashboard</span>
                </button>
              )}
              <div className="app-project-menu-list">
                {projects.map((project) => {
                  const isActive = project.id === currentProjectId;
                  return (
                    <div className="app-project-menu-row" key={project.id}>
                      <button
                        type="button"
                        className={`app-project-menu-item${isActive ? ' app-project-menu-item-active' : ''}`}
                        onClick={() => switchProject(project.id)}
                      >
                        {project.name}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="app-project-menu-co-builder">
                <Toggle
                  size="compact"
                  label="CCD Co-Builder"
                  helpText="Show the floating builder button on the page."
                  checked={coBuilderEnabled}
                  onChange={() => setCoBuilderEnabled(!coBuilderEnabled)}
                />
                <Toggle
                  size="compact"
                  label="States and Versions"
                  helpText="Show the floating toolbar to switch UI versions and states."
                  checked={toolbarEnabled}
                  onChange={() => setToolbarEnabled(!toolbarEnabled)}
                />
              </div>
              <div className="app-project-menu-note">
                Projects are managed in information architecture YAML.
              </div>
            </div>
          )}
        </div>
        <div className="app-header-avatar-menu-wrapper" ref={avatarMenuRef}>
          <button
            type="button"
            className="app-header-avatar-trigger"
            aria-haspopup="menu"
            aria-expanded={avatarMenuOpen}
            aria-label="Account menu"
            onClick={() => {
              setProjectMenuOpen(false);
              setAvatarMenuOpen((open) => !open);
            }}
          >
            <Avatar
              size={32}
              initials="MT"
              src={publicAssetUrl('images/avatar-marise-torres.png')}
              className="app-header-avatar"
            />
          </button>
          {avatarMenuOpen && (
            <div className="app-avatar-menu" role="menu" aria-label="Account">
              <div className="app-avatar-menu-title">Appearance</div>
              <div
                className="app-theme-switcher"
                role="radiogroup"
                aria-label="Appearance mode"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={theme === 'light'}
                  className={`app-theme-switcher-btn${
                    theme === 'light' ? ' app-theme-switcher-btn--active' : ''
                  }`}
                  onClick={() => {
                    if (theme !== 'light') toggleTheme();
                  }}
                >
                  <Icon
                    name={theme === 'light' ? 'brightness-high-filled' : 'brightness-high-bold'}
                    size={16}
                    lengthUnit="px"
                    aria-hidden
                  />
                  <span>Light</span>
                </button>
                <span className="app-theme-switcher-divider" aria-hidden />
                <button
                  type="button"
                  role="radio"
                  aria-checked={theme === 'dark'}
                  className={`app-theme-switcher-btn${
                    theme === 'dark' ? ' app-theme-switcher-btn--active' : ''
                  }`}
                  onClick={() => {
                    if (theme !== 'dark') toggleTheme();
                  }}
                >
                  <Icon
                    name={
                      theme === 'dark'
                        ? 'quiet-hours-presence-filled'
                        : 'quiet-hours-presence-bold'
                    }
                    size={16}
                    lengthUnit="px"
                    aria-hidden
                  />
                  <span>Dark</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
