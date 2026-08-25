import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/utils';

const colorMap = {
  primary:
    'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50',
  emerald:
    'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50',
  amber:
    'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/50',
  cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/50',
  violet:
    'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/50',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50',
};

export default function StatsCard({
  title,
  label,
  value,
  icon: Icon,
  color = 'primary',
  change,
  subtitle,
  to,
  onClick,
}) {
  const displayTitle = title || label || '';
  const isInteractive = Boolean(to || onClick);

  const content = (
    <div
      onClick={onClick}
      className={cn(
        'card p-5 sm:p-6 transition-all duration-200 relative overflow-hidden flex flex-col justify-between h-full',
        isInteractive &&
          'group cursor-pointer hover:shadow-lg hover:border-primary-400 dark:hover:border-primary-500 hover:-translate-y-0.5'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <p className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 leading-tight">
              {displayTitle}
            </p>
            {isInteractive && (
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-all flex-shrink-0" />
            )}
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none break-words">
            {value}
          </div>
          {change !== undefined && (
            <p
              className={cn(
                'text-xs font-semibold flex items-center gap-1 pt-0.5',
                change >= 0 ? 'text-emerald-600' : 'text-rose-600'
              )}
            >
              <span>
                {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
              </span>
              <span className="text-gray-500 dark:text-gray-400 font-normal">vs last month</span>
            </p>
          )}
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed pt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              'p-3 sm:p-3.5 rounded-2xl shrink-0 transition-colors shadow-sm self-start',
              colorMap[color] || colorMap.primary
            )}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
          </div>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
