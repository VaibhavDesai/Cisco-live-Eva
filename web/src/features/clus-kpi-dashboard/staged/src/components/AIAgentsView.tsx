import React from 'react';
import { KPIData } from './kpiData';
import { DateRange } from 'react-day-picker';
import { AgentTable } from './AgentTable';

interface AIAgentsViewProps {
  filteredKpiData: KPIData[];
  dateRange: string;
  customDateRange: DateRange | undefined;
  selectedMetricIds: string[];
  pinnedCardIds?: string[];
  onPinToggle?: (id: string, e: React.MouseEvent) => void;
  onDateRangeChange?: (range: '24h' | 'week' | 'month' | '90d' | 'custom', customRange?: { from: Date; to: Date }) => void;
  onAgentClick?: (agentName: string) => void;
}

export function AIAgentsView({
  filteredKpiData,
  dateRange,
  customDateRange,
  selectedMetricIds,
  pinnedCardIds = [],
  onPinToggle,
  onDateRangeChange,
  onAgentClick
}: AIAgentsViewProps) {
  return (
    <div className="flex-1 space-y-8">
      <AgentTable onAgentClick={onAgentClick} />
    </div>
  );
}
