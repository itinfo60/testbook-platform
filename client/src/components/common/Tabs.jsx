import { useState } from 'react';

export default function Tabs({ tabs, activeTab, onChange, className = '' }) {
  const [active, setActive] = useState(activeTab || tabs[0]?.key);

  const handleChange = (key) => {
    setActive(key);
    if (onChange) onChange(key);
  };

  const currentKey = activeTab || active;

  return (
    <div className={className}>
      <div className="flex gap-2 p-1.5 bg-[#F8FAFC] dark:bg-dark-900 border border-dark-100 dark:border-dark-800 rounded-[16px] overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleChange(tab.key)}
            className={`flex items-center flex-shrink-0 px-6 py-3 text-[15px] font-bold rounded-xl transition-all duration-300 ${
              currentKey === tab.key
                ? 'bg-white dark:bg-dark-800 text-[#172554] dark:text-white shadow-sm border border-dark-100 dark:border-dark-700'
                : 'text-dark-500 dark:text-dark-400 hover:text-dark-800 dark:hover:text-dark-200 hover:bg-dark-50 dark:hover:bg-dark-800/50 border border-transparent'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`ml-2 px-2 py-0.5 text-[11px] font-extrabold rounded-full transition-colors ${
                  currentKey === tab.key
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                    : 'bg-dark-200 text-dark-600 dark:bg-dark-800 dark:text-dark-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
