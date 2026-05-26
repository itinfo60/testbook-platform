import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOfficeBuilding,
  HiUsers,
  HiCash,
  HiExclamation,
  HiCheck,
  HiX,
  HiBan,
  HiRefresh,
} from 'react-icons/hi';
import { useSelector } from 'react-redux';
import api from '@/services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  active: 'bg-green-500/20 text-green-400',
  expired: 'bg-red-500/20 text-red-400',
  suspended: 'bg-yellow-500/20 text-yellow-400',
  trial: 'bg-blue-500/20 text-blue-400',
};

export default function SuperAdminDashboard() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [institutes, setInstitutes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (user?.role !== 'super_admin') {
      navigate('/unauthorized');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [instRes, statsRes] = await Promise.all([
        api.get('/institutes/all'),
        api.get('/institutes/stats').catch(() => ({ data: { data: null } })),
      ]);
      setInstitutes(instRes.data?.data?.institutes || []);
      setStats(statsRes.data?.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await api.patch(`/institutes/${id}/${action}`);
      toast.success(`Institute ${action}d successfully`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} institute`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const filtered = institutes.filter(
    (i) =>
      i.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.subdomain?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Super Admin Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Platform-wide management console</p>
          </div>
          <button
            onClick={() => navigate('/super-admin/onboard')}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            + Onboard Institute
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Institutes',
                value: stats.totalInstitutes || institutes.length,
                icon: HiOfficeBuilding,
                color: 'text-blue-400',
              },
              {
                label: 'Total Users',
                value: stats.totalUsers || '—',
                icon: HiUsers,
                color: 'text-green-400',
              },
              {
                label: 'Active Subscriptions',
                value: stats.activeSubscriptions || '—',
                icon: HiCheck,
                color: 'text-emerald-400',
              },
              {
                label: 'Monthly Revenue',
                value: stats.monthlyRevenue ? `₹${stats.monthlyRevenue.toLocaleString()}` : '—',
                icon: HiCash,
                color: 'text-yellow-400',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4"
              >
                <stat.icon className={`h-6 w-6 ${stat.color} mb-2`} />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-slate-400 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Institute List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search institutes..."
              className="flex-1 bg-slate-800 text-white placeholder-slate-500 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={fetchData}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400"
            >
              <HiRefresh className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Institute', 'Subdomain', 'Plan', 'Status', 'Expires', 'Users', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left text-slate-400 text-xs font-medium px-4 py-3"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((inst) => (
                  <tr key={inst._id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {inst.branding?.logo ? (
                          <img
                            src={inst.branding.logo}
                            alt=""
                            className="h-8 w-8 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                            {inst.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-white text-sm font-medium">{inst.name}</p>
                          <p className="text-slate-500 text-xs">{inst.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm font-mono">{inst.subdomain}</td>
                    <td className="px-4 py-3 text-slate-300 text-sm capitalize">
                      {inst.subscription?.plan?.name || 'Free'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[inst.subscription?.status] || 'bg-slate-700 text-slate-400'}`}
                      >
                        {inst.subscription?.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {inst.subscription?.expiresAt
                        ? new Date(inst.subscription.expiresAt).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">
                      {inst.limits?.studentLimit ? `${inst.limits.studentLimit}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {inst.isActive ? (
                          <button
                            onClick={() => handleAction(inst._id, 'suspend')}
                            disabled={actionLoading[inst._id]}
                            className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                            title="Suspend"
                          >
                            <HiBan className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(inst._id, 'activate')}
                            disabled={actionLoading[inst._id]}
                            className="p-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                            title="Activate"
                          >
                            <HiCheck className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">
                      No institutes found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
