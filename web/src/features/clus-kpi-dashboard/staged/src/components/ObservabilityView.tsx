import React, { useState, Fragment } from 'react';
import { KPIData } from './kpiData';
import { KPICard } from './KPICard';
import { KPIChart } from './KPIChart';
import { DateRange } from 'react-day-picker';

interface ObservabilityViewProps {
  filteredKpiData: KPIData[];
  categories: string[];
  dateRange: string;
  customDateRange: DateRange | undefined;
  pinnedCardIds: string[];
  onPinToggle: (id: string, e: React.MouseEvent) => void;
  onMoveCard: (dragIndex: number, hoverIndex: number) => void;
  activeCardId: string | null;
  onActiveCardChange: (id: string | null) => void;
  onDateRangeChange?: (range: '24h' | 'week' | 'month' | '90d' | 'custom', customRange?: { from: Date; to: Date }) => void;
}

export function ObservabilityView({
  filteredKpiData,
  categories,
  dateRange,
  customDateRange,
  pinnedCardIds,
  onPinToggle,
  onMoveCard,
  activeCardId,
  onActiveCardChange,
  onDateRangeChange
}: ObservabilityViewProps) {
  const [stickyChart, setStickyChart] = useState(false);

  const activeKPI = activeCardId ? filteredKpiData.find(k => k.id === activeCardId) : null;

  return (
    <div className="flex-1 space-y-8">
      {/* Sticky Chart (shown when a card is active and stickyChart is true) */}
      {activeCardId && activeKPI && stickyChart && (
        <div className="sticky top-[-24px] z-10 bg-[rgba(10,10,10,0.98)] backdrop-blur-xl pt-4 pb-8 -mt-4 border-b border-gray-900">
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
            curveType={activeKPI.curveType}
            onDrillDown={onDateRangeChange}
          />
        </div>
      )}

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
                      onClick={() => onActiveCardChange(kpi.id === activeCardId ? null : kpi.id)}
                      onPinToggle={(e) => onPinToggle(kpi.id, e)}
                      isPinned={true}
                      dragIndex={dragIndex}
                      onMoveCard={onMoveCard}
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
                          curveType={activeKPI.curveType}
                          onDrillDown={onDateRangeChange}
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
                      onClick={() => onActiveCardChange(kpi.id === activeCardId ? null : kpi.id)}
                      onPinToggle={(e) => onPinToggle(kpi.id, e)}
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
                          curveType={activeKPI.curveType}
                          onDrillDown={onDateRangeChange}
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
  );
}