import { useEffect, useState } from 'react';
import { institutesAPI } from '@/api';
import toast from 'react-hot-toast';
import { Search, Building2, Ban, CheckCircle, Trash2, Plus, Globe, Users } from 'lucide-react';
import CreateInstituteModal from '@/components/CreateInstituteModal';

export default function InstitutesPage() {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchInstitutes = async () => {
    setLoading(true);
    try {
      const res = await institutesAPI.getAll({
        search,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      const data = res.data?.data;
      setInstitutes(Array.isArray(data) ? data : data?.institutes || []);
    } catch {
      toast.error('Failed to load institutes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutes();
  }, [search, statusFilter]);

  const handleAction = async (id, action, label) => {
    setActionLoading((p) => ({ ...p, [id]: action }));
    try {
      if (action === 'suspend') await institutesAPI.suspend(id);
      else if (action === 'activate') await institutesAPI.activate(id);
      else if (action === 'delete') await institutesAPI.delete(id);
      toast.success(`Institute ${label} successfully`);
      setDeleteConfirm(null);
      fetchInstitutes();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${label}`);
    } finally {
      setActionLoading((p) => ({ ...p, [id]: null }));
    }
  };

  const filtered = institutes.filter(
    (i) =>
      i.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.subdomain?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Institutes</h1>
          <p className="text-gray-500 text-sm mt-1">
            {institutes.length} institutes on the platform
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Institute
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            className="input pl-9"
            placeholder="Search by name or subdomain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500">
                <th className="text-left px-5 py-3 font-medium">Institute</th>
                <th className="text-left px-5 py-3 font-medium">Subdomain</th>
                <th className="text-left px-5 py-3 font-medium">Plan</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Expires</th>
                <th className="text-left px-5 py-3 font-medium">Limits</th>
                <th className="text-right px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-gray-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Building2 className="h-10 w-10 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500">No institutes found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((inst) => {
                  const status =
                    inst.subscription?.status || (inst.isActive ? 'active' : 'suspended');
                  return (
                    <tr
                      key={inst._id}
                      className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-blue-900/50 border border-blue-800 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-4 w-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{inst.name}</p>
                            <p className="text-xs text-gray-500">
                              {inst.owner?.email || inst.contactDetails?.email || '--'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Globe className="h-3.5 w-3.5" />
                          <span className="text-blue-400">{inst.subdomain}</span>
                          <span className="text-gray-600">.testbook.com</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-400 capitalize">
                        {inst.subscription?.plan?.name || inst.subscription?.plan || 'Standard'}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {inst.subscription?.expiresAt
                          ? new Date(inst.subscription.expiresAt).toLocaleDateString()
                          : '--'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                          <Users className="h-3.5 w-3.5" />
                          {inst.limits?.studentLimit ?? '∞'} students
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {status === 'active' ? (
                            <button
                              onClick={() => handleAction(inst._id, 'suspend', 'suspended')}
                              disabled={!!actionLoading[inst._id]}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-900/30 text-yellow-400 border border-yellow-800/50 hover:bg-yellow-900/50 transition-colors disabled:opacity-50"
                            >
                              <Ban className="h-3.5 w-3.5" />
                              {actionLoading[inst._id] === 'suspend' ? 'Suspending...' : 'Suspend'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction(inst._id, 'activate', 'activated')}
                              disabled={!!actionLoading[inst._id]}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-900/30 text-green-400 border border-green-800/50 hover:bg-green-900/50 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              {actionLoading[inst._id] === 'activate'
                                ? 'Activating...'
                                : 'Activate'}
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteConfirm(inst)}
                            disabled={!!actionLoading[inst._id]}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-900/30 text-red-400 border border-red-800/50 hover:bg-red-900/50 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="card p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Institute</h3>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white">{deleteConfirm.name}</strong>? This will remove all
              their data and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-ghost flex-1">
                Cancel
              </button>
              <button
                onClick={() => handleAction(deleteConfirm._id, 'delete', 'deleted')}
                className="btn-danger flex-1"
                disabled={!!actionLoading[deleteConfirm._id]}
              >
                {actionLoading[deleteConfirm._id] ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateInstituteModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchInstitutes();
          }}
        />
      )}
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
