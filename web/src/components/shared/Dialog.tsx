import { type ReactNode, type MouseEvent } from 'react';

export type DialogSize = 'sm' | 'md' | 'lg';
export type DialogVariant = 'default' | 'promotional';

export interface DialogProps {
  children: ReactNode;
  onClose?: () => void;
  /** Match Figma Modal Dialog sizes (46-2322) */
  size?: DialogSize;
  variant?: DialogVariant;
  className?: string;
  /** When true, overlay click does not close */
  preventBackdropClose?: boolean;
}

/**
 * Momentum Web — Modal Dialog shell (Figma `46-2322`).
 * Compose with `ModalHeader`, `ModalBody`, `ModalFooter` from `./Modal`.
 */
export function Dialog({
  children,
  onClose,
  size = 'md',
  variant = 'default',
  className = '',
  preventBackdropClose = false,
}: DialogProps) {
  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (preventBackdropClose) return;
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div className="modal-overlay" onClick={onBackdrop} role="presentation">
      <div
        className={`modal dialog--${size} ${variant === 'promotional' ? 'dialog--promotional' : ''} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        onClick={(ev) => ev.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
