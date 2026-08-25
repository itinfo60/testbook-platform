import { useState } from 'react';
import { Filter, X, ChevronDown, ChevronRight } from 'lucide-react';
function FilterOptionItem({
  option,
  filter,
  activeFilters,
  onFilterChange,
  expandedNodes,
  toggleExpand,
  level = 0,
}) {
  const hasChildren = option.children && option.children.length > 0;
  const isExpanded = expandedNodes[option.value];
  const isChecked =
    activeFilters[filter.key] === option.value ||
    (Array.isArray(activeFilters[filter.key]) && activeFilters[filter.key].includes(option.value));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 group">
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => toggleExpand(e, option.value)}
            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}
        <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
          <input
            type={filter.type === 'radio' ? 'radio' : 'checkbox'}
            name={filter.key}
            checked={isChecked}
            onChange={() => onFilterChange(filter.key, option.value)}
            className={`text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 transition-colors ${
              level === 0 ? 'h-4 w-4' : 'h-3.5 w-3.5'
            }`}
          />
          <span
            className={`truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors ${
              level === 0
                ? 'text-sm font-semibold text-gray-800 dark:text-gray-200'
                : level === 1
                  ? 'text-[13px] font-medium text-gray-700 dark:text-gray-300'
                  : 'text-xs text-gray-600 dark:text-gray-400'
            }`}
          >
            {option.label}
          </span>
          {option.count !== undefined && (
            <span className="text-xs font-medium text-gray-400 ml-auto bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full shrink-0">
              {option.count}
            </span>
          )}
        </label>
      </div>

      {hasChildren && isExpanded && (
        <div className="pl-6 space-y-2 relative before:absolute before:left-3 before:top-0 before:bottom-2 before:w-[1.5px] before:bg-gray-200 dark:before:bg-gray-700">
          {option.children.map((child) => (
            <FilterOptionItem
              key={child.value}
              option={child}
              filter={filter}
              activeFilters={activeFilters}
              onFilterChange={onFilterChange}
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FilterSidebar({
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClear,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState({});

  const toggleExpand = (e, val) => {
    e.preventDefault();
    setExpandedNodes((prev) => ({ ...prev, [val]: !prev[val] }));
  };

  const hasActiveFilters = Object.values(activeFilters).some(
    (v) => v !== '' && v !== undefined && v !== null
  );

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
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
          <h3 className="text-[15px] font-bold text-gray-900 dark:text-white mb-4">
            {filter.label}
          </h3>
          <div className="space-y-3">
            {filter.options.map((option) => (
              <FilterOptionItem
                key={option.value}
                option={option}
                filter={filter}
                activeFilters={activeFilters}
                onFilterChange={onFilterChange}
                expandedNodes={expandedNodes}
                toggleExpand={toggleExpand}
                level={0}
              />
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
        {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary-600" />}
      </button>

      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div
          className="sticky top-24 bg-white dark:bg-gray-800 rounded-xl border 
                        border-gray-200 dark:border-gray-700 p-5 shadow-sm"
        >
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
          <div
            className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 
                          shadow-xl z-50 overflow-y-auto animate-slide-in-right"
          >
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
