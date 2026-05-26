import { useEffect, useState } from 'react';
import { platformAPI, institutesAPI } from '@/api';
import { Building2, Users, CreditCard, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, instRes] = await Promise.all([
          platformAPI.getStats().catch(() => ({ data: { data: {} } })),
          institutesAPI
            .getAll({ limit: 5, sort: '-createdAt' })
            .catch(() => ({ data: { data: { institutes: [] } } })),
        ]);
        setStats(statsRes.data?.data || {});
        setInstitutes(instRes.data?.data?.institutes || instRes.data?.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = [
    {
      label: 'Total Institutes',
      value: stats?.totalInstitutes ?? '--',
      icon: Building2,
      color: 'text-blue-400',
      bg: 'bg-blue-900/30',
    },
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? '--',
      icon: Users,
      color: 'text-green-400',
      bg: 'bg-green-900/30',
    },
    {
      label: 'Active Subscriptions',
      value: stats?.activeSubscriptions ?? '--',
      icon: CreditCard,
      color: 'text-purple-400',
      bg: 'bg-purple-900/30',
    },
    {
      label: 'Monthly Revenue',
      value: stats?.monthlyRevenue ? `₹${Number(stats.monthlyRevenue).toLocaleString()}` : '--',
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'bg-amber-900/30',
    },
  ];

  const growth = stats?.monthlyGrowth || [
    { month: 'Jan', institutes: 2, users: 120 },
    { month: 'Feb', institutes: 3, users: 280 },
    { month: 'Mar', institutes: 5, users: 450 },
    { month: 'Apr', institutes: 4, users: 600 },
    { month: 'May', institutes: 7, users: 850 },
    { month: 'Jun', institutes: 6, users: 1100 },
  ];

  const statusCounts = {
    active: institutes.filter((i) => i.subscription?.status === 'active').length,
    suspended: institutes.filter((i) => i.subscription?.status === 'suspended').length,
    expired: institutes.filter((i) => i.subscription?.status === 'expired').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Real-time overview of all institutes on the platform
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-500 text-sm font-medium">{c.label}</span>
              <div className={`h-9 w-9 rounded-lg ${c.bg} flex items-center justify-center`}>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
            </div>
            <p
              className={`text-2xl font-bold ${loading ? 'text-gray-600 animate-pulse' : 'text-white'}`}
            >
              {loading ? '...' : c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Status + Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Status breakdown */}
        <div className="card p-5 space-y-3">
          <h3 className="text-white font-semibold">Institute Health</h3>
          <div className="flex items-center justify-between p-3 rounded-lg bg-green-900/20 border border-green-800/50">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm text-gray-300">Active</span>
            </div>
            <span className="text-green-400 font-bold">{statusCounts.active}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-900/20 border border-yellow-800/50">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-gray-300">Suspended</span>
            </div>
            <span className="text-yellow-400 font-bold">{statusCounts.suspended}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-red-900/20 border border-red-800/50">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-gray-300">Expired</span>
            </div>
            <span className="text-red-400 font-bold">{statusCounts.expired}</span>
          </div>
        </div>

        {/* Growth chart */}
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Platform Growth</h3>
            {!stats?.monthlyGrowth && (
              <span className="text-xs text-gray-600 border border-gray-700 rounded px-2 py-0.5">
                Sample Data
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={growth}>
              <defs>
                <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#3b82f6"
                fill="url(#usersGrad)"
                strokeWidth={2}
                name="Users"
              />
              <Line
                type="monotone"
                dataKey="institutes"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={false}
                name="Institutes"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent institutes */}
      <div className="card">
        <div className="p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold">Recently Joined Institutes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left px-5 py-3 font-medium">Institute</th>
                <th className="text-left px-5 py-3 font-medium">Subdomain</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {institutes.slice(0, 5).map((inst) => (
                <tr key={inst._id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-5 py-3 font-medium text-white">{inst.name}</td>
                  <td className="px-5 py-3 text-gray-400">{inst.subdomain}.testbook.com</td>
                  <td className="px-5 py-3">
                    <StatusBadge
                      status={inst.subscription?.status || inst.isActive ? 'active' : 'suspended'}
                    />
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {inst.createdAt ? new Date(inst.createdAt).toLocaleDateString() : '--'}
                  </td>
                </tr>
              ))}
              {institutes.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-600">
                    No institutes yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    active: 'bg-green-900/50 text-green-400 border-green-800',
    suspended: 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
    expired: 'bg-red-900/50 text-red-400 border-red-800',
    trial: 'bg-blue-900/50 text-blue-400 border-blue-800',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[status] || map.active}`}
    >
      {status}
    </span>
  );
}
