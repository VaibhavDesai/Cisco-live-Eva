import { useDrag, useDrop } from 'react-dnd';
import { useRef, type MouseEvent, type Ref } from 'react';
import { Icon } from '../momentum';
import { ck } from '../clus-kpi-theme';
import type { KpiThresholdStatus } from '../kpiTypes';

export type ObservabilityProjectionCardProps = {
  cardId: string;
  title: string;
  dateLabel: string;
  thresholdStatus?: KpiThresholdStatus;
  isPinned?: boolean;
  onPinToggle?: (e: MouseEvent) => void;
  dragIndex?: number;
  onMoveCard?: (dragIndex: number, hoverIndex: number) => void;
};

function ObservabilityProjectionCardInner({
  title,
  dateLabel,
  thresholdStatus = 'good',
  isPinned,
  onPinToggle,
  cardRef,
}: Omit<ObservabilityProjectionCardProps, 'cardId' | 'dragIndex' | 'onMoveCard'> & {
  cardRef?: Ref<HTMLDivElement>;
}) {
  const threshold = thresholdStatus;
  const valueTone =
    threshold === 'good'
      ? ck.textSuccess
      : threshold === 'bad'
        ? ck.textError
        : ck.text;

  return (
    <div
      ref={cardRef}
      className="kpi-card kpi-card--glass obs-kpi-projection-card"
      role="group"
      aria-label={`${title}: ${dateLabel}`}
    >
      <div className="kpi-card__inner">
        <div className="kpi-card__header">
          <div className="kpi-card__title-with-icon">
            <p className={`kpi-card__title ${ck.typo.bodyMidsizeMedium} ${ck.text} truncate`}>{title}</p>
          </div>
          <div className="kpi-card__header-actions">
            {onPinToggle ? (
              <div
                className="kpi-card__pin-hit"
                onClick={(e) => {
                  e.stopPropagation();
                  onPinToggle(e);
                }}
                role="button"
                aria-label={isPinned ? 'Unpin card' : 'Pin card'}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onPinToggle(e as unknown as MouseEvent);
                  }
                }}
              >
                <Icon
                  name={isPinned ? 'pin-filled' : 'pin-bold'}
                  size={16}
                  lengthUnit="px"
                  className={`shrink-0 ${ck.text}`}
                  aria-hidden
                />
              </div>
            ) : null}
          </div>
        </div>
        <div className="kpi-card__value-row">
          <p className={`kpi-card__value ${ck.typo.headingLargeMedium} ${valueTone}`}>{dateLabel}</p>
        </div>
      </div>
    </div>
  );
}

function ObservabilityProjectionCardWithDnd(props: ObservabilityProjectionCardProps) {
  const { title, dateLabel, thresholdStatus, isPinned, onPinToggle, dragIndex, onMoveCard } = props;
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
      const hoverIndex = dragIndex ?? 0;
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
    <ObservabilityProjectionCardInner
      title={title}
      dateLabel={dateLabel}
      thresholdStatus={thresholdStatus}
      isPinned={isPinned}
      onPinToggle={onPinToggle}
      cardRef={ref}
    />
  );
}

export function ObservabilityProjectionCard(props: ObservabilityProjectionCardProps) {
  if (props.isPinned && props.dragIndex !== undefined && props.onMoveCard !== undefined) {
    return <ObservabilityProjectionCardWithDnd {...props} />;
  }
  return (
    <ObservabilityProjectionCardInner
      title={props.title}
      dateLabel={props.dateLabel}
      thresholdStatus={props.thresholdStatus}
      isPinned={props.isPinned}
      onPinToggle={props.onPinToggle}
    />
  );
}
