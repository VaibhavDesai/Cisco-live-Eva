import { format, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import type { SimulatedDatePreset } from '../simulated-testing-data';

/** Label shown in the historical metrics toolbar (matches selected preset or custom range). */
export function formatTestingDateLabel(
  dateRange: SimulatedDatePreset,
  customDateRange: DateRange | undefined,
): string {
  const now = new Date();
  if (dateRange === 'custom' && customDateRange?.from && customDateRange?.to) {
    return `${format(customDateRange.from, 'MMM d')} – ${format(customDateRange.to, 'MMM d, yyyy')}`;
  }
  const spanDays =
    dateRange === '24h'
      ? 1
      : dateRange === 'week'
        ? 7
        : dateRange === 'month'
          ? 30
          : dateRange === '90d'
            ? 90
            : 7;
  const start = subDays(now, spanDays);
  return `${format(start, 'MMM d')} – ${format(now, 'MMM d, yyyy')}`;
}
