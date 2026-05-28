import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats } from '@/features/dashboard/dashboardSlice';
import { formatNumber, formatCurrency } from '@/utils';
import LoadingSpinner from '@/components/loadingSpinner';
import StatsCard from '@/components/StatsCard';
import { Users, BookOpen, GraduationCap, CreditCard, FileText, Brain, Star } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

export default function Dashboard() {
  const dispatch = useDispatch();
  const { stats, loading, error } = useSelector((s) => s.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  // Don't block on loading — show what we have
  const s = stats || {};
  const overview = s.overview || {};
  const revenueData = s.revenue || {};
  const growthData = s.growth || {};
  const limits = s.limits || null;

  const roleMap = s.roleDistribution || {};

  const statCards = [
    {
      title: 'Total Users',
      value: formatNumber(overview.totalUsers || 0),
      icon: Users,
      color: 'primary',
      change: growthData.users,
    },
    {
      title: 'Total Courses',
      value: formatNumber(overview.totalCourses || 0),
      icon: BookOpen,
      color: 'emerald',
    },
    {
      title: 'Enrollments',
      value: formatNumber(overview.totalEnrollments || 0),
      icon: GraduationCap,
      color: 'amber',
      change: growthData.enrollments,
    },
    {
      title: 'Revenue',
      value: formatCurrency(revenueData.total || 0),
      icon: CreditCard,
      color: 'rose',
      change: revenueData.growth,
    },
    {
      title: 'Tests',
      value: formatNumber(overview.totalTests || 0),
      icon: FileText,
      color: 'cyan',
    },
    {
      title: 'Quizzes',
      value: formatNumber(overview.totalQuizzes || 0),
      icon: Brain,
      color: 'violet',
    },
    {
      title: 'Avg Rating',
      value: (overview.avgRating || 0).toFixed(1),
      icon: Star,
      color: 'amber',
    },
    { title: 'Teachers', value: formatNumber(roleMap.teacher || 0), icon: Users, color: 'emerald' },
  ];

  const MONTH_NAMES = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const hasMonthlyTrends = Array.isArray(s.monthlyTrends) && s.monthlyTrends.length > 0;
  const monthlyData = hasMonthlyTrends
    ? s.monthlyTrends.map((t) => ({
        month: MONTH_NAMES[(t._id?.month ?? 1) - 1],
        revenue: t.revenue || 0,
        enrollments: t.count || 0,
      }))
    : [
        { month: 'Jan', revenue: 45000, enrollments: 120 },
        { month: 'Feb', revenue: 52000, enrollments: 150 },
        { month: 'Mar', revenue: 48000, enrollments: 130 },
        { month: 'Apr', revenue: 61000, enrollments: 180 },
        { month: 'May', revenue: 55000, enrollments: 165 },
        { month: 'Jun', revenue: 67000, enrollments: 200 },
      ];

  const categoryData = s.categoryDistribution ||
    s.categories || [
      { name: 'SSC', value: 30 },
      { name: 'Banking', value: 25 },
      { name: 'Railway', value: 20 },
      { name: 'Teaching', value: 15 },
      { name: 'Other', value: 10 },
    ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Overview of your platform performance
          {error && <span className="text-amber-500 ml-2">(Some data may be unavailable)</span>}
        </p>
      </div>

      {/* Stats Grid */}
      {loading && !stats ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <StatsCard key={card.title} {...card} />
            ))}
          </div>

          {/* Plan Limits */}
          {limits && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Plan Usage
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    label: 'Students',
                    used: limits.students.used,
                    max: limits.students.max,
                    color: '#6366f1',
                  },
                  {
                    label: 'Teachers',
                    used: limits.teachers.used,
                    max: limits.teachers.max,
                    color: '#10b981',
                  },
                  {
                    label: 'Storage',
                    used: parseFloat(limits.storage.usedGB),
                    max: parseFloat(limits.storage.maxGB),
                    unit: 'GB',
                    color: '#f59e0b',
                  },
                ].map(({ label, used, max, unit = '', color }) => {
                  const pct = Math.min(Math.round((used / max) * 100), 100);
                  const danger = pct >= 90;
                  const warn = pct >= 70 && pct < 90;
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">
                          {label}
                        </span>
                        <span
                          className={`font-semibold ${danger ? 'text-red-500' : warn ? 'text-amber-500' : 'text-gray-600 dark:text-gray-300'}`}
                        >
                          {used}
                          {unit} / {max}
                          {unit}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: danger ? '#ef4444' : warn ? '#f59e0b' : color,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{pct}% used</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Revenue & Enrollments
                {!hasMonthlyTrends && (
                  <span className="text-xs text-gray-400 font-normal ml-2">(Sample Data)</span>
                )}
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--toast-bg, #fff)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue (₹)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar
                    dataKey="enrollments"
                    name="Enrollments"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Categories
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Users */}
          {(s.recent?.users || []).length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Users
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {s.recent.users.slice(0, 5).map((u) => (
                      <tr key={u._id}>
                        <td className="py-3 font-medium">{u.name}</td>
                        <td className="py-3 text-gray-500">{u.email}</td>
                        <td className="py-3">
                          <span
                            className={`badge ${u.role === 'admin' || u.role === 'super_admin' ? 'badge-danger' : u.role === 'teacher' ? 'badge-info' : 'badge-success'}`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
