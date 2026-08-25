import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Download, GraduationCap, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Actions
import { fetchEnrollments, exportEnrollments } from '@/features/enrollment/enrollmentSlice';

// Components
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import { enrollmentsAPI } from '@/services/api';

// Utils
import { getStatusColor, formatDate, truncate } from '@/utils';
import useDebounce from '@/hooks/useDebounce';

export default function EnrollmentList() {
  const dispatch = useDispatch();
  const { list, pagination, loading, exporting } = useSelector((s) => s.enrollments);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const debouncedSearch = useDebounce(search);

  const load = useCallback(() => {
    dispatch(fetchEnrollments({ page, limit: 10, search: debouncedSearch, status: statusFilter }));
  }, [dispatch, page, debouncedSearch, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = () => {
    dispatch(exportEnrollments({ search: debouncedSearch, status: statusFilter }));
  };

  const handleRevoke = async () => {
    if (!deleteTarget) return;
    try {
      await enrollmentsAPI.revokeEnrollment(deleteTarget);
      toast.success('Enrollment revoked successfully');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke enrollment');
    }
  };

  const columns = [
    {
      key: 'user',
      label: 'Student',
      render: (val) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{val?.name || 'N/A'}</p>
          <p className="text-xs text-gray-500">{val?.email || ''}</p>
        </div>
      ),
    },
    {
      key: 'course',
      label: 'Course',
      render: (val) => truncate(val?.title || 'N/A', 35),
    },
    {
      key: 'progressPercentage',
      label: 'Progress',
      render: (val) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[100px]">
            <div
              className="h-full bg-primary-600 rounded-full transition-all"
              style={{ width: `${val || 0}%` }}
            />
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap">{val || 0}%</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <span className={getStatusColor(val)}>{val || 'active'}</span>,
    },
    {
      key: 'enrolledAt',
      label: 'Enrolled',
      render: (val, row) => formatDate(val || row.createdAt),
    },
    {
      key: 'completedAt',
      label: 'Completed',
      render: (val) => (val ? formatDate(val) : '-'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => setDeleteTarget(row.id || row._id)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 transition-colors"
          title="Revoke Student Course Enrollment"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Enrollments</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Track student enrollment and progress
          </p>
        </div>
        <button onClick={handleExport} disabled={exporting} className="btn-secondary gap-2">
          <Download className="w-4 h-4" /> {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="input-field w-40 py-2"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="expired">Expired</option>
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
        searchPlaceholder="Search enrollments..."
        emptyMessage="No enrollments found"
        emptyIcon={GraduationCap}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleRevoke}
        title="Revoke Enrollment"
        message="Are you sure you want to revoke this enrollment? The student will lose access to this course."
        confirmText="Revoke"
      />
    </div>
  );
}
