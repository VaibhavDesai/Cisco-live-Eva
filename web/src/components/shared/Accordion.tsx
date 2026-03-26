import { useId, useState, type ReactNode } from 'react';
import { Icon } from '../../icons/Icon';

export type AccordionSize = 'small' | 'large';
export type AccordionStyleVariant = 'default' | 'borderless';
export type AccordionGroupType = 'stack' | 'borderless' | 'contained';

export interface AccordionGroupProps {
  children: ReactNode;
  /** Stack: shared border; Borderless: spaced items; Contained: glass background per item */
  type?: AccordionGroupType;
  className?: string;
}

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
  id?: string;
  title: ReactNode;
  children: ReactNode;
  /** Controlled open state (use with multiple items to enforce single-expand in parent) */
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (open: boolean) => void;
  disabled?: boolean;
  size?: AccordionSize;
  styleVariant?: AccordionStyleVariant;
  className?: string;
}

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
          <div className="accordion__panel-inner">{children}</div>
        </div>
      )}
    </div>
  );
}
