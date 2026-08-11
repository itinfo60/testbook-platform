import { HiArrowRight, HiBookOpen, HiAcademicCap } from 'react-icons/hi';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProgressBar from '@/components/common/ProgressBar';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyEnrollments } from '@/features/enrollment/enrollmentSlice';

export default function MyCourses() {
  const dispatch = useDispatch();
  const { enrollments, loading } = useSelector((state) => state.enrollments);

  useEffect(() => {
    dispatch(fetchMyEnrollments());
  }, [dispatch]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-dark-900 dark:text-white font-display">
            My Enrollments
          </h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">
            Track your progress and resume active batches.
          </p>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-white dark:bg-dark-900 p-8 sm:p-16 rounded-3xl border border-dashed border-slate-300 dark:border-dark-700 text-center shadow-sm">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-xl font-extrabold text-dark-900 dark:text-white mb-2">
            You haven't purchased any courses yet
          </h2>
          <p className="text-slate-500 mb-6 text-sm sm:text-base font-medium">
            Start your preparation by enrolling in a targeted batch.
          </p>
          <Link
            to="/courses"
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-3 rounded-xl transition-colors inline-block shadow-md"
          >
            Explore Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {enrollments.map((enrollment) => {
            const course = enrollment.course || {};
            const progress = enrollment.progressPercentage ?? enrollment.progress ?? 0;

            return (
              <Link
                key={enrollment._id}
                to={`/courses/${course._id}/learn`}
                className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden group flex flex-col"
              >
                <div className="h-44 bg-slate-100 dark:bg-dark-800 overflow-hidden relative">
                  {course.thumbnail?.url || course.thumbnail ? (
                    <img
                      src={course.thumbnail?.url || course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-dark-800 text-slate-300 text-5xl">
                      <HiAcademicCap />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-dark-900 dark:text-white line-clamp-2 mb-4 group-hover:text-amber-500 transition-colors">
                      {course.title}
                    </h3>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Progress
                      </span>
                      <span className="text-xs font-bold text-amber-500">{progress}%</span>
                    </div>
                    <ProgressBar value={progress} size="sm" className="mb-4" color="bg-amber-500" />

                    <button className="w-full bg-slate-50 dark:bg-dark-800 hover:bg-amber-50 dark:hover:bg-amber-900/30 text-slate-700 dark:text-slate-300 hover:text-amber-600 font-bold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 border border-slate-200 dark:border-dark-700 hover:border-amber-200 dark:hover:border-amber-800">
                      {progress >= 100 ? 'Review Course' : 'Resume Learning'}{' '}
                      <HiArrowRight className="h-4 w-4" />
                    </button>
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
