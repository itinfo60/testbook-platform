import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Search,
  RefreshCw,
  Trash2,
  Filter,
  Eye,
  Laptop,
  ShieldAlert,
  Clock,
  User,
  Globe,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '@/services/api';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';

export default function LogsExplorer() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [limit] = useState(25);
  const [appFilter, setAppFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Inspector Modal State
  const [selectedLog, setSelectedLog] = useState(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);

  // Purge Modal State
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [purgeDays, setPurgeDays] = useState(30);
  const [purging, setPurging] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch stats overview
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/logs/stats');
      if (res.data?.data) {
        setStats(res.data.data);
      }
    } catch (_) {}
  }, []);

  // Fetch logs list
  const fetchLogs = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      else setRefreshing(true);

      try {
        const params = {
          page,
          limit,
          ...(appFilter !== 'all' ? { app: appFilter } : {}),
          ...(levelFilter !== 'all' ? { level: levelFilter } : {}),
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        };

        const res = await api.get('/logs', { params });
        const data = res.data?.data || [];
        const pagination = res.data?.pagination || {};

        setLogs(Array.isArray(data) ? data : []);
        setTotalPages(pagination.pages || 1);
        setTotalLogs(pagination.total || 0);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch logs');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, limit, appFilter, levelFilter, debouncedSearch]
  );

  useEffect(() => {
    fetchStats();
    fetchLogs(true);
  }, [fetchStats, fetchLogs]);

  // Auto refresh loop
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs(false);
      fetchStats();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs, fetchStats]);

  const handlePurge = async () => {
    setPurging(true);
    try {
      const res = await api.delete('/logs/purge', { data: { days: purgeDays } });
      toast.success(res.data?.message || 'Logs purged successfully');
      setPurgeModalOpen(false);
      fetchStats();
      fetchLogs(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to purge logs');
    } finally {
      setPurging(false);
    }
  };

  const getLevelBadge = (level) => {
    switch (level?.toLowerCase()) {
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-3.5 h-3.5" /> ERROR
          </span>
        );
      case 'warn':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" /> WARN
          </span>
        );
      case 'action':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            <Activity className="w-3.5 h-3.5" /> ACTION
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <Info className="w-3.5 h-3.5" /> INFO
          </span>
        );
    }
  };

  const getAppBadge = (app) => {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
          app === 'admin'
            ? 'bg-slate-800 text-amber-400 border border-amber-500/30'
            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
        }`}
      >
        <Laptop className="w-3 h-3" /> {app ? app.toUpperCase() : 'CLIENT'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary-500" />
            Activity & System Logs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Realtime client & admin application telemetry, error tracking, and user action audit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              autoRefresh
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
            title="Toggle 10s auto-refresh"
          >
            <span
              className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}
            />
            {autoRefresh ? 'Live (10s)' : 'Paused'}
          </button>

          <button
            onClick={() => {
              fetchLogs(false);
              fetchStats();
            }}
            disabled={refreshing}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
            title="Refresh logs now"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setPurgeModalOpen(true)}
            className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Purge Logs
          </button>
        </div>
      </div>

      {/* KPI Stats Cards (24-Hour Metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Events (24h)
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              {stats?.last24h?.total?.toLocaleString() ?? 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider">
              Errors (24h)
            </p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {stats?.last24h?.errors?.toLocaleString() ?? 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
              Warnings (24h)
            </p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {stats?.last24h?.warnings?.toLocaleString() ?? 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-purple-500 uppercase tracking-wider">
              User Actions (24h)
            </p>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
              {stats?.last24h?.actions?.toLocaleString() ?? 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by event, message, path, or user email..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
          />
        </div>

        {/* Application Source Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-gray-500 uppercase shrink-0">App:</span>
          <select
            value={appFilter}
            onChange={(e) => {
              setAppFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-800 dark:text-gray-200 focus:outline-none"
          >
            <option value="all">All Apps</option>
            <option value="client">Client (Portal)</option>
            <option value="admin">Admin (Dashboard)</option>
            <option value="server">Server</option>
          </select>
        </div>

        {/* Log Level Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-gray-500 uppercase shrink-0">Level:</span>
          <select
            value={levelFilter}
            onChange={(e) => {
              setLevelFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-800 dark:text-gray-200 focus:outline-none"
          >
            <option value="all">All Levels</option>
            <option value="error">🔴 Error Only</option>
            <option value="warn">🟡 Warning Only</option>
            <option value="action">🟣 User Action</option>
            <option value="info">🔵 Info</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">App</th>
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Message / Action</th>
                <th className="py-3 px-4">Path / Route</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-500" />
                    Loading system logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-gray-400">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No log events found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                      <span className="block text-[9px] opacity-70">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    {/* App */}
                    <td className="py-3 px-4 whitespace-nowrap">{getAppBadge(item.app)}</td>

                    {/* Level */}
                    <td className="py-3 px-4 whitespace-nowrap">{getLevelBadge(item.level)}</td>

                    {/* Event Name */}
                    <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-white">
                      {item.event}
                    </td>

                    {/* Message */}
                    <td className="py-3 px-4 max-w-xs truncate text-gray-700 dark:text-gray-300 font-medium">
                      {item.message || '—'}
                    </td>

                    {/* Path */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-gray-500 dark:text-gray-400 max-w-[150px] truncate">
                      {item.path || '—'}
                    </td>

                    {/* User */}
                    <td className="py-3 px-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {item.userEmail ? (
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white truncate max-w-[130px]">
                            {item.userName || item.userEmail.split('@')[0]}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate max-w-[130px]">
                            {item.userEmail}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Guest</span>
                      )}
                    </td>

                    {/* Actions / View */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedLog(item);
                          setInspectModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg transition-colors cursor-pointer"
                        title="Inspect full log details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Showing <span className="font-bold text-gray-900 dark:text-white">{logs.length}</span>{' '}
            of <span className="font-bold text-gray-900 dark:text-white">{totalLogs}</span> entries
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Log Inspector Modal */}
      {selectedLog && (
        <Modal
          isOpen={inspectModalOpen}
          onClose={() => setInspectModalOpen(false)}
          title={`Log Details: ${selectedLog.event}`}
          size="lg"
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-gray-900 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">App</p>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">
                  {selectedLog.app}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Severity</p>
                <p className="font-semibold text-gray-900 dark:text-white uppercase">
                  {selectedLog.level}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Timestamp</p>
                <p className="font-mono text-xs text-gray-900 dark:text-white">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Path</p>
                <p className="font-mono text-xs text-gray-900 dark:text-white truncate">
                  {selectedLog.path || '—'}
                </p>
              </div>
            </div>

            {selectedLog.message && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Message</p>
                <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded-xl font-medium text-gray-800 dark:text-gray-200">
                  {selectedLog.message}
                </div>
              </div>
            )}

            {/* Context Attribution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
              <div>
                <span className="font-bold text-gray-400">User: </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {selectedLog.userEmail
                    ? `${selectedLog.userName || ''} (${selectedLog.userEmail})`
                    : 'Unauthenticated / Guest'}
                </span>
              </div>
              <div>
                <span className="font-bold text-gray-400">IP Address: </span>
                <span className="font-mono text-gray-700 dark:text-gray-300">
                  {selectedLog.ip || '—'}
                </span>
              </div>
              <div className="col-span-2 truncate">
                <span className="font-bold text-gray-400">User Agent: </span>
                <span className="text-gray-600 dark:text-gray-400 text-[11px]">
                  {selectedLog.userAgent || '—'}
                </span>
              </div>
            </div>

            {/* JSON Details */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                Raw JSON Diagnostics & Stack Trace
              </p>
              <pre className="p-4 bg-gray-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto max-h-60 border border-gray-800">
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>
            </div>
          </div>
        </Modal>
      )}

      {/* Purge Modal */}
      <Modal
        isOpen={purgeModalOpen}
        onClose={() => setPurgeModalOpen(false)}
        title="Purge Historical Logs"
      >
        <div className="space-y-4 text-sm">
          <p className="text-gray-600 dark:text-gray-400">
            Delete older log records to free database storage. This operation is permanent.
          </p>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Delete logs older than:
            </label>
            <select
              value={purgeDays}
              onChange={(e) => setPurgeDays(Number(e.target.value))}
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold"
            >
              <option value="7">Older than 7 Days</option>
              <option value="14">Older than 14 Days</option>
              <option value="30">Older than 30 Days (Recommended)</option>
              <option value="60">Older than 60 Days</option>
              <option value="90">Older than 90 Days</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setPurgeModalOpen(false)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handlePurge}
              disabled={purging}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> {purging ? 'Purging...' : 'Confirm Purge'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
