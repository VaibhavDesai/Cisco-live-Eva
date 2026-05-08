import { Fragment, useEffect } from 'react';
import type { DateRange } from 'react-day-picker';
import { ck } from '../clus-kpi-theme';
import {
  KPI_OBSERVABILITY_SECTION_HEADER_SUPPLEMENT,
  OBSERVABILITY_PROJECTION_DIGITAL_ID,
  OBSERVABILITY_PROJECTION_VOICE_ID,
  observabilityProjectionIdForCategory,
} from '../data/phase1ObservabilityMetrics';
import type { KPIData } from './kpiData';
import { kpiExpandedChartAxisProps } from '../kpiChartAxis';
import { KPICard } from './KPICard';
import { KPIChart } from './KPIChart';
import { ObservabilityProjectionCard } from './ObservabilityProjectionCard';

const CARDS_PER_ROW = 4;

interface ObservabilityViewProps {
  filteredKpiData: KPIData[];
  categories: string[];
  dateRange: '24h' | 'week' | 'month' | '90d' | 'custom';
  customDateRange: DateRange | undefined;
  pinnedCardIds: string[];
  onPinToggle: (id: string, e: React.MouseEvent) => void;
  onMoveCard: (dragIndex: number, hoverIndex: number) => void;
  activeCardId: string | null;
  onActiveCardChange: (id: string | null) => void;
  onDateRangeChange?: (
    range: '24h' | 'week' | 'month' | '90d' | 'custom',
    customRange?: { from: Date; to: Date },
  ) => void;
}

export function ObservabilityView({
  filteredKpiData,
  categories,
  dateRange,
  customDateRange,
  pinnedCardIds,
  onPinToggle,
  onMoveCard,
  activeCardId,
  onActiveCardChange,
  onDateRangeChange,
}: ObservabilityViewProps) {
  const activeKPI = activeCardId ? filteredKpiData.find((k) => k.id === activeCardId) : undefined;

  useEffect(() => {
    if (activeCardId && !filteredKpiData.some((k) => k.id === activeCardId)) {
      onActiveCardChange(null);
    }
  }, [filteredKpiData, activeCardId, onActiveCardChange]);

  return (
    <div className="flex-1 min-w-0 space-y-8">
      {pinnedCardIds.length > 0 &&
        (() => {
          return (
            <div>
              <h2 className={`${ck.sectionHeading} mb-4`}>Pinned</h2>
              <div className="kpi-card-grid">
                {pinnedCardIds.map((pinnedId, index) => {
                  const projSup =
                    pinnedId === OBSERVABILITY_PROJECTION_VOICE_ID
                      ? KPI_OBSERVABILITY_SECTION_HEADER_SUPPLEMENT['Voice usage']
                      : pinnedId === OBSERVABILITY_PROJECTION_DIGITAL_ID
                        ? KPI_OBSERVABILITY_SECTION_HEADER_SUPPLEMENT['Digital usage']
                        : undefined;

                  const isLastInRow =
                    (index + 1) % CARDS_PER_ROW === 0 || index === pinnedCardIds.length - 1;
                  const currentRowStart = Math.floor(index / CARDS_PER_ROW) * CARDS_PER_ROW;
                  const idsInRow = pinnedCardIds.slice(
                    currentRowStart,
                    Math.min(currentRowStart + CARDS_PER_ROW, pinnedCardIds.length),
                  );
                  const isActiveCardInThisRow = idsInRow.some((id) => {
                    const rowK = filteredKpiData.find((x) => x.id === id);
                    return rowK && rowK.id === activeCardId;
                  });

                  const expandedChart =
                    isLastInRow && isActiveCardInThisRow && activeKPI ? (
                      <div className="kpi-card-grid__expanded">
                        <KPIChart
                          heading={activeKPI.heading}
                          description={activeKPI.description}
                          chartType={activeKPI.chartType}
                          dateRange={dateRange}
                          customDateRange={customDateRange}
                          sparklineData={activeKPI.sparklineData}
                          unit={activeKPI.unit}
                          value={activeKPI.value}
                          {...kpiExpandedChartAxisProps(activeKPI)}
                          curveType={activeKPI.curveType}
                          onDrillDown={onDateRangeChange}
                        />
                      </div>
                    ) : null;

                  if (projSup) {
                    return (
                      <Fragment key={pinnedId}>
                        <ObservabilityProjectionCard
                          cardId={pinnedId}
                          title={projSup.title}
                          dateLabel={projSup.dateLabel}
                          thresholdStatus={projSup.thresholdStatus}
                          isPinned
                          onPinToggle={(e) => onPinToggle(pinnedId, e)}
                          dragIndex={index}
                          onMoveCard={onMoveCard}
                        />
                        {expandedChart}
                      </Fragment>
                    );
                  }

                  const kpi = filteredKpiData.find((k) => k.id === pinnedId);
                  if (!kpi) return null;

                  return (
                    <Fragment key={kpi.id}>
                      <KPICard
                        data={kpi}
                        isActive={activeCardId === kpi.id}
                        onClick={() =>
                          onActiveCardChange(activeCardId === kpi.id ? null : kpi.id)
                        }
                        onPinToggle={(e) => onPinToggle(kpi.id, e)}
                        isPinned
                        dragIndex={index}
                        onMoveCard={onMoveCard}
                      />
                      {expandedChart}
                    </Fragment>
                  );
                })}
              </div>
            </div>
          );
        })()}

      {categories.map((category) => {
        const unpinnedKpis = filteredKpiData.filter(
          (kpi) => kpi.category === category && !pinnedCardIds.includes(kpi.id),
        );

        if (unpinnedKpis.length === 0) {
          return null;
        }

        const sectionSupplement = KPI_OBSERVABILITY_SECTION_HEADER_SUPPLEMENT[
          category as keyof typeof KPI_OBSERVABILITY_SECTION_HEADER_SUPPLEMENT
        ];
        const projectionCardId = observabilityProjectionIdForCategory(category);

        return (
          <div key={category}>
            <h2 className={`${ck.sectionHeading} mb-4 mt-8 first:mt-0`}>{category}</h2>
            <div className="kpi-card-grid">
              {unpinnedKpis.map((kpi, index) => {
                const isLastInRow =
                  (index + 1) % CARDS_PER_ROW === 0 || index === unpinnedKpis.length - 1;
                const currentRowStart = Math.floor(index / CARDS_PER_ROW) * CARDS_PER_ROW;
                const currentRowEnd = Math.min(currentRowStart + CARDS_PER_ROW, unpinnedKpis.length);
                const cardsInCurrentRow = unpinnedKpis.slice(currentRowStart, currentRowEnd);
                const isActiveCardInThisRow = cardsInCurrentRow.some((card) => card.id === activeCardId);

                return (
                  <Fragment key={kpi.id}>
                    <KPICard
                      data={kpi}
                      isActive={activeCardId === kpi.id}
                      onClick={() =>
                        onActiveCardChange(activeCardId === kpi.id ? null : kpi.id)
                      }
                      onPinToggle={(e) => onPinToggle(kpi.id, e)}
                      isPinned={false}
                    />
                    {isLastInRow && isActiveCardInThisRow && activeKPI && (
                      <div className="kpi-card-grid__expanded">
                        <KPIChart
                          heading={activeKPI.heading}
                          description={activeKPI.description}
                          chartType={activeKPI.chartType}
                          dateRange={dateRange}
                          customDateRange={customDateRange}
                          sparklineData={activeKPI.sparklineData}
                          unit={activeKPI.unit}
                          value={activeKPI.value}
                          {...kpiExpandedChartAxisProps(activeKPI)}
                          curveType={activeKPI.curveType}
                          onDrillDown={onDateRangeChange}
                        />
                      </div>
                    )}
                  </Fragment>
                );
              })}
              {sectionSupplement && projectionCardId && !pinnedCardIds.includes(projectionCardId) ? (
                <ObservabilityProjectionCard
                  cardId={projectionCardId}
                  title={sectionSupplement.title}
                  dateLabel={sectionSupplement.dateLabel}
                  thresholdStatus={sectionSupplement.thresholdStatus}
                  onPinToggle={(e) => onPinToggle(projectionCardId, e)}
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
