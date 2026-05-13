import CourseCard from '@/features/course/components/CourseCard';
import CourseCardSkeleton from '@/components/skeleton/CourseCardSkeleton';
export default function CourseGrid({ courses, loading, emptyMessage = 'No courses found' }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <CourseCardSkeleton count={6} />
      </div>
    );
  }

  if (!courses?.length) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">{emptyMessage}</h3>
        <p className="text-dark-500 dark:text-dark-400">Try adjusting your filters or search query</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map(course => (
        <CourseCard key={course._id} course={course} />
      ))}
    </div>
  );
}
