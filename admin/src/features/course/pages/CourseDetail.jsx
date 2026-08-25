import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  Star,
  StarOff,
  Eye,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  Video,
  FileText,
  Clock,
  IndianRupee,
  Layers,
  Calendar,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { coursesAPI, enrollmentsAPI, reviewsAPI } from '@/services/api';
import LoadingSpinner from '@/components/loadingSpinner';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDate } from '@/utils';
import toast from 'react-hot-toast';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('curriculum');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);

  const loadCourse = async () => {
    setLoading(true);
    try {
      const res = await coursesAPI.getById(id);
      const payload = res.data?.data || res.data;
      setData(payload);
    } catch (err) {
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadCourse();
  }, [id]);

  const handleTogglePublish = async () => {
    try {
      await coursesAPI.togglePublish(id);
      toast.success('Course publish status updated');
      loadCourse();
    } catch {
      toast.error('Failed to toggle publish status');
    }
  };

  const handleToggleFeatured = async () => {
    try {
      await coursesAPI.toggleFeatured(id);
      toast.success('Course featured status updated');
      loadCourse();
    } catch {
      toast.error('Failed to toggle featured status');
    }
  };

  const handleDeleteCourse = async () => {
    try {
      await coursesAPI.delete(id);
      toast.success('Course deleted successfully');
      navigate('/courses');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete course');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleRevokeEnrollment = async () => {
    if (!revokeTarget) return;
    try {
      await enrollmentsAPI.revokeEnrollment(revokeTarget);
      toast.success('Enrollment revoked successfully');
      loadCourse();
    } catch (err) {
      toast.error('Failed to revoke enrollment');
    } finally {
      setRevokeTarget(null);
    }
  };

  const handleToggleReview = async (reviewId) => {
    try {
      await reviewsAPI.approve(reviewId);
      toast.success('Review approval status toggled');
      loadCourse();
    } catch {
      toast.error('Failed to update review status');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await reviewsAPI.delete(reviewId);
      toast.success('Review deleted');
      loadCourse();
    } catch {
      toast.error('Failed to delete review');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data || !data.course) {
    return (
      <div className="text-center py-16 space-y-4">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Course Not Found</h2>
        <button onClick={() => navigate('/courses')} className="btn-primary">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Courses
        </button>
      </div>
    );
  }

  const { course, enrolledStudents = [], reviews = [], liveClasses = [], stats = {} } = data;

  // Parse sections
  let sections = [];
  if (typeof course.sections === 'string') {
    try {
      sections = JSON.parse(course.sections);
    } catch (e) {
      sections = [];
    }
  } else if (Array.isArray(course.sections)) {
    sections = course.sections;
  }

  const totalLessons = sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <button
            onClick={() => navigate('/courses')}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors shrink-0 mt-0.5 sm:mt-0"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {course.thumbnail?.url ? (
            <img
              src={course.thumbnail.url}
              alt={course.title}
              className="w-16 h-12 rounded-xl object-cover shadow-sm border border-gray-200 dark:border-gray-700 shrink-0"
            />
          ) : (
            <div className="w-16 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 flex items-center justify-center font-bold shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {course.title}
              </h1>
              <span
                className={`badge shrink-0 ${course.isPublished ? 'badge-success' : 'badge-warning'}`}
              >
                {course.isPublished ? 'Published' : 'Draft'}
              </span>
              {course.isFeatured && (
                <span className="badge badge-info flex items-center gap-1 shrink-0">
                  <Star className="w-3 h-3 fill-current" /> Featured
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                Teacher:{' '}
                {course.teacherId || course.teacher?.id ? (
                  <Link
                    to={`/teachers/${course.teacherId || course.teacher?.id}`}
                    className="font-bold text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {course.teacher?.name || 'Assigned Teacher'}
                  </Link>
                ) : (
                  <strong className="text-gray-800 dark:text-gray-200">
                    {course.teacher?.name || 'Unassigned'}
                  </strong>
                )}
              </span>
              <span>
                Category:{' '}
                {course.categoryId || course.category?.id ? (
                  <Link
                    to={`/exam-categories/${course.categoryId || course.category?.id}`}
                    className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {course.category?.name || 'General Exam'}
                  </Link>
                ) : (
                  <strong className="text-gray-800 dark:text-gray-200">
                    {course.category?.name || 'General'}
                  </strong>
                )}
              </span>
              <span>
                Price:{' '}
                <strong className="text-emerald-600 font-bold">
                  {course.price > 0 ? `₹${course.price}` : 'Free'}
                </strong>
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls - Strictly Right-Aligned */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end lg:self-center ml-auto">
          <button
            onClick={handleTogglePublish}
            className={`btn-secondary gap-2 text-xs sm:text-sm font-semibold px-3.5 py-2 ${
              course.isPublished
                ? 'text-emerald-600 border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                : ''
            }`}
            title={
              course.isPublished
                ? 'Unpublish Course (Set to Draft)'
                : 'Publish Course Live (Active)'
            }
          >
            {course.isPublished ? (
              <ToggleRight className="w-5 h-5 text-emerald-600" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-gray-400" />
            )}
            <span>{course.isPublished ? 'Published' : 'Draft'}</span>
          </button>
          <button
            onClick={handleToggleFeatured}
            className={`btn-secondary gap-2 text-xs sm:text-sm font-semibold px-3.5 py-2 ${
              course.isFeatured
                ? 'text-amber-600 border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20'
                : ''
            }`}
            title="Toggle Featured"
          >
            {course.isFeatured ? (
              <StarOff className="w-4 h-4 text-amber-500" />
            ) : (
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            )}
            <span>{course.isFeatured ? 'Featured' : 'Feature'}</span>
          </button>
          <button
            onClick={() => navigate(`/courses/${course.id || course._id}/edit`)}
            className="btn-primary gap-2 text-xs sm:text-sm font-semibold px-4 py-2"
          >
            <Edit className="w-4 h-4" /> <span>Edit Course</span>
          </button>
          <button
            onClick={() => setDeleteTarget(true)}
            className="btn-danger gap-2 text-xs sm:text-sm font-semibold px-3.5 py-2"
          >
            <Trash2 className="w-4 h-4" /> <span>Delete</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          title="Enrolled Students"
          value={stats.totalEnrollments ?? enrolledStudents.length}
          color="primary"
          onClick={() => setActiveTab('students')}
          subtitle="Click to view students"
        />
        <StatsCard
          icon={IndianRupee}
          title="Total Revenue"
          value={`₹${(stats.totalRevenue ?? enrolledStudents.length * (course.price || 0)).toLocaleString()}`}
          color="emerald"
          to="/payments"
          subtitle="Click to view payments"
        />
        <StatsCard
          icon={Layers}
          title="Curriculum"
          value={`${sections.length} ${sections.length === 1 ? 'Section' : 'Sections'}`}
          color="amber"
          onClick={() => setActiveTab('curriculum')}
          subtitle={`${totalLessons} Total Lessons`}
        />
        <StatsCard
          icon={Star}
          title="Average Rating"
          value={`${(course.rating || 0).toFixed(1)} / 5.0`}
          color="blue"
          onClick={() => setActiveTab('reviews')}
          subtitle={reviews.length > 0 ? `${reviews.length} Verified Reviews` : '0 Reviews yet'}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 gap-6">
        {[
          { key: 'curriculum', label: 'Curriculum & Lessons', count: totalLessons },
          { key: 'students', label: 'Enrolled Students', count: enrolledStudents.length },
          { key: 'reviews', label: 'Student Reviews', count: reviews.length },
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

      {/* Tab 1: Curriculum */}
      {activeTab === 'curriculum' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Course Syllabus & Curriculum
            </h3>
            <button
              onClick={() => navigate(`/courses/${course.id || course._id}/edit`)}
              className="btn-primary gap-2 text-sm"
            >
              <Edit className="w-4 h-4" /> Edit Curriculum
            </button>
          </div>

          {sections.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <Layers className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No curriculum sections created yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((sec, sIdx) => (
                <div
                  key={sec.id || sIdx}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60 pb-3">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-base">
                        Section {sIdx + 1}: {sec.title}
                      </h4>
                      {sec.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{sec.description}</p>
                      )}
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600">
                      {sec.lessons?.length || 0} Lessons
                    </span>
                  </div>

                  <div className="divide-y dark:divide-gray-700/50">
                    {(sec.lessons || []).map((lesson, lIdx) => (
                      <div
                        key={lesson.id || lIdx}
                        className="py-2.5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-semibold">
                            {lIdx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {lesson.title}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                              {lesson.videoUrl && (
                                <span className="flex items-center gap-1">
                                  <Video className="w-3 h-3" /> Video
                                </span>
                              )}
                              {lesson.duration && <span>{lesson.duration} mins</span>}
                              {lesson.isFree && (
                                <span className="text-emerald-600 font-semibold">Preview Free</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Enrolled Students */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Enrolled Students</h3>
            <span className="text-sm text-gray-500">{enrolledStudents.length} Active Students</span>
          </div>

          <DataTable
            columns={[
              {
                key: 'user',
                label: 'Student',
                render: (_, row) => {
                  const userId = row.user?.id || row.user?._id || row.userId;
                  return (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {row.user?.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        {userId ? (
                          <Link
                            to={`/users/${userId}`}
                            className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
                          >
                            {row.user?.name || 'Student'}
                          </Link>
                        ) : (
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {row.user?.name || 'Student'}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">{row.user?.email}</p>
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
                    <div className="flex justify-between text-xs text-gray-500">
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
                label: 'Enrolled Date',
                render: (val) => formatDate(val),
              },
            ]}
            data={enrolledStudents}
            emptyMessage="No students enrolled in this course yet"
            emptyIcon={Users}
            actions={(row) => (
              <button
                onClick={() => setRevokeTarget(row.id || row._id)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 text-xs font-semibold flex items-center gap-1"
                title="Revoke Student Access"
              >
                <Trash2 className="w-3.5 h-3.5" /> Revoke
              </button>
            )}
          />
        </div>
      )}

      {/* Tab 3: Reviews */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Student Reviews</h3>
            <span className="text-sm text-gray-500">{reviews.length} Reviews Submitted</span>
          </div>

          <DataTable
            columns={[
              {
                key: 'user',
                label: 'Student',
                render: (_, row) => {
                  const userId = row.user?.id || row.user?._id || row.userId;
                  return (
                    <div>
                      {userId ? (
                        <Link
                          to={`/users/${userId}`}
                          className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
                        >
                          {row.user?.name || 'Anonymous'}
                        </Link>
                      ) : (
                        <p className="font-medium text-gray-900 dark:text-white">
                          {row.user?.name || 'Anonymous'}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">{row.user?.email}</p>
                    </div>
                  );
                },
              },
              {
                key: 'rating',
                label: 'Rating',
                render: (val) => (
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
                      {val} / 5
                    </span>
                  </div>
                ),
              },
              {
                key: 'comment',
                label: 'Review Content',
                render: (val) => (
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {val || 'No comment'}
                  </p>
                ),
              },
              {
                key: 'isApproved',
                label: 'Status',
                render: (val) => (
                  <span className={`badge ${val ? 'badge-success' : 'badge-warning'}`}>
                    {val ? 'Approved' : 'Pending'}
                  </span>
                ),
              },
              {
                key: 'createdAt',
                label: 'Date',
                render: (val) => formatDate(val),
              },
            ]}
            data={reviews}
            emptyMessage="No reviews for this course yet"
            emptyIcon={Star}
            actions={(row) => {
              const rowId = row.id || row._id;
              return (
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => handleToggleReview(rowId)}
                    className={`px-2 py-1 rounded text-xs font-semibold ${row.isApproved ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30'}`}
                  >
                    {row.isApproved ? 'Unapprove' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleDeleteReview(rowId)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            }}
          />
        </div>
      )}

      {/* Tab 4: Live Classes */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Scheduled Live Classes
            </h3>
            <button onClick={() => navigate('/live-classes')} className="btn-primary gap-2 text-sm">
              <Plus className="w-4 h-4" /> Schedule Class
            </button>
          </div>

          <DataTable
            columns={[
              {
                key: 'title',
                label: 'Session Title',
                render: (val) => <span className="font-medium">{val}</span>,
              },
              {
                key: 'scheduledAt',
                label: 'Schedule Date & Time',
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
            emptyMessage="No live classes scheduled for this course"
            emptyIcon={Video}
          />
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteCourse}
        title="Delete Course"
        message="Are you sure you want to permanently delete this course and all associated lessons?"
        confirmText="Delete"
      />

      <ConfirmDialog
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevokeEnrollment}
        title="Revoke Student Access"
        message="Are you sure you want to revoke this student's access to the course?"
        confirmText="Revoke Access"
      />
    </div>
  );
}
