import { Icon } from '../../icons/Icon';

export interface PaginationProps {
  /** 1-based current page */
  page: number;
  /** Total number of pages (≥ 1) */
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Items per page (for range summary) */
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  totalItems?: number;
  showCapacityControls?: boolean;
  showJumpToPage?: boolean;
  itemsPerPageLabel?: string;
  className?: string;
}

function clampPage(p: number, max: number) {
  const m = Math.max(1, max);
  return Math.min(Math.max(1, p), m);
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  totalItems,
  showCapacityControls = true,
  showJumpToPage = true,
  itemsPerPageLabel = 'Items per page',
  className = '',
}: PaginationProps) {
  const max = Math.max(1, pageCount);
  const current = clampPage(page, max);

  const startItem = totalItems != null ? (current - 1) * pageSize + 1 : null;
  const endItem =
    totalItems != null ? Math.min(current * pageSize, totalItems) : null;

  const rangeText =
    startItem != null && endItem != null && totalItems != null
      ? `${startItem}-${endItem} of ${totalItems} items`
      : null;

  const showCapacityBlock =
    showCapacityControls &&
    (typeof onPageSizeChange === 'function' || totalItems != null);

  const pageIds = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <nav className={`pagination${className ? ` ${className}` : ''}`} aria-label="Pagination">
      {showCapacityBlock && (
        <div className="pagination-capacity">
          {onPageSizeChange && (
            <>
              <span className="pagination-capacity-label">{itemsPerPageLabel}</span>
              <select
                className="form-input pagination-select"
                aria-label={itemsPerPageLabel}
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
              >
                {pageSizeOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </>
          )}
          {rangeText && <span className="pagination-range">{rangeText}</span>}
        </div>
      )}

      <div className="pagination-nav">
        <div className="pagination-nav-cluster">
          <button
            type="button"
            className="pagination-icon-btn"
            aria-label="First page"
            disabled={current <= 1}
            onClick={() => onPageChange(1)}
          >
            <Icon name="overflow-left" weight="bold" size={16} />
          </button>
          <button
            type="button"
            className="pagination-pill-btn"
            aria-label="Previous page"
            disabled={current <= 1}
            onClick={() => onPageChange(current - 1)}
          >
            <Icon name="arrow-left" weight="bold" size={16} />
            Previous
          </button>
        </div>

        {showJumpToPage && max > 0 && (
          <div className="pagination-jump">
            <select
              className="form-input pagination-select"
              aria-label="Current page"
              value={current}
              onChange={(e) => onPageChange(Number(e.target.value))}
            >
              {pageIds.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <span className="pagination-jump-suffix">of {max} pages</span>
          </div>
        )}

        <div className="pagination-nav-cluster">
          <button
            type="button"
            className="pagination-pill-btn"
            aria-label="Next page"
            disabled={current >= max}
            onClick={() => onPageChange(current + 1)}
          >
            Next
            <Icon name="arrow-right" weight="bold" size={16} />
          </button>
          <button
            type="button"
            className="pagination-icon-btn"
            aria-label="Last page"
            disabled={current >= max}
            onClick={() => onPageChange(max)}
          >
            <Icon name="overflow-right" weight="bold" size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Pagination;
