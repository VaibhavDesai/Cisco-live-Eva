import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SharedButton from '../../../components/shared/Button';
import Dropdown from '../../../components/shared/Dropdown';
import { Input } from '../../../components/shared/FormInput';
import { Pagination } from '../../../components/shared/Pagination';
import { Icon } from '../../../icons/Icon';
import { useProjects } from '../../../projects/useProjects';
import { buildProjectPath } from '../../../projects/project-routing';
import { ck, clusKpiTable } from '../clus-kpi-theme';

export interface AgentRow {
  agentName: string;
  availability: 'Draft' | 'Testing' | 'Live' | 'Disabled';
  totalInteractions: number;
  flaggedInteractions: number;
  avgResolutionTime: string;
  csat: string;
  security: 'Secure' | 'At risk' | 'Review';
  issue?: string;
}

interface AgentTableProps {
  onViewAgent?: (agentName: string) => void;
}

const baseAgents: AgentRow[] = [
  {
    agentName: 'Billing Support',
    availability: 'Live',
    totalInteractions: 4200,
    flaggedInteractions: 66,
    avgResolutionTime: '8.2m',
    csat: '4.8',
    security: 'Secure',
    issue: 'High Resolution Time',
  },
  {
    agentName: 'Tech Assistant',
    availability: 'Testing',
    totalInteractions: 3800,
    flaggedInteractions: 76,
    avgResolutionTime: '4m 15s',
    csat: '3.2/5',
    security: 'At risk',
    issue: 'Low CSAT',
  },
  {
    agentName: 'Returns Bot',
    availability: 'Live',
    totalInteractions: 5100,
    flaggedInteractions: 65,
    avgResolutionTime: '0m 45s',
    csat: '3.9',
    security: 'Review',
    issue: 'High Escalation Rate',
  },
  {
    agentName: 'Agent_Technical',
    availability: 'Draft',
    totalInteractions: 4700,
    flaggedInteractions: 75,
    avgResolutionTime: '8m 20s',
    csat: '-',
    security: 'Secure',
  },
  {
    agentName: 'Agent_Sales',
    availability: 'Disabled',
    totalInteractions: 3200,
    flaggedInteractions: 58,
    avgResolutionTime: '5m 10s',
    csat: '4.0',
    security: 'Secure',
  },
  {
    agentName: 'Agent_Symptoms',
    availability: 'Live',
    totalInteractions: 6000,
    flaggedInteractions: 60,
    avgResolutionTime: '3m 45s',
    csat: '4.7',
    security: 'Secure',
  },
  {
    agentName: 'Agent_Compliance',
    availability: 'Testing',
    totalInteractions: 3600,
    flaggedInteractions: 77,
    avgResolutionTime: '6m 00s',
    csat: '4.1',
    security: 'Review',
  },
  {
    agentName: 'Agent_Feedback',
    availability: 'Live',
    totalInteractions: 4200,
    flaggedInteractions: 74,
    avgResolutionTime: '1m 30s',
    csat: '4.5',
    security: 'Secure',
  },
  {
    agentName: 'Agent_Quality',
    availability: 'Live',
    totalInteractions: 3300,
    flaggedInteractions: 65,
    avgResolutionTime: '2m 15s',
    csat: '4.3',
    security: 'Review',
  },
];

const additionalAgents = Array.from({ length: 24 }, (_, i) => ({
  agentName: `Agent_${String(i + 1).padStart(3, '0')}`,
  availability: ['Live', 'Testing', 'Draft', 'Disabled'][Math.floor(Math.random() * 4)] as AgentRow['availability'],
  totalInteractions: Math.floor(Math.random() * 5000) + 1000,
  flaggedInteractions: Math.floor(Math.random() * 100),
  avgResolutionTime: `${Math.floor(Math.random() * 10)}m ${Math.floor(Math.random() * 60)}s`,
  csat: (3 + Math.random() * 2).toFixed(1),
  security: ['Secure', 'At risk', 'Review'][Math.floor(Math.random() * 3)] as AgentRow['security'],
  issue: undefined as string | undefined,
}));

export const agentData: AgentRow[] = [...baseAgents, ...additionalAgents];

/** Distinct issue labels for the Issue filter (sorted). */
const UNIQUE_ISSUE_LABELS = Array.from(
  new Set(
    agentData.map((a) => a.issue).filter((x): x is string => Boolean(x)),
  ),
).sort((a, b) => a.localeCompare(b));

const ISSUE_FILTER_OPTIONS = [
  { value: 'all', label: 'Issue: Any type' },
  { value: 'has', label: 'Issue: Has open issue' },
  { value: 'none', label: 'Issue: No open issue' },
  ...UNIQUE_ISSUE_LABELS.map((label) => ({ value: label, label: `Issue: ${label}` })),
];

const AVAILABILITY_FILTER_OPTIONS = [
  { value: 'all', label: 'Availability: All' },
  { value: 'Disabled', label: 'Disabled' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Testing', label: 'Testing' },
  { value: 'Live', label: 'Live' },
];

const CSAT_RANGE_FILTER_OPTIONS = [
  { value: 'all', label: 'CSAT: Any score' },
  { value: 'no_score', label: 'No score' },
  { value: 'lt3', label: 'Below 3' },
  { value: 'gte3lt4', label: '3 to below 4' },
  { value: 'gte4', label: '4 and above' },
];

const SECURITY_FILTER_OPTIONS = [
  { value: 'all', label: 'Security: Any' },
  { value: 'Secure', label: 'Secure' },
  { value: 'At risk', label: 'At risk' },
  { value: 'Review', label: 'Review' },
];

const parseDuration = (duration: string): number => {
  let minutes = 0;
  let seconds = 0;
  const mMatch = duration.match(/(\d+(?:\.\d+)?)m/);
  if (mMatch) minutes = parseFloat(mMatch[1]);
  const sMatch = duration.match(/(\d+)s/);
  if (sMatch) seconds = parseInt(sMatch[1], 10);
  return minutes * 60 + seconds;
};

const parseCSAT = (csat: string): number => {
  if (csat === '-') return -1;
  return parseFloat(csat.split('/')[0]);
};

type IssueFilterValue = 'all' | 'has' | 'none' | string;

type AvailabilityFilterValue = 'all' | AgentRow['availability'];

type CsatRangeFilterValue = 'all' | 'no_score' | 'lt3' | 'gte3lt4' | 'gte4';

type SecurityFilterValue = 'all' | AgentRow['security'];

function issueFilterMatches(agent: AgentRow, filter: IssueFilterValue): boolean {
  if (filter === 'all') return true;
  if (filter === 'has') return Boolean(agent.issue);
  if (filter === 'none') return !agent.issue;
  return agent.issue === filter;
}

function csatRangeMatches(csat: string, range: CsatRangeFilterValue): boolean {
  if (range === 'all') return true;
  const n = parseCSAT(csat);
  if (range === 'no_score') return csat === '-' || n < 0;
  if (n < 0) return false;
  switch (range) {
    case 'lt3':
      return n < 3;
    case 'gte3lt4':
      return n >= 3 && n < 4;
    case 'gte4':
      return n >= 4;
    default:
      return true;
  }
}

type SortConfig =
  | {
      key: keyof AgentRow | 'issue';
      direction: 'asc' | 'desc';
    }
  | null;

const ITEMS_PER_PAGE = 20;

/** Issue: red label + exclamation-in-circle (matches design reference). */
function IssueCell({ issue }: { issue: string | undefined }) {
  if (!issue) {
    return <span className={`text-[14px] ${ck.textMuted}`}>—</span>;
  }
  return (
    <span className={`inline-flex items-center gap-2 text-[14px] ${ck.textError}`}>
      <Icon name="priority-circle" weight="bold" size={16} className="shrink-0" />
      {issue}
    </span>
  );
}

/** Availability: Live (green + check circle), Testing (orange + flask), Draft/Disabled (muted + doc / blocked). */
function AvailabilityCell({ availability }: { availability: AgentRow['availability'] }) {
  const cfg = {
    Live: { icon: 'check-circle' as const, tone: ck.textSuccess },
    Testing: { icon: 'test-tube' as const, tone: ck.textWarning },
    Draft: { icon: 'document' as const, tone: ck.textMuted },
    Disabled: { icon: 'blocked' as const, tone: ck.textMuted },
  }[availability];
  return (
    <span className={`inline-flex items-center gap-2 text-[14px] ${cfg.tone}`}>
      <Icon name={cfg.icon} weight="bold" size={16} className="shrink-0" />
      {availability}
    </span>
  );
}

/** Security: shield + semantic colour (Secure / Review / At risk). */
function SecurityCell({ security }: { security: AgentRow['security'] }) {
  const tone =
    security === 'Secure' ? ck.textSuccess : security === 'Review' ? ck.textWarning : ck.textError;
  return (
    <span className={`inline-flex items-center gap-2 text-[14px] ${tone}`}>
      <Icon name="shield" weight="bold" size={16} className="shrink-0" />
      {security}
    </span>
  );
}

export function AgentTable({ onViewAgent }: AgentTableProps = {}) {
  const navigate = useNavigate();
  const { currentProjectId } = useProjects();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [issueFilter, setIssueFilter] = useState<IssueFilterValue>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilterValue>('all');
  const [csatRangeFilter, setCsatRangeFilter] = useState<CsatRangeFilterValue>('all');
  const [securityFilter, setSecurityFilter] = useState<SecurityFilterValue>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'issue', direction: 'desc' });

  const handleSort = (key: keyof AgentRow) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' };
        return null;
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (key: keyof AgentRow) => {
    if (sortConfig?.key !== key) {
      return <Icon name="unsorted" weight="bold" size={16} className="opacity-50" />;
    }
    return sortConfig.direction === 'asc' ? (
      <Icon name="arrow-up" weight="bold" size={16} />
    ) : (
      <Icon name="arrow-down" weight="bold" size={16} />
    );
  };

  const filteredData = useMemo(() => {
    let data = [...agentData];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      data = data.filter((agent) => agent.agentName.toLowerCase().includes(q));
    }
    data = data.filter((agent) => issueFilterMatches(agent, issueFilter));
    if (availabilityFilter !== 'all') {
      data = data.filter((agent) => agent.availability === availabilityFilter);
    }
    if (csatRangeFilter !== 'all') {
      data = data.filter((agent) => csatRangeMatches(agent.csat, csatRangeFilter));
    }
    if (securityFilter !== 'all') {
      data = data.filter((agent) => agent.security === securityFilter);
    }
    if (sortConfig) {
      data.sort((a, b) => {
        const { key, direction } = sortConfig;
        let comparison = 0;
        switch (key) {
          case 'issue': {
            const aIssue = a.issue ? 1 : 0;
            const bIssue = b.issue ? 1 : 0;
            comparison = aIssue - bIssue;
            break;
          }
          case 'avgResolutionTime':
            comparison = parseDuration(a.avgResolutionTime) - parseDuration(b.avgResolutionTime);
            break;
          case 'csat':
            comparison = parseCSAT(a.csat) - parseCSAT(b.csat);
            break;
          default: {
            if (a[key] === undefined && b[key] === undefined) comparison = 0;
            else if (a[key] === undefined) comparison = -1;
            else if (b[key] === undefined) comparison = 1;
            else if (a[key]! < b[key]!) comparison = -1;
            else if (a[key]! > b[key]!) comparison = 1;
          }
        }
        return direction === 'asc' ? comparison : -comparison;
      });
    } else {
      data.sort((a, b) => {
        if (a.issue && !b.issue) return -1;
        if (!a.issue && b.issue) return 1;
        return 0;
      });
    }
    return data;
  }, [
    searchQuery,
    issueFilter,
    availabilityFilter,
    csatRangeFilter,
    securityFilter,
    sortConfig,
  ]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;

  const currentData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, issueFilter, availabilityFilter, csatRangeFilter, securityFilter]);

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className={`${ck.sectionHeading} m-0 mb-0 min-w-0`}>Agent overview</h2>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="min-w-[min(100%,18rem)] flex-[1.25] clus-kpi-search-wrap">
            <Input
              aria-label="Search agents by name"
              placeholder="Search agents by name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leadingIcon="search"
              clearable
              onClear={() => setSearchQuery('')}
              className="clus-kpi-search-input"
            />
          </div>
          <div className="min-w-[11rem] flex-1">
            <Dropdown
              options={ISSUE_FILTER_OPTIONS}
              value={issueFilter}
              onChange={(value) => setIssueFilter(value as IssueFilterValue)}
              size="compact"
              className="w-full min-w-0"
            />
          </div>
          <div className="min-w-[11rem] flex-1">
            <Dropdown
              options={AVAILABILITY_FILTER_OPTIONS}
              value={availabilityFilter}
              onChange={(value) => setAvailabilityFilter(value as AvailabilityFilterValue)}
              size="compact"
              className="w-full min-w-0"
            />
          </div>
          <div className="min-w-[11rem] flex-1">
            <Dropdown
              options={CSAT_RANGE_FILTER_OPTIONS}
              value={csatRangeFilter}
              onChange={(value) => setCsatRangeFilter(value as CsatRangeFilterValue)}
              size="compact"
              className="w-full min-w-0"
            />
          </div>
          <div className="min-w-[11rem] flex-1">
            <Dropdown
              options={SECURITY_FILTER_OPTIONS}
              value={securityFilter}
              onChange={(value) => setSecurityFilter(value as SecurityFilterValue)}
              size="compact"
              className="w-full min-w-0"
            />
          </div>
        </div>
      </div>

      <div className={clusKpiTable.card}>
      <div className={clusKpiTable.scroll}>
        <table className={clusKpiTable.table}>
          <thead className={clusKpiTable.thead}>
            <tr className={clusKpiTable.theadRow}>
              <th scope="col" className={clusKpiTable.thSortable} onClick={() => handleSort('agentName')}>
                <span className="inline-flex items-center gap-2">
                  Agent name
                  {getSortIcon('agentName')}
                </span>
              </th>
              <th scope="col" className={clusKpiTable.thSortable} onClick={() => handleSort('issue')}>
                <span className="inline-flex items-center gap-2">
                  Issue
                  {getSortIcon('issue')}
                </span>
              </th>
              <th scope="col" className={clusKpiTable.thSortable} onClick={() => handleSort('availability')}>
                <span className="inline-flex items-center gap-2">
                  Availability
                  {getSortIcon('availability')}
                </span>
              </th>
              <th scope="col" className={clusKpiTable.thSortable} onClick={() => handleSort('totalInteractions')}>
                <span className="inline-flex items-center gap-2">
                  Total interactions
                  {getSortIcon('totalInteractions')}
                </span>
              </th>
              <th scope="col" className={clusKpiTable.thSortable} onClick={() => handleSort('flaggedInteractions')}>
                <span className="inline-flex items-center gap-2">
                  Flagged
                  {getSortIcon('flaggedInteractions')}
                </span>
              </th>
              <th scope="col" className={clusKpiTable.thSortable} onClick={() => handleSort('avgResolutionTime')}>
                <span className="inline-flex items-center gap-2">
                  Avg resolution
                  {getSortIcon('avgResolutionTime')}
                </span>
              </th>
              <th scope="col" className={clusKpiTable.thSortable} onClick={() => handleSort('csat')}>
                <span className="inline-flex items-center gap-2">
                  CSAT
                  {getSortIcon('csat')}
                </span>
              </th>
              <th scope="col" className={clusKpiTable.thSortable} onClick={() => handleSort('security')}>
                <span className="inline-flex items-center gap-2">
                  Security
                  {getSortIcon('security')}
                </span>
              </th>
              <th scope="col" className={clusKpiTable.th}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={clusKpiTable.tbody}>
            {currentData.map((agent, index) => (
              <tr
                key={`${agent.agentName}-${index}`}
                className={clusKpiTable.tr}
              >
                <td className={clusKpiTable.td}>
                  <a
                    className="clus-kpi-agent-name-link"
                    href={`${buildProjectPath(currentProjectId, '/simulated-testing')}?primaryTab=configuration`}
                    onClick={(e) => {
                      e.preventDefault();
                      const target = `${buildProjectPath(currentProjectId, '/simulated-testing')}?primaryTab=configuration`;
                      navigate(target);
                    }}
                  >
                    {agent.agentName}
                  </a>
                </td>
                <td className={clusKpiTable.td}>
                  <IssueCell issue={agent.issue} />
                </td>
                <td className={clusKpiTable.td}>
                  <AvailabilityCell availability={agent.availability} />
                </td>
                <td className={`${clusKpiTable.td} tabular-nums ${ck.text}`}>{agent.totalInteractions}</td>
                <td className={`${clusKpiTable.td} tabular-nums ${ck.text}`}>{agent.flaggedInteractions}</td>
                <td className={`${clusKpiTable.td} ${ck.text}`}>{agent.avgResolutionTime}</td>
                <td className={`${clusKpiTable.td} ${ck.text}`}>{agent.csat}</td>
                <td className={clusKpiTable.td}>
                  <SecurityCell security={agent.security} />
                </td>
                <td className={clusKpiTable.td}>
                  <SharedButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    aria-label={`View ${agent.agentName} metrics`}
                    onClick={() => onViewAgent?.(agent.agentName)}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Icon name="view" weight="bold" size={12} />
                      View
                    </span>
                  </SharedButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        className="clus-kpi-agent-table-pagination"
        page={currentPage}
        pageCount={totalPages}
        pageSize={ITEMS_PER_PAGE}
        totalItems={filteredData.length}
        onPageChange={setCurrentPage}
        showCapacityControls
        showJumpToPage
      />
      </div>
    </div>
  );
}
