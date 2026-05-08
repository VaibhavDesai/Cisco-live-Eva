import type { DateRange } from 'react-day-picker';
import { Option, Select, Selectlistbox } from '../momentum';
import type { SimulatedDatePreset } from '../simulated-testing-data';
import { TestingOverviewPanel } from './TestingOverviewPanel';

type Props = {
  dateRange: SimulatedDatePreset;
  customDateRange: DateRange | undefined;
  onDateRangeChange: (e: Event) => void;
};

export function TestingOverviewTab(props: Props) {
  const { dateRange, onDateRangeChange } = props;
  return (
    <TestingOverviewPanel
      dateRangeControl={
        <div className="testing-overview-date-range-select">
        <Select
          label=""
          dataAriaLabel="Date range"
          value={dateRange}
          onChange={onDateRangeChange}
        >
          <Selectlistbox>
            <Option value="24h" label="Last 24 hours" selected={dateRange === '24h'} />
            <Option value="week" label="Last week" selected={dateRange === 'week'} />
            <Option value="month" label="Last month" selected={dateRange === 'month'} />
            <Option value="90d" label="Last 90 days" selected={dateRange === '90d'} />
            <Option value="custom" label="Custom range" selected={dateRange === 'custom'} />
          </Selectlistbox>
        </Select>
        </div>
      }
    />
  );
}
