export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card p-6">
            <div className="skeleton h-4 w-24 rounded mb-3" />
            <div className="skeleton h-8 w-16 rounded mb-2" />
            <div className="skeleton h-3 w-32 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="skeleton h-5 w-40 rounded mb-4" />
          <div className="skeleton h-48 w-full rounded" />
        </div>
        <div className="card p-6">
          <div className="skeleton h-5 w-40 rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="skeleton h-12 w-full rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
