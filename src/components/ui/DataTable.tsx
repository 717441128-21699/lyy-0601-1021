import * as React from 'react';
import { cn } from '@/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  accessor?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: boolean;
  pageSize?: number;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectRow?: (id: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  rowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  highlightedRowId?: string | null;
  onHighlightedRowVisible?: (rowId: string) => void;
  className?: string;
  emptyText?: string;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  pagination = true,
  pageSize = 10,
  selectable = false,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  rowId,
  onRowClick,
  highlightedRowId,
  onHighlightedRowVisible,
  className,
  emptyText = '暂无数据',
}: DataTableProps<T>) {
  const rowRefs = React.useRef<Map<string, HTMLTableRowElement>>(new Map());
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  React.useEffect(() => {
    if (highlightedRowId) {
      setTimeout(() => {
        const rowEl = rowRefs.current.get(highlightedRowId);
        if (rowEl) {
          rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          onHighlightedRowVisible?.(highlightedRowId);
        }
      }, 100);
    }
  }, [highlightedRowId]);

  React.useEffect(() => {
    if (highlightedRowId && pagination) {
      const rowIndex = data.findIndex(d => rowId(d) === highlightedRowId);
      if (rowIndex >= 0) {
        const targetPage = Math.floor(rowIndex / pageSize) + 1;
        if (targetPage !== currentPage) {
          setCurrentPage(targetPage);
        }
      }
    }
  }, [highlightedRowId, data, rowId, pagination, pageSize]);

  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = pagination ? data.slice(startIndex, startIndex + pageSize) : data;

  const allSelected = data.length > 0 && selectedRows.length === data.length;
  const someSelected = selectedRows.length > 0 && selectedRows.length < data.length;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const renderCell = (row: T, column: Column<T>) => {
    if (column.accessor) {
      return column.accessor(row);
    }
    const key = column.key as keyof T;
    return row[key] as React.ReactNode;
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="overflow-x-auto rounded-lg border border-dark-100">
        <table className="w-full">
          <thead className="bg-dark-50 border-b border-dark-100">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="w-4 h-4 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-dark-500 uppercase tracking-wider',
                    column.sortable && 'cursor-pointer hover:bg-dark-100 select-none',
                    column.className
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable && sortKey === column.key && (
                      <span className="text-primary-500">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-100 bg-white">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-dark-400"
                >
                  <div className="animate-pulse-soft">加载中...</div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-dark-400"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const id = rowId(row);
                const isSelected = selectedRows.includes(id);
                const isHighlighted = highlightedRowId === id;
                return (
                  <tr
                    key={id}
                    ref={(el) => {
                      if (el) {
                        rowRefs.current.set(id, el);
                      } else {
                        rowRefs.current.delete(id);
                      }
                    }}
                    className={cn(
                      'transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-dark-50',
                      isSelected && 'bg-primary-50',
                      isHighlighted && 'bg-warning-100 ring-2 ring-warning-400 ring-inset animate-pulse-soft'
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => onSelectRow?.(id, e.target.checked)}
                          className="w-4 h-4 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={cn('px-4 py-3 text-sm text-dark-700', column.className)}
                      >
                        {renderCell(row, column)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && data.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 mt-4">
          <div className="text-sm text-dark-500">
            共 {data.length} 条记录，第 {currentPage} / {totalPages || 1} 页
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded hover:bg-dark-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded hover:bg-dark-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'w-8 h-8 rounded text-sm font-medium transition-colors',
                    currentPage === page
                      ? 'bg-primary-500 text-white'
                      : 'hover:bg-dark-100 text-dark-600'
                  )}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded hover:bg-dark-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded hover:bg-dark-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
