import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users,
  ArrowLeft,
  Edit,
  Trash2,
  BookOpen,
  IndianRupee,
  Video,
  Eye,
  Mail,
  Phone,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Plus,
  Award,
} from 'lucide-react';
import { teachersAPI, coursesAPI } from '@/services/api';
import LoadingSpinner from '@/components/loadingSpinner';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDate } from '@/utils';
import toast from 'react-hot-toast';

export default function TeacherDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadTeacher = async () => {
    setLoading(true);
    try {
      const res = await teachersAPI.getById(id);
      const payload = res.data?.data || res.data;
      setData(payload);
    } catch (err) {
      toast.error('Failed to load teacher profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadTeacher();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!data?.teacher) return;
    const newStatus = !data.teacher.isActive;
    try {
      await teachersAPI.toggleStatus(id, newStatus);
      toast.success(`Teacher ${newStatus ? 'activated' : 'deactivated'}`);
      loadTeacher();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteTeacher = async () => {
    try {
      await teachersAPI.delete(id);
      toast.success('Teacher deactivated');
      navigate('/teachers');
    } catch {
      toast.error('Failed to delete teacher');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleToggleCoursePublish = async (courseId) => {
    try {
      await coursesAPI.togglePublish(courseId);
      toast.success('Course status updated');
      loadTeacher();
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

  if (!data || !data.teacher) {
    return (
      <div className="text-center py-16 space-y-4">
        <Users className="w-12 h-12 text-gray-400 mx-auto" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Teacher Not Found
        </h2>
        <button onClick={() => navigate('/teachers')} className="btn-primary">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Teachers
        </button>
      </div>
    );
  }

  const { teacher, courses = [], liveClasses = [], stats = {} } = data;
  const profile =
    typeof teacher.teacherProfile === 'string'
      ? JSON.parse(teacher.teacherProfile)
      : teacher.teacherProfile || {};
  const specs = profile.specialization || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/teachers')}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold text-2xl shadow-inner">
            {teacher.avatar?.url ? (
              <img
                src={teacher.avatar.url}
                alt={teacher.name}
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              teacher.name?.charAt(0)?.toUpperCase() || 'T'
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{teacher.name}</h1>
              <span
                className={`badge ${teacher.isActive !== false ? 'badge-success' : 'badge-neutral'}`}
              >
                {teacher.isActive !== false ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" /> {teacher.email}
              </span>
              {teacher.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> {teacher.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" /> Joined{' '}
                {formatDate(teacher.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button onClick={handleToggleStatus} className="btn-secondary gap-2">
            {teacher.isActive !== false ? (
              <ToggleRight className="w-4 h-4 text-emerald-600" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-gray-400" />
            )}
            {teacher.isActive !== false ? 'Deactivate' : 'Activate'}
          </button>
          <button onClick={() => setDeleteTarget(true)} className="btn-danger gap-2">
            <Trash2 className="w-4 h-4" /> Remove Teacher
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          icon={BookOpen}
          label="Total Courses"
          value={stats.totalCourses ?? courses.length}
          color="emerald"
        />
        <StatsCard
          icon={Users}
          label="Students Taught"
          value={stats.totalStudents ?? 0}
          color="primary"
        />
        <StatsCard
          icon={IndianRupee}
          label="Total Revenue Generated"
          value={`₹${(stats.totalRevenue ?? 0).toLocaleString()}`}
          color="amber"
        />
        <StatsCard
          icon={Video}
          label="Live Classes Hosted"
          value={stats.totalLiveClasses ?? liveClasses.length}
          color="blue"
        />
      </div>

      {/* Teacher Profile & Specializations */}
      {(profile.bio || specs.length > 0 || profile.experience) && (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-primary-600" /> Teacher Credentials & Bio
          </h3>
          {profile.bio && <p className="text-sm text-gray-600 dark:text-gray-300">{profile.bio}</p>}
          {specs.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-gray-500">Specializations:</span>
              <div className="flex flex-wrap gap-1.5">
                {specs.map((s, idx) => (
                  <span key={idx} className="badge badge-info text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 gap-6">
        {[
          { key: 'courses', label: 'Courses Created', count: courses.length },
          { key: 'live', label: 'Live Classes', count: liveClasses.length },
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
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Courses Authored</h3>
            <button
              onClick={() => navigate('/courses/create')}
              className="btn-primary gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Create Course for Teacher
            </button>
          </div>

          <DataTable
            columns={[
              {
                key: 'title',
                label: 'Course',
                render: (_, row) => (
                  <div className="flex items-center gap-3">
                    {row.thumbnail?.url ? (
                      <img
                        src={row.thumbnail.url}
                        alt={row.title}
                        className="w-12 h-8 rounded object-cover shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-400 font-semibold">
                        Course
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{row.title}</p>
                      <p className="text-xs text-gray-500">{row.category?.name || 'General'}</p>
                    </div>
                  </div>
                ),
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
                render: (_, row) => row._count?.enrollments || 0,
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
            emptyMessage="No courses created by this teacher yet"
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

      {/* Tab 2: Live Classes */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Live Classes</h3>
            <button onClick={() => navigate('/live-classes')} className="btn-primary gap-2 text-sm">
              <Plus className="w-4 h-4" /> Schedule Class
            </button>
          </div>

          <DataTable
            columns={[
              {
                key: 'title',
                label: 'Class Title',
                render: (val) => <span className="font-medium">{val}</span>,
              },
              {
                key: 'scheduledAt',
                label: 'Scheduled At',
                render: (val) => formatDate(val),
              },
              {
                key: 'duration',
                label: 'Duration',
                render: (val) => `${val || 60} mins`,
              },
              {
                key: 'status',
                label: 'Status',
                render: (val) => (
                  <span className="badge badge-info capitalize">{val || 'Scheduled'}</span>
                ),
              },
            ]}
            data={liveClasses}
            emptyMessage="No live classes scheduled for this teacher"
            emptyIcon={Video}
          />
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTeacher}
        title="Remove Teacher"
        message="Are you sure you want to deactivate this teacher account?"
        confirmText="Deactivate"
      />
    </div>
  );
}
