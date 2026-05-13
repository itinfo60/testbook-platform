export default function ProgressBar({ value = 0, max = 100, size = 'md', showLabel = true, color = 'primary', className = '' }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  const sizes = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
  const colors = {
    primary: 'bg-primary-600',
    success: 'bg-secondary-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    accent: 'bg-accent-500',
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-dark-600 dark:text-dark-400">{Math.round(percent)}% complete</span>
        </div>
      )}
      <div className={`${sizes[size]} bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden`}>
        <div
          className={`${sizes[size]} ${colors[color]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
