import type { ReactNode } from 'react';
import { Fragment, useState } from 'react';
import { Button, Icon } from '@momentum-design/components/react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../../projects/useProjects';
import { buildProjectPath } from '../../../projects/project-routing';
import { KPICard } from '../../clus-kpi-dashboard/components/KPICard';
import { KPIChart } from '../../clus-kpi-dashboard/components/KPIChart';
import { ck } from '../../clus-kpi-dashboard/clus-kpi-theme';
import { TopFailureReasonsTable } from './TopFailureReasonsTable';
import {
  TESTING_HISTORICAL_KPIS,
  TESTING_RECENT_RUN_KPIS,
  type TestingHistoricalKPI,
} from './testing-overview-kpis';

type Props = {
  /** Optional date preset control (e.g. Select) aligned to the right of the historical heading row */
  dateRangeControl?: ReactNode;
};

const CARDS_PER_ROW = 4;
const RECENT_CARDS_PER_ROW = 2;

function chartDateRangePreset(): '24h' | 'week' | 'month' | '90d' | 'custom' {
  return 'month';
}

function expandedChartUnit(kpi: TestingHistoricalKPI): string {
  if (kpi.unit === '%') return '%';
  if (kpi.id === 'testing-avg-duration' || kpi.id === 'testing-total-duration') return 's';
  return '';
}

function ExpandedPerformanceTrendChart({
  activeKPI,
  dateRange,
}: {
  activeKPI: TestingHistoricalKPI;
  dateRange: ReturnType<typeof chartDateRangePreset>;
}) {
  const yPercentDomain =
    activeKPI.id === 'testing-success-rate' ||
    activeKPI.id === 'recent-agent-health' ||
    activeKPI.id === 'recent-agent-task-intent-success';

  return (
    <div className="kpi-card-grid__expanded">
      <div className={`rounded-lg border ${ck.borderDefault} ${ck.bgSurface} px-4 pb-4 pt-4 sm:px-6`}>
        <h3 className={`m-0 ${ck.typo.headingLargeMedium} ${ck.text}`}>Performance trend</h3>
        <p className={`mt-1 m-0 ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>
          X-axis: Evaluation ID • Y-axis: {activeKPI.heading}
        </p>
        <div className="mt-4 min-w-0">
          <KPIChart
            heading={activeKPI.heading}
            description={activeKPI.description}
            chartType="line"
            dateRange={dateRange}
            sparklineData={activeKPI.trendSeries}
            unit={expandedChartUnit(activeKPI)}
            value={activeKPI.value}
            valueMetricLabel={activeKPI.heading}
            curveType="linear"
            simplified={false}
            categoricalXLabels={[...activeKPI.testLabels]}
            chartSummary={activeKPI.chartSummary}
            showViewModeToggle={false}
            yDomain={yPercentDomain ? [0, 100] : undefined}
          />
        </div>
      </div>
    </div>
  );
}

export function TestingOverviewPanel({ dateRangeControl }: Props) {
  const navigate = useNavigate();
  const { currentProjectId } = useProjects();
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [activeRecentCardId, setActiveRecentCardId] = useState<string | null>(null);
  const dateRange = chartDateRangePreset();
  const activeKPI = activeCardId
    ? TESTING_HISTORICAL_KPIS.find((k) => k.id === activeCardId) ?? null
    : null;
  const activeRecentKPI = activeRecentCardId
    ? TESTING_RECENT_RUN_KPIS.find((k) => k.id === activeRecentCardId) ?? null
    : null;

  return (
    <div className="min-w-0 space-y-8">
      {/* Historical performance metrics */}
      <section className="min-w-0" aria-labelledby="testing-historical-heading">
        <div className="mb-4 flex min-w-0 flex-nowrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1 pr-2">
            <h2
              id="testing-historical-heading"
              className={`m-0 ${ck.sectionHeading} mb-0 !pb-0 truncate`}
            >
              Historical performance metrics
            </h2>
          </div>
          {dateRangeControl ? (
            <div className="flex shrink-0 items-center justify-end">{dateRangeControl}</div>
          ) : null}
        </div>

        <div className="kpi-card-grid">
          {TESTING_HISTORICAL_KPIS.map((kpi, index) => {
            const isLastInRow =
              (index + 1) % CARDS_PER_ROW === 0 || index === TESTING_HISTORICAL_KPIS.length - 1;
            const currentRowStart = Math.floor(index / CARDS_PER_ROW) * CARDS_PER_ROW;
            const currentRowEnd = Math.min(currentRowStart + CARDS_PER_ROW, TESTING_HISTORICAL_KPIS.length);
            const cardsInCurrentRow = TESTING_HISTORICAL_KPIS.slice(currentRowStart, currentRowEnd);
            const isActiveCardInThisRow = cardsInCurrentRow.some((card) => card.id === activeCardId);

            return (
              <Fragment key={kpi.id}>
                <KPICard
                  data={kpi}
                  isActive={activeCardId === kpi.id}
                  onClick={() => setActiveCardId(kpi.id === activeCardId ? null : kpi.id)}
                  isPinned={false}
                />
                {isLastInRow && isActiveCardInThisRow && activeKPI ? (
                  <ExpandedPerformanceTrendChart activeKPI={activeKPI} dateRange={dateRange} />
                ) : null}
              </Fragment>
            );
          })}
        </div>
      </section>

      {/* Top failure reasons — Observability table (includes section heading) */}
      <section className="min-w-0">
        <TopFailureReasonsTable />
      </section>

      {/* Recent run metrics */}
      <section className="min-w-0" aria-labelledby="testing-recent-heading">
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="testing-recent-heading" className={`m-0 ${ck.sectionHeading} mb-0 pb-0`}>
              Recent run metrics
            </h2>
            <Icon
              name="info-circle-bold"
              size={16}
              lengthUnit="px"
              className={`shrink-0 ${ck.textMuted}`}
              aria-hidden
            />
          </div>
        </div>
        <div className="kpi-card-grid">
          {TESTING_RECENT_RUN_KPIS.map((kpi, index) => {
            const isLastInRow =
              (index + 1) % RECENT_CARDS_PER_ROW === 0 || index === TESTING_RECENT_RUN_KPIS.length - 1;
            const currentRowStart = Math.floor(index / RECENT_CARDS_PER_ROW) * RECENT_CARDS_PER_ROW;
            const currentRowEnd = Math.min(currentRowStart + RECENT_CARDS_PER_ROW, TESTING_RECENT_RUN_KPIS.length);
            const cardsInCurrentRow = TESTING_RECENT_RUN_KPIS.slice(currentRowStart, currentRowEnd);
            const isActiveCardInThisRow = cardsInCurrentRow.some((card) => card.id === activeRecentCardId);

            return (
              <Fragment key={kpi.id}>
                <KPICard
                  data={kpi}
                  isActive={activeRecentCardId === kpi.id}
                  onClick={() =>
                    setActiveRecentCardId(kpi.id === activeRecentCardId ? null : kpi.id)
                  }
                  isPinned={false}
                />
                {isLastInRow && isActiveCardInThisRow && activeRecentKPI ? (
                  <ExpandedPerformanceTrendChart activeKPI={activeRecentKPI} dateRange={dateRange} />
                ) : null}
              </Fragment>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <footer className={`rounded-lg border ${ck.borderDefault} ${ck.bgSurface} px-6 py-6`}>
        <p className={`m-0 ${ck.typo.bodyLargeMedium} ${ck.text}`}>Need more insights?</p>
        <p className={`mt-2 m-0 ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>
          Visit the Observability dashboard for detailed performance trends and comprehensive analytics.
        </p>
        <div className="mt-4">
          <Button
            color="accent"
            variant="primary"
            size={40}
            prefixIcon="pop-out-bold"
            onClick={() => navigate(buildProjectPath(currentProjectId, '/kpi-dashboard'))}
          >
            Go to observability dashboard
          </Button>
        </div>
      </footer>
    </div>
  );
}
