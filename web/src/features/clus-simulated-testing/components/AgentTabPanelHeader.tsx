import type { ReactNode } from 'react';
import clsx from 'clsx';
import { ck, pageCopy } from '../../clus-kpi-dashboard/clus-kpi-theme';

export type AgentTabPanelHeaderProps = {
  title: string;
  description?: ReactNode;
  /** Default matches Observability section titles (`mds-type-section-title`). */
  heading?: 'h2' | 'h3';
  id?: string;
  /** Right-aligned control(s), e.g. Refresh — stays on the title row at `sm+`. */
  trailing?: ReactNode;
  className?: string;
};

/**
 * Standard title and optional muted description for Billing Support agent primary tabs and Configuration subtabs.
 */
export function AgentTabPanelHeader({
  title,
  description,
  heading = 'h2',
  id,
  trailing,
  className,
}: AgentTabPanelHeaderProps) {
  const Heading = heading;

  return (
    <div
      className={clsx(
        'agent-tab-panel-header flex min-w-0 flex-col gap-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4',
        className,
      )}
    >
      <div className={clsx(pageCopy.headingBlock, 'min-w-0 flex-1')}>
        <Heading id={id} className={clsx('m-0', ck.sectionHeading)}>
          {title}
        </Heading>
        {description ? (
          <div className={clsx(pageCopy.description, pageCopy.descriptionMaxWidth)}>{description}</div>
        ) : null}
      </div>
      {trailing ? (
        <div className="mt-3 shrink-0 self-start sm:mt-0 sm:pt-0.5">{trailing}</div>
      ) : null}
    </div>
  );
}
