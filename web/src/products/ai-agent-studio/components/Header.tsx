import type { ReactNode } from 'react';
import ThemeToggle from '../../../components/shared/ThemeToggle';
import AppHeader from '../../../components/shared/AppHeader';
import Toggle from '../../../components/shared/Toggle';
import Icon from '../../../components/shared/Icon';
import webexAiAgentStudioWordmark from '../../../assets/webex-ai-agent-studio-wordmark.svg';
import { useReview } from '../../../features/review/ReviewProvider';
import { useDesignVariation } from '../../../contexts/DesignVariationContext';
import type { DesignVariation } from '../../../contexts/designVariationStore';

export interface StudioHeaderProps {
  onAiClick?: () => void;
  onMenuClick?: () => void;
  centerContent?: ReactNode;
}

const DESIGN_VARIATION_OPTIONS: Array<{ value: DesignVariation; label: string }> = [
  { value: 'landing', label: 'Chat-based in Ai Agent' },
  { value: 'dashboard', label: 'Chat-based in Dashboard' },
  { value: 'form-bases', label: 'Form-based in Ai Agent' },
];

export default function Header({ onAiClick, onMenuClick, centerContent }: StudioHeaderProps) {
  const {
    configured: reviewConfigured,
    active: reviewActive,
    toggleActive: toggleReview,
    openCommentsModal,
  } = useReview();
  const { variation, setVariation } = useDesignVariation();

  return (
    <AppHeader
      fixed
      className="app-header--agent-studio-brand"
      wordmarkSvg={webexAiAgentStudioWordmark}
      wordmarkAlt="AI Agent Studio"
      showSearch={false}
      centerContent={centerContent}
      alertCount={0}
      avatarSrc="https://i.pravatar.cc/64?img=12"
      avatarName="Austen Jones"
      onAiClick={onAiClick}
      onMenuClick={onMenuClick}
      appLauncherContent={(
        <>
          <section className="app-header__menu-section" aria-label="Review tools">
            <div className="app-header__menu-section-title">Review tools</div>
            <div
              className="app-header__menu-row app-header__menu-row--toggle"
              data-review-ui
              title={
                !reviewConfigured
                  ? 'Comment mode unavailable — Supabase is not configured.'
                  : reviewActive
                    ? 'Comment mode is on — click any element to leave feedback.'
                    : 'Turn on to leave inline comments on any element.'
              }
            >
              <span className="app-header__menu-row-copy">
                <span className="app-header__menu-row-label">Comment mode</span>
                <span className="app-header__menu-row-hint">Press C to turn on/off</span>
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
            </div>
            <button
              type="button"
              className="app-header__menu-item"
              data-review-ui
              onClick={openCommentsModal}
              disabled={!reviewConfigured}
              role="menuitem"
            >
              <Icon name="list-menu-bold" size={16} />
              <span>View all comments</span>
            </button>
          </section>

          <section className="app-header__menu-section" aria-label="Design variations">
            <div className="app-header__menu-section-title">Design variations</div>
            {DESIGN_VARIATION_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                className={`app-header__menu-item${variation === option.value ? ' app-header__menu-item--selected' : ''}`}
                onClick={() => setVariation(option.value)}
                role="menuitemradio"
                aria-checked={variation === option.value}
              >
                <span>{option.label}</span>
                {variation === option.value && <Icon name="check-bold" size={16} />}
              </button>
            ))}
          </section>
        </>
      )}
    >
      <ThemeToggle />
    </AppHeader>
  );
}
