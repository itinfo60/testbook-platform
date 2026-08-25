import { useState, useEffect } from 'react';

import api from '@/services/api';
import { getUnifiedExams } from '@/services/categories';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
  HiCheckCircle,
  HiExternalLink,
  HiEye,
  HiNewspaper,
  HiPencil,
  HiPlus,
  HiSearch,
  HiTrash,
  HiX,
} from 'react-icons/hi';
import { Link } from 'react-router-dom';

export default function TeacherBlogManagement() {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, article, job_alert

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  const initialForm = {
    title: '',
    slug: '',
    type: 'article', // article or job_alert
    examCategory: '',
    excerpt: '',
    content: '',
    tags: '',
    status: 'published',
    coverImage: '',
    organization: '',
    totalVacancies: '',
    applicationStart: '',
    applicationEnd: '',
    examDate: '',
    officialNotificationUrl: '',
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const [blogRes, catList] = await Promise.all([
        api.get('/blogs', { params: { limit: 100 } }),
        getUnifiedExams(),
      ]);
      // API returns ApiResponse.paginated → { data: [...], pagination }
      const raw = blogRes.data?.data;
      const list = Array.isArray(raw) ? raw : raw?.blogs || raw?.docs || [];
      setBlogs(Array.isArray(list) ? list : []);
      setCategories(catList);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleTitleChange = (e) => {
    const title = e.target.value;
    const autoSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    setFormData((prev) => ({
      ...prev,
      title,
      slug: editingId ? prev.slug : autoSlug,
    }));
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialForm);
    setPreviewMode(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditingId(b._id);
    setFormData({
      title: b.title || '',
      slug: b.slug || '',
      type: b.type || 'article',
      examCategory: b.examCategory?._id || b.examCategory || '',
      excerpt: b.excerpt || '',
      content: b.content || '',
      tags: Array.isArray(b.tags) ? b.tags.join(', ') : b.tags || '',
      status: b.status || 'published',
      coverImage: b.coverImage?.url || b.coverImage || '',
      organization: b.jobAlert?.organization || '',
      totalVacancies: b.jobAlert?.totalVacancies || '',
      applicationStart: b.jobAlert?.applicationStart
        ? new Date(b.jobAlert.applicationStart).toISOString().split('T')[0]
        : '',
      applicationEnd: b.jobAlert?.applicationEnd
        ? new Date(b.jobAlert.applicationEnd).toISOString().split('T')[0]
        : '',
      examDate: b.jobAlert?.examDate
        ? new Date(b.jobAlert.examDate).toISOString().split('T')[0]
        : '',
      officialNotificationUrl: b.jobAlert?.officialNotificationUrl || '',
    });
    setPreviewMode(false);
    setIsFormOpen(true);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await api.delete(`/blogs/${id}`);
      toast.success('Post deleted successfully');
      setBlogs((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete post');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Please write some content');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        type: formData.type,
        examCategory: formData.examCategory || undefined,
        excerpt: formData.excerpt.trim(),
        content: formData.content,
        status: formData.status,
        tags: formData.tags
          ? formData.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        coverImage: formData.coverImage ? { url: formData.coverImage } : undefined,
      };

      if (formData.type === 'job_alert') {
        payload.jobAlert = {
          organization: formData.organization.trim(),
          totalVacancies: formData.totalVacancies ? Number(formData.totalVacancies) : undefined,
          applicationStart: formData.applicationStart || undefined,
          applicationEnd: formData.applicationEnd || undefined,
          examDate: formData.examDate || undefined,
          officialNotificationUrl: formData.officialNotificationUrl.trim() || undefined,
        };
      }

      if (editingId) {
        await api.patch(`/blogs/${editingId}`, payload);
        toast.success('Post updated successfully!');
      } else {
        await api.post('/blogs', payload);
        toast.success('Post published successfully!');
      }

      setIsFormOpen(false);
      fetchBlogs();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save post');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBlogs = blogs.filter((b) => {
    const matchesType =
      activeTab === 'all' ||
      (activeTab === 'article' && (b.type === 'article' || !b.type)) ||
      (activeTab === 'job_alert' && b.type === 'job_alert');

    const matchesSearch =
      !searchQuery.trim() ||
      b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.examCategory?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-dark-900 p-6 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">
            <HiNewspaper className="h-4 w-4" /> Content Studio
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white">
            Blogs & Job Alerts
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            Write study strategy articles, current affairs notes, and official exam vacancies.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all text-sm shrink-0"
        >
          <HiPlus className="h-4 w-4" /> Create New Post
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Type Tabs */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-dark-900 p-1.5 rounded-xl border border-slate-200 dark:border-dark-800 shadow-sm w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Posts' },
            { id: 'article', label: 'Articles & Notes' },
            { id: 'job_alert', label: 'Job Alerts' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-dark-300 hover:bg-slate-50 dark:hover:bg-dark-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-xl focus:outline-none focus:border-primary-500 text-dark-900 dark:text-white placeholder-slate-400 shadow-sm"
          />
        </div>
      </div>

      {/* Blogs List Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-dark-900 rounded-2xl border border-dashed border-slate-200 dark:border-dark-800 p-8">
          <HiNewspaper className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-dark-900 dark:text-white mb-1">
            No posts found
          </h3>
          <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
            You haven't created any posts matching this filter. Click below to write your first
            article or job notification.
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 bg-primary-600 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm hover:bg-primary-700 transition-all"
          >
            <HiPlus className="h-4 w-4" /> Create First Post
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBlogs.map((b) => (
            <div
              key={b.id || b._id}
              className="bg-white dark:bg-dark-900 rounded-2xl p-5 border border-slate-200 dark:border-dark-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Badges row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        b.type === 'job_alert'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                          : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                      }`}
                    >
                      {b.type === 'job_alert' ? '📢 Job Alert' : '📰 Article'}
                    </span>

                    {b.examCategory?.name && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-dark-800 dark:text-slate-300 border border-slate-200 dark:border-dark-700">
                        {b.examCategory.name}
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      b.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}
                  >
                    {b.status || 'published'}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-dark-900 dark:text-white line-clamp-2 mb-1.5 leading-snug">
                  {b.title}
                </h3>

                {/* Excerpt */}
                <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed font-normal">
                  {b.excerpt || 'No excerpt provided.'}
                </p>

                {/* Job Alert details micro strip if available */}
                {b.type === 'job_alert' && b.jobAlert && (
                  <div className="bg-slate-50 dark:bg-dark-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-dark-700 text-[11px] mb-4 flex items-center justify-between text-slate-600 dark:text-dark-300">
                    <span className="font-semibold truncate">
                      🏛️ {b.jobAlert.organization || 'Govt Dept'}
                    </span>
                    {b.jobAlert.totalVacancies && (
                      <span className="font-bold text-primary-600 dark:text-primary-400">
                        {b.jobAlert.totalVacancies} Vacancies
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="pt-3 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between">
                <Link
                  to={`/blog/${b.slug || b._id}`}
                  target="_blank"
                  className="text-xs font-semibold text-slate-500 hover:text-primary-600 flex items-center gap-1 transition-colors"
                >
                  <HiExternalLink className="h-3.5 w-3.5" /> View Live
                </Link>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-primary-50 text-slate-600 hover:text-primary-600 dark:bg-dark-800 dark:hover:bg-primary-950/40 transition-colors"
                    title="Edit Post"
                  >
                    <HiPencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(b._id, b.title)}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-dark-800 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete Post"
                  >
                    <HiTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════ POST CREATION / EDIT MODAL ════════ */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-dark-800 shadow-2xl p-6 sm:p-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-800 mb-6">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-dark-900 dark:text-white">
                  {editingId ? 'Edit Post' : 'Create New Article or Job Alert'}
                </h3>
                <p className="text-xs text-slate-500 font-normal">
                  Publish authoritative exam content and live vacancy notifications.
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 text-slate-600 dark:text-dark-300 transition-colors"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'article' })}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    formData.type === 'article'
                      ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-950/30'
                      : 'border-slate-200 dark:border-dark-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-sm text-dark-900 dark:text-white mb-0.5">
                    📰 Article / Study Notes
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    Strategy guides, syllabus deep-dives & subject notes.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'job_alert' })}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    formData.type === 'job_alert'
                      ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30'
                      : 'border-slate-200 dark:border-dark-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-sm text-dark-900 dark:text-white mb-0.5">
                    📢 Job Alert / Vacancy
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    Official recruitment notices, total posts & exam dates.
                  </div>
                </button>
              </div>

              {/* Title & Exam Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Post Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleTitleChange}
                    placeholder="e.g. RSMSSB Patwari 5,546 Vacancy Notification 2026"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl focus:outline-none focus:border-primary-500 text-dark-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Target Exam Category
                  </label>
                  <select
                    value={formData.examCategory}
                    onChange={(e) => setFormData({ ...formData, examCategory: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl focus:outline-none focus:border-primary-500 text-dark-900 dark:text-white"
                  >
                    <option value="">-- General / All Exams --</option>
                    {categories.map((c) => (
                      <option key={c.id || c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* URL Slug */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>URL Slug</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    /blog/{formData.slug || 'your-slug'}
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="rsmssb-patwari-5546-vacancy-notification-2026"
                  className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl focus:outline-none focus:border-primary-500 text-slate-600 dark:text-slate-300"
                />
              </div>

              {/* Job Alert Fields (Conditional) */}
              {formData.type === 'job_alert' && (
                <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-4">
                  <div className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    🏛️ Recruitment Details
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Hiring Organization
                      </label>
                      <input
                        type="text"
                        value={formData.organization}
                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                        placeholder="e.g. Rajasthan Staff Selection Board (RSMSSB)"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Total Vacancies
                      </label>
                      <input
                        type="number"
                        value={formData.totalVacancies}
                        onChange={(e) =>
                          setFormData({ ...formData, totalVacancies: e.target.value })
                        }
                        placeholder="e.g. 5546"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Application Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.applicationStart}
                        onChange={(e) =>
                          setFormData({ ...formData, applicationStart: e.target.value })
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Application End Date
                      </label>
                      <input
                        type="date"
                        value={formData.applicationEnd}
                        onChange={(e) =>
                          setFormData({ ...formData, applicationEnd: e.target.value })
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Exam Date
                      </label>
                      <input
                        type="date"
                        value={formData.examDate}
                        onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Official Notification PDF URL
                    </label>
                    <input
                      type="url"
                      value={formData.officialNotificationUrl}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          officialNotificationUrl: e.target.value,
                        })
                      }
                      placeholder="https://rsmssb.rajasthan.gov.in/notifications/patwari.pdf"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Excerpt */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Short Excerpt / Summary
                </label>
                <textarea
                  rows={2}
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief 1-2 sentence overview of this notification or article..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl focus:outline-none focus:border-primary-500 text-dark-900 dark:text-white"
                />
              </div>

              {/* Main Content Area */}
              <div className="space-y-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Post Body Content (HTML / Markdown supported) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setPreviewMode(!previewMode)}
                    className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1"
                  >
                    <HiEye className="h-3.5 w-3.5" />
                    {previewMode ? 'Edit Source' : 'Live Preview'}
                  </button>
                </div>

                {previewMode ? (
                  <div
                    className="w-full min-h-[220px] p-4 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl prose prose-sm dark:prose-invert max-w-none overflow-y-auto max-h-[350px]"
                    dangerouslySetInnerHTML={{ __html: formData.content }}
                  />
                ) : (
                  <textarea
                    rows={8}
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="<h2>Eligibility Criteria</h2><p>Graduation in any stream...</p><h3>Exam Pattern</h3>..."
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl focus:outline-none focus:border-primary-500 text-dark-900 dark:text-white leading-relaxed"
                  />
                )}
              </div>

              {/* Cover Image & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Cover Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="rsmssb, patwari, vacancy, syllabus"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Status and Submit */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-dark-800">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Status:
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white font-semibold"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-dark-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting ? (
                      'Saving...'
                    ) : (
                      <>
                        <HiCheckCircle className="h-4 w-4" />
                        {editingId ? 'Update Post' : 'Publish Post'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
