import { useState } from 'react';

export default function Tabs({ tabs, activeTab, onChange, className = '' }) {
  const [active, setActive] = useState(activeTab || tabs[0]?.key);

  const handleChange = key => {
    setActive(key);
    if (onChange) onChange(key);
  };

  const currentKey = activeTab || active;

  return (
    <div className={className}>
      <div className="flex gap-1 p-1 bg-dark-100 dark:bg-dark-800 rounded-xl overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleChange(tab.key)}
            className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              currentKey === tab.key
                ? 'bg-white dark:bg-dark-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-dark-300'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                currentKey === tab.key ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-dark-200 dark:bg-dark-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
