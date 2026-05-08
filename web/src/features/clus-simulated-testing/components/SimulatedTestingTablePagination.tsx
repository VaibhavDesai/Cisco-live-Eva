import { Pagination } from '../../../components/shared/Pagination';

export const SIMULATED_TESTING_TABLE_PAGE_SIZE = 10;

export type SimulatedTestingTablePaginationProps = {
  totalItems: number;
  page: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
};

export function SimulatedTestingTablePagination({
  totalItems,
  page,
  onPageChange,
  pageSize = SIMULATED_TESTING_TABLE_PAGE_SIZE,
}: SimulatedTestingTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems <= pageSize) {
    return null;
  }

  return (
    <Pagination
      className="clus-kpi-st-table-pagination"
      page={page}
      pageCount={totalPages}
      pageSize={pageSize}
      totalItems={totalItems}
      onPageChange={onPageChange}
      showCapacityControls
      showJumpToPage
    />
  );
}
