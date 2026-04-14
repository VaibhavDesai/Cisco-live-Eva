import { useCallback, useMemo, useRef, useState } from 'react';
import { Popover } from './Popover';
import { Icon } from '../../icons/Icon';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function clampToGrid(monthCursor: Date): { cells: { date: Date; inMonth: boolean }[] } {
  const first = startOfMonth(monthCursor);
  const startPad = first.getDay();
  const daysInMonth = new Date(
    monthCursor.getFullYear(),
    monthCursor.getMonth() + 1,
    0,
  ).getDate();

  const cells: { date: Date; inMonth: boolean }[] = [];
  const prevMonth = addMonths(monthCursor, -1);
  const prevDays = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();

  for (let i = 0; i < startPad; i++) {
    const day = prevDays - startPad + i + 1;
    cells.push({
      date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), day),
      inMonth: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: new Date(monthCursor.getFullYear(), monthCursor.getMonth(), d),
      inMonth: true,
    });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
    cells.push({ date: next, inMonth: false });
  }
  return { cells };
}

export interface DatePickerProps {
  /** Selected date, or null when empty */
  value: Date | null;
  /** Called when the user selects a date */
  onChange: (date: Date | null) => void;
  /** Dates before this day are disabled */
  minDate?: Date;
  /** Dates after this day are disabled */
  maxDate?: Date;
  /** Shown on the trigger when value is null */
  placeholder?: string;
  /** Prevents opening the calendar */
  disabled?: boolean;
  /** Appended to the trigger wrapper class list */
  className?: string;
  /** Optional id for label association */
  id?: string;
}

/**
 * Date picker with calendar popover (Figma `24964-19982`).
 * Uses browser-local `Date` only — wire your own persistence / APIs.
 *
 * @example
 * const [date, setDate] = useState<Date | null>(null);
 * return <DatePicker value={date} onChange={setDate} />;
 */
export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Select date',
  disabled = false,
  className = '',
  id,
}: DatePickerProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => startOfMonth(value ?? new Date()));

  const label = useMemo(() => {
    if (!value) return placeholder;
    return value.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [value, placeholder]);

  const { cells } = useMemo(() => clampToGrid(cursor), [cursor]);

  const today = new Date();

  const isDisabled = useCallback(
    (d: Date) => {
      if (minDate && d < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) {
        return true;
      }
      if (maxDate && d > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())) {
        return true;
      }
      return false;
    },
    [minDate, maxDate],
  );

  const select = (d: Date) => {
    if (isDisabled(d)) return;
    onChange(d);
    setOpen(false);
  };

  return (
    <>
      <div
        ref={anchorRef}
        className={`date-picker__trigger ${className}`.trim()}
        id={id}
      >
        <button
          type="button"
          className="form-input date-picker__input"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <Icon name="schedule-send" weight="regular" size="sm" />
          <span>{label}</span>
        </button>
      </div>
      <Popover
        open={open}
        onOpenChange={setOpen}
        anchorRef={anchorRef}
        placement="bottom-start"
        variant="tonal"
        closeOnBackdrop
        aria-label="Choose date"
      >
        <div className="date-picker__calendar">
          <div className="date-picker__nav">
            <button
              type="button"
              className="date-picker__icon-btn"
              aria-label="Previous month"
              onClick={() => setCursor((c) => addMonths(c, -1))}
            >
              <Icon name="arrow-left" weight="bold" size="sm" />
            </button>
            <span className="date-picker__month-label">
              {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              className="date-picker__icon-btn"
              aria-label="Next month"
              onClick={() => setCursor((c) => addMonths(c, 1))}
            >
              <Icon name="arrow-right" weight="bold" size="sm" />
            </button>
          </div>
          <div className="date-picker__weekdays" aria-hidden>
            {WEEKDAYS.map((w) => (
              <div key={w} className="date-picker__weekday">
                {w}
              </div>
            ))}
          </div>
          <div className="date-picker__grid" role="grid">
            {cells.map(({ date, inMonth }, i) => {
              const dis = isDisabled(date);
              const sel = value ? sameDay(date, value) : false;
              const isToday = sameDay(date, today);
              return (
                <button
                  // eslint-disable-next-line react/no-array-index-key -- stable grid position
                  key={`${date.toISOString()}-${i}`}
                  type="button"
                  role="gridcell"
                  disabled={dis}
                  className={`date-picker__cell ${!inMonth ? 'date-picker__cell--outside' : ''} ${isToday ? 'date-picker__cell--today' : ''} ${sel ? 'date-picker__cell--selected' : ''}`.trim()}
                  onClick={() => select(date)}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </Popover>
    </>
  );
}
