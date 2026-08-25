import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ClipboardList,
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  BookOpen,
  FileText,
  Users,
  Eye,
  ToggleLeft,
  ToggleRight,
  Bell,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';
import { examCategoriesAPI, coursesAPI, testSeriesAPI } from '@/services/api';
import LoadingSpinner from '@/components/loadingSpinner';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDate } from '@/utils';
import toast from 'react-hot-toast';

export default function ExamCategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadExam = async () => {
    setLoading(true);
    try {
      const res = await examCategoriesAPI.getById(id);
      const payload = res.data?.data || res.data;
      setData(payload);
    } catch (err) {
      toast.error('Failed to load exam details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadExam();
  }, [id]);

  const handleDeleteExam = async () => {
    try {
      await examCategoriesAPI.delete(id);
      toast.success('Exam deleted successfully');
      navigate('/exam-categories');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete exam');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleToggleCoursePublish = async (courseId) => {
    try {
      await coursesAPI.togglePublish(courseId);
      toast.success('Course status updated');
      loadExam();
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data || !data.category) {
    return (
      <div className="text-center py-16 space-y-4">
        <ClipboardList className="w-12 h-12 text-gray-400 mx-auto" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Exam Not Found</h2>
        <button onClick={() => navigate('/exam-categories')} className="btn-primary">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Exams
        </button>
      </div>
    );
  }

  const {
    category: exam,
    courses = [],
    tests = [],
    testSeries = [],
    resources = [],
    blogs = [],
    stats = {},
  } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/exam-categories')}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center font-bold text-2xl shadow-inner">
            {exam.icon ? (
              <span className="text-2xl">{exam.icon}</span>
            ) : (
              <ClipboardList className="w-7 h-7" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{exam.name}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  exam.isActive !== false
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {exam.isActive !== false ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Code / Slug:{' '}
              <code className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                {exam.slug}
              </code>
              {exam.description && <span className="ml-3">{exam.description}</span>}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/exam-categories/${exam.id || exam._id}/edit`)}
            className="btn-secondary gap-2"
          >
            <Edit className="w-4 h-4" /> Edit Exam
          </button>
          <button onClick={() => setDeleteTarget(true)} className="btn-danger gap-2">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          icon={BookOpen}
          title="Courses Targeted"
          value={stats.totalCourses ?? courses.length}
          color="emerald"
          onClick={() => setActiveTab('courses')}
          subtitle="Click to view courses"
        />
        <StatsCard
          icon={ClipboardList}
          title="Test Series Packages"
          value={stats.totalTestSeries ?? testSeries.length}
          color="primary"
          onClick={() => setActiveTab('test-series')}
          subtitle="Click to view series"
        />
        <StatsCard
          icon={FileText}
          title="Mock & Sectional Tests"
          value={stats.totalTests ?? tests.length}
          color="amber"
          onClick={() => setActiveTab('tests')}
          subtitle="Click to view tests"
        />
        <StatsCard
          icon={Users}
          title="Enrolled Students"
          value={stats.totalStudents ?? 0}
          color="blue"
          to="/enrollments"
          subtitle="Total enrollments"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 gap-6">
        {[
          { key: 'courses', label: 'Attached Courses', count: courses.length },
          { key: 'test-series', label: 'Test Series', count: testSeries.length },
          { key: 'tests', label: 'Mock Tests & Quizzes', count: tests.length },
          { key: 'resources', label: 'Study Material', count: resources.length },
          { key: 'alerts', label: 'Job Alerts & Notifications', count: blogs.length },
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

      {/* Tab 1: Courses */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Courses for this Exam
            </h3>
            <button
              onClick={() => navigate('/courses/create')}
              className="btn-primary gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Add Course
            </button>
          </div>

          <DataTable
            columns={[
              {
                key: 'title',
                label: 'Course',
                render: (_, row) => {
                  const courseId = row.id || row._id;
                  return (
                    <div className="flex items-center gap-3">
                      {row.thumbnail?.url ? (
                        <img
                          src={row.thumbnail.url}
                          alt={row.title}
                          className="w-12 h-8 rounded object-cover shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-400 font-semibold shrink-0">
                          Course
                        </div>
                      )}
                      <div>
                        <Link
                          to={`/courses/${courseId}`}
                          className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
                        >
                          {row.title}
                        </Link>
                        <p className="text-xs text-gray-500">
                          Instructor: {row.teacher?.name || 'Assigned'}
                        </p>
                      </div>
                    </div>
                  );
                },
              },
              {
                key: 'price',
                label: 'Price',
                render: (val) =>
                  val > 0 ? (
                    `₹${val}`
                  ) : (
                    <span className="text-emerald-600 font-semibold">Free</span>
                  ),
              },
              {
                key: 'enrollments',
                label: 'Enrolled',
                render: (_, row) => row._count?.enrollments || row.enrolledCount || 0,
              },
              {
                key: 'isPublished',
                label: 'Status',
                render: (val) => (
                  <span className={`badge ${val ? 'badge-success' : 'badge-warning'}`}>
                    {val ? 'Published' : 'Draft'}
                  </span>
                ),
              },
            ]}
            data={courses}
            emptyMessage="No courses attached to this exam yet"
            emptyIcon={BookOpen}
            actions={(row) => {
              const rowId = row.id || row._id;
              return (
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => handleToggleCoursePublish(rowId)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    title={row.isPublished ? 'Unpublish' : 'Publish'}
                  >
                    {row.isPublished ? (
                      <ToggleRight className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => navigate(`/courses/${rowId}`)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/courses/${rowId}/edit`)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              );
            }}
          />
        </div>
      )}

      {/* Tab 2: Test Series */}
      {activeTab === 'test-series' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Test Series Packages
            </h3>
            <button
              onClick={() => navigate('/test-series/create')}
              className="btn-primary gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Add Test Series
            </button>
          </div>

          <DataTable
            columns={[
              {
                key: 'title',
                label: 'Series Title',
                render: (_, row) => {
                  const seriesId = row.id || row._id;
                  return (
                    <div>
                      <Link
                        to={`/test-series/${seriesId}`}
                        className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
                      >
                        {row.title}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {Array.isArray(row.tests)
                          ? `${row.tests.length} Tests included`
                          : 'Package'}
                      </p>
                    </div>
                  );
                },
              },
              {
                key: 'price',
                label: 'Price',
                render: (val) =>
                  val > 0 ? (
                    `₹${val}`
                  ) : (
                    <span className="text-emerald-600 font-semibold">Free</span>
                  ),
              },
              {
                key: 'isPublished',
                label: 'Status',
                render: (val) => (
                  <span className={`badge ${val ? 'badge-success' : 'badge-warning'}`}>
                    {val ? 'Published' : 'Draft'}
                  </span>
                ),
              },
            ]}
            data={testSeries}
            emptyMessage="No test series created for this exam"
            emptyIcon={ClipboardList}
            actions={(row) => {
              const rowId = row.id || row._id;
              return (
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => navigate(`/test-series/${rowId}`)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/test-series/${rowId}/edit`)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              );
            }}
          />
        </div>
      )}

      {/* Tab 3: Tests */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Mock & Sectional Tests
            </h3>
            <button onClick={() => navigate('/tests/create')} className="btn-primary gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Test
            </button>
          </div>

          <DataTable
            columns={[
              {
                key: 'title',
                label: 'Test Name',
                render: (_, row) => {
                  const testId = row.id || row._id;
                  return (
                    <div>
                      <Link
                        to={`/tests/${testId}`}
                        className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
                      >
                        {row.title}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {row.duration || 60} Mins | {row.totalMarks || 100} Marks
                      </p>
                    </div>
                  );
                },
              },
              {
                key: 'questions',
                label: 'Questions',
                render: (_, row) =>
                  Array.isArray(row.questions) ? row.questions.length : row.totalQuestions || 0,
              },
              {
                key: 'attempts',
                label: 'Attempts',
                render: (_, row) => row._count?.attempts || 0,
              },
            ]}
            data={tests}
            emptyMessage="No tests created for this exam yet"
            emptyIcon={ClipboardList}
            actions={(row) => {
              const rowId = row.id || row._id;
              return (
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => navigate(`/tests/${rowId}`)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/tests/${rowId}/edit`)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              );
            }}
          />
        </div>
      )}

      {/* Tab 4: Study Material */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Study Materials & Notes
            </h3>
            <button onClick={() => navigate('/library')} className="btn-primary gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Material
            </button>
          </div>

          <DataTable
            columns={[
              {
                key: 'title',
                label: 'Document Title',
                render: (val) => <span className="font-medium">{val}</span>,
              },
              {
                key: 'type',
                label: 'Type',
                render: (val) => (
                  <span className="uppercase text-xs font-bold text-gray-500">{val || 'PDF'}</span>
                ),
              },
            ]}
            data={resources}
            emptyMessage="No study materials attached to this exam"
            emptyIcon={FileText}
          />
        </div>
      )}

      {/* Tab 5: Job Alerts */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Exam Notifications & Alerts
            </h3>
            <button onClick={() => navigate('/job-alerts')} className="btn-primary gap-2 text-sm">
              <Plus className="w-4 h-4" /> Manage Alerts
            </button>
          </div>

          <DataTable
            columns={[
              {
                key: 'title',
                label: 'Notification Title',
                render: (val) => <span className="font-medium">{val}</span>,
              },
              {
                key: 'status',
                label: 'Status',
                render: (val) => (
                  <span className="badge badge-info capitalize">{val || 'Active'}</span>
                ),
              },
              {
                key: 'createdAt',
                label: 'Published',
                render: (val) => formatDate(val),
              },
            ]}
            data={blogs}
            emptyMessage="No job alerts or official notifications posted for this exam"
            emptyIcon={Bell}
          />
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteExam}
        title="Delete Exam"
        message="Are you sure you want to delete this exam category?"
        confirmText="Delete"
      />
    </div>
  );
}
