import { type ReactNode } from 'react';
import { Illustration, type IllustrationName } from '../../assets/illustrations';

/** Artwork sizing token for the empty-state graphic region */
export type EmptyStateGraphicSize = 'sm' | 'md' | 'lg';
/** Stacks the graphic above text or arranges graphic and text horizontally */
export type EmptyStateLayout = 'vertical' | 'horizontal';

export interface EmptyStateProps {
  /** Primary heading text */
  title: string;
  /** Supporting body copy below the title */
  description?: string;
  /** Custom artwork node; overrides illustration when both are provided */
  graphic?: ReactNode;
  /** Named Empty-Primary illustration from the Momentum illustration set */
  illustration?: IllustrationName;
  /** Graphic frame size (sm / md / lg) */
  graphicSize?: EmptyStateGraphicSize;
  /** Layout direction for graphic and text */
  layout?: EmptyStateLayout;
  /** Actions row (for example buttons) rendered beneath the description */
  actions?: ReactNode;
  /** Extra class names merged onto the root empty-state element */
  className?: string;
  /** Centers in the content region with global max-width constraints when true */
  global?: boolean;
}

const GLOBAL_WIDTH_CLASS: Record<EmptyStateGraphicSize, string> = {
  lg: 'empty-state--global-w-lg',
  md: 'empty-state--global-w-md',
  sm: 'empty-state--global-w-sm',
};

/**
 * Renders Momentum empty-state content with optional illustration or custom graphic, actions, and global centering.
 * Aligns with WIP Momentum Web Library (`22-25107`, symbols under `1617-1544`); use `global` for page-level empties.
 *
 * @example
 * <EmptyState title="No items" illustration="empty-primary" actions={<Button>New</Button>} />
 */
export function EmptyState({
  title,
  description,
  graphic,
  illustration,
  graphicSize = 'lg',
  layout = 'vertical',
  actions,
  className = '',
  global = false,
}: EmptyStateProps) {
  const resolvedGraphic = graphic ?? (illustration ? <Illustration name={illustration} /> : null);

  const inner = (
    <div
      className={[
        'empty-state',
        `empty-state--${layout}`,
        global && 'empty-state--global',
        global && GLOBAL_WIDTH_CLASS[graphicSize],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
    >
      {resolvedGraphic != null && (
        <div className={`empty-state__graphic empty-state__graphic--${graphicSize}`}>
          {resolvedGraphic}
        </div>
      )}
      <div className="empty-state__text">
        {global ? (
          <h2 className="empty-state__title">{title}</h2>
        ) : (
          <h3 className="empty-state__title">{title}</h3>
        )}
        {description ? (
          <p className="empty-state__description">{description}</p>
        ) : null}
        {actions != null ? <div className="empty-state__actions">{actions}</div> : null}
      </div>
    </div>
  );

  if (global) {
    return <div className="empty-state-global-host">{inner}</div>;
  }

  return inner;
}
