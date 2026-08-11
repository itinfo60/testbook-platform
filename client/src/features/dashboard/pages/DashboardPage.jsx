import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  HiBookOpen,
  HiClipboardList,
  HiAcademicCap,
  HiTrendingUp,
  HiArrowRight,
  HiHeart,
  HiDownload,
  HiChartBar,
} from 'react-icons/hi';
import { useAuth } from '@/hooks/useAuth';
import { fetchMyEnrollments } from '@/features/enrollment/enrollmentSlice';
import DashboardSkeleton from '@/components/skeleton/DashboardSkeleton';
import ProgressBar from '@/components/common/ProgressBar';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { enrollments, loading } = useSelector((state) => state.enrollments);

  useEffect(() => {
    dispatch(fetchMyEnrollments());
  }, [dispatch]);

  if (loading) return <DashboardSkeleton />;

  const completedEnrollments = enrollments.filter(
    (e) => e.status === 'completed' || (e.progressPercentage ?? e.progress ?? 0) >= 100
  );

  const stats = [
    {
      icon: HiBookOpen,
      label: 'Enrolled Courses',
      value: enrollments.length,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30',
      link: '/my-courses',
    },
    {
      icon: HiClipboardList,
      label: 'Tests Taken',
      value: user?.testsAttempted || 0,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
      link: '/my-test-attempts',
    },
    {
      icon: HiTrendingUp,
      label: 'Average Score',
      value: (user?.averageScore || 0) + '%',
      color: 'text-green-600 bg-green-50 dark:bg-green-900/30',
      link: '/achievements',
    },
    {
      icon: HiAcademicCap,
      label: 'Best Score',
      value: (user?.bestScore || 0) + '%',
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30',
      link: '/leaderboard',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-dark-900 dark:text-white font-display">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">
          Ready to conquer your exams? Let's continue your learning journey.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.link}
            className="bg-white dark:bg-dark-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-dark-800 hover:shadow-md transition-shadow group"
          >
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${stat.color} group-hover:scale-110 transition-transform`}
            >
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-extrabold text-dark-900 dark:text-white mb-0.5">
              {stat.value}
            </div>
            <div className="text-sm font-medium text-slate-500">{stat.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-dark-900 dark:text-white">
              Continue Learning
            </h2>
            <Link
              to="/my-courses"
              className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline"
            >
              View All <HiArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="bg-white dark:bg-dark-900 p-8 rounded-3xl border border-dashed border-slate-300 dark:border-dark-700 text-center shadow-sm">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-lg font-extrabold text-dark-900 dark:text-white mb-2">
                You haven't purchased any courses yet.
              </h3>
              <p className="text-slate-500 text-sm mb-6 font-medium">
                Start your preparation by enrolling in a targeted batch.
              </p>
              <Link
                to="/courses"
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl transition-colors inline-block text-sm"
              >
                Explore Courses
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.slice(0, 4).map((enrollment) => {
                const course = enrollment.course || {};
                const progress = enrollment.progressPercentage || 0;
                const thumbnailUrl =
                  course.thumbnail?.url ||
                  (typeof course.thumbnail === 'string' ? course.thumbnail : null);

                return (
                  <Link
                    key={enrollment._id}
                    to={`/courses/${course._id}/learn`}
                    className="bg-white dark:bg-dark-900 flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <div className="h-16 w-24 sm:h-20 sm:w-28 rounded-xl bg-slate-100 dark:bg-dark-800 flex-shrink-0 overflow-hidden relative">
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          📘
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm sm:text-base text-dark-900 dark:text-white truncate mb-2">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <ProgressBar
                            value={progress}
                            size="sm"
                            className="w-full"
                            color="bg-amber-500"
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-500 w-10 text-right">
                          {progress}%
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:flex h-10 w-10 rounded-full bg-slate-50 dark:bg-dark-800 items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors flex-shrink-0">
                      <HiArrowRight className="h-5 w-5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity / Certificates */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-dark-900 dark:text-white">
              Recent Activity
            </h2>
          </div>

          <div className="bg-white dark:bg-dark-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-dark-800 h-[calc(100%-2.5rem)]">
            <div className="space-y-4">
              {enrollments && enrollments.length > 0 ? (
                enrollments.slice(0, 3).map((enrollment, idx) => (
                  <div key={enrollment._id || idx} className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 flex-shrink-0 mt-0.5">
                      <HiAcademicCap className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-dark-900 dark:text-white">
                        Enrolled in {enrollment.course?.title || 'Course'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        {enrollment.createdAt
                          ? new Date(enrollment.createdAt).toLocaleDateString()
                          : 'Recently'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm font-medium">No recent activity</p>
                </div>
              )}
            </div>

            {enrollments && enrollments.length > 0 && (
              <button className="w-full mt-6 py-2.5 rounded-xl border border-slate-200 dark:border-dark-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-800 transition-colors">
                View Full History
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Access: Progress Report, Bookmarks & Downloads ── */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: HiChartBar,
            label: 'Progress Report',
            desc: 'Test scores & performance history',
            path: '/my-test-attempts',
            color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
            gradient: 'from-blue-500 to-indigo-600',
          },
          {
            icon: HiHeart,
            label: 'Bookmarks & Wishlist',
            desc: 'Saved courses and materials',
            path: '/wishlist',
            color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/30',
            gradient: 'from-pink-500 to-rose-600',
          },
          {
            icon: HiDownload,
            label: 'Downloads',
            desc: 'Access your saved PDFs & notes',
            path: '/library',
            color: 'text-green-600 bg-green-50 dark:bg-green-900/30',
            gradient: 'from-green-500 to-emerald-600',
          },
        ].map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className="group bg-white dark:bg-dark-900 rounded-2xl p-5 border border-slate-200 dark:border-dark-800 hover:shadow-md transition-all flex items-center gap-4"
          >
            <div
              className={`h-12 w-12 rounded-2xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform flex-shrink-0`}
            >
              <item.icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-dark-900 dark:text-white text-sm">{item.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {item.desc}
              </p>
            </div>
            <HiArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
