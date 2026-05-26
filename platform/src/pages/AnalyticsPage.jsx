import { useEffect, useState } from 'react';
import { platformAPI } from '@/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    platformAPI
      .getStats()
      .then((res) => setStats(res.data?.data || {}))
      .catch(() => setStats({}))
      .finally(() => setLoading(false));
  }, []);

  const monthlyGrowth = stats?.monthlyGrowth || [
    { month: 'Jan', institutes: 2, users: 120, revenue: 45000 },
    { month: 'Feb', institutes: 3, users: 280, revenue: 72000 },
    { month: 'Mar', institutes: 5, users: 450, revenue: 98000 },
    { month: 'Apr', institutes: 4, users: 600, revenue: 115000 },
    { month: 'May', institutes: 7, users: 850, revenue: 160000 },
    { month: 'Jun', institutes: 6, users: 1100, revenue: 195000 },
  ];

  const planDistribution = stats?.planDistribution || [
    { name: 'Starter', value: 35 },
    { name: 'Growth', value: 45 },
    { name: 'Enterprise', value: 20 },
  ];

  const isSample = !stats?.monthlyGrowth;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Cross-institute platform metrics</p>
        </div>
        {isSample && (
          <span className="text-xs border border-gray-700 text-gray-500 rounded-lg px-3 py-1.5">
            Sample Data — Connect MongoDB for live stats
          </span>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Institutes', value: stats?.totalInstitutes ?? '--' },
          { label: 'Total Users', value: stats?.totalUsers?.toLocaleString() ?? '--' },
          { label: 'Total Courses', value: stats?.totalCourses?.toLocaleString() ?? '--' },
          {
            label: 'Total Revenue',
            value: stats?.totalRevenue ? `₹${Number(stats.totalRevenue).toLocaleString()}` : '--',
          },
        ].map((k) => (
          <div key={k.label} className="card p-4">
            <p className="text-gray-500 text-xs font-medium mb-1">{k.label}</p>
            <p
              className={`text-xl font-bold ${loading ? 'text-gray-700 animate-pulse' : 'text-white'}`}
            >
              {loading ? '...' : k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card p-5 xl:col-span-2">
          <h3 className="text-white font-semibold mb-4">Monthly Revenue Growth</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-white font-semibold mb-4">Plan Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={planDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {planDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-white font-semibold mb-4">User & Institute Growth</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthlyGrowth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Users"
            />
            <Line
              type="monotone"
              dataKey="institutes"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="Institutes"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
