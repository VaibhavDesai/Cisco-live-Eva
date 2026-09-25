import { Icon } from '../../../icons/Icon';
import type { IconName } from '../../../icons/types';

export type AssistantControlRailType = 'Expanded' | 'Collapsed';
export type AssistantControlRailContentPanel = 'Open' | 'Closed';

export interface AssistantControlRailItem {
  id: string;
  label: string;
  icon: IconName;
  active?: boolean;
  dividerBefore?: boolean;
  onClick: () => void;
}

export interface AssistantControlRailProps {
  type?: AssistantControlRailType;
  contentPanel?: AssistantControlRailContentPanel;
  items: AssistantControlRailItem[];
  footerLabel: string;
  footerActive?: boolean;
  onFooterClick: () => void;
  ariaLabel?: string;
}

/**
 * Permanent level-one navigation for AI Agent Studio.
 *
 * The component owns the expanded/collapsed geometry and selected-state
 * treatment from the Figma redlines while callers continue to own routes and
 * labels. `contentPanel` mirrors the design component API for future shell
 * integrations without coupling the rail to a particular panel.
 */
export default function AssistantControlRail({
  type = 'Expanded',
  contentPanel = 'Closed',
  items,
  footerLabel,
  footerActive = false,
  onFooterClick,
  ariaLabel = 'Main navigation',
}: AssistantControlRailProps) {
  const collapsed = type === 'Collapsed';

  return (
    <nav
      className={`assistant-control-rail assistant-control-rail--${collapsed ? 'collapsed' : 'expanded'}`}
      aria-label={ariaLabel}
      data-content-panel={contentPanel.toLowerCase()}
    >
      <div className="assistant-control-rail__items">
        {items.map(item => (
          <div key={item.id} className="assistant-control-rail__item-wrap">
            {item.dividerBefore && (
              <span className="assistant-control-rail__divider" aria-hidden="true" />
            )}
            <div className={`assistant-control-rail__item${item.active ? ' assistant-control-rail__item--active' : ''}`}>
              <span className="assistant-control-rail__marker" aria-hidden="true" />
              <button
                type="button"
                className="assistant-control-rail__button"
                onClick={item.onClick}
                aria-current={item.active ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
              >
                <Icon name={item.icon} weight="regular" size="lg" />
                <span className="assistant-control-rail__label">{item.label}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={`assistant-control-rail__customer${footerActive ? ' assistant-control-rail__customer--active' : ''}`}
        onClick={onFooterClick}
        title={collapsed ? footerLabel : 'Organization settings'}
        aria-label={collapsed ? `${footerLabel}, organization settings` : undefined}
      >
        <Icon name="company" weight="regular" size="lg" />
        <span className="assistant-control-rail__label">{footerLabel}</span>
      </button>
    </nav>
  );
}
