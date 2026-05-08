import ReactECharts from 'echarts-for-react';
import { lift } from 'zrender/lib/tool/color';
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  chartBarGradientTokens,
  ck,
  echartsBarGradientFromThemeTokens,
} from '../clus-kpi-theme';
import { useMdsChartThemeColors } from '../useMdsChartThemeColors';
import {
  format,
  subDays,
  subHours,
  eachDayOfInterval,
  eachHourOfInterval,
  differenceInHours,
  differenceInMinutes,
  eachMinuteOfInterval,
} from 'date-fns';
import SharedButton from '../../../components/shared/Button';
import { Icon } from '../momentum';
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
  /** When set with `sparklineData`, X axis uses these labels (e.g. test-001 …) instead of time buckets. */
  categoricalXLabels?: string[];
  /** Summary row below the chart (Average, Highest, Lowest, Trend). */
  chartSummary?: {
    average: string;
    highest: string;
    lowest: string;
    trendDisplay: string;
    trendIsPositive: boolean;
  };
  /** Tooltip value line label (defaults to `heading`). */
  valueMetricLabel?: string;
  /** When false, hides chart vs interactions toggle (embedded / simulated testing). Default true. */
  showViewModeToggle?: boolean;
}

// Generate different datasets based on chart type and date range
const generateTimeSeriesData = (
  dateRange: '24h' | 'week' | 'month' | '90d' | 'custom', 
  customRange?: { from?: Date; to?: Date }, 
  trend: 'up' | 'down' | 'stable' = 'stable',
  unit?: string,
  currentValue?: string
): Array<{ date: string; fullDate: Date; value1: number; value2: number }> => {
  const data: Array<{ date: string; fullDate: Date; value1: number; value2: number }> = [];
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
  
  dates.forEach((date) => {
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
const convertSparklineToChartData = (sparklineData: number[], dateRange: '24h' | 'week' | 'month' | '90d' | 'custom', customRange?: { from?: Date; to?: Date }): Array<{ date: string; fullDate: Date; value1: number; value2: number }> => {
  const data: Array<{ date: string; fullDate: Date; value1: number; value2: number }> = [];
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
  dates.forEach((date, idx) => {
    const dataIndex = idx % safeSparklineData.length;
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

/** Fallback when a custom `color` prop is passed (non-token hex/rgb). */
function barGradientFromResolvedColor(baseColor: string) {
  const top = lift(baseColor, 0.1) ?? baseColor;
  return {
    type: 'linear' as const,
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    global: false,
    colorStops: [
      { offset: 0, color: top },
      { offset: 1, color: baseColor },
    ],
  };
}

export function KPIChart({
  heading,
  description: _description,
  chartType,
  dateRange,
  customDateRange,
  sparklineData,
  unit,
  value,
  simplified = false,
  color,
  threshold,
  yDomain,
  ticks: _ticks,
  curveType,
  strokeWidth = 2,
  chartHeight = 300,
  className = '',
  isPinned: _isPinned,
  onPinToggle: _onPinToggle,
  onDrillDown: _onDrillDown,
  categoricalXLabels,
  chartSummary,
  valueMetricLabel,
  showViewModeToggle = true,
}: KPIChartProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'interactions'>('chart');
  const [, setZoomedRange] = useState<{ start: number; end: number } | null>(null);
  const [isZoomMode, setIsZoomMode] = useState(false);
  const [isBoxZoomActive, setIsBoxZoomActive] = useState(false);
  const chartRef = useRef<any>(null);
  const chartColors = useMdsChartThemeColors();

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
    if (categoricalXLabels?.length && effectiveSparklineData?.length) {
      const n = Math.min(categoricalXLabels.length, effectiveSparklineData.length);
      const now = new Date();
      return Array.from({ length: n }, (_, i) => ({
        date: categoricalXLabels[i] ?? '',
        fullDate: now,
        value1: effectiveSparklineData[i] ?? 0,
        value2: (effectiveSparklineData[i] ?? 0) * 0.95,
      }));
    }
    return effectiveSparklineData && effectiveSparklineData.length > 0
      ? convertSparklineToChartData(effectiveSparklineData, dateRange, customDateRange)
      : generateTimeSeriesData(dateRange, customDateRange, 'up', unit, value);
  }, [dateRange, customDateRange, effectiveSparklineData, unit, value, categoricalXLabels]);

  // Reset view when date range changes
  useEffect(() => {
    setViewMode('chart');
    setZoomedRange(null);
  }, [dateRange, customDateRange]);

  /** Table view hides the chart — zoom tools do not apply; clear zoom UI so buttons are not stuck "active". */
  useEffect(() => {
    if (viewMode !== 'interactions') return;
    setIsBoxZoomActive(false);
    setIsZoomMode(false);
    setZoomedRange(null);
  }, [viewMode]);

  const chartOption = useMemo(() => {
    const c = chartColors;
    const mainColor = isCSAT ? c.success : (color || c.accent);
    const hasCustomSeriesColor = color != null && String(color).trim() !== '';
    const commonGrid = {
      left: 10,
      right: 10,
      top: 30,
      bottom: 10,
      containLabel: true,
      borderColor: c.outline,
    };

    const metricLineLabel = valueMetricLabel ?? heading;
    const commonTooltip = {
      trigger: 'axis',
      backgroundColor: c.tooltipBg,
      borderColor: c.tooltipBorder,
      textStyle: {
        color: c.textPrimary,
      },
      formatter: (params: any) => {
        const axisVal = params[0]?.axisValue ?? '';
        const header = categoricalXLabels?.length
          ? `<div style="font-size: 12px; color: ${c.textSecondary};">Evaluation: ${axisVal}</div>`
          : `<div style="font-size: 12px; color: ${c.textSecondary};">${axisVal}</div>`;
        let res = header;
        params.forEach((item: any) => {
          res += `<div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${item.color};"></div>
                    <span style="color: ${c.textPrimary};">${metricLineLabel}: <b>${item.value}${unit ?? ''}</b></span>
                  </div>`;
        });
        return res;
      },
    };

    const xAxisData = timeSeriesData.map(d => d.date);
    const seriesData1 = timeSeriesData.map(d => d.value1);
    const seriesData2 = timeSeriesData.map(d => d.value2);

    /** Gradient fill under line charts — matches area series styling */
    const areaFillUnderLine = {
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: mainColor },
          { offset: 1, color: 'transparent' },
        ],
      },
      opacity: 0.2,
    };

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
              color: c.splitLine,
              borderColor: c.controlActive,
            }
          }
        }
      },
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          filterMode: 'filter',
        },
      ],
      xAxis: {
        type: 'category',
        data: xAxisData,
        axisLine: { lineStyle: { color: c.outline } },
        axisLabel: { color: c.axisLabel, fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: c.splitLine, type: 'dashed' } },
        axisLabel: { color: c.axisLabel, fontSize: 11 },
        min: isCSAT ? 0 : (yDomain ? yDomain[0] : undefined),
        max: isCSAT ? 5 : (yDomain ? yDomain[1] : undefined),
      },
      // Subtle, fast motion on first paint and on data updates (date range / metric change)
      animation: true,
      animationDuration: 260,
      animationEasing: 'cubicOut',
      animationDurationUpdate: 200,
      animationEasingUpdate: 'cubicOut',
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
          areaStyle: areaFillUnderLine,
        }];
        if (chartType === 'stacked-area') {
           baseOption.series.push({
             name: 'Previous',
             data: seriesData2,
             type: 'line',
             smooth: curveType === 'monotone',
             stack: 'total',
             areaStyle: { opacity: 0.2 },
             itemStyle: { color: c.secondarySeries },
             lineStyle: { width: strokeWidth }
           });
        }
        break;

      case 'bar':
      case 'column':
      case 'stacked-bar':
      case 'grouped-bar':
      case 'histogram': {
        const primaryBarFill = hasCustomSeriesColor
          ? barGradientFromResolvedColor(mainColor)
          : echartsBarGradientFromThemeTokens(
              isCSAT ? chartBarGradientTokens.success : chartBarGradientTokens.accent,
              {
                top: lift(mainColor, 0.1) ?? mainColor,
                bottom: mainColor,
              },
            );

        const defaultBarRadius: [number, number, number, number] = [4, 4, 0, 0];
        /** Bottom stack segment: square top so it meets the upper segment flush */
        const stackedBottomRadius: [number, number, number, number] = [0, 0, 0, 0];

        baseOption.series = [{
          name: heading,
          data: seriesData1,
          type: 'bar',
          itemStyle: {
            color: primaryBarFill,
            borderRadius: chartType === 'stacked-bar' ? stackedBottomRadius : defaultBarRadius,
          },
          barMaxWidth: 40
        }];
        
        if (chartType === 'stacked-bar') {
          baseOption.series[0].stack = 'total';
          baseOption.series.push({
            name: 'Previous',
            data: seriesData2,
            type: 'bar',
            stack: 'total',
            itemStyle: {
              color: echartsBarGradientFromThemeTokens(chartBarGradientTokens.muted, {
                top: lift(c.secondarySeries, 0.1) ?? c.secondarySeries,
                bottom: c.secondarySeries,
              }),
              borderRadius: defaultBarRadius,
            },
            barMaxWidth: 40
          });
        }
        break;
      }

      case 'pie':
      case 'donut':
        const pieData = [
            { value: parseFloat(value?.replace('%', '') || '60'), name: heading },
            { value: 100 - parseFloat(value?.replace('%', '') || '60'), name: 'Other' }
        ];
        
        return {
          ...baseOption,
          toolbox: { show: false },
          dataZoom: [],
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
               borderColor: c.surface,
               borderWidth: 2
            },
            color: [mainColor, c.pieOther]
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
          areaStyle: areaFillUnderLine,
          markLine: {
            data: [{ yAxis: threshold || 45 }],
            lineStyle: { color: c.warning, type: 'dashed' },
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
          lineStyle: { width: strokeWidth },
          areaStyle: areaFillUnderLine,
        }];
        break;
    }

    return baseOption;
  }, [
    chartColors,
    timeSeriesData,
    chartType,
    heading,
    color,
    simplified,
    curveType,
    strokeWidth,
    isCSAT,
    yDomain,
    unit,
    threshold,
    value,
    categoricalXLabels,
    valueMetricLabel,
  ]);

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
      {viewMode === 'chart' ? (
        <div
          key={heading}
          className="animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <ReactECharts
            ref={chartRef}
            option={chartOption}
            style={{ height: chartHeight, width: '100%' }}
            onEvents={onEvents}
            notMerge={false}
            replaceMerge={['series']}
            lazyUpdate={false}
          />
          {chartSummary ? (
            <div
              className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4"
              aria-label="Trend summary"
            >
              <div className="min-w-0 rounded-lg border border-[var(--mds-color-theme-outline-secondary-normal)] bg-[var(--mds-color-theme-background-solid-secondary-normal)] px-4 py-3">
                <p className={`m-0 ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>Average</p>
                <p className={`mt-1 m-0 ${ck.typo.bodyLargeMedium} ${ck.text}`}>{chartSummary.average}</p>
              </div>
              <div className="min-w-0 rounded-lg border border-[var(--mds-color-theme-outline-secondary-normal)] bg-[var(--mds-color-theme-background-solid-secondary-normal)] px-4 py-3">
                <p className={`m-0 ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>Highest</p>
                <p className={`mt-1 m-0 ${ck.typo.bodyLargeMedium} ${ck.textSuccess}`}>{chartSummary.highest}</p>
              </div>
              <div className="min-w-0 rounded-lg border border-[var(--mds-color-theme-outline-secondary-normal)] bg-[var(--mds-color-theme-background-solid-secondary-normal)] px-4 py-3">
                <p className={`m-0 ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>Lowest</p>
                <p className={`mt-1 m-0 ${ck.typo.bodyLargeMedium} ${ck.textError}`}>{chartSummary.lowest}</p>
              </div>
              <div className="min-w-0 rounded-lg border border-[var(--mds-color-theme-outline-secondary-normal)] bg-[var(--mds-color-theme-background-solid-secondary-normal)] px-4 py-3">
                <p className={`m-0 ${ck.typo.bodySmallRegular} ${ck.textMuted}`}>Trend</p>
                <p
                  className={`mt-1 m-0 ${ck.typo.bodyLargeMedium} ${
                    chartSummary.trendIsPositive ? ck.textSuccess : ck.textError
                  }`}
                >
                  {chartSummary.trendDisplay}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col gap-1 mb-6">
            <div className="flex gap-3 items-center">
              <h2 className={`text-2xl font-bold leading-8 ${ck.text}`}>Interactions</h2>
              <div className="flex items-start">
                <div className="bg-[var(--mds-color-theme-background-alert-success-normal)] border border-[var(--mds-color-theme-text-success-normal)] px-2 h-6 flex items-center gap-1 rounded">
                  <Icon
                    name="check-circle-bold"
                    size={16}
                    lengthUnit="px"
                    className={`${ck.textSuccess} shrink-0`}
                    aria-hidden
                  />
                  <span className={`text-sm leading-5 ${ck.text}`}>Active</span>
                </div>
              </div>
            </div>
            <p className={`text-sm leading-5 ${ck.textMuted}`}>
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

      {/* After main content in DOM so this layer stacks above the chart; high z-index avoids SVG/canvas hit-test stealing clicks */}
      <div className="absolute top-0 right-0 z-[100] flex flex-row gap-1 items-start clus-kpi-chart-toolbar">
        {showViewModeToggle ? (
          <div className="btn-group">
            <SharedButton
              variant="secondary"
              size="sm"
              className={viewMode === 'chart' ? 'active' : ''}
              aria-pressed={viewMode === 'chart'}
              onClick={() => setViewMode('chart')}
              aria-label="Chart view"
            >
              <Icon name="multiline-chart-bold" size={14} lengthUnit="px" aria-hidden />
            </SharedButton>
            <SharedButton
              variant="secondary"
              size="sm"
              className={viewMode === 'interactions' ? 'active' : ''}
              aria-pressed={viewMode === 'interactions'}
              onClick={() => setViewMode('interactions')}
              aria-label="Table view"
            >
              <Icon name="table-bold" size={14} lengthUnit="px" aria-hidden />
            </SharedButton>
          </div>
        ) : null}

        <div className="btn-group">
          <SharedButton
            variant="secondary"
            size="sm"
            className={isBoxZoomActive && viewMode === 'chart' ? 'active' : ''}
            aria-pressed={isBoxZoomActive && viewMode === 'chart'}
            disabled={viewMode === 'interactions'}
            onClick={handleBoxZoom}
            title={
              viewMode === 'interactions'
                ? 'Switch to chart view to use box zoom'
                : 'Box zoom'
            }
            aria-label="Box zoom"
          >
            <Icon name="selection-bold" size={14} lengthUnit="px" aria-hidden />
          </SharedButton>
          <SharedButton
            variant="secondary"
            size="sm"
            className={isZoomMode && viewMode === 'chart' ? 'active' : ''}
            aria-pressed={isZoomMode && viewMode === 'chart'}
            disabled={viewMode === 'interactions'}
            onClick={handleResetZoom}
            title={
              viewMode === 'interactions'
                ? 'Switch to chart view to reset zoom'
                : 'Reset zoom'
            }
            aria-label="Reset zoom"
          >
            <Icon name="reset-bold" size={14} lengthUnit="px" aria-hidden />
          </SharedButton>
        </div>
      </div>
    </div>
  );
}