import ReactECharts from 'echarts-for-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { format, subDays, subHours, subMinutes, addMinutes, eachDayOfInterval, eachHourOfInterval, addDays, differenceInHours, differenceInMinutes, startOfDay, endOfDay, startOfHour, endOfHour, eachMinuteOfInterval } from 'date-fns';
import { Button } from './ui/button';
import { Table, LineChart, RotateCcw, ZoomIn } from 'lucide-react';
import { RecentInteractions } from './RecentInteractions';

interface KPIChartProps {
  heading: string;
  description: string;
  chartType: 'line' | 'line-threshold' | 'area' | 'bar' | 'stacked-bar' | 'histogram' | 'pie' | 'donut' | 'grouped-bar' | 'column' | 'stacked-area';
  dateRange: '24h' | 'week' | 'month' | '90d' | 'custom';
  customDateRange?: { from?: Date; to?: Date };
  sparklineData?: number[];
  unit?: string;
  value?: string;
  simplified?: boolean;
  color?: string;
  threshold?: number;
  yDomain?: [number, number];
  ticks?: number[];
  curveType?: 'monotone' | 'linear' | 'step';
  strokeWidth?: number;
  chartHeight?: number;
  className?: string;
  isPinned?: boolean;
  onPinToggle?: (e: React.MouseEvent) => void;
  onDrillDown?: (range: '24h' | 'week' | 'month' | '90d' | 'custom', customRange?: { from: Date; to: Date }) => void;
}

// Generate different datasets based on chart type and date range
const generateTimeSeriesData = (
  dateRange: '24h' | 'week' | 'month' | '90d' | 'custom', 
  customRange?: { from?: Date; to?: Date }, 
  trend: 'up' | 'down' | 'stable' = 'stable',
  unit?: string,
  currentValue?: string
) => {
  const data = [];
  let dates: Date[] = [];
  let dateFormat = 'MM/dd';
  
  // Determine the date points based on range
  const now = new Date();
  
  switch (dateRange) {
    case '24h':
      dates = eachHourOfInterval({ start: subHours(now, 23), end: now });
      dateFormat = 'ha'; // e.g., "2pm"
      break;
    case 'week':
      dates = eachDayOfInterval({ start: subDays(now, 6), end: now });
      dateFormat = 'EEE'; // e.g., "Mon"
      break;
    case 'month':
      dates = eachDayOfInterval({ start: subDays(now, 29), end: now });
      dateFormat = 'MM/dd';
      break;
    case '90d':
      dates = eachDayOfInterval({ start: subDays(now, 89), end: now });
      dateFormat = 'MM/dd';
      break;
    case 'custom':
      if (customRange?.from && customRange?.to) {
        const hoursDiff = differenceInHours(customRange.to, customRange.from);
        const minutesDiff = differenceInMinutes(customRange.to, customRange.from);
        
        if (minutesDiff <= 15) {
           dates = eachMinuteOfInterval({ start: customRange.from, end: customRange.to, step: 1 });
           dateFormat = 'h:mm';
        } else if (hoursDiff <= 1) {
           dates = eachMinuteOfInterval({ start: customRange.from, end: customRange.to, step: 5 });
           dateFormat = 'h:mm';
        } else if (hoursDiff <= 48) {
           dates = eachHourOfInterval({ start: customRange.from, end: customRange.to });
           dateFormat = 'ha';
        } else {
           dates = eachDayOfInterval({ start: customRange.from, end: customRange.to });
           dateFormat = 'MM/dd';
        }
      } else {
        // Fallback to week if custom range not set
        dates = eachDayOfInterval({ start: subDays(now, 6), end: now });
        dateFormat = 'EEE';
      }
      break;
  }
  
  // Determine baseline value
  let base1 = 40;
  let base2 = 35;
  let isRating = unit === '/5';
  
  if (currentValue) {
    const val = parseFloat(currentValue);
    if (!isNaN(val)) {
      base1 = val;
      base2 = val * 0.8;
    }
  } else if (isRating) {
    base1 = 4.2;
    base2 = 3.8;
  }
  
  dates.forEach((date, i) => {
    let val1 = base1;
    let val2 = base2;
    
    // Add randomness based on trend
    if (isRating) {
      // Smaller variance for ratings (0-5 scale)
      const variance = (Math.random() - 0.5) * 0.8;
      val1 += variance;
      val2 += variance * 0.8;
      
      // Keep within bounds
      val1 = Math.max(3.0, Math.min(5.0, val1));
      val2 = Math.max(2.5, Math.min(4.5, val2));
    } else {
      // Standard variance for other metrics
      if (trend === 'up') {
        val1 += Math.random() * 5 + 2;
        val2 += Math.random() * 4 + 1;
      } else if (trend === 'down') {
        val1 -= Math.random() * 3 + 1;
        val2 -= Math.random() * 2 + 0.5;
      } else {
        val1 += (Math.random() - 0.5) * 8;
        val2 += (Math.random() - 0.5) * 6;
      }
      
      val1 = Math.max(0, Math.round(val1 * 10) / 10);
      val2 = Math.max(0, Math.round(val2 * 10) / 10);
      
      // Clamp percentage values to 100 max
      const isPercentage = (unit === '' && currentValue && currentValue.includes('%')) || unit === '%';
      if (isPercentage) {
        val1 = Math.min(100, val1);
        val2 = Math.min(100, val2);
      }
    }
    
    data.push({
      date: format(date, dateFormat),
      fullDate: date,
      value1: Math.round(val1 * 10) / 10,
      value2: Math.round(val2 * 10) / 10,
    });
  });
  
  return data;
};

// Convert sparkline data to chart format with date labels
const convertSparklineToChartData = (sparklineData: number[], dateRange: '24h' | 'week' | 'month' | '90d' | 'custom', customRange?: { from?: Date; to?: Date }) => {
  const data = [];
  let dates: Date[] = [];
  let dateFormat = 'MM/dd';
  
  // Determine the date points based on range
  const now = new Date();
  
  switch (dateRange) {
    case '24h':
      dates = eachHourOfInterval({ start: subHours(now, 23), end: now });
      dateFormat = 'ha'; // e.g., "2pm"
      break;
    case 'week':
      dates = eachDayOfInterval({ start: subDays(now, 6), end: now });
      dateFormat = 'EEE'; // e.g., "Mon"
      break;
    case 'month':
      dates = eachDayOfInterval({ start: subDays(now, 29), end: now });
      dateFormat = 'MM/dd';
      break;
    case '90d':
      dates = eachDayOfInterval({ start: subDays(now, 89), end: now });
      dateFormat = 'MM/dd';
      break;
    case 'custom':
      if (customRange?.from && customRange?.to) {
        const hoursDiff = differenceInHours(customRange.to, customRange.from);
        const minutesDiff = differenceInMinutes(customRange.to, customRange.from);
        
        if (minutesDiff <= 15) {
           dates = eachMinuteOfInterval({ start: customRange.from, end: customRange.to, step: 1 });
           dateFormat = 'h:mm';
        } else if (hoursDiff <= 1) {
           dates = eachMinuteOfInterval({ start: customRange.from, end: customRange.to, step: 5 });
           dateFormat = 'h:mm';
        } else if (hoursDiff <= 48) {
           dates = eachHourOfInterval({ start: customRange.from, end: customRange.to });
           dateFormat = 'ha';
        } else {
           dates = eachDayOfInterval({ start: customRange.from, end: customRange.to });
           dateFormat = 'MM/dd';
        }
      } else {
        // Fallback to week if custom range not set
        dates = eachDayOfInterval({ start: subDays(now, 6), end: now });
        dateFormat = 'EEE';
      }
      break;
  }
  
  // Safety check for sparkline data
  const safeSparklineData = (sparklineData && sparklineData.length > 0) 
    ? sparklineData 
    : Array(dates.length).fill(0).map(() => 3.5 + Math.random());

  // Map dates to data points cyclically to ensure we always have a value
  dates.forEach((date, i) => {
    const dataIndex = i % safeSparklineData.length;
    let val = safeSparklineData[dataIndex];
    
    // Strict validation
    if (typeof val !== 'number' || isNaN(val)) {
      val = 4.0; // Default fallback
    }
    
    // Generate second value for stacked charts
    const value2 = val * 0.7; 
    
    data.push({
      date: format(date, dateFormat),
      fullDate: date,
      value1: Math.round(val * 10) / 10,
      value2: Math.round(value2 * 10) / 10,
    });
  });
  
  return data;
};

// Hardcoded CSAT data for reliability
const csatDummyData = [3.5, 3.8, 4.2, 4.0, 3.9, 4.5, 4.3, 4.6, 4.2, 3.8, 4.1, 4.4, 4.7, 4.5, 4.2, 3.9, 4.1, 4.3, 4.6, 4.8, 4.5, 4.3, 4.0, 3.8];

const COLORS = ['#8b5cf6', '#ec4899', '#fbbf24', '#10b981'];

export function KPIChart({ heading, description, chartType, dateRange, customDateRange, sparklineData, unit, value, simplified = false, color, threshold, yDomain, ticks, curveType, strokeWidth = 2, chartHeight = 300, className = '', isPinned, onPinToggle, onDrillDown }: KPIChartProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'interactions'>('chart');
  const [zoomedRange, setZoomedRange] = useState<{start: number, end: number} | null>(null);
  const [isZoomMode, setIsZoomMode] = useState(false);
  const [isBoxZoomActive, setIsBoxZoomActive] = useState(false);
  const chartRef = useRef<any>(null);

  // Data Preparation
  const isCSAT = heading?.toUpperCase().includes('CSAT') || 
                 heading?.toLowerCase().includes('satisfaction') || 
                 unit === '/5';
                 
  const isValidCSATData = (data?: number[]) => {
    if (!data || data.length === 0) return false;
    return data.every(v => v <= 6);
  };
  
  const effectiveSparklineData = isCSAT 
    ? (isValidCSATData(sparklineData) ? sparklineData : csatDummyData)
    : sparklineData;

  const timeSeriesData = useMemo(() => {
    return effectiveSparklineData && effectiveSparklineData.length > 0 
      ? convertSparklineToChartData(effectiveSparklineData, dateRange, customDateRange)
      : generateTimeSeriesData(dateRange, customDateRange, 'up', unit, value);
  }, [dateRange, customDateRange, effectiveSparklineData, unit, value]);

  const mainColor = isCSAT ? '#10b981' : (color || '#8b5cf6');
  
  // Reset view when date range changes
  useEffect(() => {
    setViewMode('chart');
    setZoomedRange(null);
  }, [dateRange, customDateRange]);

  const getOption = () => {
    const commonGrid = {
      left: 10,
      right: 10,
      top: 30,
      bottom: 10,
      containLabel: true,
      borderColor: '#333'
    };

    const commonTooltip = {
      trigger: 'axis',
      backgroundColor: '#1a1a1a',
      borderColor: '#333',
      textStyle: {
        color: '#fff'
      },
      formatter: (params: any) => {
        let res = `<div style="font-size: 12px; color: #999;">${params[0].axisValue}</div>`;
        params.forEach((item: any) => {
          res += `<div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${item.color};"></div>
                    <span style="color: #fff;">${item.seriesName}: <b>${item.value}${unit || ''}</b></span>
                  </div>`;
        });
        return res;
      }
    };

    const xAxisData = timeSeriesData.map(d => d.date);
    const seriesData1 = timeSeriesData.map(d => d.value1);
    const seriesData2 = timeSeriesData.map(d => d.value2);

    const baseOption: any = {
      backgroundColor: 'transparent',
      tooltip: commonTooltip,
      grid: commonGrid,
      toolbox: {
        show: true,
        right: -1000, // Position off-screen
        feature: {
          dataZoom: {
            yAxisIndex: 'none',
            title: { zoom: 'Box Zoom', back: 'Reset Zoom' },
            brushStyle: {
              borderWidth: 1,
              color: 'rgba(59, 130, 246, 0.2)',
              borderColor: '#3b82f6'
            }
          }
        }
      },
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          filterMode: 'filter'
        }
      ],
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLine: { lineStyle: { color: '#333' } },
        axisLabel: { color: '#999', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#333', type: 'dashed' } },
        axisLabel: { color: '#999', fontSize: 11 },
        min: isCSAT ? 0 : (yDomain ? yDomain[0] : undefined),
        max: isCSAT ? 5 : (yDomain ? yDomain[1] : undefined),
      },
      animation: false
    };

    // Custom configuration based on chartType
    switch (chartType) {
      case 'area':
      case 'stacked-area':
        baseOption.series = [{
          name: heading,
          data: seriesData1,
          type: 'line',
          smooth: curveType === 'monotone',
          showSymbol: !simplified,
          symbolSize: 6,
          itemStyle: { color: mainColor },
          lineStyle: { width: strokeWidth },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: mainColor },
                { offset: 1, color: 'transparent' }
              ]
            },
            opacity: 0.2
          }
        }];
        if (chartType === 'stacked-area') {
           baseOption.series.push({
             name: 'Previous',
             data: seriesData2,
             type: 'line',
             smooth: curveType === 'monotone',
             stack: 'total',
             areaStyle: { opacity: 0.2 },
             itemStyle: { color: '#4b5563' },
             lineStyle: { width: strokeWidth }
           });
        }
        break;

      case 'bar':
      case 'column':
      case 'stacked-bar':
      case 'grouped-bar':
      case 'histogram':
        baseOption.series = [{
          name: heading,
          data: seriesData1,
          type: 'bar',
          itemStyle: { color: mainColor, borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 40
        }];
        
        if (chartType === 'stacked-bar') {
          baseOption.series[0].stack = 'total';
          baseOption.series.push({
            name: 'Previous',
            data: seriesData2,
            type: 'bar',
            stack: 'total',
            itemStyle: { color: '#4b5563', borderRadius: [4, 4, 0, 0] },
            barMaxWidth: 40
          });
        }
        break;

      case 'pie':
      case 'donut':
        const pieData = [
            { value: parseFloat(value?.replace('%', '') || '60'), name: heading },
            { value: 100 - parseFloat(value?.replace('%', '') || '60'), name: 'Other' }
        ];
        
        return {
          ...baseOption,
          tooltip: { trigger: 'item' },
          xAxis: { show: false },
          yAxis: { show: false },
          series: [{
            name: heading,
            type: 'pie',
            radius: chartType === 'donut' ? ['50%', '70%'] : '70%',
            center: ['50%', '50%'],
            data: pieData,
            label: { show: false },
            itemStyle: {
               borderRadius: 5,
               borderColor: '#1a1a1a',
               borderWidth: 2
            },
            color: [mainColor, '#333']
          }]
        };

      case 'line-threshold':
        baseOption.series = [{
          name: heading,
          data: seriesData1,
          type: 'line',
          smooth: curveType === 'monotone',
          showSymbol: !simplified,
          symbolSize: 6,
          itemStyle: { color: mainColor },
          lineStyle: { width: strokeWidth },
          markLine: {
            data: [{ yAxis: threshold || 45 }],
            lineStyle: { color: '#fbbf24', type: 'dashed' },
            label: { formatter: 'Threshold' }
          }
        }];
        break;

      case 'line':
      default:
        baseOption.series = [{
          name: heading,
          data: seriesData1,
          type: 'line',
          smooth: curveType === 'monotone',
          showSymbol: !simplified,
          symbolSize: 6,
          itemStyle: { color: mainColor },
          lineStyle: { width: strokeWidth }
        }];
        break;
    }

    return baseOption;
  };

  const onEvents = {
    'dataZoom': (params: any) => {
      // Handle zoom event from both scroll/pinch (direct start/end) and toolbox brush (batch array)
      const start = params.batch?.[0]?.start ?? params.start;
      const end = params.batch?.[0]?.end ?? params.end;
      
      if (start !== undefined && end !== undefined) {
        // Calculate zoom percentage (0-100)
        const zoomRange = end - start;
        
        // Show button if zoomed in to 50% or less of the view
        if (zoomRange < 50) {
          setZoomedRange({ start, end });
          setIsZoomMode(true);
        } else {
          setZoomedRange(null);
          setIsZoomMode(false);
        }
      }
    }
  };

  const handleResetZoom = () => {
    // Reset ECharts zoom
    if (chartRef.current) {
      const echartsInstance = chartRef.current.getEchartsInstance();
      echartsInstance.dispatchAction({
        type: 'dataZoom',
        start: 0,
        end: 100
      });
    }
    setZoomedRange(null);
    setViewMode('chart');
    setIsZoomMode(false);
    setIsBoxZoomActive(false);
  };

  const handleBoxZoom = () => {
    const newState = !isBoxZoomActive;
    setIsBoxZoomActive(newState);
    
    if (chartRef.current) {
      const echartsInstance = chartRef.current.getEchartsInstance();
      if (newState) {
        // Activate box zoom mode
        echartsInstance.dispatchAction({
          type: 'takeGlobalCursor',
          key: 'dataZoomSelect',
          dataZoomSelectActive: true
        });
      } else {
        // Deactivate box zoom mode
        echartsInstance.dispatchAction({
          type: 'takeGlobalCursor',
          key: 'dataZoomSelect',
          dataZoomSelectActive: false
        });
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Control buttons - vertically aligned */}
      <div className="absolute top-2 right-2 z-20 pointer-events-none flex flex-col gap-2">
        {/* View toggle button group */}
        <div className="flex pointer-events-auto shadow-md rounded-md overflow-hidden border border-gray-600">
          <Button 
             variant="ghost" 
             size="sm" 
             className={`rounded-none border-0 px-2.5 transition-colors ${
               viewMode === 'chart' 
                 ? 'bg-blue-600 text-white hover:bg-blue-700' 
                 : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
             }`}
             onClick={() => setViewMode('chart')}
          >
            <LineChart className="w-3.5 h-3.5" />
          </Button>
          <div className="w-px bg-gray-600"></div>
          <Button 
             variant="ghost" 
             size="sm" 
             className={`rounded-none border-0 px-2.5 transition-colors ${
               viewMode === 'interactions' 
                 ? 'bg-blue-600 text-white hover:bg-blue-700' 
                 : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
             }`}
             onClick={() => setViewMode('interactions')}
          >
            <Table className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Zoom controls button group */}
        <div className="flex pointer-events-auto shadow-md rounded-md overflow-hidden border border-gray-600">
          <Button 
             variant="ghost" 
             size="sm" 
             className={`rounded-none border-0 px-2.5 transition-colors ${
               isBoxZoomActive
                 ? 'bg-blue-600 text-white hover:bg-blue-700'
                 : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
             }`}
             onClick={handleBoxZoom}
             title="Box Zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <div className="w-px bg-gray-600"></div>
          <Button 
             variant="ghost" 
             size="sm" 
             className={`rounded-none border-0 px-2.5 transition-colors ${
               isZoomMode
                 ? 'bg-blue-600 text-white hover:bg-blue-700'
                 : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
             }`}
             onClick={handleResetZoom}
             title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {viewMode === 'chart' ? (
        <ReactECharts 
          ref={chartRef}
          option={getOption()} 
          style={{ height: chartHeight, width: '100%' }}
          onEvents={onEvents}
          notMerge={false} 
          lazyUpdate={true}
        />
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col gap-1 mb-6">
            <div className="flex gap-3 items-center">
              <h2 className="text-2xl font-bold text-white leading-8">Interactions</h2>
              <div className="flex items-start">
                <div className="bg-[#0e2b20] border border-[#3cc29a] px-2 h-6 flex items-center gap-1 rounded">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                    <path d="M8 0C3.58 0 0 3.58 0 8C0 12.42 3.58 16 8 16C12.42 16 16 12.42 16 8C16 3.58 12.42 0 8 0ZM6.5 11.5L3 8L4.41 6.59L6.5 8.67L11.59 3.58L13 5L6.5 11.5Z" fill="#3cc29a"/>
                  </svg>
                  <span className="text-sm text-white/95 leading-5">Active</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-white/95 leading-5">
              Sessions capture all interactions with your AI agent, providing insight into what happens behind the scenes.
            </p>
          </div>
          <RecentInteractions 
             title="" 
             metricName={heading} 
             metricUnit={unit}
             chartView={true}
             dateRange="custom"
             timeSegment="custom"
          />
        </div>
      )}
    </div>
  );
}