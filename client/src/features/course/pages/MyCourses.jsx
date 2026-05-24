import { HiArrowRight } from 'react-icons/hi';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProgressBar from '@/components/common/ProgressBar';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyEnrollments } from '@/features/enrollment/enrollmentSlice';

export default function MyCourses() {
  const dispatch = useDispatch();
  const { enrollments, loading } = useSelector(state => state.enrollments);

  useEffect(() => {
    dispatch(fetchMyEnrollments());
  }, [dispatch]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="section-title mb-8">My Courses</h1>

      {enrollments.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-2">No courses yet</h2>
          <p className="text-dark-500 mb-6">Enroll in a course to start learning</p>
          <Link to="/courses" className="btn-primary">Browse Courses</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map(enrollment => {
            const course = enrollment.course || {};
            const progress = enrollment.progress || 0;

            return (
              <Link key={enrollment._id} to={`/courses/${course._id}/learn`} className="card-hover overflow-hidden group">
                <div className="h-40 bg-dark-100 dark:bg-dark-700 overflow-hidden">
                  {(course.thumbnail?.url || course.thumbnail) ? (
                    <img src={course.thumbnail?.url || course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 text-white text-4xl">📘</div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-dark-900 dark:text-white line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
                    {course.title}
                  </h3>
                  <ProgressBar value={progress} size="md" className="mb-3" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-dark-400">{progress === 100 ? 'Completed ✅' : 'In Progress'}</span>
                    <span className="text-sm text-primary-600 dark:text-primary-400 flex items-center gap-1 font-medium">
                      Continue <HiArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
