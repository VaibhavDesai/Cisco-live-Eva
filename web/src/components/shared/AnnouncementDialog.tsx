import { createPortal } from 'react-dom';
import { type ReactNode, type MouseEvent } from 'react';
import { Icon } from '../../icons/Icon';

export interface AnnouncementDialogProps {
  /** Renders the dialog in a portal when true */
  open: boolean;
  /** Called when the user dismisses the dialog */
  onClose: () => void;
  /** Dialog heading */
  title: string;
  /** Optional supporting copy below the title */
  description?: string;
  /** Illustration or custom graphic (Figma illustration or custom slot) */
  visual?: ReactNode;
  /** Primary action slot (e.g. primary button) */
  primaryAction?: ReactNode;
  /** Secondary action slot (e.g. secondary button) */
  secondaryAction?: ReactNode;
  /** Appended to the dialog container class list */
  className?: string;
}

/**
 * Figma Announcement Dialog (`43610-72381`) — ~712×494 promotional shell.
 *
 * @example
 * <AnnouncementDialog open title="What's new" onClose={() => {}} primaryAction={<button type="button">OK</button>} />
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
