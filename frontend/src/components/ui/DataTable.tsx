/**
 * Enhanced Responsive Data Table
 * Mobile-first table with sticky columns, virtual scrolling, and adaptive layouts
 */

import { forwardRef, useCallback, useMemo, type ReactNode } from "react";
import { cn } from "../../design-system/utils";
import { useContainerQuery } from "../../hooks/useContainerQuery";
import { VirtualList } from "./VirtualList";

interface Column<T = any> {
  key: string;
  header: ReactNode;
  cell: (item: T, index: number) => ReactNode;
  width?: string | number;
  minWidth?: string | number;
  sticky?: 'left' | 'right';
  sortable?: boolean;
  searchable?: boolean;
  mobileHidden?: boolean;
  mobileOrder?: number;
}

interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  loading?: boolean;
  emptyState?: ReactNode;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  virtual?: boolean;
  rowHeight?: number;
  maxHeight?: string;
  stickyHeader?: boolean;
  mobileLayout?: 'card' | 'stack' | 'horizontal-scroll';
  onRowClick?: (item: T, index: number) => void;
  rowSelection?: {
    selectedRows: Set<string | number>;
    onSelectionChange: (selectedRows: Set<string | number>) => void;
    getRowId: (item: T) => string | number;
  };
}

const SortIcon = ({ direction }: { direction?: 'asc' | 'desc' }) => (
  <svg 
    className={cn("data-table__sort-icon", direction && `data-table__sort-icon--${direction}`)}
    width="16" 
    height="16" 
    viewBox="0 0 16 16" 
    fill="none"
  >
    <path 
      d="M8 3L12 7H4L8 3Z" 
      fill="currentColor" 
      opacity={direction === 'asc' ? 1 : 0.3}
    />
    <path 
      d="M8 13L4 9H12L8 13Z" 
      fill="currentColor" 
      opacity={direction === 'desc' ? 1 : 0.3}
    />
  </svg>
);

const LoadingSkeleton = ({ columns }: { columns: Column[] }) => (
  <div className="data-table__loading">
    {Array.from({ length: 5 }, (_, i) => (
      <div key={i} className="data-table__loading-row">
        {columns.map((column, _j) => (
          <div 
            key={`${i}-${_j}`} 
            className="data-table__loading-cell"
            style={{ width: column.width || 'auto' }}
          >
            <div className="data-table__skeleton" />
          </div>
        ))}
      </div>
    ))}
  </div>
);

const MobileCard = <T,>({ 
  item, 
  index, 
  columns, 
  onRowClick,
  isSelected,
  onSelectionChange 
}: {
  item: T;
  index: number;
  columns: Column<T>[];
  onRowClick?: (item: T, index: number) => void;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
}) => {
  const visibleColumns = columns
    .filter(col => !col.mobileHidden)
    .sort((a, b) => (a.mobileOrder || 0) - (b.mobileOrder || 0));

  return (
    <div 
      className={cn(
        "data-table__mobile-card",
        onRowClick && "data-table__mobile-card--clickable",
        isSelected && "data-table__mobile-card--selected"
      )}
      onClick={onRowClick ? () => onRowClick(item, index) : undefined}
    >
      {onSelectionChange && (
        <div className="data-table__mobile-card-selection">
          <input
            type="checkbox"
            checked={isSelected || false}
            onChange={(e) => onSelectionChange(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div className="data-table__mobile-card-content">
        {visibleColumns.map((column, colIndex) => (
          <div key={column.key} className="data-table__mobile-field">
            <div className="data-table__mobile-field-label">
              {column.header}
            </div>
            <div className="data-table__mobile-field-value">
              {column.cell(item, index)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DataTable = forwardRef<HTMLDivElement, DataTableProps>(
  <T,>(
    {
      data,
      columns,
      className,
      loading = false,
      emptyState,
      onSort,
      sortColumn,
      sortDirection,
      virtual = false,
      rowHeight = 48,
      maxHeight = "400px",
      stickyHeader = true,
      mobileLayout = 'card',
      onRowClick,
      rowSelection,
    }: DataTableProps<T>,
    ref: React.Ref<HTMLDivElement>
  ) => {
    const { containerRef, matches } = useContainerQuery({
      breakpoints: { sm: 320, md: 768, lg: 1024 }
    });


    const isMobile = !matches.md;
    const shouldUseCardLayout = isMobile && mobileLayout === 'card';

    const handleSort = useCallback((column: Column<T>) => {
      if (!column.sortable || !onSort) return;
      
      const newDirection = 
        sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
      onSort(column.key, newDirection);
    }, [onSort, sortColumn, sortDirection]);

    const handleRowSelection = useCallback((item: T, selected: boolean) => {
      if (!rowSelection) return;
      
      const rowId = rowSelection.getRowId(item);
      const newSelection = new Set(rowSelection.selectedRows);
      
      if (selected) {
        newSelection.add(rowId);
      } else {
        newSelection.delete(rowId);
      }
      
      rowSelection.onSelectionChange(newSelection);
    }, [rowSelection]);

    const visibleColumns = useMemo(() => {
      if (isMobile) {
        return columns.filter(col => !col.mobileHidden);
      }
      return columns;
    }, [columns, isMobile]);

    const renderTableRow = useCallback((item: T, index: number) => {
      const rowId = rowSelection?.getRowId(item);
      const isSelected = rowId !== undefined && rowSelection?.selectedRows.has(rowId);

      return (
        <tr 
          key={index}
          className={cn(
            "data-table__row",
            onRowClick && "data-table__row--clickable",
            isSelected && "data-table__row--selected"
          )}
          onClick={onRowClick ? () => onRowClick(item, index) : undefined}
        >
          {rowSelection && (
            <td className="data-table__cell data-table__cell--selection">
              <input
                type="checkbox"
                checked={isSelected || false}
                onChange={(e) => handleRowSelection(item, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
            </td>
          )}
          {visibleColumns.map((column) => (
            <td
              key={column.key}
              className={cn(
                "data-table__cell",
                column.sticky && `data-table__cell--sticky-${column.sticky}`
              )}
              style={{
                width: column.width,
                minWidth: column.minWidth,
              }}
            >
              {column.cell(item, index)}
            </td>
          ))}
        </tr>
      );
    }, [visibleColumns, onRowClick, rowSelection, handleRowSelection]);

    const renderMobileList = useCallback(() => {
      if (loading) {
        return <LoadingSkeleton columns={visibleColumns} />;
      }

      if (data.length === 0) {
        return emptyState || (
          <div className="data-table__empty">
            <p>No data available</p>
          </div>
        );
      }

      return (
        <div className="data-table__mobile-list">
          {data.map((item, index) => {
            const rowId = rowSelection?.getRowId(item);
            const isSelected = rowId !== undefined && rowSelection?.selectedRows.has(rowId);
            
            return (
              <MobileCard
                key={index}
                item={item}
                index={index}
                columns={visibleColumns}
                onRowClick={onRowClick}
                isSelected={isSelected}
                onSelectionChange={rowSelection ? (selected) => handleRowSelection(item, selected) : undefined}
              />
            );
          })}
        </div>
      );
    }, [data, visibleColumns, loading, emptyState, onRowClick, rowSelection, handleRowSelection]);

    const renderDesktopTable = useCallback(() => {
      const tableContent = (
        <table className="data-table__table">
          <thead className={cn("data-table__header", stickyHeader && "data-table__header--sticky")}>
            <tr className="data-table__header-row">
              {rowSelection && (
                <th className="data-table__header-cell data-table__header-cell--selection">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && data.every(item => 
                      rowSelection.selectedRows.has(rowSelection.getRowId(item))
                    )}
                    onChange={(e) => {
                      const newSelection = new Set<string | number>();
                      if (e.target.checked) {
                        data.forEach(item => {
                          newSelection.add(rowSelection.getRowId(item));
                        });
                      }
                      rowSelection.onSelectionChange(newSelection);
                    }}
                  />
                </th>
              )}
              {visibleColumns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "data-table__header-cell",
                    column.sortable && "data-table__header-cell--sortable",
                    column.sticky && `data-table__header-cell--sticky-${column.sticky}`
                  )}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                  }}
                  onClick={column.sortable ? () => handleSort(column) : undefined}
                >
                  <div className="data-table__header-content">
                    {column.header}
                    {column.sortable && (
                      <SortIcon 
                        direction={sortColumn === column.key ? sortDirection : undefined}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="data-table__body">
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + (rowSelection ? 1 : 0)}>
                  <LoadingSkeleton columns={visibleColumns} />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + (rowSelection ? 1 : 0)} className="data-table__empty">
                  {emptyState || <p>No data available</p>}
                </td>
              </tr>
            ) : virtual ? (
              <tr>
                <td colSpan={visibleColumns.length + (rowSelection ? 1 : 0)} style={{ padding: 0 }}>
                  <VirtualList
                    items={data}
                    itemHeight={rowHeight}
                    height={400}
                    renderItem={renderTableRow as any}
                  />
                </td>
              </tr>
            ) : (
              data.map(renderTableRow)
            )}
          </tbody>
        </table>
      );

      return virtual && !loading && data.length > 0 ? (
        <div className="data-table__virtual-container" style={{ maxHeight }}>
          {tableContent}
        </div>
      ) : (
        tableContent
      );
    }, [
      data,
      visibleColumns,
      loading,
      emptyState,
      virtual,
      rowHeight,
      maxHeight,
      stickyHeader,
      rowSelection,
      handleSort,
      renderTableRow,
      sortColumn,
      sortDirection
    ]);

    return (
      <div
        ref={ref}
        className={cn("data-table", className)}
      >
        <div ref={containerRef as any} className="data-table__container">
          {shouldUseCardLayout ? renderMobileList() : renderDesktopTable()}
        </div>
      </div>
    );
  }
);

DataTable.displayName = "DataTable";

export default DataTable;