import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiVideoCamera,
  HiPlus,
  HiPlay,
  HiStop,
  HiPencil,
  HiX,
  HiClock,
  HiUsers,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { courseAPI } from '@/services/api';

function formatDate(d) {
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  live: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ended: 'bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-dark-400',
  cancelled: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const EMPTY_FORM = {
  title: '',
  description: '',
  scheduledAt: '',
  durationMinutes: 60,
  courseId: '',
  maxParticipants: 200,
  isRecorded: false,
  chatEnabled: true,
};

export default function TeacherLiveClasses() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create, else class obj
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api
      .get('/live-classes/my')
      .then(({ data }) => setClasses(data.data?.classes || []))
      .catch(() => toast.error('Failed to load classes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    courseAPI
      .getTeacherCourses()
      .then(({ data }) => setCourses(data.data?.courses || data.courses || []))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (cls) => {
    setEditTarget(cls);
    setForm({
      title: cls.title,
      description: cls.description || '',
      scheduledAt: new Date(cls.scheduledAt).toISOString().slice(0, 16),
      durationMinutes: cls.durationMinutes,
      courseId: cls.course?._id || '',
      maxParticipants: cls.maxParticipants,
      isRecorded: cls.isRecorded,
      chatEnabled: cls.chatEnabled,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.scheduledAt) {
      toast.error('Title and scheduled time are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: Number(form.durationMinutes),
        courseId: form.courseId || undefined,
        maxParticipants: Number(form.maxParticipants),
        isRecorded: form.isRecorded,
        chatEnabled: form.chatEnabled,
      };
      if (editTarget) {
        await api.put(`/live-classes/${editTarget._id}`, payload);
        toast.success('Class updated');
      } else {
        await api.post('/live-classes', payload);
        toast.success('Live class scheduled!');
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStart = async (cls) => {
    try {
      const { data } = await api.post(`/live-classes/${cls._id}/start`);
      toast.success('Class is now live!');
      navigate(`/live-classes/${cls._id}/room`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start');
    }
  };

  const handleEnd = async (cls) => {
    if (!window.confirm('End this live class?')) return;
    try {
      await api.post(`/live-classes/${cls._id}/end`);
      toast.success('Class ended');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark-900 dark:text-white">My Live Classes</h2>
          <p className="text-sm text-dark-500">Schedule and manage your live sessions</p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-2 text-sm">
          <HiPlus className="h-4 w-4" /> Schedule Class
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-dark-100 dark:border-dark-700">
              <h3 className="font-bold text-dark-900 dark:text-white">
                {editTarget ? 'Edit Live Class' : 'Schedule New Class'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700"
              >
                <HiX className="h-5 w-5 text-dark-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="e.g. Chapter 5 — Motion Equations"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                  Description
                </label>
                <textarea
                  className="input-field w-full resize-none"
                  rows={3}
                  placeholder="What will be covered in this session?"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                    Scheduled At *
                  </label>
                  <input
                    type="datetime-local"
                    className="input-field w-full"
                    value={form.scheduledAt}
                    onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    className="input-field w-full"
                    min={15}
                    max={480}
                    value={form.durationMinutes}
                    onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                    Linked Course
                  </label>
                  <select
                    className="input-field w-full"
                    value={form.courseId}
                    onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
                  >
                    <option value="">None (open to all)</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    className="input-field w-full"
                    min={2}
                    max={500}
                    value={form.maxParticipants}
                    onChange={(e) => setForm((f) => ({ ...f, maxParticipants: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-primary-600"
                    checked={form.isRecorded}
                    onChange={(e) => setForm((f) => ({ ...f, isRecorded: e.target.checked }))}
                  />
                  <span className="text-sm text-dark-700 dark:text-dark-300">Enable recording</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-primary-600"
                    checked={form.chatEnabled}
                    onChange={(e) => setForm((f) => ({ ...f, chatEnabled: e.target.checked }))}
                  />
                  <span className="text-sm text-dark-700 dark:text-dark-300">Enable chat</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary flex-1 text-sm"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 text-sm">
                  {submitting ? 'Saving...' : editTarget ? 'Update' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-16 text-dark-400">
          <HiVideoCamera className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No live classes yet. Schedule your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((cls) => (
            <div
              key={cls._id}
              className="bg-white dark:bg-dark-800 rounded-2xl border border-dark-100 dark:border-dark-700 p-4 flex items-center gap-4"
            >
              <div
                className={`flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center ${cls.status === 'live' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-dark-50 dark:bg-dark-700'}`}
              >
                <HiVideoCamera
                  className={`h-5 w-5 ${cls.status === 'live' ? 'text-red-500' : 'text-dark-400'}`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-dark-900 dark:text-white text-sm truncate">
                    {cls.title}
                  </p>
                  <span
                    className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[cls.status]}`}
                  >
                    {cls.status === 'live' && (
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse mr-1" />
                    )}
                    {cls.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-dark-400">
                  <span className="flex items-center gap-1">
                    <HiClock className="h-3.5 w-3.5" /> {formatDate(cls.scheduledAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <HiUsers className="h-3.5 w-3.5" /> {cls.attendance?.length || 0} joined ·{' '}
                    {cls.durationMinutes}min
                  </span>
                </div>
                {cls.course && (
                  <p className="text-xs text-primary-500 mt-0.5">{cls.course.title}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {cls.status === 'scheduled' && (
                  <>
                    <button
                      onClick={() => openEdit(cls)}
                      className="p-2 rounded-lg text-dark-400 hover:text-dark-700 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
                      title="Edit"
                    >
                      <HiPencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleStart(cls)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold"
                    >
                      <HiPlay className="h-3.5 w-3.5" /> Start
                    </button>
                  </>
                )}
                {cls.status === 'live' && (
                  <>
                    <button
                      onClick={() => navigate(`/live-classes/${cls._id}/room`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold"
                    >
                      <HiVideoCamera className="h-3.5 w-3.5" /> Rejoin
                    </button>
                    <button
                      onClick={() => handleEnd(cls)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-100 hover:bg-dark-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-dark-600 dark:text-dark-300 text-xs font-semibold"
                    >
                      <HiStop className="h-3.5 w-3.5" /> End
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
