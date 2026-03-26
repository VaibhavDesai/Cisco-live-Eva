import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../icons/Icon';
import type { IconName } from '../../icons/types';

/* ------------------------------------------------------------------ */
/*  MenuOverlay — the floating container                               */
/* ------------------------------------------------------------------ */

export interface MenuOverlayProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /** Preferred alignment: 'left' (default) or 'right' */
  align?: 'left' | 'right';
}

export function MenuOverlay({
  open,
  anchorRef,
  onClose,
  children,
  className = '',
  align = 'left',
}: MenuOverlayProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !anchorRef.current) return;

    const updatePos = () => {
      const rect = anchorRef.current!.getBoundingClientRect();
      const menuW = menuRef.current?.offsetWidth ?? 200;
      let left = align === 'right' ? rect.right - menuW : rect.left;
      left = Math.max(4, Math.min(left, window.innerWidth - menuW - 4));
      setPos({ top: rect.bottom + 4, left });
    };

    updatePos();

    const handleClickOutside = (e: Event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !anchorRef.current?.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const handleEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [open, anchorRef, onClose, align]);

  useEffect(() => {
    if (open && menuRef.current) {
      const first = menuRef.current.querySelector<HTMLElement>('[role="menuitem"]:not(.disabled)');
      first?.focus();
    }
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      className={`menu-overlay${className ? ` ${className}` : ''}`}
      role="menu"
      style={{ position: 'fixed', top: pos.top, left: pos.left }}
      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
        const items = Array.from(
          e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not(.disabled)'),
        );
        const idx = items.indexOf(document.activeElement as HTMLElement);

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          items[(idx + 1) % items.length]?.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          items[(idx - 1 + items.length) % items.length]?.focus();
        } else if (e.key === 'Home') {
          e.preventDefault();
          items[0]?.focus();
        } else if (e.key === 'End') {
          e.preventDefault();
          items[items.length - 1]?.focus();
        }
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/*  MenuSection — groups items under an optional header                */
/* ------------------------------------------------------------------ */

export interface MenuSectionProps {
  header?: string;
  children: ReactNode;
}

export function MenuSection({ header, children }: MenuSectionProps) {
  return (
    <div className="menu-section" role="group" aria-label={header}>
      {header && <div className="menu-header">{header}</div>}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MenuDivider                                                        */
/* ------------------------------------------------------------------ */

export function MenuDivider() {
  return <div className="menu-divider" role="separator" />;
}

/* ------------------------------------------------------------------ */
/*  MenuItem                                                           */
/* ------------------------------------------------------------------ */

export interface MenuItemProps {
  label: string;
  /** Leading icon name */
  icon?: IconName;
  /** Trailing keyboard shortcut text */
  shortcut?: string;
  /** Shows a checkmark on the right */
  selected?: boolean;
  /** Indicates this item opens a sub-menu */
  hasSubmenu?: boolean;
  disabled?: boolean;
  /** Danger styling (red text) */
  danger?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

export const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(
  function MenuItem(
    {
      label,
      icon,
      shortcut,
      selected = false,
      hasSubmenu = false,
      disabled = false,
      danger = false,
      onClick,
      className = '',
    },
    ref,
  ) {
    const cls = [
      'menu-item',
      disabled ? 'disabled' : '',
      danger ? 'danger' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type="button"
        role="menuitem"
        className={cls}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        onClick={onClick}
        tabIndex={-1}
      >
        <span className="menu-item-leading">
          {icon && (
            <span className="menu-item-icon">
              <Icon name={icon} weight="bold" size={16} />
            </span>
          )}
          <span className="menu-item-label">{label}</span>
        </span>
        <span className="menu-item-trailing">
          {shortcut && <span className="menu-item-shortcut">{shortcut}</span>}
          {selected && (
            <span className="menu-item-check">
              <Icon name="check" weight="bold" size={16} />
            </span>
          )}
          {hasSubmenu && (
            <span className="menu-item-submenu-arrow">
              <Icon name="arrow-right" weight="bold" size={16} />
            </span>
          )}
        </span>
      </button>
    );
  },
);

/* ------------------------------------------------------------------ */
/*  useMenu — convenience hook for trigger + overlay wiring            */
/* ------------------------------------------------------------------ */

export function useMenu() {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLElement>(null);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  return { open, anchorRef, toggle, close };
}
