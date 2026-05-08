import { Button, Icon } from '../momentum';
import { useMemo, useState } from 'react';
import { ck, clusKpiTable } from '../clus-kpi-theme';
import { useClusKpiDashboardNav } from '../clus-kpi-dashboard-nav-context';

export interface Interaction {
  id: string;
  timestamp: string;
  agentCount: number;
  agentType: string;
  agentName?: string;
  agentNames?: string[]; // For multi-agent interactions
  sessionCount: number;
  messages: number;
  duration: string;
  statusType: "completed" | "failed" | "handoff";
  statusLabel: string;
  statusSublabel?: string;
  metricValue?: number; // Dynamic metric value
}

export const baseInteractions: Interaction[] = [
  {
    id: "interaction-001",
    timestamp: "03:32 PM",
    agentCount: 3,
    agentType: "Multi-Agent",
    agentNames: [
      "Technical Support Agent",
      "Billing Specialist",
      "Customer Success Agent Specialist",
    ],
    sessionCount: 4,
    messages: 23,
    duration: "12m 23s",
    statusType: "completed",
    statusLabel: "Completed",
  },
  {
    id: "interaction-002",
    timestamp: "03:28 PM",
    agentCount: 2,
    agentType: "Multi-Agent",
    agentNames: ["Technical Support Agent", "Billing Specialist"],
    sessionCount: 3,
    messages: 15,
    duration: "8m 45s",
    statusType: "completed",
    statusLabel: "Completed",
  },
  {
    id: "interaction-003",
    timestamp: "03:25 PM",
    agentCount: 1,
    agentType: "Single-Agent",
    agentName: "Technical Support Agent",
    sessionCount: 2,
    messages: 12,
    duration: "6m 12s",
    statusType: "handoff",
    statusLabel: "Handoff",
    statusSublabel: "Goal not achieved",
  },
  {
    id: "interaction-004",
    timestamp: "03:20 PM",
    agentCount: 2,
    agentType: "Multi-Agent",
    agentNames: ["Customer Success Agent Specialist", "Technical Support Agent"],
    sessionCount: 5,
    messages: 28,
    duration: "15m 34s",
    statusType: "completed",
    statusLabel: "Completed",
  },
  {
    id: "interaction-005",
    timestamp: "03:18 PM",
    agentCount: 1,
    agentType: "Single-Agent",
    agentName: "Billing Specialist",
    sessionCount: 1,
    messages: 6,
    duration: "3m 22s",
    statusType: "failed",
    statusLabel: "Failed",
    statusSublabel: "Goal not achieved",
  },
  {
    id: "interaction-006",
    timestamp: "03:15 PM",
    agentCount: 4,
    agentType: "Multi-Agent",
    agentNames: [
      "Technical Support Agent",
      "Billing Specialist",
      "Customer Success Agent Specialist",
      "Product Specialist",
    ],
    sessionCount: 6,
    messages: 35,
    duration: "18m 56s",
    statusType: "completed",
    statusLabel: "Completed",
  },
  {
    id: "interaction-007",
    timestamp: "03:12 PM",
    agentCount: 2,
    agentType: "Multi-Agent",
    agentNames: ["Billing Specialist", "Customer Success Agent Specialist"],
    sessionCount: 3,
    messages: 18,
    duration: "9m 18s",
    statusType: "completed",
    statusLabel: "Completed",
  },
  {
    id: "interaction-008",
    timestamp: "03:08 PM",
    agentCount: 1,
    agentType: "Single-Agent",
    agentName: "Product Specialist",
    sessionCount: 2,
    messages: 9,
    duration: "4m 45s",
    statusType: "completed",
    statusLabel: "Completed",
  },
];

export function RecentInteractions({
  currentAgent,
  title,
  metricName,
  metricUnit,
  timeSegment,
  timeSeriesData,
  chartView = false,
  dateRange,
  className,
  filterStatus = 'all',
}: {
  currentAgent?: string;
  title?: string;
  metricName?: string;
  metricUnit?: string;
  timeSegment?: string | null;
  timeSeriesData?: {
    date: string;
    value1: number;
    value2?: number;
  }[];
  chartView?: boolean;
  dateRange?: '24h' | 'week' | 'month' | '90d' | 'custom';
  className?: string;
  filterStatus?: 'incomplete' | 'all';
}) {
  const nav = useClusKpiDashboardNav();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Generate timestamps based on time segment
  const generateTimestamp = (
    segmentLabel: string | null,
    _index: number,
  ): string => {
    if (
      segmentLabel === null &&
      timeSeriesData &&
      timeSeriesData.length > 0
    ) {
      const randomIndex = Math.floor(Math.random() * timeSeriesData.length);
      const dataPoint = timeSeriesData[randomIndex];
      const dateLabel = dataPoint.date;

      const hourMatch = dateLabel.match(/(\d+)(am|pm)/i);
      if (hourMatch) {
        const hour = parseInt(hourMatch[1]);
        const isPM = hourMatch[2].toLowerCase() === "pm";
        const hour24 =
          isPM && hour !== 12
            ? hour + 12
            : !isPM && hour === 12
              ? 0
              : hour;
        const minutes = Math.floor(Math.random() * 60);
        return `${String(hour24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      }

      const randomHour = Math.floor(Math.random() * 24);
      const randomMinutes = Math.floor(Math.random() * 60);
      return `${String(randomHour).padStart(2, "0")}:${String(randomMinutes).padStart(2, "0")}`;
    }

    if (!segmentLabel) return "03:32";

    const hourMatch = segmentLabel.match(/(\d+)(am|pm)/i);
    if (hourMatch) {
      const hour = parseInt(hourMatch[1]);
      const isPM = hourMatch[2].toLowerCase() === "pm";
      const hour24 =
        isPM && hour !== 12
          ? hour + 12
          : !isPM && hour === 12
            ? 0
            : hour;

      const minutes = Math.floor(Math.random() * 60);
      return `${String(hour24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }

    const randomHour = Math.floor(Math.random() * 24);
    const randomMinutes = Math.floor(Math.random() * 60);
    return `${String(randomHour).padStart(2, "0")}:${String(randomMinutes).padStart(2, "0")}`;
  };

  const generateMetricValue = (metricName?: string): number => {
    if (!metricName) return 0;
    const lowerMetric = metricName.toLowerCase();

    if (
      lowerMetric.includes("csat") ||
      lowerMetric.includes("satisfaction") ||
      lowerMetric.includes("effort")
    ) {
      return Math.random() * 2 + 3;
    }

    if (lowerMetric.includes("nps")) {
      return Math.random() * 100;
    }

    if (
      lowerMetric.includes("response") ||
      lowerMetric.includes("time") ||
      lowerMetric.includes("latency")
    ) {
      return Math.random() * 500 + 100;
    }

    if (
      lowerMetric.includes("rate") ||
      lowerMetric.includes("resolution")
    ) {
      return Math.random() * 30 + 70;
    }

    return Math.random() * 100;
  };

  const formatMetricValue = (
    value: number,
    unit?: string,
  ): string => {
    if (!unit) return value.toFixed(1);

    switch (unit) {
      case "/5":
        return `${value.toFixed(1)}★`;
      case "s":
        return `${value.toFixed(1)}s`;
      case "ms":
        return `${value.toFixed(0)}ms`;
      case "min":
        return `${value.toFixed(1)} min`;
      case "%":
      case "":
        return `${value.toFixed(1)}%`;
      default:
        return `${value.toFixed(1)}${unit}`;
    }
  };

  const interactions = useMemo(() => {
    let count = baseInteractions.length;
    if (chartView) {
      if (timeSegment) {
        count = 24;
      } else {
        switch (dateRange) {
          case 'week': count = 1400; break;
          case 'month': count = 6000; break;
          case '90d': count = 18000; break;
          case '24h': 
          default: count = 200; break;
        }
      }
    }

    const result = [];
    for (let i = 0; i < count; i++) {
      const baseIndex = i % baseInteractions.length;
      const interaction = baseInteractions[baseIndex];
      let updated = { ...interaction };
      
      updated.id = `int-${String(i + 1).padStart(5, '0')}`;

      if (timeSegment !== undefined) {
        updated.timestamp = generateTimestamp(timeSegment, i);
      }

      if (metricName) {
        updated.metricValue = generateMetricValue(metricName);
      }

      if (interaction.agentCount === 1 && currentAgent) {
        updated.agentName = currentAgent;
      }

      if (interaction.agentCount > 1 && currentAgent) {
        const agentNames = interaction.agentNames || [];
        if (!agentNames.includes(currentAgent)) {
          const updatedAgents = [
            currentAgent,
            ...agentNames.slice(1),
          ];
          updated.agentNames = updatedAgents;
        }
      }
      
      result.push(updated);
    }

    if (filterStatus === 'incomplete') {
      return result.filter(i => i.statusType !== 'completed');
    }

    return result;
  }, [currentAgent, timeSegment, metricName, timeSeriesData, chartView, dateRange, filterStatus]);

  const totalPages = Math.ceil(interactions.length / itemsPerPage);
  
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return interactions.slice(start, start + itemsPerPage);
  }, [currentPage, interactions]);

  return (
    <div className={`w-full ${className || 'mt-8'}`}>
      {title && (
        <h2 className={`${ck.sectionHeading} mb-4`}>
          {title}
        </h2>
      )}

      <div className={clusKpiTable.card}>
        <div className={clusKpiTable.scroll}>
          <table className={clusKpiTable.table}>
            <thead className={clusKpiTable.thead}>
              <tr className={clusKpiTable.theadRow}>
                <th scope="col" className={clusKpiTable.th}>
                  Interaction ID
                </th>
                {metricName && <th scope="col" className={clusKpiTable.th}>{metricName}</th>}
                <th scope="col" className={clusKpiTable.th}>Timestamp</th>
                <th scope="col" className={clusKpiTable.th}>Agents</th>
                {!chartView && (
                  <>
                    <th scope="col" className={clusKpiTable.th}>Sessions</th>
                    <th scope="col" className={clusKpiTable.th}>Duration</th>
                  </>
                )}
                <th scope="col" className={clusKpiTable.th}>Status</th>
              </tr>
            </thead>
            <tbody className={clusKpiTable.tbody}>
              {currentData.map((interaction) => (
                <tr key={interaction.id} className={clusKpiTable.tr}>
                  <td className={`${clusKpiTable.td} font-medium text-[14px]`}>
                    <a
                      href={`#/interaction/${encodeURIComponent(interaction.id)}`}
                      className={`${ck.textAccent} hover:underline`}
                      onClick={(e) => {
                        if (nav) {
                          e.preventDefault();
                          nav.openInteraction(interaction.id);
                        }
                      }}
                    >
                      {interaction.id}
                    </a>
                  </td>
                  {metricName && (
                    <td className={`${clusKpiTable.td} text-[14px] ${ck.text}`}>
                      {formatMetricValue(interaction.metricValue || 0, metricUnit)}
                    </td>
                  )}
                  <td className={`${clusKpiTable.td} text-[14px] ${ck.text}`}>{interaction.timestamp}</td>
                  <td className={clusKpiTable.td}>
                    <div className={`text-[14px] ${ck.text}`} title={interaction.agentNames?.join(', ')}>
                      {interaction.agentCount === 1 
                        ? (currentAgent || interaction.agentName || "Agent")
                        : `(${interaction.agentCount}) ${interaction.agentNames?.slice(0, 3).join(', ')}${interaction.agentNames && interaction.agentNames.length > 3 ? '...' : ''}`
                      }
                    </div>
                  </td>
                  {!chartView && (
                    <>
                      <td className={`${clusKpiTable.td} text-[14px] ${ck.text}`}>
                        {interaction.sessionCount} ({interaction.messages} messages)
                      </td>
                      <td className={`${clusKpiTable.td} text-[14px] ${ck.text}`}>{interaction.duration}</td>
                    </>
                  )}
                  <td className={clusKpiTable.td}>
                    <div className="flex items-center gap-2">
                      {interaction.statusType === "completed" && (
                        <Icon name="check-circle-bold" size={16} lengthUnit="px" className={ck.textSuccess} aria-hidden />
                      )}
                      {interaction.statusType === "failed" && (
                        <Icon name="cancel-circle-bold" size={16} lengthUnit="px" className={ck.textError} aria-hidden />
                      )}
                      {interaction.statusType === "handoff" && (
                        <Icon name="alert-circle-bold" size={16} lengthUnit="px" className={ck.textWarning} aria-hidden />
                      )}
                      <span className={`text-[14px] ${ck.text}`}>
                        {interaction.statusSublabel || interaction.statusLabel}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={clusKpiTable.tableFooter}>
          <div className="flex items-center gap-2">
            <span>Page Size:</span>
            <select className={`rounded px-2 py-1 text-sm border ${ck.bgSurface} ${ck.text} ${ck.borderDefault}`}>
              <option>10</option>
            </select>
            <span className="ml-4">
              {Math.min(interactions.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(interactions.length, currentPage * itemsPerPage)} of {interactions.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              color="default"
              variant="secondary"
              size={32}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              prefixIcon="arrow-left-bold"
              aria-label="Previous page"
            />
            <span className={ck.text}>
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>
            <Button
              color="default"
              variant="secondary"
              size={32}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              prefixIcon="arrow-right-bold"
              aria-label="Next page"
            />
          </div>
        </div>
      </div>
    </div>
  );
}