import {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../icons';

/* ── Size presets (Figma 46835-58869) ─────────────────────────────── */
export type ModalSize = 'sm' | 'md' | 'lg';

/* ── Modal (overlay + dialog shell) ───────────────────────────────── */
export interface ModalProps {
  /** Dialog content */
  children: ReactNode;
  /** Called when the user dismisses the modal (e.g. backdrop click) */
  onClose?: () => void;
  /** Dialog width preset */
  size?: ModalSize;
  /** Additional CSS class on the dialog shell */
  className?: string;
  /** Additional CSS class on the full-screen overlay (stacks above .modal-overlay) */
  overlayClassName?: string;
  /** When true the backdrop click does not close */
  preventBackdropClose?: boolean;
  /** Accessible name for the dialog when no external labelled-by id is supplied */
  ariaLabel?: string;
}

/**
 * Full-screen overlay and centered dialog shell; compose with ModalHeader, ModalBody, and ModalFooter.
 * @example
 * <Modal onClose={close} size="lg">
 *   <ModalHeader title="Edit" onClose={close} /><ModalBody>…</ModalBody><ModalFooter>…</ModalFooter>
 * </Modal>
 */
export function Modal({
  children,
  onClose,
  size = 'md',
  className = '',
  overlayClassName = '',
  preventBackdropClose = false,
  ariaLabel,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const frame = window.requestAnimationFrame(() => {
      const firstFocusable = dialog.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      (firstFocusable ?? dialog).focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus();
    };
  }, []);

  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (preventBackdropClose) return;
    if (e.target === e.currentTarget) onClose?.();
  };

  const trapFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter(element => element.offsetParent !== null);
    if (focusable.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      className={`modal-overlay ${overlayClassName}`.trim()}
      onClick={onBackdrop}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={`modal modal--${size} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        onKeyDown={trapFocus}
        onClick={(ev) => ev.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* ── ModalHeader ──────────────────────────────────────────────────── */
export interface ModalHeaderProps {
  /** Primary heading text */
  title: string;
  /** Supporting text shown below the title */
  description?: string;
  /** When set, renders a close control that calls this handler */
  onClose?: () => void;
  /** Extra content in the header copy column (e.g. metadata) */
  children?: ReactNode;
}

/**
 * Modal title row with optional description, optional extra children, and optional close button.
 * @example
 * <ModalHeader title="Rename" description="Pick a new name." onClose={onClose} />
 */
export function ModalHeader({ title, description, onClose, children }: ModalHeaderProps) {
  return (
    <div className="modal-header">
      <div className="modal-header-copy">
        <h2 className="modal-title">{title}</h2>
        {description && <p className="modal-description">{description}</p>}
        {children}
      </div>
      {onClose && (
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <Icon name="cancel" weight="bold" size={16} />
        </button>
      )}
    </div>
  );
}

/* ── ModalBody ────────────────────────────────────────────────────── */
export interface ModalBodyProps {
  /** Main dialog content */
  children: ReactNode;
  /** Additional CSS class */
  className?: string;
}

/**
 * Main scrollable region between ModalHeader and ModalFooter.
 * @example
 * <ModalBody className="modal-body--flush"><form>…</form></ModalBody>
 */
export function ModalBody({ children, className = '' }: ModalBodyProps) {
  return <div className={`modal-body ${className}`.trim()}>{children}</div>;
}

/* ── ModalFooter ──────────────────────────────────────────────────── */
export interface ModalFooterProps {
  /** Footer actions or auxiliary content */
  children: ReactNode;
  /** Additional CSS class */
  className?: string;
}

/**
 * Bottom region for primary/secondary actions or helper content.
 * @example
 * <ModalFooter><button type="button">Save</button></ModalFooter>
 */
export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return <div className={`modal-footer ${className}`.trim()}>{children}</div>;
}

export default Modal;
