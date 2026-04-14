import {
  forwardRef,
  useCallback,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Icon } from '../../icons/Icon';
import type { IconName } from '../../icons/types';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Visual style of the tab list */
export type TabVariant = 'pill' | 'glass' | 'line' | 'vertical';

/* ------------------------------------------------------------------ */
/*  Tabs (container)                                                   */
/* ------------------------------------------------------------------ */

export interface TabsProps {
  /** Tab triggers (and any inline chrome) inside the tablist */
  children: ReactNode;
  /** Visual style; defaults to pill */
  variant?: TabVariant;
  /** Extra classes on the tablist container */
  className?: string;
  /** Inline styles on the tablist container */
  style?: React.CSSProperties;
  /** Accessible name for the tablist */
  'aria-label'?: string;
}

/**
 * Tablist container with arrow/Home/End keyboard navigation between enabled tabs.
 *
 * @example
 * <Tabs aria-label="Settings">
 *   <Tab active>General</Tab>
 * </Tabs>
 */
export default function Tabs({
  children,
  variant = 'pill',
  className = '',
  style = {},
  'aria-label': ariaLabel,
}: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const variantCls =
    variant === 'glass'
      ? 'tabs-glass'
      : variant === 'line'
        ? 'tabs-line'
        : variant === 'vertical'
          ? 'tabs-vertical'
          : '';

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const list = listRef.current;
      if (!list) return;

      const isVertical = variant === 'vertical';
      const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
      const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

      if (e.key !== nextKey && e.key !== prevKey && e.key !== 'Home' && e.key !== 'End') {
        return;
      }

      e.preventDefault();

      const buttons = Array.from(
        list.querySelectorAll<HTMLButtonElement>(
          'button.tab:not([disabled]):not(.disabled)',
        ),
      );
      if (buttons.length === 0) return;

      const current = document.activeElement as HTMLButtonElement;
      const idx = buttons.indexOf(current);

      let next: HTMLButtonElement | undefined;
      if (e.key === nextKey) {
        next = buttons[(idx + 1) % buttons.length];
      } else if (e.key === prevKey) {
        next = buttons[(idx - 1 + buttons.length) % buttons.length];
      } else if (e.key === 'Home') {
        next = buttons[0];
      } else if (e.key === 'End') {
        next = buttons[buttons.length - 1];
      }

      next?.focus();
    },
    [variant],
  );

  return (
    <div
      ref={listRef}
      className={`tabs${variantCls ? ` ${variantCls}` : ''}${className ? ` ${className}` : ''}`}
      style={style}
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation={variant === 'vertical' ? 'vertical' : 'horizontal'}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab (individual button)                                            */
/* ------------------------------------------------------------------ */

export interface TabProps {
  /** Tab label text */
  children: ReactNode;
  /** Whether this tab is the selected tab */
  active?: boolean;
  /** Disables the tab button */
  disabled?: boolean;
  /** Optional leading icon name */
  icon?: IconName;
  /** Optional numeric badge after the label */
  badge?: number;
  /** Invoked when the tab is activated (ignored when disabled) */
  onClick?: () => void;
  /** Extra classes on the tab button */
  className?: string;
  /** DOM id for the tab element */
  id?: string;
  /** Id of the tabpanel this tab controls */
  'aria-controls'?: string;
}

/**
 * Individual `role="tab"` button for use inside `Tabs`.
 *
 * @example
 * <Tabs><Tab active aria-controls="panel-1">Overview</Tab></Tabs>
 */
export const Tab = forwardRef<HTMLButtonElement, TabProps>(function Tab(
  {
    children,
    active = false,
    disabled = false,
    icon,
    badge,
    onClick,
    className = '',
    id: idProp,
    'aria-controls': ariaControls,
  },
  ref,
) {
  const autoId = useId();
  const tabId = idProp ?? autoId;

  const cls = [
    'tab',
    active && 'active',
    disabled && 'disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type="button"
      id={tabId}
      className={cls}
      role="tab"
      aria-selected={active}
      aria-disabled={disabled || undefined}
      aria-controls={ariaControls}
      tabIndex={active ? 0 : -1}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
    >
      {icon && (
        <span className="tab-icon">
          <Icon name={icon} weight="bold" size={16} />
        </span>
      )}
      <span className="tab-label">{children}</span>
      {badge != null && <span className="tab-badge">{badge}</span>}
    </button>
  );
});

/* ------------------------------------------------------------------ */
/*  TabPanel                                                           */
/* ------------------------------------------------------------------ */

export interface TabPanelProps {
  /** Panel body shown when `active` */
  children: ReactNode;
  /** When false, renders nothing */
  active?: boolean;
  /** DOM id for the tabpanel */
  id?: string;
  /** Id of the tab that labels this panel */
  'aria-labelledby'?: string;
  /** Extra classes on the panel root */
  className?: string;
}

/**
 * `role="tabpanel"` region that mounts only while its tab is active.
 *
 * @example
 * <TabPanel id="panel-1" aria-labelledby="tab-1" active={tab === 1}>…</TabPanel>
 */
export function TabPanel({
  children,
  active = true,
  id,
  'aria-labelledby': ariaLabelledby,
  className = '',
}: TabPanelProps) {
  if (!active) return null;

  return (
    <div
      id={id}
      className={className || undefined}
      role="tabpanel"
      aria-labelledby={ariaLabelledby}
      tabIndex={0}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SegmentControl & SegmentItem (backward compat)                     */
/* ------------------------------------------------------------------ */

export interface SegmentControlProps {
  /** Segment buttons inside the view switcher */
  children: ReactNode;
  /** Extra classes on the wrapper */
  className?: string;
  /** Inline styles on the wrapper */
  style?: React.CSSProperties;
}

/**
 * Legacy segmented control wrapper (view switcher layout).
 *
 * @example
 * <SegmentControl><SegmentItem active>One</SegmentItem></SegmentControl>
 */
export function SegmentControl({
  children,
  className = '',
  style = {},
}: SegmentControlProps) {
  return (
    <div className={`view-switcher ${className}`} style={style}>
      {children}
    </div>
  );
}

export interface SegmentItemProps {
  /** Button label */
  children: ReactNode;
  /** Applies the active segment styling */
  active?: boolean;
  /** Invoked when the segment is clicked */
  onClick?: () => void;
  /** Extra classes on the button */
  className?: string;
}

/**
 * Single segment button for use inside `SegmentControl`.
 *
 * @example
 * <SegmentItem active onClick={() => setView('a')}>Alpha</SegmentItem>
 */
export function SegmentItem({
  children,
  active = false,
  onClick,
  className = '',
}: SegmentItemProps) {
  return (
    <button
      type="button"
      className={`view-btn ${active ? 'active' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
