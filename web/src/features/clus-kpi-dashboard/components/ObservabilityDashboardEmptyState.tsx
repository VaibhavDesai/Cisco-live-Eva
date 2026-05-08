/**
 * Shown on the Observability Dashboard when all metric cards are turned off in Settings.
 * Layout matches the AI Assistant empty state (centered illustration, title, body, secondary action).
 * Illustration: Figma Illustration Library — System info / Empty primary (node 3380:1151), exported as SVG.
 */

import { Text } from '@momentum-design/components/react';
import { publicAssetUrl } from '../../../app/publicAsset';
import SharedButton from '../../../components/shared/Button';
import { Icon } from '../../../icons/Icon';

interface ObservabilityDashboardEmptyStateProps {
  onOpenConfiguration: () => void;
}

export function ObservabilityDashboardEmptyState({
  onOpenConfiguration,
}: ObservabilityDashboardEmptyStateProps) {
  return (
    <section
      className="clus-kpi-dashboard-metrics-empty"
      aria-labelledby="clus-kpi-metrics-empty-title"
    >
      <div className="clus-kpi-dashboard-metrics-empty__content">
        <div className="clus-kpi-dashboard-metrics-empty__illustration" aria-hidden>
          <img
            src={publicAssetUrl('images/observability-metrics-empty.svg')}
            alt=""
            className="clus-kpi-dashboard-metrics-empty__illustration-img"
            width={240}
            height={168}
            decoding="async"
          />
        </div>
        <h2 id="clus-kpi-metrics-empty-title" className="clus-kpi-dashboard-metrics-empty__title">
          Dashboard metrics are off
        </h2>
        <Text type="body-small-regular" className="text-secondary clus-kpi-dashboard-metrics-empty__description">
          All observability metrics are hidden on this dashboard. Open Settings to turn metrics back on or
          choose which categories and cards to include.
        </Text>
        <SharedButton
          variant="secondary"
          size="sm"
          type="button"
          onClick={onOpenConfiguration}
        >
          <span className="btn-icon" aria-hidden>
            <Icon name="settings" weight="bold" size={16} />
          </span>
          Open Settings
        </SharedButton>
      </div>
    </section>
  );
}
