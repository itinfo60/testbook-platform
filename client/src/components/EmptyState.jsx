/**
 * EmptyState — unified empty state component
 *
 * Props:
 *  icon        string  — emoji or icon text
 *  title       string  — heading text
 *  description string  — supporting text
 *  action      node    — optional CTA button/link JSX
 */
export default function EmptyState({
  icon = '📭',
  title = 'Nothing here yet',
  description,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white dark:bg-dark-900 rounded-3xl border border-dashed border-slate-300 dark:border-dark-700 shadow-sm">
      <span className="text-5xl mb-4 select-none">{icon}</span>
      <h3 className="text-xl font-extrabold text-dark-900 dark:text-white mb-2">{title}</h3>
      {description && (
        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-sm leading-relaxed mb-6">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
