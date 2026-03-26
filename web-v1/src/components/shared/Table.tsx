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

export type SortDirection = 'asc' | 'desc' | 'none';

/* ------------------------------------------------------------------ */
/*  Table                                                              */
/* ------------------------------------------------------------------ */

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode;
  stickyHeader?: boolean;
  compact?: boolean;
  bordered?: boolean;
  striped?: boolean;
  className?: string;
}

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
  children: ReactNode;
  className?: string;
}

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
  children?: ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  colSpan?: number;
  className?: string;
}

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
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLTableRowElement>) => void;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
}

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
  children?: ReactNode;
  sortDirection?: SortDirection;
  onSort?: () => void;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

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
  children?: ReactNode;
  align?: 'left' | 'center' | 'right';
  truncate?: boolean;
  className?: string;
}

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

export default Table;
