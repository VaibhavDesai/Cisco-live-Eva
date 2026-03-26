import { type ReactNode } from 'react';
import { Illustration, type IllustrationName } from '../../assets/illustrations';

export type EmptyStateGraphicSize = 'sm' | 'md' | 'lg';
export type EmptyStateLayout = 'vertical' | 'horizontal';

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Custom graphic ReactNode. Overrides `illustration` if both provided. */
  graphic?: ReactNode;
  /** Named illustration from the Momentum Illustration Library (Empty-Primary). */
  illustration?: IllustrationName;
  graphicSize?: EmptyStateGraphicSize;
  layout?: EmptyStateLayout;
  actions?: ReactNode;
  className?: string;
  /**
   * Full-area empty state (Figma WIP **Empty State** `1617-1544`): centers in the content
   * region, applies symbol max-width (496px large / 316px medium & small).
   */
  global?: boolean;
}

const GLOBAL_WIDTH_CLASS: Record<EmptyStateGraphicSize, string> = {
  lg: 'empty-state--global-w-lg',
  md: 'empty-state--global-w-md',
  sm: 'empty-state--global-w-sm',
};

/**
 * Empty State — WIP Momentum Web Library (`22-25107`, symbols under `1617-1544`).
 * Use `global` for page-level / primary content empty patterns.
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
