import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Generate timestamps based on time segment
  const generateTimestamp = (
    segmentLabel: string | null,
    index: number,
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
        <h2 className="text-white mb-4">
          {title}
        </h2>
      )}

      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
              <TableRow className="border-[#2a2a2a] hover:bg-transparent">
                <TableHead className="text-white/60 font-medium text-xs">Interaction ID</TableHead>
                {metricName && (
                  <TableHead className="text-white/60 font-medium text-xs">{metricName}</TableHead>
                )}
                <TableHead className="text-white/60 font-medium text-xs">Timestamp</TableHead>
                <TableHead className="text-white/60 font-medium text-xs">Agents</TableHead>
                {!chartView && (
                  <>
                    <TableHead className="text-white/60 font-medium text-xs">Sessions</TableHead>
                    <TableHead className="text-white/60 font-medium text-xs">Duration</TableHead>
                  </>
                )}
                <TableHead className="text-white/60 font-medium text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((interaction) => (
                <TableRow key={interaction.id} className="border-[#2a2a2a] hover:bg-[#1a1a1a] transition-colors">
                  <TableCell className="font-medium text-sm">
                    <a href={`#/interaction/${interaction.id}`} className="text-[#3b82f6] hover:underline">
                      {interaction.id}
                    </a>
                  </TableCell>
                  {metricName && (
                    <TableCell className="text-white/95 text-sm">
                      {formatMetricValue(interaction.metricValue || 0, metricUnit)}
                    </TableCell>
                  )}
                  <TableCell className="text-white/95 text-sm">{interaction.timestamp}</TableCell>
                  <TableCell>
                    <div className="text-white/95 text-sm" title={interaction.agentNames?.join(', ')}>
                      {interaction.agentCount === 1 
                        ? (currentAgent || interaction.agentName || "Agent")
                        : `(${interaction.agentCount}) ${interaction.agentNames?.slice(0, 3).join(', ')}${interaction.agentNames && interaction.agentNames.length > 3 ? '...' : ''}`
                      }
                    </div>
                  </TableCell>
                  {!chartView && (
                    <>
                      <TableCell className="text-white/95 text-sm">
                        {interaction.sessionCount} ({interaction.messages} messages)
                      </TableCell>
                      <TableCell className="text-white/95 text-sm">{interaction.duration}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {interaction.statusType === "completed" && <CheckCircle2 className="w-4 h-4 text-[#3cc29a]" />}
                      {interaction.statusType === "failed" && <XCircle className="w-4 h-4 text-[#ef4444]" />}
                      {interaction.statusType === "handoff" && <AlertCircle className="w-4 h-4 text-[#f59e0b]" />}
                      <span className="text-white/95 text-sm">
                        {interaction.statusSublabel || interaction.statusLabel}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-[#2a2a2a] bg-[#0a0a0a] flex items-center justify-between text-sm text-white/60">
          <div className="flex items-center gap-2">
            <span>Page Size:</span>
            <select className="bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1 text-white/95 text-sm">
              <option>10</option>
            </select>
            <span className="ml-4">
              {Math.min(interactions.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(interactions.length, currentPage * itemsPerPage)} of {interactions.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="bg-transparent border-[#2a2a2a] text-white/95 hover:bg-[#1a1a1a] hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-white/95">
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="bg-transparent border-[#2a2a2a] text-white/95 hover:bg-[#1a1a1a] hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}