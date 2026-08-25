import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FolderOpen,
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  BookOpen,
  ClipboardList,
  FileText,
  Users,
  Eye,
  ToggleLeft,
  ToggleRight,
  Bell,
} from 'lucide-react';
import { examCategoriesAPI, coursesAPI } from '@/services/api';
import LoadingSpinner from '@/components/loadingSpinner';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDate } from '@/utils';
import toast from 'react-hot-toast';

export default function CategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('exams');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadCategory = async () => {
    setLoading(true);
    try {
      const res = await examCategoriesAPI.getById(id);
      const payload = res.data?.data || res.data;
      setData(payload);
    } catch (err) {
      toast.error('Failed to load category details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadCategory();
  }, [id]);

  const handleDeleteCategory = async () => {
    try {
      await examCategoriesAPI.delete(id);
      toast.success('Category deleted successfully');
      navigate('/categories');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleToggleCoursePublish = async (courseId) => {
    try {
      await coursesAPI.togglePublish(courseId);
      toast.success('Course publish status updated');
      loadCategory();
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
        <FolderOpen className="w-12 h-12 text-gray-400 mx-auto" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Category Not Found
        </h2>
        <button onClick={() => navigate('/categories')} className="btn-primary">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Categories
        </button>
      </div>
    );
  }

  const {
    category,
    subCategories = [],
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
            onClick={() => navigate('/categories')}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 flex items-center justify-center font-bold text-2xl shadow-inner">
            {category.icon ? (
              <span className="text-2xl">{category.icon}</span>
            ) : (
              <FolderOpen className="w-7 h-7" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{category.name}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  category.isActive !== false
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {category.isActive !== false ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-4">
              <span>
                Slug:{' '}
                <strong className="text-gray-700 dark:text-gray-300 font-mono text-xs">
                  {category.slug}
                </strong>
              </span>
              <span>
                Type:{' '}
                <strong className="capitalize text-gray-700 dark:text-gray-300">
                  {category.type || 'Exam'}
                </strong>
              </span>
              <span>Created: {formatDate(category.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/categories/${category.id || category._id}/edit`)}
            className="btn-primary gap-2"
          >
            <Edit className="w-4 h-4" /> Edit Category
          </button>
          <button onClick={() => setDeleteTarget(true)} className="btn-danger gap-2">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          icon={ClipboardList}
          title="Total Exams"
          value={stats.totalExams ?? subCategories.length}
          color="primary"
          onClick={() => setActiveTab('exams')}
          subtitle="Click to view exams"
        />
        <StatsCard
          icon={BookOpen}
          title="Total Courses"
          value={stats.totalCourses ?? courses.length}
          color="emerald"
          onClick={() => setActiveTab('courses')}
          subtitle="Click to view courses"
        />
        <StatsCard
          icon={FileText}
          title="Mock Tests"
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
          subtitle="Across all courses"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 gap-6">
        {[
          { key: 'exams', label: 'Associated Exams', count: subCategories.length },
          { key: 'courses', label: 'Courses', count: courses.length },
          { key: 'test-series', label: 'Test Series', count: testSeries.length },
          { key: 'tests', label: 'Tests & Quizzes', count: tests.length },
          { key: 'resources', label: 'Free Resources', count: resources.length },
          { key: 'alerts', label: 'Blogs & Job Alerts', count: blogs.length },
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

      {/* Tab 1: Associated Exams */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Exams in this Category
            </h3>
            <button
              onClick={() =>
                navigate(`/exam-categories/create?parentId=${category.id || category._id}`)
              }
              className="btn-primary gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Add Sub-Exam
            </button>
          </div>

          <DataTable
            columns={[
              {
                key: 'name',
                label: 'Exam Name',
                render: (val, row) => {
                  const rowId = row.id || row._id;
                  return (
                    <Link
                      to={`/exam-categories/${rowId}`}
                      className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 hover:underline flex items-center gap-2"
                    >
                      <div className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {val?.charAt(0) || 'E'}
                      </div>
                      {val}
                    </Link>
                  );
                },
              },
              {
                key: 'slug',
                label: 'Slug',
                render: (val) => <span className="font-mono text-xs text-gray-500">{val}</span>,
              },
              {
                key: 'isActive',
                label: 'Status',
                render: (val) => (
                  <span className={`badge ${val !== false ? 'badge-success' : 'badge-neutral'}`}>
                    {val !== false ? 'Active' : 'Inactive'}
                  </span>
                ),
              },
              {
                key: 'createdAt',
                label: 'Created',
                render: (val) => formatDate(val),
              },
            ]}
            data={subCategories}
            emptyMessage="No exams created under this category yet"
            emptyIcon={ClipboardList}
            actions={(row) => {
              const rowId = row.id || row._id;
              return (
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => navigate(`/exam-categories/${rowId}`)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
                    title="View Exam Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/exam-categories/${rowId}/edit`)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
                    title="Edit Exam"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              );
            }}
          />
        </div>
      )}

      {/* Tab 2: Associated Courses */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Courses in this Category
            </h3>
            <button
              onClick={() => navigate('/courses/create')}
              className="btn-primary gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Add New Course
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
                          Instructor: {row.teacher?.name || 'Assigned Teacher'}
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
                label: 'Enrolled Students',
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
              {
                key: 'createdAt',
                label: 'Created',
                render: (val) => formatDate(val),
              },
            ]}
            data={courses}
            emptyMessage="No courses in this category yet"
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
                    title="View Course"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/courses/${rowId}/edit`)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
                    title="Edit Course"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              );
            }}
          />
        </div>
      )}

      {/* Tab 3: Test Series */}
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
              {
                key: 'createdAt',
                label: 'Created',
                render: (val) => formatDate(val),
              },
            ]}
            data={testSeries}
            emptyMessage="No test series created for this category yet"
            emptyIcon={ClipboardList}
            actions={(row) => {
              const rowId = row.id || row._id;
              return (
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => navigate(`/test-series/${rowId}`)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
                    title="View Test Series"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/test-series/${rowId}/edit`)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
                    title="Edit Test Series"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              );
            }}
          />
        </div>
      )}

      {/* Tab 4: Associated Tests */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Mock Tests & Assessments
            </h3>
            <button onClick={() => navigate('/tests/create')} className="btn-primary gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Test
            </button>
          </div>

          <DataTable
            columns={[
              {
                key: 'title',
                label: 'Test Title',
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
                        {row.duration || 60} mins | {row.totalMarks || 100} Marks
                      </p>
                    </div>
                  );
                },
              },
              {
                key: 'totalQuestions',
                label: 'Questions',
                render: (val, row) =>
                  val || (Array.isArray(row.questions) ? row.questions.length : 0),
              },
              {
                key: 'attempts',
                label: 'Student Attempts',
                render: (_, row) => row._count?.attempts || 0,
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
            data={tests}
            emptyMessage="No tests attached to this category yet"
            emptyIcon={ClipboardList}
            actions={(row) => {
              const rowId = row.id || row._id;
              return (
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => navigate(`/tests/${rowId}`)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
                    title="View Test"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/tests/${rowId}/edit`)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
                    title="Edit Test"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              );
            }}
          />
        </div>
      )}

      {/* Tab 5: Free Resources */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Free Study Resources & Notes
            </h3>
            <button onClick={() => navigate('/library')} className="btn-primary gap-2 text-sm">
              <Plus className="w-4 h-4" /> Manage Library
            </button>
          </div>

          <DataTable
            columns={[
              {
                key: 'title',
                label: 'Resource Title',
                render: (val) => <span className="font-medium">{val}</span>,
              },
              {
                key: 'type',
                label: 'Type',
                render: (val) => (
                  <span className="uppercase text-xs font-bold text-gray-500">{val || 'PDF'}</span>
                ),
              },
              {
                key: 'accessLevel',
                label: 'Access Level',
                render: (val) => <span className="badge badge-info">{val || 'Free'}</span>,
              },
            ]}
            data={resources}
            emptyMessage="No free resources tagged for this category yet"
            emptyIcon={FileText}
          />
        </div>
      )}

      {/* Tab 6: Blogs & Job Alerts */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Job Alerts & Blog Articles
            </h3>
            <button onClick={() => navigate('/blogs/create')} className="btn-primary gap-2 text-sm">
              <Plus className="w-4 h-4" /> Create Article / Alert
            </button>
          </div>

          <DataTable
            columns={[
              {
                key: 'title',
                label: 'Title',
                render: (val, row) => {
                  const blogId = row.id || row._id;
                  return (
                    <Link
                      to={`/blogs/${blogId}/edit`}
                      className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 hover:underline"
                    >
                      {val}
                    </Link>
                  );
                },
              },
              {
                key: 'type',
                label: 'Type',
                render: (val) => (
                  <span className="badge badge-info uppercase text-xs">{val || 'Article'}</span>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                render: (val) => (
                  <span
                    className={`badge ${val === 'published' ? 'badge-success' : 'badge-neutral'}`}
                  >
                    {val || 'Draft'}
                  </span>
                ),
              },
              {
                key: 'createdAt',
                label: 'Published Date',
                render: (val) => formatDate(val),
              },
            ]}
            data={blogs}
            emptyMessage="No articles or job alerts tagged for this category yet"
            emptyIcon={Bell}
            actions={(row) => {
              const blogId = row.id || row._id;
              return (
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => navigate(`/blogs/${blogId}/edit`)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
                    title="Edit Blog"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              );
            }}
          />
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message="Are you sure you want to delete this category? Any unassigned courses must be reallocated."
        confirmText="Delete"
      />
    </div>
  );
}
