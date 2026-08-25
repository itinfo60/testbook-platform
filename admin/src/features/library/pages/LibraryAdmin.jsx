import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { Plus, Edit, Trash2, Download, FolderOpen } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

const EMPTY_FORM = {
  title: '',
  description: '',
  category: '',
  examCategory: '',
  resourceType: 'notes',
  tags: '',
  accessLevel: 'all',
  file: null,
};

export default function LibraryAdmin() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [examCategories, setExamCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (typeFilter) params.resourceType = typeFilter;
      const res = await api.get('/library', { params });
      const data = res.data?.data || res.data || {};
      setResources(data.resources || data.docs || []);
      setTotalPages(data.pagination?.pages || data.pages || 1);
    } catch {
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter]);

  const fetchExamCategories = async () => {
    try {
      const res = await api.get('/categories');
      setExamCategories(
        res.data?.data?.allCategories || res.data?.data?.categories || res.data?.categories || []
      );
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    fetchResources();
    fetchExamCategories();
  }, [fetchResources]);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (r) => {
    setEditId(r.id || r._id);
    setForm({
      title: r.title || '',
      description: r.description || '',
      category: r.category?.id || r.category?._id || r.category || '',
      examCategory: r.examCategory?.id || r.examCategory?._id || r.examCategory || '',
      resourceType: r.resourceType || 'notes',
      tags: Array.isArray(r.tags) ? r.tags.join(', ') : r.tags || '',
      accessLevel: r.accessLevel || 'all',
      file: null,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      ['title', 'description', 'resourceType', 'accessLevel'].forEach((k) => {
        if (form[k]) fd.append(k, form[k]);
      });
      if (form.category) fd.append('category', form.category);
      if (form.examCategory) fd.append('examCategory', form.examCategory);
      const tagList = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      tagList.forEach((tag) => fd.append('tags', tag));
      if (form.file) fd.append('file', form.file);

      if (editId) {
        await api.put(`/library/${editId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Resource updated');
      } else {
        await api.post('/library', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Resource created');
      }
      setShowForm(false);
      fetchResources();
    } catch {
      /* handled by interceptor */
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/library/${deleteTarget}`);
      toast.success('Deleted');
      setDeleteTarget(null);
      fetchResources();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleDownload = async (id, title) => {
    try {
      const res = await api.get(`/library/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = title;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Digital Library</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Manage PYQs, notes, syllabi and free resources
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Add Resource
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search resources..."
          className="input-field w-56 py-2"
        />
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="input-field w-44 py-2"
        >
          <option value="">All Types</option>
          <option value="pyq">PYQs</option>
          <option value="notes">Notes</option>
          <option value="syllabus">Syllabus</option>
          <option value="current_affairs">Current Affairs</option>
        </select>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="card p-6 border-2 border-primary-200 dark:border-primary-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editId ? 'Edit Resource' : 'Add New Resource'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input-field"
                placeholder="Resource title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                value={form.resourceType}
                onChange={(e) => setForm({ ...form, resourceType: e.target.value })}
                className="input-field"
              >
                <option value="notes">Notes</option>
                <option value="pyq">PYQ (Previous Year Paper)</option>
                <option value="syllabus">Syllabus</option>
                <option value="current_affairs">Current Affairs</option>
                <option value="solved_pyq">Solved PYQ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Access Level
              </label>
              <select
                value={form.accessLevel}
                onChange={(e) => setForm({ ...form, accessLevel: e.target.value })}
                className="input-field"
              >
                <option value="all">Free (All)</option>
                <option value="enrolled">Enrolled Students</option>
                <option value="premium">Premium Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Exam Category
              </label>
              <select
                value={form.examCategory}
                onChange={(e) => setForm({ ...form, examCategory: e.target.value })}
                className="input-field"
              >
                <option value="">— None —</option>
                {examCategories.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.icon ? `${c.icon} ` : ''}
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="input-field"
                placeholder="rajasthan, pyq, 2023"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-field"
                rows={2}
                placeholder="Brief description..."
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                File {editId ? '(leave empty to keep existing)' : '*'}
              </label>
              <input
                type="file"
                onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
                className="input-field py-2"
              />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Saving...' : editId ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : resources.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No resources found. Add your first resource.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Access
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Downloads
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {resources.map((r) => (
                  <tr key={r.id || r._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {r.title}
                    </td>
                    <td className="px-4 py-3 text-gray-500 capitalize">
                      {r.resourceType?.replace('_', ' ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {r.examCategory?.name || r.category?.name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          r.accessLevel === 'all'
                            ? 'bg-green-100 text-green-700'
                            : r.accessLevel === 'premium'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {r.accessLevel || 'all'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.downloadsCount || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {r.fileUrl && (
                          <button
                            onClick={() => handleDownload(r.id || r._id, r.title)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(r)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(r.id || r._id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Resource"
        message="Are you sure you want to delete this resource? This cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
