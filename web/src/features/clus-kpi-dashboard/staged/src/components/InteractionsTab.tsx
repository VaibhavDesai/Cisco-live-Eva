import { useState } from 'react';
import { Search, Filter, ChevronDown, ArrowLeft } from 'lucide-react';
import { RecentInteractions } from './RecentInteractions';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { DateRange } from 'react-day-picker';

import { InteractionPageNew } from './InteractionPageNew';

interface InteractionsTabProps {
  dateRange: '24h' | 'week' | 'month' | '90d' | 'custom';
  customDateRange: { from?: Date; to?: Date };
  onDateRangeChange: (range: '24h' | 'week' | 'month' | '90d' | 'custom', customRange?: { from?: Date; to?: Date }) => void;
  interactionId?: string | null;
  onBack?: () => void;
}

export function InteractionsTab({ dateRange, customDateRange, onDateRangeChange, interactionId, onBack }: InteractionsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterBar, setShowFilterBar] = useState(false);

  if (interactionId) {
    return (
      <div className="relative z-[1] flex min-h-0 w-full flex-1 flex-col">
        <InteractionPageNew 
          interactionId={interactionId} 
          onBack={onBack} 
          hideHeader={true}
        />
      </div>
    );
  }

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case '24h': return 'Last 24 hours';
      case 'week': return 'Last week';
      case 'month': return 'Last month';
      case '90d': return 'Last 90 days';
      case 'custom': return 'Select date range';
      default: return 'Last 24 hours';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
         {/* Show Filters Toggle */}
         <button
           onClick={() => setShowFilterBar(!showFilterBar)}
           className={`flex items-center gap-1.5 px-3 py-[5.5px] rounded-lg transition-colors ${
             showFilterBar 
               ? 'bg-[rgba(255,255,255,0.2)] border border-[rgba(255,255,255,0.7)] text-[rgba(255,255,255,0.95)]' 
               : 'bg-transparent border border-[rgba(255,255,255,0.5)] text-[rgba(255,255,255,0.7)] hover:border-[rgba(255,255,255,0.7)]'
           }`}
         >
           <Filter className="w-4 h-4" />
           <span>{showFilterBar ? 'Hide filters' : 'Show filters'}</span>
         </button>

         {/* Date Range Filter */}
         <Popover>
            <PopoverTrigger className="flex items-center gap-1.5 px-3 py-[5.5px] bg-transparent border border-[rgba(255,255,255,0.5)] rounded-lg text-[rgba(255,255,255,0.7)] hover:border-[rgba(255,255,255,0.7)] transition-colors">
              <Filter className="w-4 h-4" />
              <span>{getDateRangeLabel()}</span>
              <ChevronDown className="w-4 h-4" />
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 bg-[#1a1a1a] border border-gray-800">
               {dateRange === 'custom' ? (
                 <div className="space-y-3">
                   <button
                     onClick={() => onDateRangeChange('24h')}
                     className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:bg-[#252525] rounded transition-colors w-full text-left"
                   >
                     <ArrowLeft className="w-4 h-4" />
                     Back to options
                   </button>
                   <Calendar
                     mode="range"
                     selected={customDateRange.from ? { from: customDateRange.from, to: customDateRange.to } : undefined}
                     onSelect={(range) => onDateRangeChange('custom', { from: range?.from, to: range?.to })}
                     className="rounded-md"
                   />
                 </div>
               ) : (
                 <div className="space-y-2">
                   {['24h', 'week', 'month', '90d', 'custom'].map((range) => (
                      <button
                        key={range}
                        onClick={() => onDateRangeChange(range as any)}
                        className="flex items-center justify-between w-full px-3 py-2 text-gray-300 hover:bg-[#252525] rounded transition-colors"
                      >
                        <span>{range === '24h' ? 'Last 24 hours' : range === 'week' ? 'Last week' : range === 'month' ? 'Last month' : range === '90d' ? 'Last 90 days' : 'Custom range'}</span>
                      </button>
                   ))}
                 </div>
               )}
            </PopoverContent>
         </Popover>

         {/* Search Input */}
         <div className="relative flex-1 min-w-[200px] max-w-[600px]">
           <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
             <Search className="w-4 h-4 text-gray-400" />
           </div>
           <input
             type="text"
             placeholder="Search transcripts or for interactions and customer IDs"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full bg-transparent border border-[rgba(255,255,255,0.5)] rounded-lg pl-10 pr-4 py-[5.5px] text-[rgba(255,255,255,0.7)] placeholder-[rgba(255,255,255,0.7)] focus:outline-none focus:border-white"
           />
         </div>
      </div>

      {/* Interactions Table */}
      <RecentInteractions 
        chartView={true}
        dateRange={dateRange}
        title="Interactions"
        className="mt-0" 
      />
    </div>
  );
}
