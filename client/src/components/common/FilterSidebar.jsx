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
  showTitle = true,
  className = '',
}) {
  const [expandedNodes, setExpandedNodes] = useState({});

  const toggleExpand = (e, val) => {
    e.preventDefault();
    setExpandedNodes((prev) => ({ ...prev, [val]: !prev[val] }));
  };

  const hasActiveFilters = Object.values(activeFilters).some((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== '' && v !== undefined && v !== null;
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-dark-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Filters</h2>
          {onClear && hasActiveFilters && (
            <button
              onClick={onClear}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {filters.map((filter) => (
        <div key={filter.key} className="space-y-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-wide">
            {filter.label}
          </h3>
          <div className="space-y-2">
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
}
