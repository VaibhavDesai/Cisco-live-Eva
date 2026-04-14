import {
  forwardRef,
  useCallback,
  type ReactNode,
  type ThHTMLAttributes,
  type TdHTMLAttributes,
  type HTMLAttributes,
  type TableHTMLAttributes,
  type MouseEvent,
  type KeyboardEvent,
} from 'react';
import { Icon } from '../../icons/Icon';

/* ------------------------------------------------------------------ */
/*  Sort types                                                         */
/* ------------------------------------------------------------------ */

/** Sort direction for a sortable column header */
export type SortDirection = 'asc' | 'desc' | 'none';

/* ------------------------------------------------------------------ */
/*  Table                                                              */
/* ------------------------------------------------------------------ */

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  /** Table structure and rows */
  children: ReactNode;
  /** Keep the header visible while scrolling */
  stickyHeader?: boolean;
  /** Use compact row spacing */
  compact?: boolean;
  /** Show borders around cells */
  bordered?: boolean;
  /** Alternate row background colors */
  striped?: boolean;
  /** Extra class on the outer wrapper */
  className?: string;
}

/**
 * Table wrapper with layout variants around a semantic `<table>`.
 *
 * @example
 * <Table><TableHead><TableRow><TableHeader>Name</TableHeader></TableRow></TableHead>
 *   <TableBody><TableRow><TableCell>Value</TableCell></TableRow></TableBody></Table>
 */
export const Table = forwardRef<HTMLDivElement, TableProps>(function Table(
  {
    children,
    stickyHeader = false,
    compact = false,
    bordered = false,
    striped = false,
    className = '',
    ...tableProps
  },
  ref,
) {
  const containerCls = [
    'table-container',
    stickyHeader && 'table-sticky',
    compact && 'table-compact',
    bordered && 'table-bordered',
    striped && 'table-striped',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={ref} className={containerCls}>
      <table role="table" {...tableProps}>
        {children}
      </table>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  TableHead                                                          */
/* ------------------------------------------------------------------ */

export interface TableHeadProps {
  /** Header rows and cells */
  children: ReactNode;
  /** Extra class on `<thead>` */
  className?: string;
}

/**
 * Header row group (`<thead>`) for column labels.
 *
 * @example
 * <TableHead><TableRow><TableHeader>Title</TableHeader></TableRow></TableHead>
 */
export function TableHead({ children, className = '' }: TableHeadProps) {
  return (
    <thead className={className || undefined} role="rowgroup">
      {children}
    </thead>
  );
}

/* ------------------------------------------------------------------ */
/*  TableBody                                                          */
/* ------------------------------------------------------------------ */

export interface TableBodyProps {
  /** Body rows (ignored when loading or empty) */
  children?: ReactNode;
  /** Show a loading row instead of children */
  loading?: boolean;
  /** Show the empty state instead of children */
  empty?: boolean;
  /** Icon shown in the empty state */
  emptyIcon?: ReactNode;
  /** Empty state title text */
  emptyTitle?: string;
  /** Empty state description text */
  emptyDescription?: string;
  /** Column span for loading and empty placeholder rows */
  colSpan?: number;
  /** Extra class on `<tbody>` */
  className?: string;
}

/**
 * Body row group with loading and empty presets, or child rows.
 *
 * @example
 * <TableBody><TableRow><TableCell>Row</TableCell></TableRow></TableBody>
 */
export function TableBody({
  children,
  loading = false,
  empty = false,
  emptyIcon,
  emptyTitle = 'No data',
  emptyDescription,
  colSpan = 1,
  className = '',
}: TableBodyProps) {
  if (loading) {
    return (
      <tbody className={className || undefined} role="rowgroup">
        <tr>
          <td colSpan={colSpan}>
            <div className="table-loading" role="status" aria-label="Loading">
              <div className="table-loading-spinner" />
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  if (empty) {
    return (
      <tbody className={className || undefined} role="rowgroup">
        <tr>
          <td colSpan={colSpan}>
            <div className="table-empty-state">
              {emptyIcon && (
                <span className="table-empty-icon">{emptyIcon}</span>
              )}
              <span className="table-empty-title">{emptyTitle}</span>
              {emptyDescription && (
                <span className="table-empty-description">
                  {emptyDescription}
                </span>
              )}
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className={className || undefined} role="rowgroup">
      {children}
    </tbody>
  );
}

/* ------------------------------------------------------------------ */
/*  TableRow                                                           */
/* ------------------------------------------------------------------ */

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  /** Row cells */
  children: ReactNode;
  /** Row click handler (enables keyboard activation when set) */
  onClick?: (e: MouseEvent<HTMLTableRowElement>) => void;
  /** Selected row styling */
  selected?: boolean;
  /** Disables click and keyboard interaction */
  disabled?: boolean;
  /** Extra class on `<tr>` */
  className?: string;
}

/**
 * Table row with optional click, selection, and disabled states.
 *
 * @example
 * <TableRow onClick={() => {}}><TableCell>Clickable</TableCell></TableRow>
 */
export function TableRow({
  children,
  onClick,
  selected = false,
  disabled = false,
  className = '',
  ...rowProps
}: TableRowProps) {
  const rowCls = [
    onClick && 'table-row-clickable',
    selected && 'table-row-selected',
    disabled && 'table-row-disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTableRowElement>) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick(e as unknown as MouseEvent<HTMLTableRowElement>);
      }
    },
    [onClick],
  );

  return (
    <tr
      className={rowCls || undefined}
      onClick={disabled ? undefined : onClick}
      onKeyDown={onClick && !disabled ? handleKeyDown : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      role={onClick ? 'row' : undefined}
      aria-selected={selected || undefined}
      aria-disabled={disabled || undefined}
      {...rowProps}
    >
      {children}
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/*  TableHeader                                                        */
/* ------------------------------------------------------------------ */

export interface TableHeaderProps
  extends ThHTMLAttributes<HTMLTableCellElement> {
  /** Header label or custom content */
  children?: ReactNode;
  /** Active sort direction for this column */
  sortDirection?: SortDirection;
  /** Invoked when the header sort control is activated */
  onSort?: () => void;
  /** Header text alignment */
  align?: 'left' | 'center' | 'right';
  /** Extra class on `<th>` */
  className?: string;
}

/**
 * Column header cell with optional sort controls and alignment.
 *
 * @example
 * <TableHeader sortDirection="asc" onSort={() => {}}>Name</TableHeader>
 */
export function TableHeader({
  children,
  sortDirection,
  onSort,
  align,
  className = '',
  ...thProps
}: TableHeaderProps) {
  const isSortable = sortDirection !== undefined || onSort !== undefined;
  const isSorted = sortDirection === 'asc' || sortDirection === 'desc';

  const thCls = [
    isSortable && 'table-header-sortable',
    isSorted && 'table-header-sorted',
    align === 'center' && 'align-center',
    align === 'right' && 'align-right',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = useCallback(() => {
    onSort?.();
  }, [onSort]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTableCellElement>) => {
      if (onSort && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onSort();
      }
    },
    [onSort],
  );

  return (
    <th
      className={thCls || undefined}
      onClick={isSortable ? handleClick : undefined}
      onKeyDown={isSortable ? handleKeyDown : undefined}
      tabIndex={isSortable ? 0 : undefined}
      role="columnheader"
      aria-sort={
        sortDirection === 'asc'
          ? 'ascending'
          : sortDirection === 'desc'
            ? 'descending'
            : isSortable
              ? 'none'
              : undefined
      }
      {...thProps}
    >
      {isSortable ? (
        <span className="table-header-content">
          {children}
          {isSorted && (
            <span
              className={`table-sort-icon${sortDirection === 'desc' ? ' desc' : ''}`}
            >
              <Icon name="arrow-tail-up" weight="bold" size={12} />
            </span>
          )}
        </span>
      ) : (
        children
      )}
    </th>
  );
}

/* ------------------------------------------------------------------ */
/*  TableCell                                                          */
/* ------------------------------------------------------------------ */

export interface TableCellProps
  extends TdHTMLAttributes<HTMLTableCellElement> {
  /** Cell content */
  children?: ReactNode;
  /** Cell text alignment */
  align?: 'left' | 'center' | 'right';
  /** Ellipsis overflow for long single-line content */
  truncate?: boolean;
  /** Extra class on `<td>` */
  className?: string;
}

/**
 * Body cell with optional alignment and truncation.
 *
 * @example
 * <TableCell truncate>Long value…</TableCell>
 */
export function TableCell({
  children,
  align,
  truncate = false,
  className = '',
  style,
  ...tdProps
}: TableCellProps) {
  const tdCls = [
    align === 'center' && 'align-center',
    align === 'right' && 'align-right',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const mergedStyle = truncate
    ? {
        ...style,
        maxWidth: style?.maxWidth ?? '200px',
        overflow: 'hidden' as const,
        textOverflow: 'ellipsis' as const,
        whiteSpace: 'nowrap' as const,
      }
    : style;

  return (
    <td
      className={tdCls || undefined}
      style={mergedStyle}
      {...tdProps}
    >
      {children}
    </td>
  );
}

/**
 * Default export — same component as {@link Table}.
 *
 * @example
 * import Table from './Table';
 */
export default Table;
