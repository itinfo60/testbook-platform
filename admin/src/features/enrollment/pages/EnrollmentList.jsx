import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Download,
  GraduationCap,
  Trash2,
  Eye,
  User,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  CreditCard,
  ShieldCheck,
  Layers,
  IndianRupee,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Actions
import { fetchEnrollments, exportEnrollments } from '@/features/enrollment/enrollmentSlice';

// Components
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import Modal from '@/components/Modal';
import StatsCard from '@/components/StatsCard';
import { enrollmentsAPI } from '@/services/api';

// Utils
import { getStatusColor, formatDate, formatCurrency, truncate } from '@/utils';
import useDebounce from '@/hooks/useDebounce';

export default function EnrollmentList() {
  const dispatch = useDispatch();
  const { list, stats, pagination, loading, exporting } = useSelector((s) => s.enrollments);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const debouncedSearch = useDebounce(search);

  const load = useCallback(() => {
    dispatch(
      fetchEnrollments({
        page,
        limit: 10,
        search: debouncedSearch,
        status: statusFilter,
        type: typeFilter !== 'all' ? typeFilter : undefined,
      })
    );
  }, [dispatch, page, debouncedSearch, statusFilter, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = () => {
    dispatch(
      exportEnrollments({
        search: debouncedSearch,
        status: statusFilter,
        type: typeFilter !== 'all' ? typeFilter : undefined,
      })
    );
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
      label: 'Product Enrolled',
      render: (val, row) => {
        const title = val?.title || row.testSeries?.title || row.product?.title || 'N/A';
        const isSeries = row.type === 'test_series' || row.productType === 'Test Series';
        return (
          <div className="max-w-[240px]">
            <p className="font-medium text-gray-900 dark:text-white truncate" title={title}>
              {title}
            </p>
            <span
              className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                isSeries
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              }`}
            >
              {isSeries ? 'Test Series' : 'Course'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'progressPercentage',
      label: 'Progress / Access',
      render: (val, row) => {
        const isSeries = row.type === 'test_series' || row.productType === 'Test Series';
        if (isSeries) {
          return (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md">
              Full Pass Unlocked
            </span>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[100px]">
              <div
                className="h-full bg-primary-600 rounded-full transition-all"
                style={{ width: `${val || 0}%` }}
              />
            </div>
            <span className="text-sm text-gray-500 whitespace-nowrap">{val || 0}%</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <span className={getStatusColor(val)}>{val || 'active'}</span>,
    },
    {
      key: 'enrolledAt',
      label: 'Enrolled Date',
      render: (val, row) => formatDate(val || row.createdAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewTarget(row)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-primary-600 transition-colors"
            title="View Enrollment Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row.id || row._id)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 transition-colors"
            title="Revoke Student Enrollment"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Enrollments</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Track student enrollments across Courses and Test Series in one single dashboard
          </p>
        </div>
        <button onClick={handleExport} disabled={exporting} className="btn-secondary gap-2">
          <Download className="w-4 h-4" /> {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* KPI Cards across different areas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          icon={GraduationCap}
          title="Total Enrollments"
          value={stats?.total ?? list.length}
          color="primary"
          subtitle="All platform enrollments"
          onClick={() => {
            setTypeFilter('all');
            setPage(1);
          }}
        />
        <StatsCard
          icon={BookOpen}
          title="Course Enrollments"
          value={stats?.courses ?? list.filter((e) => e.type === 'course').length}
          color="blue"
          subtitle="Click to filter courses"
          onClick={() => {
            setTypeFilter('course');
            setPage(1);
          }}
        />
        <StatsCard
          icon={Layers}
          title="Test Series Passes"
          value={stats?.testSeries ?? list.filter((e) => e.type === 'test_series').length}
          color="violet"
          subtitle="Click to filter test series"
          onClick={() => {
            setTypeFilter('test_series');
            setPage(1);
          }}
        />
        <StatsCard
          icon={Users}
          title="Unique Students"
          value={stats?.uniqueStudents ?? new Set(list.map((e) => e.userId)).size}
          color="emerald"
          subtitle="Distinct enrolled learners"
        />
        <StatsCard
          icon={IndianRupee}
          title="Enrolled Revenue"
          value={formatCurrency(
            stats?.totalRevenue ?? list.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
          )}
          color="amber"
          subtitle="Total enrollment value"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="inline-flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          <button
            onClick={() => {
              setTypeFilter('all');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              typeFilter === 'all'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            All Enrollments
          </button>
          <button
            onClick={() => {
              setTypeFilter('course');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              typeFilter === 'course'
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => {
              setTypeFilter('test_series');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              typeFilter === 'test_series'
                ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Test Series
          </button>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="input-field w-40 py-1.5 text-xs"
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

      {/* ── View Enrollment Details Modal ── */}
      <Modal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="Enrollment Details"
        size="lg"
      >
        {viewTarget && (
          <div className="space-y-6">
            {/* Student & Course Quick Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-primary-600 dark:text-primary-400 uppercase">
                  <User className="w-4 h-4" /> Student Profile
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base">
                  {viewTarget.user?.name || 'Unknown Student'}
                </h4>
                <p className="text-xs text-gray-500 font-mono">
                  {viewTarget.user?.email || 'No email attached'}
                </p>
                <div className="text-[11px] text-gray-400">
                  User ID:{' '}
                  <span className="font-mono text-gray-600 dark:text-gray-300">
                    {viewTarget.userId}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  <BookOpen className="w-4 h-4" />{' '}
                  {viewTarget.type === 'test_series' ? 'Test Series Details' : 'Course Details'}
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base">
                  {viewTarget.title ||
                    viewTarget.course?.title ||
                    viewTarget.testSeries?.title ||
                    'Product'}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    {viewTarget.paymentStatus === 'free' || viewTarget.amount === 0
                      ? 'FREE ENROLLMENT'
                      : `PAID (₹${viewTarget.amount})`}
                  </span>
                  <span className="text-xs font-bold text-gray-500">
                    Status:{' '}
                    <span className={getStatusColor(viewTarget.status)}>{viewTarget.status}</span>
                  </span>
                </div>
                <div className="text-[11px] text-gray-400">
                  {viewTarget.type === 'test_series' ? 'Test Series ID: ' : 'Course ID: '}
                  <span className="font-mono text-gray-600 dark:text-gray-300">
                    {viewTarget.testSeries?.id || viewTarget.courseId || viewTarget.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Learning Progress & Timestamps */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">
                  <CheckCircle className="w-4 h-4" />{' '}
                  {viewTarget.type === 'test_series' ? 'Pass Access' : 'Curriculum Progress'}
                </div>
                <span className="text-sm font-extrabold text-gray-900 dark:text-white">
                  {viewTarget.type === 'test_series'
                    ? 'Full Access Unlocked'
                    : `${viewTarget.progressPercentage || 0}% Completed`}
                </span>
              </div>

              {viewTarget.type !== 'test_series' && (
                <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full transition-all"
                    style={{ width: `${viewTarget.progressPercentage || 0}%` }}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <span className="text-gray-400 block">Enrolled Date</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {formatDate(viewTarget.enrolledAt || viewTarget.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Completion Date</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {viewTarget.completedAt ? formatDate(viewTarget.completedAt) : 'In Progress'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Completed Lessons</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {viewTarget.completedLessons?.length || 0} Lessons
                  </span>
                </div>
              </div>
            </div>

            {/* Payment & Order Tracking */}
            {(() => {
              const isSeries = viewTarget.type === 'test_series';
              // For test_series the paymentId field holds an object built in the API
              const payObj = isSeries ? viewTarget.paymentId : null;
              const paymentRef =
                payObj?.paymentId ||
                payObj?.id ||
                (typeof viewTarget.paymentId === 'string' ? viewTarget.paymentId : null);
              const orderRef = payObj?.orderId || viewTarget.orderId || null;
              const isFree =
                !viewTarget.amount ||
                viewTarget.amount === 0 ||
                viewTarget.paymentStatus === 'free';

              return (
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">
                    <CreditCard className="w-4 h-4" /> Transaction Reference
                  </div>

                  {isFree ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-block text-xs font-bold px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                        ✓ Free Enrollment — No payment required
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400">Payment ID:</span>{' '}
                        <span className="font-mono font-medium text-gray-700 dark:text-gray-300">
                          {paymentRef || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Order ID:</span>{' '}
                        <span className="font-mono font-medium text-gray-700 dark:text-gray-300">
                          {orderRef || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Amount Paid:</span>{' '}
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          ₹{viewTarget.amount?.toLocaleString('en-IN') || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Gateway:</span>{' '}
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {payObj?.provider === 'razorpay' || paymentRef?.startsWith('pay_')
                            ? 'Razorpay'
                            : 'Online'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}
