import type { DateRange } from 'react-day-picker';
import { InteractionPageNew } from './InteractionPageNew';
import { RecentInteractions } from './RecentInteractions';

type DatePreset = '24h' | 'week' | 'month' | '90d' | 'custom';

export interface InteractionsTabProps {
  dateRange: DatePreset;
  customDateRange: DateRange | undefined;
  onDateRangeChange: (range: DatePreset, custom: DateRange | undefined) => void;
  interactionId?: string | null;
  onBack?: () => void;
}

/** Interactions list or single interaction transcript (KPI dashboard). */
export function InteractionsTab(props: InteractionsTabProps) {
  const { dateRange, interactionId, onBack } = props;
  if (interactionId) {
    return (
      <div className="relative z-[1] flex min-h-0 w-full flex-1 flex-col">
        <InteractionPageNew interactionId={interactionId} onBack={onBack} hideHeader={true} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RecentInteractions
        chartView={true}
        dateRange={dateRange}
        title="Interactions"
        className="mt-0"
      />
    </div>
  );
}
