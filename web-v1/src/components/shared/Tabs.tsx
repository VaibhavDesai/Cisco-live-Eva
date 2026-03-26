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

export type TabVariant = 'pill' | 'glass' | 'line' | 'vertical';

/* ------------------------------------------------------------------ */
/*  Tabs (container)                                                   */
/* ------------------------------------------------------------------ */

export interface TabsProps {
  children: ReactNode;
  /** Visual variant. Default 'pill' */
  variant?: TabVariant;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

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
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  icon?: IconName;
  badge?: number;
  onClick?: () => void;
  className?: string;
  id?: string;
  'aria-controls'?: string;
}

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
  children: ReactNode;
  active?: boolean;
  id?: string;
  'aria-labelledby'?: string;
  className?: string;
}

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
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

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
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

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
