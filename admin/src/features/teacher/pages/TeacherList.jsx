import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Users, ShieldCheck, CheckCircle } from 'lucide-react';

// Actions
import { fetchTeachers, verifyTeacher } from '@/features/teacher/teacherSlice';

// Components
import DataTable from '@/components/DataTable';

// Utils
import { getStatusColor, formatDate } from '@/utils';
import useDebounce from '@/hooks/useDebounce';

export default function TeacherList() {
  const dispatch = useDispatch();
  const { list, pagination, loading } = useSelector((s) => s.teachers);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debouncedSearch = useDebounce(search);

  const load = useCallback(() => {
    dispatch(fetchTeachers({
      page,
      limit: 10,
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
    }));
  }, [dispatch, page, debouncedSearch, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleVerify = async (id) => {
    await dispatch(verifyTeacher(id));
    load();
  };



  const columns = [
    {
      key: 'name',
      label: 'Teacher',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-sm font-bold">
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
      key: 'specialization',
      label: 'Specialization',
      render: (_, row) => {
        const specs = row.teacherProfile?.specialization || [];
        return specs.length > 0 ? specs.join(', ') : '-';
      },
    },
    {
      key: 'totalStudents',
      label: 'Students',
      render: (_, row) => row.teacherProfile?.totalStudents || 0,
    },
    {
      key: 'totalEarnings',
      label: 'Earnings',
      render: (_, row) => {
        const earnings = row.teacherProfile?.totalEarnings || 0;
        return `₹${earnings.toLocaleString()}`;
      },
    },
    {
      key: 'verified',
      label: 'Verified',
      render: (_, row) => {
        const isVerified = row.teacherProfile?.isVerified || row.isVerified;
        return (
          <span className={isVerified ? 'badge-success' : 'badge-warning'}>
            {isVerified ? 'Verified' : 'Pending'}
          </span>
        );
      },
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (val, row) => {
        const status = row.status || (val !== false ? 'active' : 'inactive');
        return <span className={getStatusColor(status)}>{status}</span>;
      },
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (val) => formatDate(val),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Teachers</h2>
        <p className="mt-1 text-gray-500 dark:text-gray-400">Manage and verify teachers</p>
      </div>

      <div className="flex gap-3">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-44 py-2">
          <option value="">All Teachers</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
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
        onSearch={(val) => { setSearch(val); setPage(1); }}
        searchPlaceholder="Search teachers..."
        emptyMessage="No teachers found"
        emptyIcon={Users}
        actions={(row) => {
          const isVerified = row.teacherProfile?.isVerified || row.isVerified;
          return (
            <div className="flex items-center justify-end gap-1">
              {isVerified ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <ShieldCheck className="w-4 h-4" /> Verified
                </span>
              ) : (
                <>
                  <button
                    onClick={() => handleVerify(row._id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Verify"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </button>

                </>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}