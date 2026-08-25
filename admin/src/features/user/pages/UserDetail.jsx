import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users,
  ArrowLeft,
  Edit,
  Trash2,
  BookOpen,
  ClipboardList,
  CheckCircle,
  Clock,
  IndianRupee,
  Mail,
  Phone,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Award,
} from 'lucide-react';
import { usersAPI } from '@/services/api';
import LoadingSpinner from '@/components/loadingSpinner';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDate } from '@/utils';
import toast from 'react-hot-toast';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadUser = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getById(id);
      const payload = res.data?.data || res.data;
      setData(payload?.user || payload);
    } catch (err) {
      toast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadUser();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!data) return;
    const newStatus = !data.isActive;
    try {
      await usersAPI.update(id, { isActive: newStatus });
      toast.success(`User ${newStatus ? 'activated' : 'deactivated'}`);
      loadUser();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await usersAPI.delete(id);
      toast.success('User deleted successfully');
      navigate('/users');
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 space-y-4">
        <Users className="w-12 h-12 text-gray-400 mx-auto" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">User Not Found</h2>
        <button onClick={() => navigate('/users')} className="btn-primary">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users
        </button>
      </div>
    );
  }

  const {
    name,
    email,
    phone,
    role,
    isActive,
    createdAt,
    enrollments = [],
    testAttempts = [],
    quizAttempts = [],
    payments = [],
    stats = {},
  } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/users')}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 flex items-center justify-center font-bold text-2xl shadow-inner">
            {name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{name}</h1>
              <span
                className={`badge ${role === 'admin' || role === 'super_admin' ? 'badge-danger' : role === 'teacher' ? 'badge-info' : 'badge-success'} capitalize`}
              >
                {role}
              </span>
              <span className={`badge ${isActive !== false ? 'badge-success' : 'badge-neutral'}`}>
                {isActive !== false ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" /> {email}
              </span>
              {phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> {phone}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" /> Joined {formatDate(createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button onClick={handleToggleStatus} className="btn-secondary gap-2">
            {isActive !== false ? (
              <ToggleRight className="w-4 h-4 text-emerald-600" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-gray-400" />
            )}
            {isActive !== false ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => navigate(`/users/${data.id || data._id}/edit`)}
            className="btn-primary gap-2"
          >
            <Edit className="w-4 h-4" /> Edit Profile
          </button>
          <button onClick={() => setDeleteTarget(true)} className="btn-danger gap-2">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          icon={BookOpen}
          title="Courses Enrolled"
          value={stats.totalEnrolled ?? enrollments.length}
          color="primary"
          onClick={() => setActiveTab('courses')}
          subtitle="Click to view enrollments"
        />
        <StatsCard
          icon={CheckCircle}
          title="Completed Courses"
          value={stats.completedCourses ?? 0}
          color="emerald"
          onClick={() => setActiveTab('courses')}
          subtitle="Successfully finished"
        />
        <StatsCard
          icon={ClipboardList}
          title="Tests Taken"
          value={stats.testsAttempted ?? testAttempts.length}
          color="amber"
          onClick={() => setActiveTab('tests')}
          subtitle="Mock assessments"
        />
        <StatsCard
          icon={IndianRupee}
          title="Total Orders Value"
          value={`₹${(stats.totalSpent ?? 0).toLocaleString()}`}
          color="blue"
          onClick={() => setActiveTab('orders')}
          subtitle="Total spend history"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 gap-6">
        {[
          { key: 'courses', label: 'Enrolled Courses', count: enrollments.length },
          { key: 'tests', label: 'Test Attempts', count: testAttempts.length },
          { key: 'quizzes', label: 'Quiz History', count: quizAttempts.length },
          { key: 'orders', label: 'Payment History', count: payments.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === tab.key
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span>{tab.label}</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab 1: Enrolled Courses */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <DataTable
            columns={[
              {
                key: 'course',
                label: 'Course Title',
                render: (_, row) => {
                  const courseId = row.course?.id || row.courseId || row.course?._id;
                  return (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        {courseId ? (
                          <Link
                            to={`/courses/${courseId}`}
                            className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
                          >
                            {row.course?.title || 'Course Details'}
                          </Link>
                        ) : (
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {row.course?.title || 'Course'}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {row.paymentStatus === 'paid' ? 'Paid Enrolled' : 'Free Enrolled'}
                        </p>
                      </div>
                    </div>
                  );
                },
              },
              {
                key: 'progressPercentage',
                label: 'Progress',
                render: (val) => (
                  <div className="w-36 space-y-1">
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                      <span>Completed</span>
                      <span>{Math.round(val || 0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${val || 0}%` }}
                      />
                    </div>
                  </div>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                render: (val) => (
                  <span className={`badge ${val === 'completed' ? 'badge-success' : 'badge-info'}`}>
                    {val || 'active'}
                  </span>
                ),
              },
              {
                key: 'enrolledAt',
                label: 'Enrolled On',
                render: (val) => formatDate(val),
              },
              {
                key: 'actions',
                label: 'Action',
                render: (_, row) => {
                  const courseId = row.course?.id || row.courseId || row.course?._id;
                  return courseId ? (
                    <Link
                      to={`/courses/${courseId}`}
                      className="text-xs font-semibold text-primary-600 hover:underline inline-flex items-center gap-1"
                    >
                      View Course →
                    </Link>
                  ) : null;
                },
              },
            ]}
            data={enrollments}
            emptyMessage="User is not enrolled in any course yet"
            emptyIcon={BookOpen}
          />
        </div>
      )}

      {/* Tab 2: Test Attempts */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <DataTable
            columns={[
              {
                key: 'test',
                label: 'Assessment Title',
                render: (_, row) => {
                  const testId = row.test?.id || row.testId || row.test?._id;
                  return (
                    <div>
                      {testId ? (
                        <Link
                          to={`/tests/${testId}`}
                          className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
                        >
                          {row.test?.title || 'Mock Test'}
                        </Link>
                      ) : (
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {row.test?.title || 'Mock Test'}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Duration: {row.test?.duration || 60} mins
                      </p>
                    </div>
                  );
                },
              },
              {
                key: 'score',
                label: 'Score',
                render: (val, row) => (
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {val ?? 0} / {row.test?.totalMarks || row.totalMarks || 100}
                  </span>
                ),
              },
              {
                key: 'percentage',
                label: 'Percentage',
                render: (val, row) => {
                  const total = row.test?.totalMarks || row.totalMarks || 100;
                  const pct =
                    val !== undefined ? val : Math.round(((row.score || 0) / total) * 100);
                  return <span className="font-medium">{Math.round(pct || 0)}%</span>;
                },
              },
              {
                key: 'status',
                label: 'Status',
                render: (val) => (
                  <span className="badge badge-success capitalize">{val || 'Completed'}</span>
                ),
              },
              {
                key: 'startedAt',
                label: 'Attempt Date',
                render: (val, row) => formatDate(val || row.createdAt),
              },
            ]}
            data={testAttempts}
            emptyMessage="No mock tests attempted yet"
            emptyIcon={ClipboardList}
          />
        </div>
      )}

      {/* Tab 3: Quizzes */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          <DataTable
            columns={[
              {
                key: 'quiz',
                label: 'Quiz Title',
                render: (_, row) => {
                  const quizId = row.quiz?.id || row.quizId || row.quiz?._id;
                  return (
                    <div>
                      {quizId ? (
                        <Link
                          to={`/quizzes/${quizId}`}
                          className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
                        >
                          {row.quiz?.title || 'Quiz Session'}
                        </Link>
                      ) : (
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {row.quiz?.title || 'Quiz Session'}
                        </p>
                      )}
                    </div>
                  );
                },
              },
              {
                key: 'score',
                label: 'Score Earned',
                render: (val) => <span className="font-bold text-emerald-600">{val || 0} pts</span>,
              },
              {
                key: 'createdAt',
                label: 'Attempted At',
                render: (val) => formatDate(val),
              },
            ]}
            data={quizAttempts}
            emptyMessage="No quizzes taken yet"
            emptyIcon={Award}
          />
        </div>
      )}

      {/* Tab 4: Payments */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <DataTable
            columns={[
              {
                key: 'amount',
                label: 'Amount Paid',
                render: (val, row) => (
                  <span className="font-bold text-gray-900 dark:text-white">
                    ₹{val}{' '}
                    <span className="text-xs text-gray-400 font-normal">
                      ({row.currency || 'INR'})
                    </span>
                  </span>
                ),
              },
              {
                key: 'transactionId',
                label: 'Transaction / Order ID',
                render: (val, row) => {
                  const ref = val || row.orderId || '—';
                  return (
                    <Link
                      to={`/payments?search=${encodeURIComponent(ref)}`}
                      className="font-mono text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {ref}
                    </Link>
                  );
                },
              },
              {
                key: 'status',
                label: 'Status',
                render: (val) => (
                  <span
                    className={`badge ${
                      val === 'completed'
                        ? 'badge-success'
                        : val === 'failed'
                          ? 'badge-danger'
                          : 'badge-warning'
                    }`}
                  >
                    {val || 'Pending'}
                  </span>
                ),
              },
              {
                key: 'createdAt',
                label: 'Transaction Date',
                render: (val) => formatDate(val),
              },
            ]}
            data={payments}
            emptyMessage="No transaction records found for this user"
            emptyIcon={IndianRupee}
          />
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message="Are you sure you want to delete this user account and revoke all enrollments?"
        confirmText="Delete"
      />
    </div>
  );
}
