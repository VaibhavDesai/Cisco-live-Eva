import { useMemo, useState } from 'react';
import { Button, Icon } from '../momentum';
import { ck, clusKpiTable } from '../../clus-kpi-dashboard/clus-kpi-theme';
import { topFailureReasons, type TopFailureReason } from '../failure-reasons-data';
import { useSimulatedTestingResults } from '../simulated-testing-results-context';

const VISIBLE_EVAL_IDS = 2;

type SortKey = 'reason' | 'occurrences' | 'area' | 'evalIds' | 'frequency';

function parseOccurrencesLabel(label: string): number {
  const m = label.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function EvalIdLink({
  id,
  onOpen,
}: {
  id: string;
  onOpen: (evaluationId: string) => void;
}) {
  return (
    <button
      type="button"
      className="clus-kpi-eval-id-link cursor-pointer p-0 text-left"
      onClick={() => onOpen(id)}
    >
      {id}
    </button>
  );
}

function EvalIdBadges({
  ids,
  onOpen,
}: {
  ids: string[];
  onOpen: (evaluationId: string) => void;
}) {
  const visible = ids.slice(0, VISIBLE_EVAL_IDS);
  const rest = Math.max(0, ids.length - VISIBLE_EVAL_IDS);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visible.map((id) => (
        <EvalIdLink key={id} id={id} onOpen={onOpen} />
      ))}
      {rest > 0 && <span className={`shrink-0 ${ck.textMuted}`}>+{rest}</span>}
    </div>
  );
}

export function TopFailureReasonsTable() {
  const { openEvaluationById } = useSimulatedTestingResults();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const first = topFailureReasons[0]?.id;
    return first ? new Set([first]) : new Set();
  });

  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: 'asc' | 'desc';
  } | null>({ key: 'frequency', direction: 'desc' });

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
      return <Icon name="unsorted-bold" size={16} lengthUnit="px" className="opacity-50" aria-hidden />;
    }
    return sortConfig.direction === 'asc' ? (
      <Icon name="arrow-up-bold" size={16} lengthUnit="px" aria-hidden />
    ) : (
      <Icon name="arrow-down-bold" size={16} lengthUnit="px" aria-hidden />
    );
  };

  const sortedRows = useMemo(() => {
    const data = [...topFailureReasons];
    if (!sortConfig) return data;

    data.sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.key) {
        case 'reason':
          comparison = a.reason.localeCompare(b.reason);
          break;
        case 'occurrences':
          comparison =
            parseOccurrencesLabel(a.occurrencesLabel) - parseOccurrencesLabel(b.occurrencesLabel);
          break;
        case 'area':
          comparison = a.area.localeCompare(b.area);
          break;
        case 'evalIds':
          comparison = a.evaluationIds.length - b.evaluationIds.length;
          break;
        case 'frequency':
          comparison = a.frequencyPct - b.frequencyPct;
          break;
        default:
          comparison = 0;
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    return data;
  }, [sortConfig]);

  return (
    <section className="min-w-0 w-full" aria-labelledby="clus-top-failure-reasons-heading">
      <div className="w-full">
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="clus-top-failure-reasons-heading" className={`${ck.sectionHeading} m-0 mb-0 min-w-0`}>
              Top failure reasons
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

        <div className={clusKpiTable.card}>
          <div className={clusKpiTable.scroll}>
            <table className={clusKpiTable.table}>
              <thead className={clusKpiTable.thead}>
                <tr className={clusKpiTable.theadRow}>
                  <th scope="col" className={`w-10 min-w-[40px] ${clusKpiTable.th}`} aria-hidden />
                  <th
                    scope="col"
                    className={`min-w-[12rem] ${clusKpiTable.thSortable}`}
                    onClick={() => handleSort('reason')}
                  >
                    <span className="inline-flex items-center gap-2">
                      Failure reason
                      {getSortIcon('reason')}
                    </span>
                  </th>
                  <th
                    scope="col"
                    className={`min-w-[7.5rem] ${clusKpiTable.thSortable}`}
                    onClick={() => handleSort('occurrences')}
                  >
                    <span className="inline-flex items-center gap-2">
                      Occurrences
                      {getSortIcon('occurrences')}
                    </span>
                  </th>
                  <th
                    scope="col"
                    className={`min-w-[6.5rem] ${clusKpiTable.thSortable}`}
                    onClick={() => handleSort('area')}
                  >
                    <span className="inline-flex items-center gap-2">
                      Area
                      {getSortIcon('area')}
                    </span>
                  </th>
                  <th
                    scope="col"
                    className={`min-w-[10rem] ${clusKpiTable.thSortable}`}
                    onClick={() => handleSort('evalIds')}
                  >
                    <span className="inline-flex items-center gap-2">
                      Failed test IDs
                      {getSortIcon('evalIds')}
                    </span>
                  </th>
                  <th
                    scope="col"
                    className={`min-w-[5.5rem] ${clusKpiTable.thSortable}`}
                    onClick={() => handleSort('frequency')}
                  >
                    <span className="inline-flex items-center gap-2">
                      Frequency
                      {getSortIcon('frequency')}
                    </span>
                  </th>
                </tr>
              </thead>

              {sortedRows.map((row) => (
                <FailureReasonGroup
                  key={row.id}
                  row={row}
                  expanded={expandedIds.has(row.id)}
                  onToggle={() => toggleExpanded(row.id)}
                  onOpenEvaluation={openEvaluationById}
                />
              ))}
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function FailureReasonGroup({
  row,
  expanded,
  onToggle,
  onOpenEvaluation,
}: {
  row: TopFailureReason;
  expanded: boolean;
  onToggle: () => void;
  onOpenEvaluation: (evaluationId: string) => void;
}) {
  const hasSubs = row.subReasons.length > 0;

  return (
    <tbody className={`clus-kpi-failure-reason-group ${clusKpiTable.tbody}`}>
      <tr className={clusKpiTable.tr}>
        <td className={`${clusKpiTable.td} align-middle`}>
          {hasSubs ? (
            <div className="flex justify-center">
              <Button
                variant="tertiary"
                size={32}
                prefixIcon={expanded ? 'arrow-down-bold' : 'arrow-right-bold'}
                aria-label={expanded ? `Collapse ${row.reason}` : `Expand ${row.reason}`}
                aria-expanded={expanded}
                onClick={onToggle}
              />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center" aria-hidden />
          )}
        </td>
        <td className={`${clusKpiTable.td} min-w-0 font-medium ${ck.text}`}>
          <span className="line-clamp-2">{row.reason}</span>
        </td>
        <td className={`${clusKpiTable.td} tabular-nums ${ck.text}`}>{row.occurrencesLabel}</td>
        <td className={`${clusKpiTable.td} ${ck.text}`}>{row.area}</td>
        <td className={`${clusKpiTable.td} min-w-0`}>
          <EvalIdBadges ids={row.evaluationIds} onOpen={onOpenEvaluation} />
        </td>
        <td className={`${clusKpiTable.td} text-right tabular-nums align-middle ${ck.text}`}>
          {row.frequencyPct}%
        </td>
      </tr>

      {hasSubs &&
        expanded &&
        row.subReasons.map((sub) => (
          <tr
            key={sub.id}
            className="bg-[color-mix(in_srgb,var(--mds-color-theme-background-secondary-normal)_14%,var(--mds-color-theme-background-solid-secondary-normal))]"
          >
            <td className={`${clusKpiTable.td} align-middle`} aria-hidden />
            <td className={`${clusKpiTable.td} min-w-0 text-[14px] ${ck.textMuted}`}>
              <span className="line-clamp-2">{sub.label}</span>
            </td>
            <td className={`${clusKpiTable.td} tabular-nums text-[14px] ${ck.textMuted}`}>{sub.occurrencesLabel}</td>
            <td className={`${clusKpiTable.td} ${ck.textMuted}`}>{row.area}</td>
            <td className={`${clusKpiTable.td} min-w-0 align-middle`}>
              <EvalIdLink id={sub.evaluationId} onOpen={onOpenEvaluation} />
            </td>
            <td className={`${clusKpiTable.td} text-right tabular-nums align-middle ${ck.textMuted}`}>
              {row.frequencyPct}%
            </td>
          </tr>
        ))}
    </tbody>
  );
}
