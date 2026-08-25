import { Search, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import LoadingSpinner from '@/components/loadingSpinner';
import Pagination from '@/components/Pagination';
import { useState } from 'react';
import { cn } from '@/utils';

export default function DataTable({
  columns,
  data = [],
  loading,
  pagination,
  onPageChange,
  onSort,
  sortField,
  sortOrder,
  searchable = true,
  searchValue = '',
  onSearch,
  searchPlaceholder = 'Search...',
  actions,
  emptyMessage = 'No data found',
  emptyIcon: EmptyIcon,
  headerActions,
  title,
  selectable,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
}) {
  const [localSearch, setLocalSearch] = useState(searchValue);

  const handleSearch = (val) => {
    setLocalSearch(val);
    onSearch?.(val);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-primary-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-primary-600" />
    );
  };

  const allSelected = data.length > 0 && selectedRows.length === data.length;

  return (
    <div className="card overflow-hidden">
      {(title || searchable || headerActions) && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            )}
            <div className="flex items-center gap-3 flex-1 sm:justify-end">
              {searchable && onSearch && (
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={localSearch}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="input-field pl-9 pr-8 py-2"
                  />
                  {localSearch && (
                    <button
                      onClick={() => handleSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  )}
                </div>
              )}
              {headerActions}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/60">
              {selectable && (
                <th className="w-12 px-6 py-3.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    title={allSelected ? 'Deselect All' : 'Select All'}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                    col.sortable &&
                      'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200',
                    col.className
                  )}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    {col.label}
                    {col.sortable && <SortIcon field={col.key} />}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0) + (selectable ? 1 : 0)}
                  className="px-6 py-16"
                >
                  <LoadingSpinner size="md" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0) + (selectable ? 1 : 0)}
                  className="px-6 py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    {EmptyIcon && (
                      <EmptyIcon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    )}
                    <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const rowId = row.id || row._id || idx;
                return (
                  <tr
                    key={rowId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    {selectable && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(rowId)}
                          onChange={(e) => onSelectRow?.(rowId, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 cursor-pointer"
                          title={selectedRows.includes(rowId) ? 'Deselect row' : 'Select row'}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-6 py-4 text-sm text-gray-700 dark:text-gray-300',
                          col.cellClass
                        )}
                      >
                        {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '-')}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-6 py-4 text-right whitespace-nowrap">{actions(row)}</td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages || pagination.pages}
            total={pagination.total || pagination.totalDocs}
            limit={pagination.limit}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
