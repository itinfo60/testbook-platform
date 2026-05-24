import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { HiBookOpen, HiClipboardList, HiAcademicCap, HiTrendingUp, HiArrowRight } from 'react-icons/hi';
import { useAuth } from '@/hooks/useAuth';
import { fetchMyEnrollments } from '@/features/enrollment/enrollmentSlice';
import { fetchMyBadges } from '@/features/achievement/achievementSlice';
import DashboardSkeleton from '@/components/skeleton/DashboardSkeleton';
import ProgressBar from '@/components/common/ProgressBar';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { enrollments, loading } = useSelector(state => state.enrollments);
  const { myBadges } = useSelector(state => state.achievements);

  useEffect(() => {
    dispatch(fetchMyEnrollments());
    dispatch(fetchMyBadges());
  }, [dispatch]);

  if (loading) return <DashboardSkeleton />;

  const stats = [
    { icon: HiBookOpen, label: 'Enrolled Courses', value: enrollments.length, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/30', link: '/my-courses' },
    { icon: HiClipboardList, label: 'Tests Taken', value: user?.testsAttempted || 0, color: 'text-accent-600 bg-accent-50 dark:bg-accent-900/30', link: '/my-test-attempts' },
    { icon: HiAcademicCap, label: 'Badges Earned', value: myBadges.length, color: 'text-secondary-600 bg-secondary-50 dark:bg-secondary-900/30', link: '/achievements' },
    { icon: HiTrendingUp, label: 'Current Streak', value: user?.streak || 0, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30', link: '/leaderboard' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-dark-900 dark:text-white">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-dark-500 mt-1">Let's continue your learning journey</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <Link key={stat.label} to={stat.link} className="card-hover p-5">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-dark-900 dark:text-white">{stat.value}</div>
            <div className="text-sm text-dark-500">{stat.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Continue Learning</h2>
            <Link to="/my-courses" className="text-sm text-primary-600 dark:text-primary-400 flex items-center gap-1">
              View All <HiArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-3">📚</div>
              <h3 className="font-semibold text-dark-900 dark:text-white mb-1">No courses yet</h3>
              <p className="text-dark-500 text-sm mb-4">Start learning by enrolling in a course</p>
              <Link to="/courses" className="btn-primary text-sm">Browse Courses</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.slice(0, 4).map(enrollment => {
                const course = enrollment.course || {};
                const progress = enrollment.progressPercentage || 0;
                const thumbnailUrl = course.thumbnail?.url || (typeof course.thumbnail === 'string' ? course.thumbnail : null);
                
                return (
                  <Link
                    key={enrollment._id}
                    to={`/courses/${course._id}/learn`}
                    className="card-hover flex items-center gap-3 sm:gap-4 p-3 sm:p-4"
                  >
                    <div className="h-14 w-20 sm:h-16 sm:w-24 rounded-lg bg-dark-100 dark:bg-dark-700 flex-shrink-0 overflow-hidden">
                      {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">📘</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-dark-900 dark:text-white truncate">{course.title}</h3>
                      <ProgressBar value={progress} size="sm" className="mt-2" />
                    </div>
                    <HiArrowRight className="h-4 w-4 text-dark-400 flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Achievements */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Recent Badges</h2>
            <Link to="/achievements" className="text-sm text-primary-600 dark:text-primary-400 flex items-center gap-1">
              View All <HiArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="card p-5">
            {myBadges.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">🏅</div>
                <p className="text-sm text-dark-400">Complete courses and tests to earn badges!</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {myBadges.slice(0, 6).map((badge, i) => (
                  <div key={badge._id || i} className="text-center">
                    <div className="text-3xl mb-1">{badge.icon || '🏅'}</div>
                    <p className="text-xs text-dark-500 truncate">{badge.name || badge.badge?.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
