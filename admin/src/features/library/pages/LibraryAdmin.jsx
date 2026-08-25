import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import {
  Plus,
  Edit,
  Trash2,
  Download,
  FolderOpen,
  BookmarkCheck,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import FileUploadInput from '@/components/FileUploadInput';

import { getUnifiedCategories, getUnifiedExams } from '@/services/categories';

const EMPTY_FORM = {
  title: '',
  description: '',
  categoryId: '',
  examCategoryId: '',
  resourceType: 'notes',
  tags: '',
  accessLevel: 'all',
  fileUrl: '',
};

const DEFAULT_RESOURCE_CATEGORIES = [
  { id: 'pyq', slug: 'pyq', name: 'Solved PYQs & Past Papers', icon: '📝' },
  { id: 'syllabus', slug: 'syllabus', name: 'Official Syllabus & Scheme', icon: '📖' },
  { id: 'notes', slug: 'notes', name: 'Handwritten Notes & Summaries', icon: '📋' },
  { id: 'current_affairs', slug: 'current_affairs', name: 'Monthly Current Affairs', icon: '📰' },
  { id: 'mind_map', slug: 'mind_map', name: 'Mind Maps & Formulas', icon: '🧠' },
  { id: 'quiz', slug: 'quiz', name: 'Free Topic Quizzes', icon: '⚡' },
];

export default function LibraryAdmin() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [categories, setCategories] = useState([]);
  const [exams, setExams] = useState([]);
  const [resourceCategories, setResourceCategories] = useState(DEFAULT_RESOURCE_CATEGORIES);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Filter exams based on selected parent category
  const filteredExams = (exams || []).filter(
    (e) => !form.categoryId || e.parentId === form.categoryId
  );

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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedResources = useMemo(() => {
    if (!sortField || !Array.isArray(resources)) return resources;
    return [...resources].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'category') {
        aVal = a.examCategory?.name || a.category?.name || '';
        bVal = b.examCategory?.name || b.category?.name || '';
      } else if (sortField === 'resourceType') {
        aVal = a.resourceType || a.type || '';
        bVal = b.resourceType || b.type || '';
      }

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comp = aVal - bVal;
      } else {
        comp = String(aVal).localeCompare(String(bVal), undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      }

      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [resources, sortField, sortOrder]);

  const SortIcon = ({ field }) => {
    if (sortField !== field)
      return (
        <ArrowUpDown className="w-3.5 h-3.5 opacity-30 group-hover:opacity-70 transition-opacity" />
      );
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
    );
  };

  const loadDropdownData = async () => {
    try {
      const [cats, examList, resCatRes] = await Promise.all([
        getUnifiedCategories(),
        getUnifiedExams(),
        api
          .get('/categories/admin/list?type=resource&limit=100')
          .catch(() => ({ data: { data: [] } })),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setExams(Array.isArray(examList) ? examList : []);

      const dynamicResCats = Array.isArray(resCatRes.data?.data)
        ? resCatRes.data.data
        : resCatRes.data?.data?.categories || resCatRes.data?.categories || [];
      if (dynamicResCats.length > 0) {
        setResourceCategories(dynamicResCats);
      }
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    fetchResources();
    loadDropdownData();
  }, [fetchResources]);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (r) => {
    setEditId(r.id || r._id);
    const catId =
      r.categoryId ||
      r.category?.id ||
      r.category?._id ||
      (typeof r.category === 'string' ? r.category : '');
    const examId =
      r.examCategoryId ||
      r.examCategory?.id ||
      r.examCategory?._id ||
      (typeof r.examCategory === 'string' ? r.examCategory : '');

    let resolvedCategory = catId;
    let resolvedExam = examId;

    if (!resolvedCategory && resolvedExam) {
      const matchedExam = (exams || []).find((e) => (e.id || e._id) === resolvedExam);
      if (matchedExam && matchedExam.parentId) {
        resolvedCategory = matchedExam.parentId;
      }
    }

    setForm({
      title: r.title || '',
      description: r.description || '',
      categoryId: resolvedCategory || '',
      examCategoryId: resolvedExam || '',
      resourceType: r.resourceType || r.type || 'notes',
      tags: Array.isArray(r.tags) ? r.tags.join(', ') : r.tags || '',
      accessLevel: r.accessLevel || 'all',
      fileUrl:
        r.url ||
        r.fileUrl ||
        (r.fileData && (r.fileData.secure_url || r.fileData.url || r.fileData.fileUrl)) ||
        '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fileUrl) {
      toast.error('Please upload a file or provide a file URL');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        resourceType: form.resourceType,
        type: form.resourceType,
        accessLevel: form.accessLevel,
        fileUrl: form.fileUrl,
        url: form.fileUrl,
        categoryId: form.categoryId || null,
        examCategoryId: form.examCategoryId || null,
        category: form.categoryId || form.examCategoryId || null,
        examCategory: form.examCategoryId || form.categoryId || null,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (editId) {
        await api.put(`/library/${editId}`, payload);
        toast.success('Resource updated');
      } else {
        await api.post('/library', payload);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Digital Library</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage notes, PYQs, syllabus PDFs, and study materials classified by resource category
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Add Resource
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search resources by title, description, or tag..."
          className="input-field flex-1"
        />
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="input-field sm:w-64"
          title="Filter by Resource Category"
        >
          <option value="">All Resource Categories</option>
          {resourceCategories.map((rc) => (
            <option key={rc.slug || rc.id} value={rc.slug || rc.id}>
              {rc.icon ? `${rc.icon} ` : ''}
              {rc.name}
            </option>
          ))}
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
                placeholder="e.g. RPSC School Lecturer Political Science 2022 Official Solved Paper"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Resource Category *
              </label>
              <select
                value={form.resourceType}
                onChange={(e) => setForm({ ...form, resourceType: e.target.value })}
                className="input-field"
                required
              >
                {resourceCategories.map((rc) => (
                  <option key={rc.slug || rc.id} value={rc.slug || rc.id}>
                    {rc.icon ? `${rc.icon} ` : ''}
                    {rc.name}
                  </option>
                ))}
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
                <option value="all">Free (All Students)</option>
                <option value="enrolled">Enrolled Students Only</option>
                <option value="premium">Premium Pass Holders</option>
              </select>
            </div>

            {/* 2-Step Category -> Exam Dropdowns */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Academic Category
              </label>
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value, examCategoryId: '' })
                }
                className="input-field"
              >
                <option value="">— Select Category —</option>
                {categories.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.icon ? `${c.icon} ` : ''}
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Exam
              </label>
              <select
                value={form.examCategoryId}
                onChange={(e) => setForm({ ...form, examCategoryId: e.target.value })}
                className="input-field"
                disabled={!form.categoryId && filteredExams.length === 0}
              >
                <option value="">
                  {form.categoryId ? '— Select Target Exam —' : '— Select Category First —'}
                </option>
                {filteredExams.map((ex) => (
                  <option key={ex.id || ex._id} value={ex.id || ex._id}>
                    {ex.icon ? `${ex.icon} ` : ''}
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="input-field"
                placeholder="rpsc, lecturer, pyq, 2022"
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
                placeholder="Brief description and highlights of this study resource..."
              />
            </div>

            <div className="col-span-2">
              <FileUploadInput
                label="Study Material / Document File"
                value={form.fileUrl}
                onChange={(url) => setForm({ ...form, fileUrl: url })}
                type="document"
                folder="library-docs"
                placeholder="Upload PDF, DOCX, Notes or paste public link"
                hint="Upload PDF or notes directly to Supabase Storage or provide document URL"
                required={!editId}
              />
            </div>

            <div className="col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Saving...' : editId ? 'Update Resource' : 'Create Resource'}
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
          <div className="text-center py-12 text-gray-400">Loading study resources...</div>
        ) : resources.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No study resources found. Add your first resource above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th
                    onClick={() => handleSort('title')}
                    className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      Title
                      <SortIcon field="title" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('resourceType')}
                    className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      Resource Category
                      <SortIcon field="resourceType" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('category')}
                    className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      Target Exam / Category
                      <SortIcon field="category" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('accessLevel')}
                    className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      Access
                      <SortIcon field="accessLevel" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('downloadsCount')}
                    className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 dark:hover:text-white select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      Downloads
                      <SortIcon field="downloadsCount" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {sortedResources.map((r) => {
                  const typeKey = r.resourceType || r.type;
                  const matchedCat = resourceCategories.find(
                    (rc) => rc.slug === typeKey || rc.name === typeKey || rc.id === typeKey
                  );

                  return (
                    <tr key={r.id || r._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {r.title}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          <span>{matchedCat?.icon || '📄'}</span>
                          <span>
                            {matchedCat?.name || typeKey?.replace('_', ' ') || 'Document'}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {r.examCategory?.name || r.category?.name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            r.accessLevel === 'all' || r.accessLevel === 'free'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : r.accessLevel === 'premium'
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {r.accessLevel === 'all' ? '100% Free' : r.accessLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-semibold">
                        {r.downloadsCount || 0}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {(r.url || r.fileUrl || r.fileData) && (
                            <button
                              onClick={() => handleDownload(r.id || r._id, r.title)}
                              className="p-1 text-gray-400 hover:text-blue-600 cursor-pointer"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(r)}
                            className="p-1 text-gray-400 hover:text-blue-600 cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(r.id || r._id)}
                            className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Resource"
        message="Are you sure you want to delete this study resource? This action cannot be undone."
      />
    </div>
  );
}
