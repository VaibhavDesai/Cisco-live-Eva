import { type ReactNode, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../icons';

/* ── Size presets (Figma 46835-58869) ─────────────────────────────── */
export type ModalSize = 'sm' | 'md' | 'lg';

/* ── Modal (overlay + dialog shell) ───────────────────────────────── */
export interface ModalProps {
  children: ReactNode;
  onClose?: () => void;
  size?: ModalSize;
  className?: string;
  /** When true the backdrop click does not close */
  preventBackdropClose?: boolean;
}

export function Modal({
  children,
  onClose,
  size = 'md',
  className = '',
  preventBackdropClose = false,
}: ModalProps) {
  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (preventBackdropClose) return;
    if (e.target === e.currentTarget) onClose?.();
  };

  return createPortal(
    <div className="modal-overlay" onClick={onBackdrop} role="presentation">
      <div
        className={`modal modal--${size} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
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
  title: string;
  description?: string;
  onClose?: () => void;
  children?: ReactNode;
}

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
  children: ReactNode;
  className?: string;
}

export function ModalBody({ children, className = '' }: ModalBodyProps) {
  return <div className={`modal-body ${className}`.trim()}>{children}</div>;
}

/* ── ModalFooter ──────────────────────────────────────────────────── */
export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return <div className={`modal-footer ${className}`.trim()}>{children}</div>;
}

export default Modal;
