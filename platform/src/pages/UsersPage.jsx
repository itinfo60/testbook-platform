import { useEffect, useState, useCallback } from 'react';
import api from '@/api';
import { Search, Users, ShieldCheck, BookOpen, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_STYLES = {
  super_admin: 'bg-purple-900/50 text-purple-400 border-purple-800',
  admin: 'bg-blue-900/50 text-blue-400 border-blue-800',
  teacher: 'bg-green-900/50 text-green-400 border-green-800',
  student: 'bg-gray-800 text-gray-400 border-gray-700',
};

const ROLE_ICONS = {
  super_admin: ShieldCheck,
  admin: ShieldCheck,
  teacher: BookOpen,
  student: GraduationCap,
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', {
        params: { search, role: roleFilter !== 'all' ? roleFilter : undefined, page, limit: LIMIT },
      });
      const data = res.data?.data;
      setUsers(Array.isArray(data) ? data : data?.users || []);
      setTotal(data?.total || data?.pagination?.total || 0);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);
  useEffect(() => {
    fetch();
  }, [fetch]);

  const toggleBan = async (user) => {
    try {
      await api.patch(`/admin/users/${user._id}/toggle-status`);
      toast.success(user.isActive ? 'User banned' : 'User unbanned');
      fetch();
    } catch {
      toast.error('Action failed');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">All Users</h1>
        <p className="text-gray-500 text-sm mt-1">{total} users across all institutes</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            className="input pl-9"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500">
                <th className="text-left px-5 py-3 font-medium">User</th>
                <th className="text-left px-5 py-3 font-medium">Role</th>
                <th className="text-left px-5 py-3 font-medium">Institute</th>
                <th className="text-left px-5 py-3 font-medium">Joined</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-gray-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Users className="h-10 w-10 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500">No users found</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const RoleIcon = ROLE_ICONS[u.role] || Users;
                  return (
                    <tr key={u._id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {u.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROLE_STYLES[u.role] || ROLE_STYLES.student}`}
                        >
                          <RoleIcon className="h-3 w-3" />
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{u.tenantId || '--'}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive !== false ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30'}`}
                        >
                          {u.isActive !== false ? 'Active' : 'Banned'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {u.role !== 'super_admin' && (
                          <button
                            onClick={() => toggleBan(u)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${u.isActive !== false ? 'text-red-400 border-red-800 hover:bg-red-900/20' : 'text-green-400 border-green-800 hover:bg-green-900/20'}`}
                          >
                            {u.isActive !== false ? 'Ban' : 'Unban'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-800">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-ghost text-sm px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page * LIMIT >= total}
                onClick={() => setPage((p) => p + 1)}
                className="btn-ghost text-sm px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
