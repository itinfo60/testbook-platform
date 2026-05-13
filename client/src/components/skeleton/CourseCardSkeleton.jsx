export default function CourseCardSkeleton({ count = 1 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card overflow-hidden animate-pulse">
          <div className="skeleton h-44 w-full" />
          <div className="p-5 space-y-3">
            <div className="skeleton h-3 w-20 rounded-full" />
            <div className="skeleton h-5 w-full rounded" />
            <div className="skeleton h-3 w-4/5 rounded" />
            <div className="flex items-center gap-2">
              <div className="skeleton h-4 w-4 rounded-full" />
              <div className="skeleton h-3 w-24 rounded" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="skeleton h-5 w-16 rounded" />
              <div className="skeleton h-3 w-12 rounded" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
