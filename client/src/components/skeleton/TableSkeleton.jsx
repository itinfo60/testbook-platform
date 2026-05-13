export default function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="p-4 border-b dark:border-dark-700">
        <div className="skeleton h-5 w-48 rounded" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: cols }, (_, j) => (
              <div key={j} className="skeleton h-4 flex-1 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
