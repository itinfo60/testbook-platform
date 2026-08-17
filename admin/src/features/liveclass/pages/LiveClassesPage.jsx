import { useState, useEffect } from 'react';
import { Video, Clock, Users, Filter, Plus, Edit2, XCircle } from 'lucide-react';
import api from '@/services/api';
import LoadingSpinner from '@/components/loadingSpinner';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  live: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ended: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  cancelled: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function LiveClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [courses, setCourses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    scheduledAt: '',
    durationMinutes: 60,
    meetingUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);

  const load = () => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (statusFilter) params.status = statusFilter;
    api
      .get('/live-classes/admin/all', { params })
      .then(({ data }) => {
        setClasses(data.data?.classes || []);
        setPages(data.data?.pages || 1);
        setTotal(data.data?.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadCourses = () => {
    api
      .get('/admin/courses?limit=100')
      .then(({ data }) => {
        setCourses(data.data?.courses || data.data?.docs || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [page, statusFilter]);

  useEffect(() => {
    loadCourses();
  }, []);

  const handleOpenModal = (cls = null) => {
    if (cls) {
      setEditId(cls._id);
      setFormData({
        title: cls.title || '',
        description: cls.description || '',
        courseId: cls.course?._id || cls.course || '',
        scheduledAt: cls.scheduledAt ? new Date(cls.scheduledAt).toISOString().slice(0, 16) : '',
        durationMinutes: cls.durationMinutes || 60,
        meetingUrl: cls.meetingUrl || '',
      });
    } else {
      setEditId(null);
      setFormData({
        title: '',
        description: '',
        courseId: '',
        scheduledAt: '',
        durationMinutes: 60,
        meetingUrl: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await api.put(`/live-classes/${editId}`, formData);
        toast.success('Class updated successfully');
      } else {
        await api.post('/live-classes', formData);
        toast.success('Class scheduled successfully');
      }
      setIsModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelClass = async () => {
    if (!cancelTarget) return;
    try {
      await api.patch(`/live-classes/${cancelTarget}/cancel`);
      toast.success('Class cancelled successfully');
      setCancelTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Live Classes</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            All live sessions across your institute ({total} total)
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Schedule Class
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex gap-2">
          {['', 'scheduled', 'live', 'ended', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No live classes found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Class
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Teacher
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Scheduled
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Duration
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Participants
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {classes.map((cls) => (
                <tr
                  key={cls._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{cls.title}</p>
                      {cls.course && (
                        <p className="text-xs text-primary-500 mt-0.5">{cls.course.title}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {cls.teacher?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {formatDate(cls.scheduledAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {cls.durationMinutes} min
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      {cls.attendance?.length || 0} / {cls.maxParticipants}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[cls.status] || STATUS_BADGE.ended}`}
                    >
                      {cls.status === 'live' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      )}
                      {cls.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(cls)}
                        className="p-1 text-gray-500 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {cls.status !== 'cancelled' && cls.status !== 'ended' && (
                        <button
                          onClick={() => setCancelTarget(cls._id)}
                          className="p-1 text-gray-500 hover:text-red-600"
                          title="Cancel Class"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editId ? 'Edit Live Class' : 'Schedule Live Class'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="Class Title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows="3"
              placeholder="Description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Course
            </label>
            <select
              value={formData.courseId}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              className="input-field"
            >
              <option value="">Select Course (Optional)</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Scheduled At
              </label>
              <input
                required
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duration (mins)
              </label>
              <input
                required
                type="number"
                min="1"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })
                }
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Meeting URL
            </label>
            <input
              required
              type="url"
              value={formData.meetingUrl}
              onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
              className="input-field"
              placeholder="https://meet.google.com/..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : 'Save Class'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelClass}
        title="Cancel Live Class"
        message="Are you sure you want to cancel this live class? This action cannot be undone."
        confirmText="Cancel Class"
      />
    </div>
  );
}
