import { createPortal } from 'react-dom';
import { type ReactNode, type MouseEvent } from 'react';
import { Icon } from '../../icons/Icon';

export interface AnnouncementDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Illustration or custom graphic (Figma Type=Illustration | Custom) */
  visual?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}

/**
 * Figma Announcement Dialog (`43610-72381`) — ~712×494 promotional shell.
 */
export function AnnouncementDialog({
  open,
  onClose,
  title,
  description,
  visual,
  primaryAction,
  secondaryAction,
  className = '',
}: AnnouncementDialogProps) {
  if (!open) return null;

  const node = (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className={`announcement-dialog ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-dialog-title"
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}
          onClick={onClose}
          aria-label="Close"
        >
          <Icon name="cancel" weight="bold" size="md" />
        </button>
        {visual != null && (
          <div className="announcement-dialog__visual">{visual}</div>
        )}
        <div className="announcement-dialog__body">
          <h2 id="announcement-dialog-title" className="announcement-dialog__title">
            {title}
          </h2>
          {description ? (
            <p className="announcement-dialog__description">{description}</p>
          ) : null}
        </div>
        {(primaryAction != null || secondaryAction != null) && (
          <div className="announcement-dialog__footer">
            {secondaryAction}
            {primaryAction}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
