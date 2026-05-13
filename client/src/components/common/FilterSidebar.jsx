import { useState } from 'react';
import { Filter, X } from 'lucide-react';
export default function FilterSidebar({ filters = [], activeFilters = {}, onFilterChange, onClear }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasActiveFilters = Object.values(activeFilters).some(
    (v) => v !== '' && v !== undefined && v !== null
  );

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
        {onClear && hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Clear all
          </button>
        )}
      </div>

      {filters.map((filter) => (
        <div key={filter.key}>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {filter.label}
          </h4>
          <div className="space-y-2">
            {filter.options.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type={filter.type === 'radio' ? 'radio' : 'checkbox'}
                  name={filter.key}
                  checked={
                    activeFilters[filter.key] === option.value ||
                    (Array.isArray(activeFilters[filter.key]) &&
                      activeFilters[filter.key].includes(option.value))
                  }
                  onChange={() => onFilterChange(filter.key, option.value)}
                  className="h-4 w-4 text-primary-600 border-gray-300 dark:border-gray-600 
                             rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 
                                 group-hover:text-gray-900 dark:group-hover:text-gray-200 
                                 transition-colors">
                  {option.label}
                </span>
                {option.count !== undefined && (
                  <span className="text-xs text-gray-400 ml-auto">({option.count})</span>
                )}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* Mobile trigger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden inline-flex items-center gap-2 px-4 py-3 rounded-xl border 
                   border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 
                   text-gray-700 dark:text-gray-300 text-sm font-medium
                   hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Filter className="w-4 h-4" />
        Filters
        {hasActiveFilters && (
          <span className="w-2 h-2 rounded-full bg-primary-600" />
        )}
      </button>

      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-xl border 
                        border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          {content}
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 
                          shadow-xl z-50 overflow-y-auto animate-slide-in-right">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">{content}</div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setMobileOpen(false)}
                className="w-full px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg 
                           hover:bg-primary-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}