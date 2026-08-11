import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, ToggleRight, ToggleLeft, Edit, Trash2, BookOpen } from 'lucide-react';

// Actions
import { fetchUsers, deleteUser, toggleUserStatus } from '@/features/user/userSlice';

// Components
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingSpinner from '@/components/loadingSpinner';
import Modal from '@/components/Modal';

// Utils
import { formatDate, getRoleBadge, getStatusColor } from '@/utils';
import useDebounce from '@/hooks/useDebounce';

export default function UserList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, pagination, loading } = useSelector((s) => s.users);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Bulk Assignment State
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignType, setAssignType] = useState('course'); // 'course' | 'test'
  const [assignItemId, setAssignItemId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const debouncedSearch = useDebounce(search);

  const loadUsers = useCallback(() => {
    dispatch(
      fetchUsers({
        page,
        limit: 10,
        search: debouncedSearch,
        role: roleFilter,
        sort: sortField,
        order: sortOrder,
      })
    );
  }, [dispatch, page, debouncedSearch, roleFilter, sortField, sortOrder]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await dispatch(deleteUser(deleteTarget));
      setDeleteTarget(null);
      loadUsers();
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'User',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-bold">
            {row.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{row.name}</p>
            <p className="text-xs text-gray-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (val) => <span className={getRoleBadge(val)}>{val}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_, row) => {
        const status = row.isActive !== false ? 'active' : 'inactive';
        return <span className={getStatusColor(status)}>{status}</span>;
      },
    },
    {
      key: 'createdAt',
      label: 'Joined',
      sortable: true,
      render: (val) => formatDate(val),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-display tracking-tight">
            Users
          </h2>
          <p className="mt-1 text-sm font-bold text-gray-500 dark:text-gray-400">
            Manage all platform users and bulk assignments
          </p>
        </div>
        <div className="flex gap-3">
          {selectedUsers.length > 0 && (
            <button
              onClick={() => setAssignModalOpen(true)}
              className="btn-outline gap-2 border-primary-500 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 font-bold"
            >
              <BookOpen className="w-4 h-4" /> Bulk Assign ({selectedUsers.length})
            </button>
          )}
          <button
            onClick={() => navigate('/users/create')}
            className="btn-primary gap-2 font-bold shadow-md"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="input-field w-40 py-2"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={list}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        searchable
        searchValue={search}
        onSearch={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search users..."
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyMessage="No users found"
        emptyIcon={Users}
        selectable={true}
        selectedRows={selectedUsers}
        onSelectRow={(id, selected) => {
          setSelectedUsers((prev) => (selected ? [...prev, id] : prev.filter((uId) => uId !== id)));
        }}
        onSelectAll={(selected) => {
          if (selected) {
            setSelectedUsers(list.map((u) => u._id));
          } else {
            setSelectedUsers([]);
          }
        }}
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => dispatch(toggleUserStatus(row))}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Toggle status"
            >
              {row.status === 'active' ? (
                <ToggleRight className="w-4 h-4 text-emerald-600" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={() => navigate(`/users/${row._id}/edit`)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Edit"
            >
              <Edit className="w-4 h-4 text-blue-600" />
            </button>
            <button
              onClick={() => setDeleteTarget(row._id)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
      />

      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Bulk Assign Content"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Assign content to{' '}
            <span className="font-bold text-primary-600">{selectedUsers.length}</span> selected
            users.
          </p>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Content Type
            </label>
            <select
              value={assignType}
              onChange={(e) => setAssignType(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium focus:ring-2 focus:ring-primary-500"
            >
              <option value="course">Course</option>
              <option value="test">Test Series</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Item ID
            </label>
            <input
              type="text"
              value={assignItemId}
              onChange={(e) => setAssignItemId(e.target.value)}
              placeholder={`Enter ${assignType} ID`}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button onClick={() => setAssignModalOpen(false)} className="btn-outline">
              Cancel
            </button>
            <button
              className="btn-primary font-bold shadow-md"
              disabled={!assignItemId || assigning}
              onClick={() => {
                setAssigning(true);
                // Mock API call for bulk assign
                setTimeout(() => {
                  toast.success(
                    `Successfully assigned ${assignType} to ${selectedUsers.length} users`
                  );
                  setAssigning(false);
                  setAssignModalOpen(false);
                  setSelectedUsers([]);
                }, 1500);
              }}
            >
              {assigning ? 'Assigning...' : 'Assign Content'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
