import SeoHead from '@/components/SeoHead';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  HiAcademicCap,
  HiArrowRight,
  HiBookOpen,
  HiCalendar,
  HiChartBar,
  HiChevronRight,
  HiClipboardList,
  HiDownload,
  HiExternalLink,
  HiHeart,
  HiLightningBolt,
  HiPlay,
  HiShoppingCart,
  HiSparkles,
  HiTrendingUp,
  HiVideoCamera,
} from 'react-icons/hi';
import { useAuth } from '@/hooks/useAuth';
import { fetchMyEnrollments } from '@/features/enrollment/enrollmentSlice';
import { fetchWishlist } from '@/features/wishlist/wishlistSlice';
import DashboardSkeleton from '@/components/skeleton/DashboardSkeleton';
import ProgressBar from '@/components/common/ProgressBar';
import ErrorState from '@/components/ErrorState';
import toast from 'react-hot-toast';
import { useMemo, useState } from 'react';
import { testAPI, enrollmentAPI, liveClassAPI, quizAPI } from '@/services/api';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { enrollments, loading } = useSelector((state) => state.enrollments);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    dispatch(fetchMyEnrollments());
    dispatch(fetchWishlist());

    const loadDetails = async () => {
      try {
        const [attemptsRes, ordersRes, liveRes, quizRes] = await Promise.allSettled([
          testAPI.getMyAttempts({ limit: 6 }),
          enrollmentAPI.getOrderHistory
            ? enrollmentAPI.getOrderHistory({ limit: 6 })
            : Promise.resolve({ data: [] }),
          liveClassAPI.getUpcoming
            ? liveClassAPI.getUpcoming({ limit: 4 })
            : Promise.resolve({ data: [] }),
          quizAPI.getAll ? quizAPI.getAll({ limit: 4 }) : Promise.resolve({ data: [] }),
        ]);

        if (attemptsRes.status === 'fulfilled') {
          const attempts =
            attemptsRes.value.data?.data?.attempts ||
            attemptsRes.value.data?.data ||
            attemptsRes.value.data?.attempts ||
            [];
          setRecentAttempts(Array.isArray(attempts) ? attempts : []);
        }

        if (ordersRes.status === 'fulfilled') {
          const ords =
            ordersRes.value.data?.data?.enrollments ||
            ordersRes.value.data?.data?.orders ||
            ordersRes.value.data?.data ||
            [];
          setOrders(Array.isArray(ords) ? ords : []);
        }

        if (liveRes.status === 'fulfilled') {
          const lives =
            liveRes.value.data?.data?.liveClasses ||
            liveRes.value.data?.data ||
            liveRes.value.data?.classes ||
            [];
          setLiveClasses(Array.isArray(lives) ? lives : []);
        }

        if (quizRes.status === 'fulfilled') {
          const qzs =
            quizRes.value.data?.data?.quizzes ||
            quizRes.value.data?.data ||
            quizRes.value.data?.quizzes ||
            [];
          setQuizzes(Array.isArray(qzs) ? qzs : []);
        }
      } catch (err) {
        setError(err.message || 'Failed to load some dashboard items');
        toast.error('Failed to load dashboard data');
      }
    };

    loadDetails();
  }, [dispatch]);

  // Primary active course to resume
  const primaryEnrollment = useMemo(() => {
    if (!enrollments || enrollments.length === 0) return null;
    const inProgress = enrollments.find((e) => (e.progressPercentage || 0) < 100);
    return inProgress || enrollments[0];
  }, [enrollments]);

  const primaryCourseData = useMemo(() => {
    if (!primaryEnrollment?.course) return null;
    const course = primaryEnrollment.course;
    const courseSlug = course.slug || course._id;
    const progressPct = primaryEnrollment.progressPercentage || 0;
    const totalLessons = course.totalLessons || 24;
    const completedCount = Math.round((progressPct / 100) * totalLessons);

    return {
      course,
      courseSlug,
      progressPct,
      totalLessons,
      completedCount,
      teacherName: course.teacher?.name || 'Subject Expert',
      learnUrl: `/courses/${courseSlug}/learn`,
    };
  }, [primaryEnrollment]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  // 6 Top Navigation Cards
  const hubModules = [
    {
      id: 'courses',
      icon: HiBookOpen,
      label: 'Courses',
      value: `${enrollments.length}`,
      sub: 'Enrolled courses',
      color: 'text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30',
      tagColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
      link: '#courses-section',
    },
    {
      id: 'tests',
      icon: HiClipboardList,
      label: 'Tests',
      value: `${recentAttempts.length || user?.testsAttempted || 0}`,
      sub: 'Attempts & rank',
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
      tagColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
      link: '#tests-section',
    },
    {
      id: 'quizzes',
      icon: HiLightningBolt,
      label: 'Quizzes',
      value: quizzes.length > 0 ? `${quizzes.length}` : 'Daily',
      sub: 'Speed challenges',
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30',
      tagColor: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300',
      link: '#quizzes-section',
    },
    {
      id: 'live',
      icon: HiVideoCamera,
      label: 'Live Classes',
      value: liveClasses.length > 0 ? `${liveClasses.length} Scheduled` : 'Live Batches',
      sub: 'Interactive room',
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30',
      tagColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
      link: '#live-classes-section',
    },
    {
      id: 'wishlist',
      icon: HiHeart,
      label: 'Wishlist',
      value: `${wishlistItems?.length || 0}`,
      sub: 'Saved items',
      color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/30',
      tagColor: 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300',
      link: '#wishlist-section',
    },
    {
      id: 'orders',
      icon: HiShoppingCart,
      label: 'Orders',
      value: orders.length > 0 ? `${orders.length} Invoices` : '0 Invoices',
      sub: 'Billing history',
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
      tagColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
      link: '#orders-section',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <SeoHead
        title="Student Learning Console — EduPortal"
        description="Your unified student dashboard for courses, tests, daily quizzes, live classes, wishlist, and orders."
      />

      {/* ══════════════════════════════════════════════════════════════
          1. WELCOME HERO & QUICK JUMP
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-white via-slate-50/50 to-amber-50/30 dark:from-dark-900 dark:via-dark-900 dark:to-amber-950/20 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-dark-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-500 dark:text-amber-400 text-xs font-black uppercase tracking-wider">
              <HiSparkles className="h-3.5 w-3.5" /> Learner Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-dark-900 dark:text-white">
              Welcome back, {user?.name?.split(' ')[0] || 'Student'} 👋
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium">
              Everything in your learning portal is organized below for quick access.
            </p>
          </div>

          {/* Quick Primary Course Continue Banner if enrolled */}
          {primaryCourseData && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl p-4 sm:p-5 border border-amber-200/70 dark:border-amber-900/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-lg w-full">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-500 dark:text-amber-400 flex items-center gap-1 mb-1">
                  <HiPlay className="h-3 w-3" /> Resume Learning
                </span>
                <h3 className="font-bold text-xs sm:text-sm text-dark-900 dark:text-white truncate">
                  {primaryCourseData.course.title}
                </h3>
                <div className="mt-2 space-y-1">
                  <ProgressBar
                    value={primaryCourseData.progressPct}
                    size="sm"
                    color="bg-amber-500"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 font-semibold">
                    <span>
                      {primaryCourseData.completedCount}/{primaryCourseData.totalLessons} Lessons
                    </span>
                    <span>{primaryCourseData.progressPct}%</span>
                  </div>
                </div>
              </div>

              <Link
                to={primaryCourseData.learnUrl}
                className="bg-amber-800 hover:bg-amber-900 text-white font-extrabold px-4 py-2.5 rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-1.5 flex-shrink-0"
              >
                Continue <HiArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          2. TOP 6 CORE MODULE TILES (SMOOTH ANCHOR NAV)
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {hubModules.map((mod) => (
          <a
            key={mod.label}
            href={mod.link}
            className="bg-white dark:bg-dark-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-dark-800 hover:shadow-md hover:-translate-y-1 hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-200 group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center ${mod.color}`}
                >
                  <mod.icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-amber-500 transition-colors">
                  ↓
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-dark-900 dark:text-white mb-0.5 truncate">
                {mod.value}
              </div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {mod.label}
              </div>
            </div>
            <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-2 truncate font-medium flex items-center justify-between">
              <span>{mod.sub}</span>
            </div>
          </a>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          3. COURSES DETAIL SECTION
      ══════════════════════════════════════════════════════════════ */}
      <div id="courses-section" className="space-y-4 scroll-mt-24">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-dark-800">
          <div>
            <h2 className="text-xl font-black tracking-tight text-dark-900 dark:text-white flex items-center gap-2">
              <HiBookOpen className="h-6 w-6 text-amber-500" /> My Enrolled Courses (
              {enrollments.length})
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Continue your video lessons, syllabus tracking & course modules
            </p>
          </div>
          <Link
            to="/my-courses"
            className="text-xs font-bold text-amber-700 dark:text-amber-500 hover:underline flex items-center gap-1"
          >
            View All Courses <HiChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <div className="bg-white dark:bg-dark-900 p-8 rounded-3xl border border-dashed border-slate-200 dark:border-dark-700 text-center shadow-sm">
            <div className="text-4xl mb-2">📚</div>
            <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">
              You have not enrolled in any courses yet.
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
              Explore our expert-guided target batches and syllabus courses.
            </p>
            <Link
              to="/courses"
              className="mt-4 inline-block bg-amber-800 hover:bg-amber-900 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md"
            >
              Browse Course Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.map((enrollment) => {
              const course = enrollment.course || {};
              const courseSlug = course.slug || course._id || enrollment._id;
              const title = course.title || 'Untitled Course';
              const instructor = course.teacher?.name || 'Subject Expert';
              const progressPct = enrollment.progressPercentage || 0;
              const totalLessons = course.totalLessons || 24;
              const completedCount = Math.round((progressPct / 100) * totalLessons);

              const thumbnailUrl =
                course.thumbnail?.url ||
                (typeof course.thumbnail === 'string' ? course.thumbnail : null);

              const learnUrl = `/courses/${courseSlug}/learn`;

              return (
                <div
                  key={enrollment.id || enrollment._id}
                  className="bg-white dark:bg-dark-900 p-5 rounded-3xl border border-slate-200 dark:border-dark-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-16 w-20 rounded-2xl bg-amber-50 dark:bg-dark-800 flex-shrink-0 overflow-hidden relative border border-slate-100 dark:border-dark-700">
                        {thumbnailUrl ? (
                          <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            📘
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3
                          className="font-bold text-sm text-dark-900 dark:text-white truncate mb-0.5"
                          title={title}
                        >
                          {title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                          By {instructor}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] font-semibold text-slate-500">
                          <span>📚 {totalLessons} Lessons</span>
                          <span>·</span>
                          <span>📝 Practice Tests</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500">
                          {completedCount}/{totalLessons} Complete
                        </span>
                        <span className="text-amber-700 dark:text-amber-500">{progressPct}%</span>
                      </div>
                      <ProgressBar value={progressPct} size="sm" color="bg-amber-500" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={learnUrl}
                      className="flex-1 bg-amber-800 hover:bg-amber-900 text-white font-extrabold py-2.5 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <HiPlay className="h-3.5 w-3.5" /> Continue Course
                    </Link>
                    <Link
                      to={`/courses/${courseSlug}`}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 text-slate-600 dark:text-slate-300 text-xs"
                      title="Course Details"
                    >
                      <HiExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          4. TESTS DETAIL SECTION
      ══════════════════════════════════════════════════════════════ */}
      <div id="tests-section" className="space-y-4 scroll-mt-24">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-dark-800">
          <div>
            <h2 className="text-xl font-black tracking-tight text-dark-900 dark:text-white flex items-center gap-2">
              <HiClipboardList className="h-6 w-6 text-blue-500" /> Mock Tests & Performance
              Scorecards
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Review detailed solution analytics, rank cards, and attempt fresh mock tests
            </p>
          </div>
          <Link
            to="/my-test-attempts"
            className="text-xs font-bold text-amber-700 dark:text-amber-500 hover:underline flex items-center gap-1"
          >
            All Scorecards <HiChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentAttempts.length > 0 ? (
            recentAttempts.slice(0, 3).map((attempt) => (
              <div
                key={attempt.id || attempt._id}
                className="bg-white dark:bg-dark-900 p-5 rounded-3xl border border-slate-200 dark:border-dark-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {attempt.completedAt
                        ? new Date(attempt.completedAt).toLocaleDateString()
                        : 'Recent Test Attempt'}
                    </span>
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-black text-xs rounded-lg">
                      Score: {attempt.score ?? attempt.percentage ?? 0}%
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-dark-900 dark:text-white mb-2 line-clamp-1">
                    {attempt.test?.title || attempt.testSeries?.title || 'Mock Examination'}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold mb-4">
                    <span>🎯 {attempt.answers?.length || 50} Questions</span>
                    <span>·</span>
                    <span>⏱️ {Math.round((attempt.timeTaken || 1800) / 60)} Mins</span>
                    <span>·</span>
                    <span
                      className={
                        attempt.isPassed
                          ? 'text-emerald-600 font-bold'
                          : 'text-amber-700 dark:text-amber-500 font-bold'
                      }
                    >
                      {attempt.isPassed ? 'Passed' : 'Evaluated'}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/tests/${attempt.test?.id || attempt.test?._id || attempt.testId || attempt.test || attempt.id || attempt._id}/result`}
                  className="w-full bg-blue-50 hover:bg-blue-600 hover:text-white dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold py-2.5 px-4 rounded-xl transition-all text-xs text-center flex items-center justify-center gap-1"
                >
                  View Solution & Scorecard →
                </Link>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white dark:bg-dark-900 p-6 rounded-3xl border border-slate-200 dark:border-dark-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm text-dark-900 dark:text-white">
                  Attempt your first full-length Mock Test
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Practice full-length test series on official RPSC/Rajasthan exam patterns
                </p>
              </div>
              <Link
                to="/test-series"
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs flex-shrink-0 shadow-md"
              >
                Browse Test Series Catalog
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          5. QUIZZES DETAIL SECTION
      ══════════════════════════════════════════════════════════════ */}
      <div id="quizzes-section" className="space-y-4 scroll-mt-24">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-dark-800">
          <div>
            <h2 className="text-xl font-black tracking-tight text-dark-900 dark:text-white flex items-center gap-2">
              <HiLightningBolt className="h-6 w-6 text-orange-500" /> Daily Quizzes & Speed Practice
              Drills
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Timed 10-minute topic challenges with instant negative marking & solutions
            </p>
          </div>
          <Link
            to="/daily-quiz"
            className="text-xs font-bold text-amber-700 dark:text-amber-500 hover:underline flex items-center gap-1"
          >
            Today's Quiz Hub <HiChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {quizzes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.slice(0, 3).map((quiz, index) => (
              <div
                key={quiz.id || quiz._id}
                className={`${index === 0 ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white relative overflow-hidden' : 'bg-white dark:bg-dark-900'} p-5 rounded-3xl border ${index === 0 ? 'border-transparent' : 'border-slate-200 dark:border-dark-800'} shadow-sm flex flex-col justify-between`}
              >
                {index === 0 && (
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-lg"></div>
                )}
                <div>
                  <span
                    className={`${index === 0 ? 'bg-white/20 text-white' : 'bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-300'} text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md`}
                  >
                    {quiz.type === 'daily' ? "⚡ Today's Challenge" : 'Subject Quiz'}
                  </span>
                  <h3
                    className={`font-black text-lg mt-2 mb-1 ${index !== 0 ? 'text-dark-900 dark:text-white text-sm' : ''}`}
                  >
                    {quiz.title}
                  </h3>
                  <p
                    className={`text-xs ${index === 0 ? 'text-amber-100' : 'text-slate-600 dark:text-slate-400'} mb-3 line-clamp-2`}
                  >
                    {quiz.description || 'Practice quiz with instant solutions'}
                  </p>
                  <div
                    className={`flex items-center gap-3 text-xs font-bold ${index === 0 ? 'text-amber-100' : 'text-slate-500'} mb-4`}
                  >
                    <span>⏱️ {quiz.duration || 10} Min</span>
                    <span>·</span>
                    <span>🎯 {quiz.questions?.length || 10} Qs</span>
                  </div>
                </div>
                <Link
                  to={`/quiz/${quiz.id || quiz._id}`}
                  className={`${index === 0 ? 'bg-white text-orange-600 hover:bg-amber-50' : 'bg-slate-100 dark:bg-dark-800 hover:bg-orange-500 hover:text-white'} font-black py-2.5 px-4 rounded-xl text-center text-xs shadow-md transition-all`}
                >
                  Start Quiz →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-900 p-6 rounded-3xl border border-slate-200 dark:border-dark-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-dark-900 dark:text-white">Daily Quizzes</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                No active quizzes at the moment. Check back later!
              </p>
            </div>
            <Link
              to="/daily-quiz"
              className="bg-amber-800 hover:bg-amber-900 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs flex-shrink-0 shadow-md"
            >
              View Quiz Hub
            </Link>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          6. LIVE CLASSES DETAIL SECTION
      ══════════════════════════════════════════════════════════════ */}
      <div id="live-classes-section" className="space-y-4 scroll-mt-24">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-dark-800">
          <div>
            <h2 className="text-xl font-black tracking-tight text-dark-900 dark:text-white flex items-center gap-2">
              <HiVideoCamera className="h-6 w-6 text-rose-500" /> Live Interactive Classes &
              Mentorship
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Join interactive live classrooms, ask live doubts to teachers, and access recordings
            </p>
          </div>
          <Link
            to="/live-classes"
            className="text-xs font-bold text-amber-700 dark:text-amber-500 hover:underline flex items-center gap-1"
          >
            All Live Classes <HiChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveClasses.length > 0 ? (
            liveClasses.map((lc) => (
              <div
                key={lc.id || lc._id}
                className="bg-white dark:bg-dark-900 p-5 rounded-3xl border border-slate-200 dark:border-dark-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>{' '}
                      Live Broadcast
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
                      <HiCalendar className="h-3.5 w-3.5" />{' '}
                      {lc.scheduledAt
                        ? new Date(lc.scheduledAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '7:00 PM'}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-dark-900 dark:text-white line-clamp-1 mb-1">
                    {lc.title || 'Live Session'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Mentor: {lc.teacher?.name || 'Subject Faculty'}
                  </p>
                </div>

                <Link
                  to={`/live-classes/${lc._id}/room`}
                  className="mt-4 w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-xs text-center flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <HiVideoCamera className="h-4 w-4" /> Enter Live Classroom
                </Link>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-dark-900 p-6 rounded-3xl border border-slate-200 dark:border-dark-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center text-2xl flex-shrink-0">
                  🎥
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-dark-900 dark:text-white">
                    Live Classes
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    No scheduled live classes found.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          7. WISHLIST DETAIL SECTION
      ══════════════════════════════════════════════════════════════ */}
      <div id="wishlist-section" className="space-y-4 scroll-mt-24">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-dark-800">
          <div>
            <h2 className="text-xl font-black tracking-tight text-dark-900 dark:text-white flex items-center gap-2">
              <HiHeart className="h-6 w-6 text-pink-500" /> Saved Wishlist Items (
              {wishlistItems?.length || 0})
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Target courses and test series saved for your upcoming exam cycle
            </p>
          </div>
          <Link
            to="/wishlist"
            className="text-xs font-bold text-amber-700 dark:text-amber-500 hover:underline flex items-center gap-1"
          >
            Manage Wishlist <HiChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {wishlistItems && wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlistItems.map((item, idx) => (
              <div
                key={
                  item.id ||
                  item._id ||
                  item.course?.id ||
                  item.course?._id ||
                  item.testSeries?.id ||
                  idx
                }
                className="bg-white dark:bg-dark-900 p-5 rounded-3xl border border-slate-200 dark:border-dark-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-bold text-sm text-dark-900 dark:text-white line-clamp-1 mb-1">
                    {item.course?.title || item.testSeries?.title || 'Saved Course/Test'}
                  </h3>
                  <p className="text-xs text-amber-700 dark:text-amber-500 font-black mb-3">
                    ₹
                    {item.course?.effectivePrice ||
                      item.course?.price ||
                      item.testSeries?.price ||
                      'Free'}
                  </p>
                </div>
                <Link
                  to={
                    item.course
                      ? `/checkout/${item.course.slug || item.course.id || item.course._id}`
                      : `/checkout/${item.testSeries?.slug || item.testSeries?.id || item.testSeries?._id}?type=test_series`
                  }
                  className="w-full bg-amber-800 hover:bg-amber-900 text-white font-bold py-2.5 px-4 rounded-xl text-center text-xs transition-colors shadow-sm"
                >
                  Enroll Now →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-900 p-8 rounded-3xl border border-dashed border-slate-200 dark:border-dark-700 text-center shadow-sm">
            <div className="text-3xl mb-2">💖</div>
            <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">
              Your wishlist is currently empty.
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
              Bookmark any course or mock test series to enroll later.
            </p>
            <Link
              to="/courses"
              className="mt-3 inline-block bg-amber-800 hover:bg-amber-900 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-sm"
            >
              Explore Courses & Mock Tests
            </Link>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          8. ORDERS DETAIL SECTION
      ══════════════════════════════════════════════════════════════ */}
      <div id="orders-section" className="space-y-4 scroll-mt-24">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-dark-800">
          <div>
            <h2 className="text-xl font-black tracking-tight text-dark-900 dark:text-white flex items-center gap-2">
              <HiShoppingCart className="h-6 w-6 text-emerald-500" /> Orders & Payment Invoices (
              {orders.length})
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              All successful course enrollments, test packages, and receipts
            </p>
          </div>
          <Link
            to="/orders"
            className="text-xs font-bold text-amber-700 dark:text-amber-500 hover:underline flex items-center gap-1"
          >
            All Invoices <HiChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-800 overflow-hidden shadow-sm">
          {orders.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-dark-800">
              {orders.map((ord) => (
                <div
                  key={ord.id || ord._id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-dark-800/50 transition-colors"
                >
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-dark-900 dark:text-white truncate">
                      {ord.course?.title ||
                        ord.test?.title ||
                        ord.testSeries?.title ||
                        'Course Enrollment'}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Enrolled:{' '}
                      {ord.enrolledAt ? new Date(ord.enrolledAt).toLocaleDateString() : 'Recent'} ·
                      Status: Active Course Access
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-sm text-dark-900 dark:text-white">
                      ₹{ord.amountPaid ?? 999}
                    </span>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg text-xs font-black">
                      Paid
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">No orders found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
