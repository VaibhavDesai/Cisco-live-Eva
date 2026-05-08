import { Fragment, useState, useEffect, useRef } from 'react';
import { KPICard } from './KPICard';
import { KPIChart } from './KPIChart';
import { FilterBar } from './FilterBar';
import { kpiData, KPIData } from './kpiData';
import { PageHeader } from './PageHeader';
import { RecentInteractions } from './RecentInteractions';
import { agentData } from './AgentTable';
import { ArrowLeft } from 'lucide-react';
import { FilterIcon } from './icons';
import { SearchIcon } from './icons';
import { ArrowDownIcon } from './icons';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Calendar } from './ui/calendar';
import { Check } from 'lucide-react';

interface SingleAgentViewProps {
  agentName: string;
  onBack: () => void;
}

export function SingleAgentView({ agentName, onBack }: SingleAgentViewProps) {
  const [activeTab, setActiveTab] = useState<'Configuration' | 'Interactions' | 'History' | 'Analytics'>('Analytics');
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'24h' | 'week' | 'month' | '90d' | 'custom'>('24h');
  const [customDateRange, setCustomDateRange] = useState<{from?: Date, to?: Date}>({});
  const [stickyChart, setStickyChart] = useState(false);
  const [pinnedCardIds, setPinnedCardIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  
  const agentStatus = agentData.find(a => a.agentName === agentName)?.availability || 'Live';

  // Scroll to top when component mounts or agent changes
  useEffect(() => {
    // Scroll the parent scrolling container to top
    const scrollContainer = topRef.current?.closest('[data-name=".Main Content Area"]');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }, [agentName]);

  const filteredKpiData = kpiData.filter(kpi =>
    kpi.heading.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeKPI = filteredKpiData.find(kpi => kpi.id === activeCardId);
  
  const categories = ['Customer Experience', 'AI Quality', 'Business Impact', 'Tool Specific'];

  const getDateRangeLabel = () => {
    if (dateRange === 'custom' && customDateRange.from) {
      if (customDateRange.to) {
        return `${customDateRange.from.toLocaleDateString()} - ${customDateRange.to.toLocaleDateString()}`;
      }
      return customDateRange.from.toLocaleDateString();
    }
    return {
      '24h': 'Last 24 hours',
      'week': 'Last week',
      'month': 'Last month',
      '90d': 'Last 90 days',
      'custom': 'Select date range'
    }[dateRange];
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedCardIds(prev => 
      prev.includes(id) ? prev.filter(pinId => pinId !== id) : [...prev, id]
    );
  };

  const movePinnedCard = (dragIndex: number, hoverIndex: number) => {
    const draggedId = pinnedCardIds[dragIndex];
    const newPinnedIds = [...pinnedCardIds];
    newPinnedIds.splice(dragIndex, 1);
    newPinnedIds.splice(hoverIndex, 0, draggedId);
    setPinnedCardIds(newPinnedIds);
  };

  return (
    <div ref={topRef} className="flex-1 w-[1400px]">
      {/* Header */}
      <div className="mb-6">
        <PageHeader 
          agentName={agentName} 
          status={agentStatus}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Top Filter Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
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
            <FilterIcon />
            <span>{showFilterBar ? 'Hide filters' : 'Show filters'}</span>
          </button>
          
          {/* Search Input - Only for Analytics */}
          {activeTab === 'Analytics' && (
            <div className="relative flex-1 min-w-[200px] max-w-[400px]">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search metrics"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border border-[rgba(255,255,255,0.5)] rounded-lg pl-10 pr-4 py-[5.5px] text-[rgba(255,255,255,0.7)] placeholder-[rgba(255,255,255,0.7)]"
              />
            </div>
          )}
          
          {/* Date Range Filter */}
          <Popover>
            <PopoverTrigger className="flex items-center gap-1.5 px-3 py-[5.5px] bg-transparent border border-[rgba(255,255,255,0.5)] rounded-lg text-[rgba(255,255,255,0.7)] hover:border-[rgba(255,255,255,0.7)] transition-colors">
              <FilterIcon />
              <span>{getDateRangeLabel()}</span>
              <ArrowDownIcon />
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 bg-[#1a1a1a] border border-gray-800">
              {dateRange === 'custom' ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setDateRange('24h')}
                    className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:bg-[#252525] rounded transition-colors w-full text-left"
                  >
                    ← Back to options
                  </button>
                  <Calendar
                    mode="range"
                    selected={customDateRange.from ? { from: customDateRange.from, to: customDateRange.to } : undefined}
                    onSelect={(range) => setCustomDateRange({ from: range?.from, to: range?.to })}
                    className="rounded-md"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => setDateRange('24h')}
                    className="flex items-center justify-between w-full px-3 py-2 text-gray-300 hover:bg-[#252525] rounded transition-colors"
                  >
                    <span>Last 24 hours</span>
                    {dateRange === '24h' && <Check className="w-4 h-4 text-blue-500" />}
                  </button>
                  <button
                    onClick={() => setDateRange('week')}
                    className="flex items-center justify-between w-full px-3 py-2 text-gray-300 hover:bg-[#252525] rounded transition-colors"
                  >
                    <span>Last week</span>
                    {dateRange === 'week' && <Check className="w-4 h-4 text-blue-500" />}
                  </button>
                  <button
                    onClick={() => setDateRange('month')}
                    className="flex items-center justify-between w-full px-3 py-2 text-gray-300 hover:bg-[#252525] rounded transition-colors"
                  >
                    <span>Last month</span>
                    {dateRange === 'month' && <Check className="w-4 h-4 text-blue-500" />}
                  </button>
                  <button
                    onClick={() => setDateRange('90d')}
                    className="flex items-center justify-between w-full px-3 py-2 text-gray-300 hover:bg-[#252525] rounded transition-colors"
                  >
                    <span>Last 90 days</span>
                    {dateRange === '90d' && <Check className="w-4 h-4 text-blue-500" />}
                  </button>
                  <button
                    onClick={() => setDateRange('custom')}
                    className="flex items-center justify-between w-full px-3 py-2 text-gray-300 hover:bg-[#252525] rounded transition-colors"
                  >
                    <span>Select date range</span>
                  </button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* All Agents Button */}
          {activeTab === 'Interactions' ? (
            <div className="relative w-[600px]">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search transcripts or for interactions and customer IDs"
                className="w-full bg-transparent border border-[rgba(255,255,255,0.5)] rounded-lg pl-10 pr-4 py-[5.5px] text-[rgba(255,255,255,0.7)] placeholder-[rgba(255,255,255,0.7)]"
              />
            </div>
          ) : (
            <button
              onClick={() => {
                window.location.hash = '/';
                onBack();
              }}
              className="flex items-center gap-1.5 px-3 py-[5.5px] bg-transparent border border-[rgba(255,255,255,0.5)] rounded-lg text-[rgba(255,255,255,0.7)] hover:border-[rgba(255,255,255,0.7)] transition-colors"
            >
              <span>All agents</span>
            </button>
          )}
        </div>
      </div>

      {/* Analytics View */}
      {activeTab === 'Analytics' && (
        <>
          {/* Sticky Chart (shown when a card is active and stickyChart is true) */}
          {stickyChart && activeKPI && (
            <div className="sticky top-0 z-10 mb-6">
              <KPIChart 
                heading={activeKPI.heading}
                description={activeKPI.description}
                chartType={activeKPI.chartType}
                dateRange={dateRange}
                customDateRange={customDateRange}
                sparklineData={activeKPI.sparklineData}
                unit={activeKPI.unit}
                value={activeKPI.value}
                yDomain={activeKPI.id === 'ce1' ? [0, 5] : undefined}
                ticks={activeKPI.id === 'ce1' ? [0, 1, 2, 3, 4, 5] : undefined}
                color={activeKPI.id === 'ce1' ? '#10b981' : undefined}
              />
            </div>
          )}

          {/* KPI Cards Grid - Grouped by Category */}
          <div className={`flex gap-4 ${showFilterBar ? '' : ''}`}>
            {/* Filter Bar - Conditionally rendered (without Agents section) */}
            {showFilterBar && (
              <FilterBar agentNames={[]} hideAgents={true} hideType={true} hideStatus={true} />
            )}
            
            {/* Content Area */}
            <div className="flex-1 space-y-8">
              {/* Pinned Section */}
              {pinnedCardIds.length > 0 && (() => {
                const pinnedFilteredCards = pinnedCardIds
                  .map(id => filteredKpiData.find(k => k.id === id))
                  .filter(Boolean) as KPIData[];
                
                if (pinnedFilteredCards.length === 0) return null;
                
                return (
                  <div>
                    <h2 className="text-white mb-4">Pinned</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {pinnedFilteredCards.map((kpi, index) => {
                        const CARDS_PER_ROW = 4;
                        const isLastInRow = (index + 1) % CARDS_PER_ROW === 0 || index === pinnedFilteredCards.length - 1;
                        const currentRowStart = Math.floor(index / CARDS_PER_ROW) * CARDS_PER_ROW;
                        const currentRowEnd = Math.min(currentRowStart + CARDS_PER_ROW, pinnedFilteredCards.length);
                        const cardsInCurrentRow = pinnedFilteredCards.slice(currentRowStart, currentRowEnd);
                        const isActiveCardInThisRow = !stickyChart && cardsInCurrentRow.some(card => card.id === activeCardId);
                        const dragIndex = pinnedCardIds.indexOf(kpi.id);
                        
                        return (
                          <Fragment key={kpi.id}>
                            <KPICard
                              data={kpi}
                              isActive={activeCardId === kpi.id}
                              onClick={() => setActiveCardId(kpi.id === activeCardId ? null : kpi.id)}
                              onPinToggle={(e) => togglePin(kpi.id, e)}
                              isPinned={true}
                              dragIndex={dragIndex}
                              onMoveCard={movePinnedCard}
                            />
                            {/* Inline Chart for pinned cards */}
                            {isLastInRow && isActiveCardInThisRow && activeKPI && (
                              <div className="col-span-1 sm:grid-cols-2 lg:col-span-4">
                                <KPIChart 
                                  heading={activeKPI.heading}
                                  description={activeKPI.description}
                                  chartType={activeKPI.chartType}
                                  dateRange={dateRange}
                                  customDateRange={customDateRange}
                                  sparklineData={activeKPI.sparklineData}
                                  unit={activeKPI.unit}
                                  value={activeKPI.value}
                                  yDomain={activeKPI.id === 'ce1' ? [0, 5] : undefined}
                                  ticks={activeKPI.id === 'ce1' ? [0, 1, 2, 3, 4, 5] : undefined}
                                  color={activeKPI.id === 'ce1' ? '#10b981' : undefined}
                                />
                              </div>
                            )}
                          </Fragment>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              
              {/* Regular Category Sections */}
              {categories.map((category) => {
                const CARDS_PER_ROW = 4;
                // Filter by search query and filter out pinned cards from regular sections
                const unpinnedKpis = filteredKpiData.filter(kpi => kpi.category === category && !pinnedCardIds.includes(kpi.id));
                
                if (unpinnedKpis.length === 0) return null;
                
                return (
                  <div key={category}>
                    <h2 className="text-white mb-4 mt-8 first:mt-0">{category}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {unpinnedKpis.map((kpi, index) => {
                        const isLastInRow = (index + 1) % CARDS_PER_ROW === 0 || index === unpinnedKpis.length - 1;
                        const currentRowStart = Math.floor(index / CARDS_PER_ROW) * CARDS_PER_ROW;
                        const currentRowEnd = Math.min(currentRowStart + CARDS_PER_ROW, unpinnedKpis.length);
                        const cardsInCurrentRow = unpinnedKpis.slice(currentRowStart, currentRowEnd);
                        const isActiveCardInThisRow = !stickyChart && cardsInCurrentRow.some(card => card.id === activeCardId);
                        
                        return (
                          <Fragment key={kpi.id}>
                            <KPICard
                              data={kpi}
                              isActive={activeCardId === kpi.id}
                              onClick={() => setActiveCardId(kpi.id === activeCardId ? null : kpi.id)}
                              onPinToggle={(e) => togglePin(kpi.id, e)}
                              isPinned={false}
                            />
                            {/* Inline Chart (shown after the row when a card in this row is selected) */}
                            {isLastInRow && isActiveCardInThisRow && activeKPI && (
                              <div className="col-span-1 sm:col-span-2 lg:col-span-4">
                                <KPIChart 
                                  heading={activeKPI.heading}
                                  description={activeKPI.description}
                                  chartType={activeKPI.chartType}
                                  dateRange={dateRange}
                                  customDateRange={customDateRange}
                                  sparklineData={activeKPI.sparklineData}
                                  unit={activeKPI.unit}
                                  value={activeKPI.value}
                                  yDomain={activeKPI.id === 'ce1' ? [0, 5] : undefined}
                                  ticks={activeKPI.id === 'ce1' ? [0, 1, 2, 3, 4, 5] : undefined}
                                  color={activeKPI.id === 'ce1' ? '#10b981' : undefined}
                                />
                              </div>
                            )}
                          </Fragment>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
      
      {/* Interactions View */}
      {activeTab === 'Interactions' && (
        <div className={`w-full ${showFilterBar ? 'flex gap-4' : ''}`}>
          {/* Filter Bar - Conditionally rendered */}
          {showFilterBar && (
            <FilterBar agentNames={[]} hideAgents={true} hideType={true} hideStatus={true} />
          )}
          
          <div className="flex-1 min-w-0 w-full grid grid-cols-1">
            <RecentInteractions 
              currentAgent={agentName} 
              chartView={true}
              dateRange={dateRange}
              className="mt-0 w-full"
            />
          </div>
        </div>
      )}

      {/* History View */}
      {activeTab === 'History' && (
        <div className={`w-full ${showFilterBar ? 'flex gap-4' : ''}`}>
          {/* Filter Bar - Conditionally rendered */}
          {showFilterBar && (
            <FilterBar agentNames={[]} hideAgents={true} hideType={true} hideStatus={true} />
          )}
          
          <div className="flex-1 min-w-0 w-full grid grid-cols-1">
            <div className="text-white p-8 text-center border border-[rgba(255,255,255,0.1)] rounded-lg bg-[rgba(0,0,0,0.2)] w-full">
              History View
            </div>
          </div>
        </div>
      )}

      {/* Configuration View */}
      {activeTab === 'Configuration' && (
        <div className={`w-full ${showFilterBar ? 'flex gap-4' : ''}`}>
          {/* Filter Bar - Conditionally rendered */}
          {showFilterBar && (
            <FilterBar agentNames={[]} hideAgents={true} hideType={true} hideStatus={true} />
          )}
          
          <div className="flex-1 min-w-0 w-full grid grid-cols-1">
             <div className="text-white p-8 text-center border border-[rgba(255,255,255,0.1)] rounded-lg bg-[rgba(0,0,0,0.2)] w-full">
              Configuration View
            </div>
          </div>
        </div>
      )}
    </div>
  );
}