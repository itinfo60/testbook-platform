import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Megaphone,
  Send,
  Users,
  Link as LinkIcon,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { notificationsAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function AnnouncementCenter() {
  const [form, setForm] = useState({
    title: '',
    message: '',
    url: '',
    targetRole: 'all',
    type: 'info',
    priority: 'normal',
    scheduledAt: '',
  });
  const [sending, setSending] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [sent, setSent] = useState([]);

  const quickLinks = [
    { label: 'Courses Page', path: '/courses' },
    { label: 'Test Series', path: '/tests' },
    { label: 'Live Classes', path: '/live-classes' },
    { label: 'Daily Quiz', path: '/daily-quiz' },
    { label: 'Blog & News', path: '/blog' },
    { label: 'Free Library', path: '/free-resources' },
  ];

  const fetchRecent = useCallback(async () => {
    setLoadingRecent(true);
    try {
      const res = await notificationsAPI.getAnnouncements({ limit: 15 });
      const data = res.data?.data || res.data || {};
      setSent(data.announcements || []);
    } catch (err) {
      console.warn('Failed to load recent announcements:', err);
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) {
      toast.error('Title and message are required');
      return;
    }
    setSending(true);
    try {
      const payload = { ...form };
      payload.targetRoles = [payload.targetRole];
      delete payload.targetRole;
      if (!payload.scheduledAt) delete payload.scheduledAt;

      // Pass both url and link for backend compatibility
      if (payload.url) {
        payload.url = payload.url.trim();
        payload.link = payload.url;
      } else {
        delete payload.url;
        delete payload.link;
      }

      await notificationsAPI.send(payload);
      toast.success(
        form.scheduledAt
          ? 'Announcement scheduled successfully!'
          : 'Announcement sent successfully!'
      );
      setForm({
        title: '',
        message: '',
        url: '',
        targetRole: 'all',
        type: 'info',
        priority: 'normal',
        scheduledAt: '',
      });
      // Refresh list from database
      await fetchRecent();
    } catch (err) {
      // handled by interceptor
    } finally {
      setSending(false);
    }
  };

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const typeOptions = [
    {
      value: 'info',
      label: 'Info',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
      value: 'success',
      label: 'Success',
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    {
      value: 'warning',
      label: 'Warning',
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    },
    {
      value: 'error',
      label: 'Urgent',
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Announcement Center</h2>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Send broadcast announcements and redirectable notifications to platform users
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="card p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <Megaphone className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  New Announcement
                </h3>
                <p className="text-sm text-gray-500">
                  Compose and send an interactive notification to users
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={handleChange('title')}
                className="input-field"
                placeholder="e.g., New UPSC Crash Course Available!"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message *
              </label>
              <textarea
                value={form.message}
                onChange={handleChange('message')}
                className="input-field"
                rows={4}
                placeholder="Write your announcement message here..."
                required
              />
            </div>

            {/* Action / Redirect URL Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4 text-primary-500" />
                  <span>Action / Redirect URL (Optional)</span>
                </label>
                <span className="text-xs text-gray-500">
                  Redirects user upon clicking notification
                </span>
              </div>
              <input
                type="text"
                value={form.url}
                onChange={handleChange('url')}
                className="input-field"
                placeholder="e.g., /courses/upsc-course-slug or https://..."
              />

              {/* Quick shortcut chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-xs text-gray-400 mr-1">Quick paths:</span>
                {quickLinks.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, url: item.path }))}
                    className={`text-xs px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                      form.url === item.path
                        ? 'bg-primary-50 text-primary-700 border-primary-300 dark:bg-primary-950/50 dark:text-primary-300 dark:border-primary-700'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Target Audience
                </label>
                <select
                  value={form.targetRole}
                  onChange={handleChange('targetRole')}
                  className="input-field"
                >
                  <option value="all">All Users (Students, Teachers, Admins)</option>
                  <option value="student">Students Only</option>
                  <option value="teacher">Teachers Only</option>
                  <option value="admin">Admins Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Broadcast Type
                </label>
                <select value={form.type} onChange={handleChange('type')} className="input-field">
                  {typeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Priority Level
                </label>
                <select
                  value={form.priority}
                  onChange={handleChange('priority')}
                  className="input-field"
                >
                  <option value="low">Low (Standard update)</option>
                  <option value="normal">Normal (Regular announcement)</option>
                  <option value="high">High (Urgent alert / banner)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Schedule Send (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={handleChange('scheduledAt')}
                  className="input-field cursor-pointer"
                />
              </div>
            </div>

            {/* Type & Redirect Live Preview */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                User Notification Preview
              </p>
              <div
                className={`p-4 rounded-xl shadow-sm ${typeOptions.find((t) => t.value === form.type)?.color || ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm">{form.title || 'Announcement Title'}</p>
                  {form.url && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-white/70 dark:bg-black/30 shadow-xs">
                      View <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <p className="text-xs mt-1 opacity-90 leading-relaxed">
                  {form.message || 'Your message will appear here...'}
                </p>
                {form.url && (
                  <p className="text-[11px] mt-2.5 font-medium opacity-80 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" /> Redirects to:{' '}
                    <span className="underline">{form.url}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <Users className="w-4 h-4 inline mr-1" />
                Sending to:{' '}
                <span className="font-medium capitalize">
                  {form.targetRole === 'all' ? 'All Users' : `${form.targetRole}s`}
                </span>
              </p>
              <button type="submit" disabled={sending} className="btn-primary gap-2">
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : 'Send Announcement'}
              </button>
            </div>
          </form>
        </div>

        {/* Recent Announcements */}
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5" /> Recent Sent
              </h3>
              <button
                type="button"
                onClick={fetchRecent}
                disabled={loadingRecent}
                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Refresh recent list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingRecent ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {loadingRecent ? (
              <div className="py-8 text-center">
                <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-gray-500">Loading announcements...</p>
              </div>
            ) : sent.length === 0 ? (
              <div className="text-center py-8">
                <Megaphone className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No announcements sent yet
                </p>
                <p className="text-xs text-gray-400 mt-1">Sent broadcasts will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
                {sent.map((item) => {
                  const itemUrl = item.url || item.link;
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`badge ${typeOptions.find((t) => t.value === item.type)?.color || 'badge-info'}`}
                        >
                          {item.type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {item.sentAt || item.createdAt
                            ? new Date(item.sentAt || item.createdAt).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Just now'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {item.title}
                      </p>
                      {item.message && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {item.message}
                        </p>
                      )}
                      {itemUrl && (
                        <p className="text-[11px] text-primary-600 dark:text-primary-400 mt-1.5 flex items-center gap-1 font-medium truncate">
                          <LinkIcon className="w-3 h-3 flex-shrink-0" /> {itemUrl}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100 dark:border-gray-700/60 text-[11px] text-gray-400">
                        <span>
                          To:{' '}
                          <strong className="font-medium text-gray-600 dark:text-gray-300 capitalize">
                            {item.targetRole || 'All'}
                          </strong>
                        </span>
                        {item.priority && <span className="capitalize">{item.priority}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Tips */}
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Tips</h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-blue-600">1</span>
                </div>
                <p>
                  Add a <strong>Redirect URL</strong> to send students directly to a newly launched
                  course or test series.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-amber-600">2</span>
                </div>
                <p>
                  Use <strong>Warning</strong> for maintenance or schedule changes.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-red-600">3</span>
                </div>
                <p>
                  Use <strong>Urgent</strong> sparingly for critical announcements.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-emerald-600">4</span>
                </div>
                <p>Target specific roles to avoid sending irrelevant notifications.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
