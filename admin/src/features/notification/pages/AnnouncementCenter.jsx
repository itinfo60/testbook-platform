import { useState } from 'react';
import { Bell, Megaphone, Send, Users } from 'lucide-react';
import { notificationsAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function AnnouncementCenter() {
  const [form, setForm] = useState({
    title: '',
    message: '',
    targetRole: 'all',
    type: 'info',
    priority: 'normal',
    scheduledAt: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState([]);

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

      await notificationsAPI.send(payload);
      toast.success(
        form.scheduledAt
          ? 'Announcement scheduled successfully!'
          : 'Announcement sent successfully!'
      );
      setSent((prev) => [{ ...form, sentAt: new Date().toISOString(), id: Date.now() }, ...prev]);
      setForm({
        title: '',
        message: '',
        targetRole: 'all',
        type: 'info',
        priority: 'normal',
        scheduledAt: '',
      });
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
          Send announcements to users across the platform
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
                <p className="text-sm text-gray-500">Compose and send a notification to users</p>
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
                placeholder="e.g., New Feature Launched!"
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
                rows={5}
                placeholder="Write your announcement message here..."
                required
              />
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

            {/* Type Preview */}
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Preview</p>
              <div
                className={`p-3 rounded-lg ${typeOptions.find((t) => t.value === form.type)?.color || ''}`}
              >
                <p className="font-semibold text-sm">{form.title || 'Announcement Title'}</p>
                <p className="text-sm mt-1 opacity-80">
                  {form.message || 'Your message will appear here...'}
                </p>
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" /> Recent Sent
            </h3>
            {sent.length === 0 ? (
              <div className="text-center py-8">
                <Megaphone className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No announcements sent yet in this session
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sent.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`badge ${typeOptions.find((t) => t.value === item.type)?.color || 'badge-info'}`}
                      >
                        {item.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(item.sentAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">To: {item.targetRole}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Tips</h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-blue-600">1</span>
                </div>
                <p>
                  Use <strong>Info</strong> type for general updates and news.
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
                <p>Target specific roles to avoid spamming everyone.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
