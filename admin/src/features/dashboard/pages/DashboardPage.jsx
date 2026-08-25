import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchDashboardStats } from '@/features/dashboard/dashboardSlice';
import { formatNumber, formatCurrency, formatDate } from '@/utils';
import LoadingSpinner from '@/components/loadingSpinner';
import StatsCard from '@/components/StatsCard';
import {
  Users,
  UserCheck,
  BookOpen,
  Layers,
  Brain,
  HelpCircle,
  GraduationCap,
  IndianRupee,
  Award,
  TrendingUp,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const PERIOD_OPTIONS = [
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 3 Months' },
  { value: '365', label: 'Last 1 Year' },
];

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { stats, loading } = useSelector((s) => s.dashboard);
  const [period, setPeriod] = useState('30');

  const loadStats = useCallback(() => {
    dispatch(fetchDashboardStats({ period }));
  }, [dispatch, period]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading && !stats) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const s = stats || {};
  const totals = s.platformTotals || {};
  const topPerf = s.topPerforming || {};
  const alerts = s.actionRequired || {};
  const trendData = s.trendData || [];

  // Exact 8 Core Platform Totals
  const totalTeachers = totals.totalTeachers ?? s.contentInventory?.teachers ?? 0;
  const totalStudents = totals.totalStudents ?? s.overview?.totalStudents ?? 0;
  const totalCourses = totals.totalCourses ?? s.overview?.totalCourses ?? 0;
  const totalTestSeries = totals.totalTestSeries ?? s.contentInventory?.testSeries ?? 0;
  const totalTests = totals.totalTests ?? s.overview?.totalTests ?? 0;
  const totalQuizzes = totals.totalQuizzes ?? s.overview?.totalQuizzes ?? 0;
  const totalEnrollments = totals.totalEnrollments ?? s.overview?.totalEnrollments ?? 0;
  const totalRevenue = totals.totalRevenue ?? s.overview?.revenue ?? 0;

  // Exact 5 Top Performing Entities
  const topTeacher = topPerf.teacher || (s.topTeachers && s.topTeachers[0]) || null;
  const topCourse = topPerf.course || (s.topCourses && s.topCourses[0]) || null;
  const topQuiz = topPerf.quiz || null;
  const topTestSeries = topPerf.testSeries || null;
  const topTest = topPerf.test || null;

  const activePeriodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label || 'Last 30 Days';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight font-display">
            Platform Dashboard
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            Authoritative platform metrics, content inventory, and top performers
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Period selector */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            {PERIOD_OPTIONS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setPeriod(tab.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  period === tab.value
                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={loadStats}
            disabled={loading}
            className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm transition-all"
            title="Refresh Intelligence Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* SECTION 1: Exact 8 Total Metrics Cards (Spacious, Clear, No Cut Words) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Platform Total Metrics
          </h2>
          <span className="text-xs font-semibold text-gray-500">Authoritative platform counts</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Teachers */}
          <StatsCard
            icon={UserCheck}
            title="Total Teachers"
            value={formatNumber(totalTeachers)}
            color="blue"
            to="/teachers"
            subtitle="Verified faculty members"
          />

          {/* 2. Total Students */}
          <StatsCard
            icon={Users}
            title="Total Students"
            value={formatNumber(totalStudents)}
            color="purple"
            to="/users"
            subtitle="Registered learner accounts"
          />

          {/* 3. Total Courses */}
          <StatsCard
            icon={BookOpen}
            title="Total Courses"
            value={formatNumber(totalCourses)}
            color="indigo"
            to="/courses"
            subtitle="Academic curriculum packages"
          />

          {/* 4. Total Test Series */}
          <StatsCard
            icon={Layers}
            title="Total Test Series"
            value={formatNumber(totalTestSeries)}
            color="amber"
            to="/test-series"
            subtitle="Exam series collections"
          />

          {/* 5. Total Tests */}
          <StatsCard
            icon={Brain}
            title="Total Tests"
            value={formatNumber(totalTests)}
            color="rose"
            to="/tests"
            subtitle="Mock tests and assessments"
          />

          {/* 6. Total Quizzes */}
          <StatsCard
            icon={HelpCircle}
            title="Total Quizzes"
            value={formatNumber(totalQuizzes)}
            color="emerald"
            to="/quizzes"
            subtitle="Daily practice quizzes"
          />

          {/* 7. Total Enrollments */}
          <StatsCard
            icon={GraduationCap}
            title="Total Enrollments"
            value={formatNumber(totalEnrollments)}
            color="cyan"
            to="/enrollments"
            subtitle="Active student course enrollments"
          />

          {/* 8. Total Revenue */}
          <StatsCard
            icon={IndianRupee}
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            color="emerald"
            to="/payments"
            subtitle="Cleared payments volume"
          />
        </div>
      </div>

      {/* SECTION 2: Top Performing Entities (5 Clean Showcase Cards) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Top Performing Showcase
            </h2>
          </div>
          <span className="text-xs font-semibold text-gray-500">Top entity in each category</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* 1. Top Performing Teacher */}
          <div className="card p-5 border border-gray-200 dark:border-gray-700/80 shadow-sm bg-white dark:bg-gray-800 rounded-2xl flex flex-col justify-between hover:border-primary-400 transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="badge badge-primary text-[10px] font-bold uppercase tracking-wider">
                  Top Teacher
                </span>
                <Award className="w-4 h-4 text-amber-500 shrink-0" />
              </div>

              {topTeacher ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 font-bold text-sm flex items-center justify-center shrink-0">
                      {topTeacher.name?.charAt(0)?.toUpperCase() || 'T'}
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/teachers/${topTeacher.id}`}
                        className="font-bold text-gray-900 dark:text-white hover:text-primary-600 truncate block text-sm hover:underline"
                        title={topTeacher.name}
                      >
                        {topTeacher.name}
                      </Link>
                      <p className="text-xs text-gray-500 truncate">
                        {topTeacher.email || 'Faculty'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span>Students:</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {formatNumber(topTeacher.studentCount || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span>Courses:</span>
                      <span className="font-semibold">{topTeacher.courseCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>Revenue:</span>
                      <span>₹{Number(topTeacher.revenue || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-gray-400">
                  No teacher performance data
                </div>
              )}
            </div>

            {topTeacher && (
              <Link
                to={`/teachers/${topTeacher.id}`}
                className="mt-4 pt-2 border-t border-gray-100 dark:border-gray-700/60 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center justify-between"
              >
                <span>View Faculty Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* 2. Top Performing Course */}
          <div className="card p-5 border border-gray-200 dark:border-gray-700/80 shadow-sm bg-white dark:bg-gray-800 rounded-2xl flex flex-col justify-between hover:border-primary-400 transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="badge badge-primary text-[10px] font-bold uppercase tracking-wider">
                  Top Course
                </span>
                <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
              </div>

              {topCourse ? (
                <div className="space-y-2">
                  <div>
                    <Link
                      to={`/courses/${topCourse.id}`}
                      className="font-bold text-gray-900 dark:text-white hover:text-primary-600 block text-sm hover:underline line-clamp-2"
                      title={topCourse.title}
                    >
                      {topCourse.title}
                    </Link>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      By {topCourse.instructor || 'Faculty'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span>Enrollments:</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {formatNumber(topCourse.enrollments || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span>Price:</span>
                      <span className="font-semibold">₹{topCourse.price || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>Revenue:</span>
                      <span>₹{Number(topCourse.revenue || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-gray-400">
                  No course performance data
                </div>
              )}
            </div>

            {topCourse && (
              <Link
                to={`/courses/${topCourse.id}`}
                className="mt-4 pt-2 border-t border-gray-100 dark:border-gray-700/60 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center justify-between"
              >
                <span>View Course Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* 3. Top Performing Quiz */}
          <div className="card p-5 border border-gray-200 dark:border-gray-700/80 shadow-sm bg-white dark:bg-gray-800 rounded-2xl flex flex-col justify-between hover:border-primary-400 transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="badge badge-success text-[10px] font-bold uppercase tracking-wider">
                  Top Quiz
                </span>
                <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>

              {topQuiz ? (
                <div className="space-y-2">
                  <div>
                    <Link
                      to={`/quizzes/${topQuiz.id}`}
                      className="font-bold text-gray-900 dark:text-white hover:text-primary-600 block text-sm hover:underline line-clamp-2"
                      title={topQuiz.title}
                    >
                      {topQuiz.title}
                    </Link>
                    <p className="text-xs text-gray-500 truncate mt-0.5">Daily Practice Quiz</p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span>Total Attempts:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatNumber(topQuiz.attemptsCount || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span>Questions:</span>
                      <span className="font-semibold">{topQuiz.questionsCount || 0} Questions</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500">
                      <span>Status:</span>
                      <span
                        className={
                          topQuiz.isPublished ? 'text-emerald-600 font-bold' : 'text-amber-600'
                        }
                      >
                        {topQuiz.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-gray-400">
                  No quiz activity recorded
                </div>
              )}
            </div>

            {topQuiz && (
              <Link
                to={`/quizzes/${topQuiz.id}`}
                className="mt-4 pt-2 border-t border-gray-100 dark:border-gray-700/60 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center justify-between"
              >
                <span>View Quiz Questions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* 4. Top Performing Test Series */}
          <div className="card p-5 border border-gray-200 dark:border-gray-700/80 shadow-sm bg-white dark:bg-gray-800 rounded-2xl flex flex-col justify-between hover:border-primary-400 transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="badge badge-warning text-[10px] font-bold uppercase tracking-wider">
                  Top Test Series
                </span>
                <Layers className="w-4 h-4 text-amber-500 shrink-0" />
              </div>

              {topTestSeries ? (
                <div className="space-y-2">
                  <div>
                    <Link
                      to={`/test-series/${topTestSeries.id}`}
                      className="font-bold text-gray-900 dark:text-white hover:text-primary-600 block text-sm hover:underline line-clamp-2"
                      title={topTestSeries.title}
                    >
                      {topTestSeries.title}
                    </Link>
                    <p className="text-xs text-gray-500 truncate mt-0.5">Exam Prep Series</p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span>Tests Included:</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {topTestSeries.testsCount || 0} Tests
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span>Package Price:</span>
                      <span className="font-semibold">₹{topTestSeries.price || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500">
                      <span>Status:</span>
                      <span
                        className={
                          topTestSeries.isPublished
                            ? 'text-emerald-600 font-bold'
                            : 'text-amber-600'
                        }
                      >
                        {topTestSeries.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-gray-400">
                  No test series recorded
                </div>
              )}
            </div>

            {topTestSeries && (
              <Link
                to={`/test-series/${topTestSeries.id}`}
                className="mt-4 pt-2 border-t border-gray-100 dark:border-gray-700/60 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center justify-between"
              >
                <span>View Test Series</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* 5. Top Performing Test */}
          <div className="card p-5 border border-gray-200 dark:border-gray-700/80 shadow-sm bg-white dark:bg-gray-800 rounded-2xl flex flex-col justify-between hover:border-primary-400 transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="badge badge-danger text-[10px] font-bold uppercase tracking-wider">
                  Top Test
                </span>
                <Brain className="w-4 h-4 text-rose-500 shrink-0" />
              </div>

              {topTest ? (
                <div className="space-y-2">
                  <div>
                    <Link
                      to={`/tests/${topTest.id}`}
                      className="font-bold text-gray-900 dark:text-white hover:text-primary-600 block text-sm hover:underline line-clamp-2"
                      title={topTest.title}
                    >
                      {topTest.title}
                    </Link>
                    <p className="text-xs text-gray-500 truncate mt-0.5">Mock Assessment</p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span>Attempts:</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {formatNumber(topTest.attemptsCount || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span>Questions:</span>
                      <span className="font-semibold">{topTest.totalQuestions || 0} Qs</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span>Duration:</span>
                      <span className="font-semibold">{topTest.duration || 60} mins</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-gray-400">No mock test records</div>
              )}
            </div>

            {topTest && (
              <Link
                to={`/tests/${topTest.id}`}
                className="mt-4 pt-2 border-t border-gray-100 dark:border-gray-700/60 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center justify-between"
              >
                <span>View Mock Test</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: Revenue & Order Performance Trend Chart */}
      <div className="card p-6 border border-gray-200 dark:border-gray-700/80 shadow-sm bg-white dark:bg-gray-800 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white font-display">
                Revenue & Order Volume Trend
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Financial volume (₹) and transaction throughput across {activePeriodLabel}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" /> Revenue (₹)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Orders
            </span>
            <Link
              to="/revenue"
              className="text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 shrink-0 ml-2"
            >
              Full Revenue Analytics <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="h-64 w-full">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="dashOrderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val, name) => [
                    name === 'revenue' ? `₹${Number(val).toLocaleString('en-IN')}` : val,
                    name === 'revenue' ? 'Revenue' : 'Orders',
                  ]}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '0.75rem',
                    color: '#f9fafb',
                    fontSize: '12px',
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#dashRevGrad)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#dashOrderGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <TrendingUp className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No transaction trend data recorded for this window</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
