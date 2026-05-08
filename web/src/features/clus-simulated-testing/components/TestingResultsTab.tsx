import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button, Icon } from '../momentum';
import Badge from '../../../components/shared/Badge';
import { ck, clusKpiTable } from '../../clus-kpi-dashboard/clus-kpi-theme';
import { sampleEvaluationResults, type EvaluationResultRow, type EvaluationScenarioRow } from '../simulated-testing-data';
import { useSimulatedTestingResults } from '../simulated-testing-results-context';
import {
  SIMULATED_TESTING_TABLE_PAGE_SIZE,
  SimulatedTestingTablePagination,
} from './SimulatedTestingTablePagination';

type SortKey = keyof Pick<
  EvaluationResultRow,
  'id' | 'name' | 'testType' | 'dateSortKey' | 'duration' | 'status'
>;

function durationToSeconds(s: string): number {
  if (s === '-' || s === '—') return -1;
  let m = 0;
  let sec = 0;
  const mm = s.match(/(\d+)\s*m/);
  const ss = s.match(/(\d+)\s*s/);
  if (mm) m = parseInt(mm[1], 10);
  if (ss) sec = parseInt(ss[1], 10);
  return m * 60 + sec;
}

/** Stable ordering among synthetic rows sharing the same `dateSortKey` (same run). */
function evalIdSeqComparison(aId: string, bId: string): number {
  const ma = /^eval-(\d+)$/i.exec(aId);
  const mb = /^eval-(\d+)$/i.exec(bId);
  if (ma && mb) return Number.parseInt(ma[1], 10) - Number.parseInt(mb[1], 10);
  return aId.localeCompare(bId);
}

function statusSortRank(s: EvaluationResultRow['status']): number {
  if (s === 'Running') return 2;
  return s === 'Success' ? 0 : 1;
}

function statusChipProps(status: EvaluationResultRow['status'] | EvaluationScenarioRow['status']) {
  if (status === 'Success') return { variant: 'success' as const, label: status };
  if (status === 'Failed') return { variant: 'error' as const, label: status };
  return { variant: 'warning' as const, label: 'Running' };
}

function HeaderCell({
  label,
  sortKey,
  getSortIcon,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  getSortIcon: (key: SortKey) => ReactNode;
  onSort: (key: SortKey) => void;
}) {
  return (
    <th scope="col" className={`min-w-0 ${clusKpiTable.thSortable}`} onClick={() => onSort(sortKey)}>
      <span className="inline-flex items-center gap-2">
        <span className="min-w-0">{label}</span>
        {getSortIcon(sortKey)}
      </span>
    </th>
  );
}

export function TestingResultsTab() {
  const { dynamicEvaluationRows, openEvaluationFromRow, openScenarioStandalone } = useSimulatedTestingResults();

  const [page, setPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(['eval-001']));
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: 'asc' | 'desc';
  } | null>({ key: 'dateSortKey', direction: 'desc' });

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSort = (key: SortKey) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' };
        return null;
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig?.key !== key) {
      return <Icon name="unsorted-bold" size={16} lengthUnit="px" className="shrink-0 opacity-50" aria-hidden />;
    }
    return sortConfig.direction === 'asc' ? (
      <Icon name="arrow-up-bold" size={16} lengthUnit="px" className="shrink-0" aria-hidden />
    ) : (
      <Icon name="arrow-down-bold" size={16} lengthUnit="px" className="shrink-0" aria-hidden />
    );
  };

  const sortedRows = useMemo(() => {
    const data = [...dynamicEvaluationRows, ...sampleEvaluationResults];
    if (!sortConfig) return data;

    data.sort((a, b) => {
      switch (sortConfig.key) {
        case 'dateSortKey': {
          const primary = a.dateSortKey.localeCompare(b.dateSortKey);
          if (primary !== 0) {
            return sortConfig.direction === 'asc' ? primary : -primary;
          }
          const seq = evalIdSeqComparison(a.id, b.id);
          return seq;
        }
        default: {
          let comparison = 0;
          switch (sortConfig.key) {
            case 'id':
              comparison = a.id.localeCompare(b.id, undefined, { numeric: true });
              break;
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'testType':
              comparison = a.testType.localeCompare(b.testType);
              break;
            case 'duration':
              comparison = durationToSeconds(a.duration) - durationToSeconds(b.duration);
              break;
            case 'status':
              comparison = statusSortRank(a.status) - statusSortRank(b.status);
              break;
            default:
              comparison = 0;
          }
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }
      }
    });
    return data;
  }, [sortConfig, dynamicEvaluationRows]);

  useEffect(() => {
    setPage(1);
  }, [sortConfig]);

  const totalItems = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / SIMULATED_TESTING_TABLE_PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const pageOffset = (clampedPage - 1) * SIMULATED_TESTING_TABLE_PAGE_SIZE;
  const visibleEvalRows = sortedRows.slice(pageOffset, pageOffset + SIMULATED_TESTING_TABLE_PAGE_SIZE);

  return (
    <div className="min-w-0 space-y-4">
      <h3 className={`m-0 ${ck.tableTitle}`}>Test results</h3>

      <div className={clusKpiTable.cardTestingCompact}>
        <div className={clusKpiTable.scroll}>
          <table className={clusKpiTable.table}>
            <thead className={clusKpiTable.thead}>
              <tr className={clusKpiTable.theadRow}>
                <th scope="col" className={`w-10 min-w-[40px] ${clusKpiTable.th}`} aria-hidden />
              <HeaderCell label="Test / scenario id" sortKey="id" getSortIcon={getSortIcon} onSort={handleSort} />
              <HeaderCell
                label="Test / scenario name"
                sortKey="name"
                getSortIcon={getSortIcon}
                onSort={handleSort}
              />
              <HeaderCell label="Test type" sortKey="testType" getSortIcon={getSortIcon} onSort={handleSort} />
              <HeaderCell label="Date" sortKey="dateSortKey" getSortIcon={getSortIcon} onSort={handleSort} />
              <HeaderCell label="Test duration" sortKey="duration" getSortIcon={getSortIcon} onSort={handleSort} />
              <HeaderCell label="Status" sortKey="status" getSortIcon={getSortIcon} onSort={handleSort} />
            </tr>
          </thead>
            {visibleEvalRows.map((row) => {
              const hasMultipleScenarios = row.scenarios.length > 1;
              const expanded = expandedIds.has(row.id);
              const isRunning = row.status === 'Running';
              const statusChip = statusChipProps(row.status);
              return (
                <tbody
                  key={row.id}
                  className={`clus-kpi-failure-reason-group ${clusKpiTable.tbody}`}
                >
                  <tr className={clusKpiTable.tr}>
                    <td className={`${clusKpiTable.td} align-middle`}>
                      {hasMultipleScenarios ? (
                        <div className="flex justify-center">
                          <Button
                            variant="tertiary"
                            size={32}
                            prefixIcon={expanded ? 'arrow-down-bold' : 'arrow-right-bold'}
                            aria-label={expanded ? `Collapse ${row.name}` : `Expand ${row.name}`}
                            aria-expanded={expanded}
                            onClick={() => toggleExpanded(row.id)}
                          />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center" aria-hidden />
                      )}
                    </td>
                    <td className={`${clusKpiTable.td} font-['Inter',sans-serif] text-[14px] ${ck.text}`}>
                      {isRunning ? (
                        <span className={`${ck.textMuted}`}>{row.id}</span>
                      ) : (
                        <button
                          type="button"
                          className="clus-kpi-eval-id-link cursor-pointer p-0 text-left font-['Inter',sans-serif]"
                          onClick={() => openEvaluationFromRow(row)}
                        >
                          {row.id}
                        </button>
                      )}
                    </td>
                    <td className={`${clusKpiTable.td} min-w-0 font-medium text-[14px] ${ck.text}`}>
                      <span className={`line-clamp-2 ${ck.typo.bodyMidsizeRegular}`}>{row.name}</span>
                    </td>
                    <td className={`${clusKpiTable.td} text-[14px] ${ck.text}`}>{row.testType}</td>
                    <td className={`${clusKpiTable.td} text-[14px] ${ck.textMuted}`}>{row.dateLabel}</td>
                    <td className={`${clusKpiTable.td} tabular-nums text-[14px] ${ck.textMuted}`}>{row.duration}</td>
                    <td className={`${clusKpiTable.td} align-middle`}>
                      <span className="inline-flex items-center">
                        <Badge variant={statusChip.variant}>{statusChip.label}</Badge>
                      </span>
                    </td>
                  </tr>
                  {hasMultipleScenarios &&
                    expanded &&
                    row.scenarios.map((s: EvaluationScenarioRow, index: number) => (
                      <tr
                        key={`${row.id}-${s.id}`}
                        className="bg-[color-mix(in_srgb,var(--mds-color-theme-background-secondary-normal)_14%,var(--mds-color-theme-background-solid-secondary-normal))]"
                      >
                        <td className={`${clusKpiTable.td} align-middle`} aria-hidden />
                        <td className={`${clusKpiTable.td} pl-4 font-['Inter',sans-serif] text-[14px]`}>
                          <button
                            type="button"
                            className="clus-kpi-eval-id-link cursor-pointer p-0 text-left font-['Inter',sans-serif] text-xs font-medium"
                            onClick={() => openScenarioStandalone(s)}
                          >
                            Scenario #{index + 1}
                          </button>
                        </td>
                        <td className={`${clusKpiTable.td} min-w-0 pl-2 text-[14px] ${ck.textMuted}`}>
                          <span className={`line-clamp-2 ${ck.typo.bodyMidsizeRegular}`}>{s.name}</span>
                        </td>
                        <td className={`${clusKpiTable.td} text-[14px] ${ck.textMuted}`}>{s.testType}</td>
                        <td className={`${clusKpiTable.td} text-[14px] ${ck.textMuted}`}>{s.date}</td>
                        <td className={`${clusKpiTable.td} tabular-nums text-[14px] ${ck.textMuted}`}>{s.duration}</td>
                        <td className={`${clusKpiTable.td} align-middle`}>
                          <span className="inline-flex items-center">
                            <Badge variant={s.status === 'Success' ? 'success' : 'error'}>
                              {s.status}
                            </Badge>
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              );
            })}
          </table>
        </div>
        <SimulatedTestingTablePagination totalItems={totalItems} page={page} onPageChange={setPage} />
      </div>
    </div>
  );
}
