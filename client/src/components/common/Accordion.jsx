import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiChevronDown } from 'react-icons/hi';

export default function Accordion({
  items,
  allowMultiple = false,
  defaultOpenIndex = 0,
  className = '',
}) {
  const [openItems, setOpenItems] = useState(
    defaultOpenIndex !== null && defaultOpenIndex !== undefined ? [defaultOpenIndex] : []
  );

  const toggle = (index) => {
    if (allowMultiple) {
      setOpenItems((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setOpenItems((prev) => (prev.includes(index) ? [] : [index]));
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item, index) => (
        <div
          key={index}
          className="border border-dark-100 dark:border-dark-700 rounded-xl overflow-hidden"
        >
          <button
            onClick={() => toggle(index)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-dark-50 dark:hover:bg-dark-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {item.icon && (
                <span className="text-primary-600 dark:text-primary-400">{item.icon}</span>
              )}
              <div>
                <span className="font-medium text-dark-900 dark:text-white">{item.title}</span>
                {item.subtitle && <p className="text-xs text-dark-500 mt-0.5">{item.subtitle}</p>}
              </div>
            </div>
            <HiChevronDown
              className={`h-5 w-5 text-dark-400 transition-transform duration-200 ${openItems.includes(index) ? 'rotate-180' : ''}`}
            />
          </button>
          <AnimatePresence>
            {openItems.includes(index) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-5 pb-4 text-dark-600 dark:text-dark-400">{item.content}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
