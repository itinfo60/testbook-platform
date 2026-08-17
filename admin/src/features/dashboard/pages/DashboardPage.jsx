import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats } from '@/features/dashboard/dashboardSlice';
import { formatNumber, formatCurrency } from '@/utils';
import LoadingSpinner from '@/components/loadingSpinner';
import StatsCard from '@/components/StatsCard';
import {
  Users,
  BookOpen,
  GraduationCap,
  CreditCard,
  FileText,
  Brain,
  Star,
  RefreshCw,
} from 'lucide-react';
import { revenueAPI } from '@/services/api';
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

export default function Dashboard() {
  const dispatch = useDispatch();
  const { stats, loading, error } = useSelector((s) => s.dashboard);

  const [revenueData, setRevenueData] = useState([]);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState(false);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  const loadRevenue = async () => {
    setRevenueLoading(true);
    setRevenueError(false);
    try {
      const res = await revenueAPI.getMonthly();
      const trends = res.data?.data?.trends || res.data?.trends || [];
      const formatted = trends.map((t) => ({
        month: MONTH_NAMES[(t._id?.month ?? t.month ?? 1) - 1] || 'Unknown',
        revenue: t.revenue || 0,
        enrollments: t.count || t.enrollments || 0,
      }));
      setRevenueData(formatted);
    } catch (err) {
      setRevenueError(true);
    } finally {
      setRevenueLoading(false);
    }
  };

  useEffect(() => {
    loadRevenue();
  }, []);

  const s = stats || {};
  const overview = s.overview || {};
  const revenueStats = s.revenue || {};
  const growthData = s.growth || {};
  const limits = s.limits || null;
  const roleMap = s.roleDistribution || {};
  const categoryData = s.categoryDistribution || s.categories || [];

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
      value: formatCurrency(revenueStats.total || 0),
      icon: CreditCard,
      color: 'rose',
      change: revenueStats.growth,
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Overview of your platform performance
          {error && <span className="text-amber-500 ml-2">(Some data may be unavailable)</span>}
        </p>
      </div>

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Revenue & Enrollments
                </h3>
              </div>
              <div className="flex-1 min-h-[320px] relative">
                {revenueLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner />
                  </div>
                ) : revenueError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 space-y-3">
                    <p>Revenue data unavailable</p>
                    <button
                      onClick={loadRevenue}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" /> Retry
                    </button>
                  </div>
                ) : revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
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
                      <Bar
                        dataKey="revenue"
                        name="Revenue (₹)"
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="enrollments"
                        name="Enrollments"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    No data to display
                  </div>
                )}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Categories
              </h3>
              {categoryData && categoryData.length > 0 ? (
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
              ) : (
                <div className="flex items-center justify-center h-[320px] text-gray-500">
                  No category data available
                </div>
              )}
            </div>
          </div>

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
