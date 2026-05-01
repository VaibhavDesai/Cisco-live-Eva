import { useId, useState, type ReactNode } from 'react';
import { Icon } from '../../icons/Icon';

export type AccordionSize = 'small' | 'large';
export type AccordionStyleVariant = 'default' | 'borderless';
export type AccordionGroupType = 'stack' | 'borderless' | 'contained';

export interface AccordionGroupProps {
  /** AccordionItem nodes to lay out as a group */
  children: ReactNode;
  /** Stack, borderless, or contained group chrome */
  type?: AccordionGroupType;
  /** Additional CSS class on the group root */
  className?: string;
}

/**
 * Wraps accordion items with shared stack, borderless, or contained layout.
 *
 * @example
 * <AccordionGroup type="stack">
 *   <AccordionItem title="Section">Panel</AccordionItem>
 * </AccordionGroup>
 */
export function AccordionGroup({
  children,
  type = 'stack',
  className = '',
}: AccordionGroupProps) {
  return (
    <div className={`accordion-group accordion-group--${type} ${className}`.trim()}>
      {children}
    </div>
  );
}

export interface AccordionItemProps {
  /** Stable id for header and panel ARIA wiring */
  id?: string;
  /** Header label content for the toggle button */
  title: ReactNode;
  /** Panel content shown when expanded */
  children: ReactNode;
  /** Controlled open state (parent owns expansion) */
  expanded?: boolean;
  /** Uncontrolled initial expanded state */
  defaultExpanded?: boolean;
  /** Called when expanded state changes after user toggle */
  onExpandedChange?: (open: boolean) => void;
  /** Disables toggle interaction */
  disabled?: boolean;
  /** Visual size preset */
  size?: AccordionSize;
  /** Default or borderless surface style */
  styleVariant?: AccordionStyleVariant;
  /** Additional CSS class on the item root */
  className?: string;
}

/**
 * Single expandable accordion with a header button and collapsible region.
 *
 * @example
 * <AccordionItem title="Details" defaultExpanded>
 *   <p>More information</p>
 * </AccordionItem>
 */
export function AccordionItem({
  id: idProp,
  title,
  children,
  expanded: expandedProp,
  defaultExpanded = false,
  onExpandedChange,
  disabled = false,
  size = 'small',
  styleVariant = 'default',
  className = '',
}: AccordionItemProps) {
  const reactId = useId();
  const stableId = idProp ?? `acc-${reactId.replace(/:/g, '')}`;
  const panelId = `${stableId}-panel`;
  const headerId = `${stableId}-header`;

  const [internalOpen, setInternalOpen] = useState(defaultExpanded);
  const isControlled = expandedProp !== undefined;
  const open = isControlled ? Boolean(expandedProp) : internalOpen;

  const toggle = () => {
    if (disabled) return;
    const next = !open;
    if (!isControlled) setInternalOpen(next);
    onExpandedChange?.(next);
  };

  return (
    <div
      className={`accordion accordion--${size} ${
        styleVariant === 'borderless' ? 'accordion--borderless' : ''
      } ${className}`.trim()}
    >
      <button
        type="button"
        id={headerId}
        className="accordion__header"
        aria-expanded={open}
        aria-controls={panelId}
        disabled={disabled}
        onClick={toggle}
      >
        <span className="accordion__header-text">{title}</span>
        <span
          aria-hidden
          className={`accordion__chevron ${open ? 'accordion__chevron--open' : ''}`}
        >
          <Icon name="arrow-down" weight="bold" size="sm" />
        </span>
      </button>
      {open && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className="accordion__panel"
        >
          <div className="accordion__panel-content">{children}</div>
        </div>
      )}
    </div>
  );
}
