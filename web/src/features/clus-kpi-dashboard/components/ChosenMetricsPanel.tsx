import { Fragment } from 'react';
import { ck } from '../clus-kpi-theme';
import type { KPIData } from './kpiData';
import { kpiExpandedChartAxisProps } from '../kpiChartAxis';
import { KPICard } from './KPICard';
import { KPIChart } from './KPIChart';
import type { DateRange } from 'react-day-picker';

interface ChosenMetricsPanelProps {
  /** Full KPI list for resolving pinned ids (must not use search-filtered data). */
  kpiCatalog: KPIData[];
  pinnedCardIds: string[];
  activeCardId: string | null;
  onPinToggle: (id: string, e: React.MouseEvent) => void;
  onMoveCard: (dragIndex: number, hoverIndex: number) => void;
  onSelectMetric: (id: string) => void;
  dateRange: '24h' | 'week' | 'month' | '90d' | 'custom';
  customDateRange: DateRange | undefined;
  onDateRangeChange?: (
    range: '24h' | 'week' | 'month' | '90d' | 'custom',
    customRange?: { from: Date; to: Date },
  ) => void;
}

export function ChosenMetricsPanel({
  kpiCatalog,
  pinnedCardIds,
  activeCardId,
  onPinToggle,
  onMoveCard,
  onSelectMetric,
  dateRange,
  customDateRange,
  onDateRangeChange,
}: ChosenMetricsPanelProps) {
  const pinnedCards = pinnedCardIds
    .map((id) => kpiCatalog.find((k) => k.id === id))
    .filter(Boolean) as KPIData[];

  return (
    <aside
      className="clus-kpi-chosen-aside shrink-0 w-full lg:w-[min(100%,380px)] lg:max-w-[420px]"
      aria-labelledby="clus-kpi-chosen-heading"
    >
      <h2 id="clus-kpi-chosen-heading" className={`${ck.sectionHeading} m-0 mb-4`}>
        Chosen metrics
      </h2>
      {pinnedCards.length === 0 ? (
        <p className={`m-0 ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>
          No metrics in this view yet. Click a metric on the dashboard or use the pin on a card to add
          it here. You can open several metrics and compare their charts side by side.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {pinnedCards.map((kpi) => {
            const dragIndex = pinnedCardIds.indexOf(kpi.id);
            const isActive = activeCardId === kpi.id;
            return (
              <Fragment key={kpi.id}>
                <div>
                  <KPICard
                    data={kpi}
                    isActive={isActive}
                    onClick={() => onSelectMetric(kpi.id)}
                    onPinToggle={(e) => onPinToggle(kpi.id, e)}
                    isPinned
                    dragIndex={dragIndex}
                    onMoveCard={onMoveCard}
                  />
                  <div className="mt-4">
                    <KPIChart
                      heading={kpi.heading}
                      description={kpi.description}
                      chartType={kpi.chartType}
                      dateRange={dateRange}
                      customDateRange={customDateRange}
                      sparklineData={kpi.sparklineData}
                      unit={kpi.unit}
                      value={kpi.value}
                      {...kpiExpandedChartAxisProps(kpi)}
                      curveType={kpi.curveType}
                      simplified
                      chartHeight={220}
                      onDrillDown={onDateRangeChange}
                    />
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>
      )}
    </aside>
  );
}
