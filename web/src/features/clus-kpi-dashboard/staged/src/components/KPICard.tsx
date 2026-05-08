import { Info } from 'lucide-react';
import { KPIData } from '../App';
import svgPaths from '../imports/svg-lzqm4dnxmq';
import svgPathsFilled from '../imports/svg-clfiy41r9l';
import { useDrag, useDrop } from 'react-dnd';
import { useRef } from 'react';

interface KPICardProps {
  data: KPIData;
  isActive: boolean;
  onClick: () => void;
  isPinned?: boolean;
  onPinToggle?: (e: React.MouseEvent) => void;
  dragIndex?: number;
  onMoveCard?: (dragIndex: number, hoverIndex: number) => void;
}

// Pin Icon Component
function PinIcon({ filled, className }: { filled?: boolean; className?: string }) {
  if (filled) {
    // Filled variant - using the filled pin icon
    return (
      <svg className={className} fill="none" viewBox="0 0 20 20">
        <path 
          d={svgPathsFilled.p1d9a1700} 
          fill="currentColor"
        />
      </svg>
    );
  }
  
  // Outline variant - using the outline pin icon
  return (
    <svg className={className} fill="none" viewBox="0 0 20 20">
      <path 
        d={svgPaths.p324c1100} 
        fill="currentColor"
      />
    </svg>
  );
}

// Sparkline Component
function Sparkline({ data, color, type }: { data: number[]; color: string; type: 'line' | 'area' | 'bar' }) {
  if (!data || data.length === 0) return null;
  
  const width = 32;
  const height = 16;
  const padding = 2;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  if (type === 'bar') {
    // Bar sparkline
    const barWidth = (width - padding * 2) / data.length;
    const barGap = barWidth * 0.2;
    const actualBarWidth = barWidth - barGap;
    
    return (
      <svg 
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`}
        className="flex-shrink-0"
      >
        {data.map((value, index) => {
          const barHeight = ((value - min) / range) * (height - padding * 2);
          const x = padding + index * barWidth;
          const y = height - padding - barHeight;
          
          return (
            <rect
              key={index}
              x={x}
              y={y}
              width={actualBarWidth}
              height={barHeight}
              fill={color}
              rx={0.5}
            />
          );
        })}
      </svg>
    );
  }
  
  // Create points for the line/area
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');
  
  if (type === 'area') {
    // Area sparkline with fill
    const firstPoint = data[0];
    const lastPoint = data[data.length - 1];
    const firstX = padding;
    const lastX = width - padding;
    const bottomY = height - padding;
    
    const firstY = height - padding - ((firstPoint - min) / range) * (height - padding * 2);
    const lastY = height - padding - ((lastPoint - min) / range) * (height - padding * 2);
    
    const areaPoints = `${firstX},${bottomY} ${points} ${lastX},${bottomY}`;
    
    return (
      <svg 
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`}
        className="flex-shrink-0"
      >
        <polygon
          points={areaPoints}
          fill={color}
          fillOpacity={0.3}
        />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  
  // Line sparkline (default)
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`}
      className="flex-shrink-0"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KPICard({ data, isActive, onClick, isPinned, onPinToggle, dragIndex, onMoveCard }: KPICardProps) {
  const changeValue = parseFloat(data.change);
  const isIncrease = changeValue > 0;
  
  // Drag and Drop
  const ref = useRef<HTMLButtonElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'KPI_CARD',
    item: { index: dragIndex },
    canDrag: () => isPinned && dragIndex !== undefined && onMoveCard !== undefined,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const [, drop] = useDrop({
    accept: 'KPI_CARD',
    hover(item: { index: number }) {
      if (!ref.current) {
        return;
      }
      const hoverIndex = dragIndex;
      const draggedIndex = item.index;
      
      if (draggedIndex === hoverIndex || hoverIndex === undefined) {
        return;
      }
      
      onMoveCard && onMoveCard(draggedIndex, hoverIndex);
      
      item.index = hoverIndex;
    },
  });
  
  // Only attach drag/drop refs if the card is pinned
  if (isPinned && dragIndex !== undefined && onMoveCard) {
    drag(drop(ref));
  }
  
  return (
    <button
      ref={ref}
      onClick={onClick}
      className="relative h-[112px] rounded-[8px] transition-all text-left w-full overflow-hidden group"
      style={{
        backgroundColor: 'var(--mds-color-theme-avatar-glass-active)',
      }}
    >
      {/* Main content */}
      <div className="box-border flex flex-col gap-[16px] items-start px-[24px] py-[16px] relative w-full h-full">
        {/* Header with title and icons */}
        <div className="flex gap-[4px] items-end w-full">
          <p className="font-['Inter:medium',sans-serif] leading-[20px] text-[14px] text-[rgba(255,255,255,0.95)] flex-1">
            {data.heading}
          </p>
          <div className="flex items-center gap-[4px]">
            {onPinToggle && (
              <div
                className="flex items-center justify-center h-[20px] w-[20px] rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer"
                onClick={onPinToggle}
                role="button"
                aria-label={isPinned ? "Unpin card" : "Pin card"}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPinToggle(e as any);
                  }
                }}
              >
                <PinIcon
                  filled={isPinned}
                  className={`w-[12px] h-[12px] text-[rgba(255,255,255,0.95)]`}
                />
              </div>
            )}
            <div className="flex items-center justify-center h-[20px] w-[20px] rounded-full">
              <Info className="w-[12px] h-[12px] text-[rgba(255,255,255,0.95)]" />
            </div>
          </div>
        </div>

        {/* Value and trend */}
        <div className="flex gap-[8px] h-[40px] items-center">
          <p className="font-['Inter:medium',sans-serif] leading-[40px] text-[32px] text-[rgba(255,255,255,0.95)]">
            {data.value}{data.unit}
          </p>
          <div className={`flex gap-[4px] items-center ${data.isPositive ? 'text-[#3cc29a]' : 'text-[#ff6b6b]'}`}>
            {/* Sparkline */}
            {data.sparklineData && data.sparklineType && (
              <Sparkline
                data={data.sparklineData}
                color={data.isPositive ? '#3cc29a' : '#ff6b6b'}
                type={data.sparklineType}
              />
            )}
            <p className="font-['Inter:regular',sans-serif] leading-[20px] text-[14px]">
              {data.change}
            </p>
          </div>
        </div>
      </div>
      
      {/* Border overlay */}
      <div 
        aria-hidden="true" 
        className={`absolute border border-solid inset-0 pointer-events-none rounded-[8px] transition-colors ${
          isActive ? 'border-[#1170cf]' : 'border-[rgba(255,255,255,0.11)]'
        }`} 
      />
    </button>
  );
}