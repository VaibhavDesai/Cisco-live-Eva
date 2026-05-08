import { useEffect, useMemo, useState } from 'react';
import { Button } from '../momentum';
import { ck, clusKpiTable } from '../../clus-kpi-dashboard/clus-kpi-theme';
import { type ScenarioVariableRow } from '../simulated-testing-data';
import {
  SIMULATED_TESTING_TABLE_PAGE_SIZE,
  SimulatedTestingTablePagination,
} from './SimulatedTestingTablePagination';

interface TestingVariablesTabProps {
  searchQuery: string;
  /** Sample/default variables (passed from parent so overrides are reflected). */
  sampleVariables?: ScenarioVariableRow[];
  /** Variables created in this session (shown after sample rows). */
  userVariables?: ScenarioVariableRow[];
  /** Open delete confirmation for this row (parent shows modal then removes if confirmed). */
  onRequestDeleteVariable?: (row: ScenarioVariableRow) => void;
  /** Edit any variable — opens the edit dialog pre-populated with this row. */
  onEditVariable?: (row: ScenarioVariableRow) => void;
}

export function TestingVariablesTab({
  searchQuery,
  sampleVariables = [],
  userVariables = [],
  onRequestDeleteVariable,
  onEditVariable,
}: TestingVariablesTabProps) {
  const allVariables = useMemo(
    () => [...sampleVariables, ...userVariables],
    [sampleVariables, userVariables],
  );

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allVariables;
    return allVariables.filter((row) => {
      const date = (row.dateAdded ?? '').toLowerCase();
      const by = (row.addedBy ?? '').toLowerCase();
      return (
        row.name.toLowerCase().includes(q) ||
        row.defaultValue.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q) ||
        date.includes(q) ||
        by.includes(q)
      );
    });
  }, [searchQuery, allVariables]);

  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / SIMULATED_TESTING_TABLE_PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const pageOffset = (clampedPage - 1) * SIMULATED_TESTING_TABLE_PAGE_SIZE;
  const visiblePageRows = filteredRows.slice(
    pageOffset,
    pageOffset + SIMULATED_TESTING_TABLE_PAGE_SIZE,
  );

  return (
    <div className="min-w-0">
      <div className={clusKpiTable.card}>
        <div className={clusKpiTable.scroll}>
          <table className={`${clusKpiTable.table} w-full table-fixed`}>
            <colgroup>
              <col className="min-w-0" />
              <col className="min-w-0" />
              <col className="w-[7.5rem]" />
              <col className="w-[8.5rem]" />
              <col className="w-[6.5rem]" />
            </colgroup>
            <thead className={clusKpiTable.thead}>
              <tr className={clusKpiTable.theadRow}>
                <th scope="col" className={`!text-left ${clusKpiTable.th}`}>
                  Variable name
                </th>
                <th scope="col" className={`!text-left ${clusKpiTable.th}`}>
                  Value
                </th>
                <th scope="col" className={`!text-left ${clusKpiTable.th}`}>
                  Date added
                </th>
                <th scope="col" className={`!text-left ${clusKpiTable.th}`}>
                  Added by
                </th>
                <th scope="col" className={`!text-right ${clusKpiTable.th}`}>
                  Controls
                </th>
              </tr>
            </thead>
            <tbody className={clusKpiTable.tbody}>
              {totalItems === 0 ? (
                <tr className={clusKpiTable.tr}>
                  <td className={`${clusKpiTable.td} ${ck.textMuted}`} colSpan={5}>
                    No variables match your search.
                  </td>
                </tr>
              ) : (
                visiblePageRows.map((row) => {
                  return (
                    <tr key={row.id} className={clusKpiTable.tr}>
                      <td className={`${clusKpiTable.td} min-w-0`}>
                        <span className={`text-sm font-semibold ${ck.text}`}>{row.name}</span>
                      </td>
                      <td className={`${clusKpiTable.td} min-w-0 ${ck.text}`}>
                        {row.defaultValue.trim() ? row.defaultValue : '—'}
                      </td>
                      <td className={`${clusKpiTable.td} whitespace-nowrap ${ck.textMuted}`}>
                        {row.dateAdded ?? '—'}
                      </td>
                      <td className={`${clusKpiTable.td} min-w-0 whitespace-nowrap ${ck.textMuted}`}>
                        {row.addedBy ?? '—'}
                      </td>
                      <td className={`${clusKpiTable.td} text-right align-middle`}>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="tertiary"
                            color="default"
                            size={32}
                            prefixIcon="edit-bold"
                            aria-label={`Edit ${row.name}`}
                            onClick={() => onEditVariable?.(row)}
                          />
                          <Button
                            type="button"
                            variant="tertiary"
                            color="default"
                            size={32}
                            prefixIcon="delete-bold"
                            aria-label={`Delete ${row.name}`}
                            onClick={() => onRequestDeleteVariable?.(row)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <SimulatedTestingTablePagination
          totalItems={totalItems}
          page={page}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
