import { Icon } from '../momentum';
import { chartBarGradientTokens, ck, momentumColorVars } from '../clus-kpi-theme';
import type { KPIData } from './kpiData';
import { useDrag, useDrop } from 'react-dnd';
import { useId, useRef, type MouseEvent as ReactMouseEvent, type Ref } from 'react';

/** Bar mini-chart: accent token gradient (matches other KPI emphasis). */
function sparklineBarAccentGradientStops(): [string, string] {
  return [
    `var(${chartBarGradientTokens.accent.top})`,
    `var(${chartBarGradientTokens.accent.bottom})`,
  ];
}

interface KPICardProps {
  data: KPIData;
  isActive: boolean;
  onClick: () => void;
  isPinned?: boolean;
  onPinToggle?: (e: React.MouseEvent) => void;
  dragIndex?: number;
  onMoveCard?: (dragIndex: number, hoverIndex: number) => void;
}

type SparklineProps = {
  data: number[];
  color: string;
  type: 'line' | 'area' | 'bar';
  width?: number;
  height?: number;
};

/** Mini trend chart — sized for compact KPI card (sparkline strip). */
function Sparkline({ data, color, type, width = 64, height = 24 }: SparklineProps) {
  const barGradientId = useId().replace(/:/g, '');
  if (!data || data.length === 0) return null;

  const padding = 3;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  if (type === 'bar') {
    const barWidth = (width - padding * 2) / data.length;
    const barGap = barWidth * 0.2;
    const actualBarWidth = barWidth - barGap;
    const [stopTop, stopBottom] = sparklineBarAccentGradientStops();

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="shrink-0"
        aria-hidden
      >
        <defs>
          <linearGradient id={barGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stopTop} />
            <stop offset="100%" stopColor={stopBottom} />
          </linearGradient>
        </defs>
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
              fill={`url(#${barGradientId})`}
              rx={1}
            />
          );
        })}
      </svg>
    );
  }

  const points = data
    .map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const firstX = padding;
  const lastX = width - padding;
  const bottomY = height - padding;
  const areaPoints = `${firstX},${bottomY} ${points} ${lastX},${bottomY}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
      aria-hidden
    >
      <polygon points={areaPoints} fill={color} fillOpacity={0.28} />
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

function KPICardInner({
  data,
  isActive,
  onClick,
  isPinned,
  onPinToggle,
  cardRef,
}: KPICardProps & { cardRef?: Ref<HTMLDivElement> }) {
  const threshold = data.thresholdStatus;
  const valueTone =
    threshold === 'good'
      ? ck.textSuccess
      : threshold === 'bad'
        ? ck.textError
        : ck.text;
  return (
    <div
      ref={cardRef}
      className={`kpi-card ${isActive ? 'kpi-card--active' : 'kpi-card--glass'}`}
    >
      <button type="button" className="kpi-card__primary" onClick={onClick}>
        <div className="kpi-card__inner">
          <div
            className={`kpi-card__header ${onPinToggle ? 'kpi-card__header--reserve-pin' : ''}`}
          >
            <div className="kpi-card__title-with-icon">
              <p className={`kpi-card__title ${ck.typo.bodyMidsizeMedium} ${ck.text} truncate`}>
                {data.heading}
              </p>
              {threshold === 'good' || threshold === 'bad' ? (
                <span
                  className="kpi-card__threshold-icon"
                  role="img"
                  aria-label={
                    threshold === 'good'
                      ? 'Current value meets configured threshold band'
                      : 'Current value is outside configured threshold band'
                  }
                >
                  <Icon
                    name={threshold === 'good' ? 'check-circle-filled' : 'warning-filled'}
                    size={16}
                    lengthUnit="px"
                    className={`kpi-card__threshold-icon-glyph ${threshold === 'good' ? ck.textSuccess : ck.textError}`}
                    aria-hidden
                  />
                </span>
              ) : null}
            </div>
          </div>

          <div className="kpi-card__value-row">
            <p className={`kpi-card__value ${ck.typo.headingLargeMedium} ${valueTone}`}>
              {data.value}
              {data.unit}
            </p>
            {data.sparklineData && data.sparklineType ? (
              <div className="kpi-card__sparkline">
                <Sparkline
                  data={data.sparklineData}
                  color={momentumColorVars.accent}
                  type={data.sparklineType}
                  width={64}
                  height={24}
                />
              </div>
            ) : null}
            <p
              className={`kpi-card__delta ${ck.typo.bodyMidsizeRegular} ${
                data.isPositive ? ck.textSuccess : ck.textError
              }`}
            >
              {data.change}
            </p>
          </div>
        </div>
      </button>
      {onPinToggle ? (
        <button
          type="button"
          className="kpi-card__pin-hit"
          aria-label={isPinned ? 'Unpin card' : 'Pin card'}
          onClick={(e: ReactMouseEvent<HTMLButtonElement>) => onPinToggle(e)}
        >
          <Icon
            name={isPinned ? 'pin-filled' : 'pin-bold'}
            size={16}
            lengthUnit="px"
            className={`shrink-0 ${ck.text}`}
            aria-hidden
          />
        </button>
      ) : null}
    </div>
  );
}

/** Cards that are not reorderable skip react-dnd so HTML5Backend does not interfere with clicks. */
function KPICardWithoutDnd(props: KPICardProps) {
  return <KPICardInner {...props} />;
}

function KPICardWithDnd({
  data,
  isActive,
  onClick,
  isPinned,
  onPinToggle,
  dragIndex,
  onMoveCard,
}: KPICardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [, drag] = useDrag({
    type: 'KPI_CARD',
    item: { index: dragIndex },
    canDrag: () => true,
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

  drag(drop(ref));

  return (
    <KPICardInner
      data={data}
      isActive={isActive}
      onClick={onClick}
      isPinned={isPinned}
      onPinToggle={onPinToggle}
      cardRef={ref}
    />
  );
}

export function KPICard(props: KPICardProps) {
  if (props.isPinned && props.dragIndex !== undefined && props.onMoveCard !== undefined) {
    return <KPICardWithDnd {...props} />;
  }
  return <KPICardWithoutDnd {...props} />;
}
