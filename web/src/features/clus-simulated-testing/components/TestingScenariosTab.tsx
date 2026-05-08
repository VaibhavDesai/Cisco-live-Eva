import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import Badge from '../../../components/shared/Badge';
import { Button, Checkbox, Icon } from '../momentum';
import { ck, clusKpiTable } from '../../clus-kpi-dashboard/clus-kpi-theme';
import { sampleScenarios, type TestScenarioRow } from '../simulated-testing-data';
import {
  SIMULATED_TESTING_TABLE_PAGE_SIZE,
  SimulatedTestingTablePagination,
} from './SimulatedTestingTablePagination';

type SortKey = keyof Pick<
  TestScenarioRow,
  'name' | 'lastRun' | 'lastUpdatedSortKey' | 'updatedBy'
>;

const EMPTY_RUNNING_IDS = new Set<string>();

function formatScenarioLastUpdatedLabel(mmDdYyyy: string): string {
  const parts = mmDdYyyy.split('/');
  if (parts.length !== 3) return mmDdYyyy;
  const [mo, d, y] = parts;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mi = parseInt(mo, 10) - 1;
  if (mi < 0 || mi > 11) return mmDdYyyy;
  return `${parseInt(d, 10)}, ${months[mi]} ${y.slice(2)}`;
}

interface TestingScenariosTabProps {
  searchQuery: string;
  /** User-created scenarios (prepended to sample data). */
  userScenarios?: TestScenarioRow[];
  /** Edited sample scenarios keyed by id (prototype persistence). */
  sampleScenarioOverrides?: ReadonlyMap<string, TestScenarioRow>;
  /** Sample ids removed from the table (prototype). */
  removedSampleScenarioIds?: ReadonlySet<string>;
  selectedIds: Set<string>;
  setSelectedIds: Dispatch<SetStateAction<Set<string>>>;
  /** Scenario rows currently showing an in-progress “Running” state in Last run. */
  runningScenarioIds?: ReadonlySet<string>;
  /** Bumped by the parent each time scenarios are added so the table can surface them. */
  scenarioAddedSignal?: number;
  onRequestEditScenario?: (row: TestScenarioRow) => void;
  onRequestDuplicateScenario?: (row: TestScenarioRow) => void;
  onRequestDeleteScenario?: (row: TestScenarioRow) => void;
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
    <th scope="col" className={`min-w-0 !text-left ${clusKpiTable.thSortable}`} onClick={() => onSort(sortKey)}>
      <span className="inline-flex items-center justify-start gap-2">
        <span className="min-w-0">{label}</span>
        {getSortIcon(sortKey)}
      </span>
    </th>
  );
}

export function TestingScenariosTab({
  searchQuery,
  userScenarios = [],
  sampleScenarioOverrides,
  removedSampleScenarioIds,
  selectedIds,
  setSelectedIds,
  runningScenarioIds = EMPTY_RUNNING_IDS,
  scenarioAddedSignal = 0,
  onRequestEditScenario,
  onRequestDuplicateScenario,
  onRequestDeleteScenario,
}: TestingScenariosTabProps) {
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: 'asc' | 'desc';
  } | null>({ key: 'name', direction: 'asc' });

  // When a scenario is added, jump to page 1 and sort by most recently updated so the new row is on top.
  useEffect(() => {
    if (scenarioAddedSignal === 0) return;
    setSortConfig({ key: 'lastUpdatedSortKey', direction: 'desc' });
    setPage(1);
  }, [scenarioAddedSignal]);

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

  const mergedSampleScenarios = useMemo(() => {
    const removed = removedSampleScenarioIds;
    const base = removed?.size
      ? sampleScenarios.filter((s) => !removed.has(s.id))
      : sampleScenarios;
    const overrides = sampleScenarioOverrides;
    if (!overrides || overrides.size === 0) return base;
    return base.map((s) => overrides.get(s.id) ?? s);
  }, [sampleScenarioOverrides, removedSampleScenarioIds]);

  const filteredSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let data = [...userScenarios, ...mergedSampleScenarios];
    if (q) {
      data = data.filter((row) => {
        const hay = [
          row.name,
          row.type,
          row.channel,
          row.description,
          row.instructions,
          row.expectedOutcome,
        ]
          .filter(Boolean)
          .join('\n')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    if (sortConfig) {
      data.sort((a, b) => {
        let comparison = 0;
        switch (sortConfig.key) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'lastRun':
            comparison = a.lastRun.localeCompare(b.lastRun);
            break;
          case 'lastUpdatedSortKey':
            comparison = a.lastUpdatedSortKey.localeCompare(b.lastUpdatedSortKey);
            break;
          case 'updatedBy':
            comparison = a.updatedBy.localeCompare(b.updatedBy);
            break;
          default:
            comparison = 0;
        }
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }
    return data;
  }, [sortConfig, searchQuery, userScenarios, mergedSampleScenarios]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortConfig]);

  const totalItems = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / SIMULATED_TESTING_TABLE_PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const pageOffset = (clampedPage - 1) * SIMULATED_TESTING_TABLE_PAGE_SIZE;
  const visiblePageRows = filteredSorted.slice(pageOffset, pageOffset + SIMULATED_TESTING_TABLE_PAGE_SIZE);

  const allVisibleSelected =
    visiblePageRows.length > 0 && visiblePageRows.every((r) => selectedIds.has(r.id));

  const someVisibleSelected =
    visiblePageRows.length > 0 && visiblePageRows.some((r) => selectedIds.has(r.id)) && !allVisibleSelected;

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visiblePageRows.forEach((r) => next.delete(r.id));
      } else {
        visiblePageRows.forEach((r) => next.add(r.id));
      }
      return next;
    });
  };

  return (
    <div className="min-w-0">
      <div className={clusKpiTable.cardTestingCompact}>
        <div className={clusKpiTable.scroll}>
          <table className={`${clusKpiTable.table} table-fixed`}>
            <colgroup>
              <col className="w-10" />
              <col />
              <col className="w-[9rem]" />
              <col className="w-[8rem]" />
              <col className="min-w-[6.5rem]" />
              <col className="w-[7rem]" />
            </colgroup>
            <thead className={clusKpiTable.thead}>
              <tr className={clusKpiTable.theadRow}>
                <th scope="col" className={`w-10 max-w-[40px] ${clusKpiTable.th}`}>
                  <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      label=""
                      dataAriaLabel={
                        allVisibleSelected
                          ? 'Deselect all scenarios on this page'
                          : 'Select all scenarios on this page'
                      }
                      checked={allVisibleSelected}
                      indeterminate={someVisibleSelected}
                      onChange={toggleSelectAllVisible}
                    />
                  </div>
                </th>
                <HeaderCell label="Name" sortKey="name" getSortIcon={getSortIcon} onSort={handleSort} />
                <HeaderCell label="Last run" sortKey="lastRun" getSortIcon={getSortIcon} onSort={handleSort} />
                <HeaderCell
                  label="Last updated"
                  sortKey="lastUpdatedSortKey"
                  getSortIcon={getSortIcon}
                  onSort={handleSort}
                />
                <HeaderCell
                  label="Updated by"
                  sortKey="updatedBy"
                  getSortIcon={getSortIcon}
                  onSort={handleSort}
                />
                <th scope="col" className={`!text-left ${clusKpiTable.th}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={clusKpiTable.tbody}>
              {visiblePageRows.map((row) => (
                <tr key={row.id} className={clusKpiTable.tr}>
                  <td className={`${clusKpiTable.td} align-top`}>
                    <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        label=""
                        dataAriaLabel={`Select ${row.name}`}
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                      />
                    </div>
                  </td>
                  <td className={`${clusKpiTable.td} min-w-0`}>
                    <p className={`m-0 font-medium ${ck.text}`}>{row.name}</p>
                  </td>
                  <td className={`${clusKpiTable.td} whitespace-nowrap ${ck.text}`}>
                    {runningScenarioIds.has(row.id) ? (
                      <span className="inline-flex items-center" aria-live="polite">
                        <Badge variant="warning">Running</Badge>
                      </span>
                    ) : (
                      row.lastRun
                    )}
                  </td>
                  <td className={`${clusKpiTable.td} whitespace-nowrap ${ck.text}`}>
                    {formatScenarioLastUpdatedLabel(row.lastUpdated)}
                  </td>
                  <td className={`${clusKpiTable.td} min-w-0 ${ck.text}`}>
                    <span className="block truncate" title={row.updatedBy}>
                      {row.updatedBy}
                    </span>
                  </td>
                  <td className={`${clusKpiTable.td} !text-left align-middle`}>
                    <div className="flex w-fit max-w-full items-center justify-start gap-0">
                      <Button
                        variant="tertiary"
                        size={32}
                        prefixIcon="edit-bold"
                        aria-label={`Edit ${row.name}`}
                        type="button"
                        disabled={!onRequestEditScenario}
                        onClick={() => onRequestEditScenario?.(row)}
                      />
                      <Button
                        variant="tertiary"
                        size={32}
                        prefixIcon="copy-bold"
                        aria-label={`Duplicate ${row.name}`}
                        type="button"
                        disabled={!onRequestDuplicateScenario}
                        onClick={() => onRequestDuplicateScenario?.(row)}
                      />
                      <Button
                        variant="tertiary"
                        size={32}
                        prefixIcon="delete-bold"
                        aria-label={`Delete ${row.name}`}
                        type="button"
                        className={ck.textError}
                        disabled={!onRequestDeleteScenario}
                        onClick={() => onRequestDeleteScenario?.(row)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SimulatedTestingTablePagination totalItems={totalItems} page={page} onPageChange={setPage} />
      </div>
    </div>
  );
}
