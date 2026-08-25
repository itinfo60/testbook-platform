import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Users,
  ToggleRight,
  ToggleLeft,
  Edit,
  Trash2,
  BookOpen,
  Eye,
  GraduationCap,
  CheckCircle2,
} from 'lucide-react';

// Actions
import { fetchUsers, deleteUser, toggleUserStatus } from '@/features/user/userSlice';
import { enrollmentsAPI } from '@/services/api';
import toast from 'react-hot-toast';

// Components
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingSpinner from '@/components/loadingSpinner';
import Modal from '@/components/Modal';

// Utils
import { formatDate, getStatusColor } from '@/utils';
import useDebounce from '@/hooks/useDebounce';

export default function UserList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, pagination, loading } = useSelector((s) => s.users);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('student');
  const [statusFilter, setStatusFilter] = useState(''); // '' = all, 'true' = active, 'false' = inactive
  const [verificationFilter, setVerificationFilter] = useState(''); // '' = all, 'true' = verified, 'false' = unverified
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
        role: roleFilter || 'student',
        // pass isActive explicitly so backend shows inactive when selected
        ...(statusFilter !== '' && { isActive: statusFilter === 'true' }),
        ...(verificationFilter !== '' && { isEmailVerified: verificationFilter === 'true' }),
        sort: sortField,
        order: sortOrder,
      })
    );
  }, [
    dispatch,
    page,
    debouncedSearch,
    roleFilter,
    statusFilter,
    verificationFilter,
    sortField,
    sortOrder,
  ]);

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
      label: 'Student',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-bold shrink-0">
            {row.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 dark:text-white truncate">{row.name}</p>
              {row.isEmailVerified ? (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  title="Email Verified"
                >
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                  title="Email Not Verified"
                >
                  Unverified
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Account Status',
      sortable: true,
      render: (_, row) => {
        const isActive = row.isActive !== false;
        return (
          <span className={getStatusColor(isActive ? 'active' : 'inactive')}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Joined Date',
      sortable: true,
      render: (val) => formatDate(val),
    },
  ];

  // Student KPIs
  const totalStudents = pagination?.total || list.length;
  const activeStudents = list.filter((u) => u.isActive !== false).length;
  const verifiedStudents = list.filter((u) => u.isEmailVerified === true).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-display tracking-tight">
            Students Management
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            Manage student registrations, profile histories, enrollments, and progress
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {selectedUsers.length > 0 && (
            <button
              onClick={() => setAssignModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-300 dark:border-primary-700/60 hover:bg-primary-100 transition-all shadow-sm shrink-0"
              title={`Assign courses or test series to ${selectedUsers.length} selected students`}
            >
              <BookOpen className="w-4 h-4 shrink-0 text-primary-600 dark:text-primary-400" />
              <span>Bulk Assign</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-primary-600 text-white font-bold">
                {selectedUsers.length}
              </span>
            </button>
          )}
          <button
            onClick={() => navigate('/users/create')}
            className="btn-primary gap-2 font-bold shadow-md shrink-0"
            title="Register a new student account"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => {
            setStatusFilter('');
            setVerificationFilter('');
            setPage(1);
          }}
          className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between cursor-pointer hover:border-primary-300 transition-all"
        >
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Students
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalStudents}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => {
            setStatusFilter(statusFilter === 'true' ? '' : 'true');
            setPage(1);
          }}
          className={`p-4 rounded-2xl bg-white dark:bg-gray-800 border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
            statusFilter === 'true'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Active Students
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {activeStudents}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center font-bold">
            <ToggleRight className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => {
            setVerificationFilter(verificationFilter === 'true' ? '' : 'true');
            setPage(1);
          }}
          className={`p-4 rounded-2xl bg-white dark:bg-gray-800 border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
            verificationFilter === 'true'
              ? 'border-blue-500 ring-2 ring-blue-500/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Verified Accounts
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {verifiedStudents}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="input-field w-44 py-2"
          title="Filter by student active status"
        >
          <option value="">All Account Statuses</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive (Deactivated)</option>
        </select>

        <select
          value={verificationFilter}
          onChange={(e) => {
            setVerificationFilter(e.target.value);
            setPage(1);
          }}
          className="input-field w-48 py-2"
          title="Filter by email verification status"
        >
          <option value="">All Verification Status</option>
          <option value="true">Verified Email Only</option>
          <option value="false">Unverified Email Only</option>
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
        searchPlaceholder="Search users by name or email..."
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyMessage="No users found"
        emptyIcon={Users}
        selectable={true}
        selectedRows={selectedUsers}
        onSelectRow={(id, isChecked) => {
          setSelectedUsers((prev) => {
            const shouldAdd = isChecked !== undefined ? isChecked : !prev.includes(id);
            return shouldAdd
              ? prev.includes(id)
                ? prev
                : [...prev, id]
              : prev.filter((uId) => uId !== id);
          });
        }}
        onSelectAll={(selected) => {
          if (selected) {
            setSelectedUsers(list.map((u) => u.id || u._id));
          } else {
            setSelectedUsers([]);
          }
        }}
        actions={(row) => {
          const rowId = row.id || row._id;
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => navigate(`/users/${rowId}`)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 transition-colors"
                title="View Full Student Profile & Enrollments"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => dispatch(toggleUserStatus(row))}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={row.isActive !== false ? 'Deactivate User' : 'Activate User'}
              >
                {row.isActive !== false ? (
                  <ToggleRight className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <button
                onClick={() => navigate(`/users/${rowId}/edit`)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Edit User Profile"
              >
                <Edit className="w-4 h-4 text-blue-600" />
              </button>
              <button
                onClick={() => setDeleteTarget(rowId)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Delete User Account"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          );
        }}
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
              onClick={async () => {
                setAssigning(true);
                try {
                  await enrollmentsAPI.bulkAssign({
                    userIds: selectedUsers,
                    entityId: assignItemId,
                    entityType: assignType,
                  });
                  toast.success(
                    `Successfully assigned ${assignType} to ${selectedUsers.length} users`
                  );
                  setAssignModalOpen(false);
                  setSelectedUsers([]);
                } catch (error) {
                  // Handled by axios interceptor
                } finally {
                  setAssigning(false);
                }
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
