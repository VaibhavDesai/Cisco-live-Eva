import { useEffect, useMemo, useState } from 'react';
import { Searchfield } from '../momentum';
import { ck, clusKpiTable } from '../../clus-kpi-dashboard/clus-kpi-theme';
import { sampleTestingChangeLog } from '../testing-change-log-data';
import {
  SIMULATED_TESTING_TABLE_PAGE_SIZE,
  SimulatedTestingTablePagination,
} from './SimulatedTestingTablePagination';

const PAGE_SIZE = SIMULATED_TESTING_TABLE_PAGE_SIZE;

export function TestingChangeLogTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sampleTestingChangeLog;
    return sampleTestingChangeLog.filter(
      (row) =>
        row.scenarioName.toLowerCase().includes(q) ||
        row.updatedAt.toLowerCase().includes(q) ||
        row.updatedBy.toLowerCase().includes(q) ||
        row.area.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const pageOffset = (clampedPage - 1) * PAGE_SIZE;
  const visibleRows = filteredRows.slice(pageOffset, pageOffset + PAGE_SIZE);

  return (
    <div className="min-w-0 space-y-4">
      <div className="testing-scenarios-tab-toolbar-row flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 shrink-0">
          <h3 className={`m-0 ${ck.tableTitle}`}>Change logs</h3>
        </div>
        <div className="testing-scenarios-tab-toolbar-row__actions flex min-w-0 flex-[1_1_16rem] flex-wrap items-center justify-end gap-3 sm:flex-nowrap">
          <div className="min-w-0 flex-1 clus-kpi-search-wrap sm:max-w-[22rem]">
            <Searchfield
              label=""
              placeholder="Search change logs..."
              value={searchQuery}
              onInput={(e: Event) =>
                setSearchQuery((e.target as HTMLElement & { value: string }).value)
              }
              className="clus-kpi-search-input"
            />
          </div>
        </div>
      </div>

      <div className={clusKpiTable.cardTestingCompact}>
        <div className={clusKpiTable.scroll}>
          <table className={`${clusKpiTable.table} w-full table-fixed`}>
            <colgroup>
              <col className="min-w-0" />
              <col className="w-[10rem]" />
              <col className="w-[6.5rem]" />
              <col className="w-[8.5rem]" />
              <col className="min-w-0" />
            </colgroup>
            <thead className={clusKpiTable.thead}>
              <tr className={clusKpiTable.theadRow}>
                <th scope="col" className={`!text-left ${clusKpiTable.th}`}>
                  Test scenario
                </th>
                <th scope="col" className={`!text-left ${clusKpiTable.th}`}>
                  Updated at
                </th>
                <th scope="col" className={`!text-left ${clusKpiTable.th}`}>
                  Updated by
                </th>
                <th scope="col" className={`!text-left ${clusKpiTable.th}`}>
                  Area
                </th>
                <th scope="col" className={`!text-left ${clusKpiTable.th}`}>
                  Description
                </th>
              </tr>
            </thead>
            <tbody className={clusKpiTable.tbody}>
              {filteredRows.length === 0 ? (
                <tr className={clusKpiTable.tr}>
                  <td className={`${clusKpiTable.td} ${ck.textMuted}`} colSpan={5}>
                    No change log entries match your search.
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => (
                  <tr key={row.id} className={clusKpiTable.tr}>
                    <td className={`${clusKpiTable.td} min-w-0 font-medium ${ck.text}`}>{row.scenarioName}</td>
                    <td className={`${clusKpiTable.td} whitespace-nowrap ${ck.textMuted}`}>{row.updatedAt}</td>
                    <td className={`${clusKpiTable.td} whitespace-nowrap ${ck.textMuted}`}>{row.updatedBy}</td>
                    <td className={`${clusKpiTable.td} min-w-0 ${ck.textMuted}`}>{row.area}</td>
                    <td className={`${clusKpiTable.td} min-w-0 ${ck.text}`}>{row.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <SimulatedTestingTablePagination totalItems={totalItems} page={page} onPageChange={setPage} />
      </div>
    </div>
  );
}
