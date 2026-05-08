import React from 'react';
import type { KPIData } from './kpiData';
import type { DateRange } from 'react-day-picker';
import { AgentTable } from './AgentTable';

interface AIAgentsViewProps {
  filteredKpiData: KPIData[];
  dateRange: string;
  customDateRange: DateRange | undefined;
  selectedMetricIds: string[];
  pinnedCardIds?: string[];
  onPinToggle?: (id: string, e: React.MouseEvent) => void;
  onDateRangeChange?: (range: '24h' | 'week' | 'month' | '90d' | 'custom', customRange?: { from: Date; to: Date }) => void;
}

export function AIAgentsView({
  filteredKpiData: _filteredKpiData,
  dateRange: _dateRange,
  customDateRange: _customDateRange,
  selectedMetricIds: _selectedMetricIds,
  pinnedCardIds: _pinnedCardIds = [],
  onPinToggle: _onPinToggle,
  onDateRangeChange: _onDateRangeChange,
}: AIAgentsViewProps) {
  return (
    <div className="flex-1 space-y-8">
      <AgentTable />
    </div>
  );
}
