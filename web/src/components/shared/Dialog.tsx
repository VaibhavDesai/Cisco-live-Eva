import { type ReactNode, type MouseEvent } from 'react';

export type DialogSize = 'sm' | 'md' | 'lg';
export type DialogVariant = 'default' | 'promotional';

export interface DialogProps {
  /** Dialog body (e.g. ModalHeader, ModalBody, ModalFooter) */
  children: ReactNode;
  /** Called when the user clicks the overlay (unless prevented) */
  onClose?: () => void;
  /** Modal width preset (sm, md, lg); matches Figma Modal Dialog */
  size?: DialogSize;
  /** Default vs promotional dialog styling */
  variant?: DialogVariant;
  /** Appended to the dialog class list */
  className?: string;
  /** When true, overlay clicks do not invoke onClose */
  preventBackdropClose?: boolean;
}

/**
 * Momentum Web — Modal Dialog shell (Figma `46-2322`).
 * Compose with `ModalHeader`, `ModalBody`, `ModalFooter` from `./Modal`.
 *
 * @example
 * <Dialog onClose={handleClose}>
 *   <ModalHeader title="Confirm" />
 * </Dialog>
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
