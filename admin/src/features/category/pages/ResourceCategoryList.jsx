import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  BookmarkCheck,
  Edit,
  Trash2,
  Layers,
  CheckCircle2,
  XCircle,
  FileText,
  ToggleLeft,
  ToggleRight,
  Library,
  FolderOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import DataTable from '@/components/DataTable';
import StatsCard from '@/components/StatsCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import Modal from '@/components/Modal';
import { formatDate } from '@/utils';

export default function ResourceCategoryList() {
  const [list, setList] = useState([]);
  const [libraryResources, setLibraryResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' = all, 'true' = active, 'false' = inactive
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '📄',
    description: '',
    isActive: true,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [catRes, libRes] = await Promise.all([
        api.get('/categories/admin/list?type=resource&limit=100'),
        api.get('/library?limit=100').catch(() => ({ data: { data: { resources: [] } } })),
      ]);

      const cats = Array.isArray(catRes.data?.data)
        ? catRes.data.data
        : catRes.data?.data?.categories || catRes.data?.categories || [];
      const libs = libRes.data?.data?.resources || libRes.data?.resources || [];

      setList(Array.isArray(cats) ? cats : []);
      setLibraryResources(Array.isArray(libs) ? libs : []);
    } catch (err) {
      toast.error('Failed to load resource categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      slug: '',
      icon: '📄',
      description: '',
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      slug: item.slug || '',
      icon: item.icon || '📄',
      description: item.description || '',
      isActive: item.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || undefined,
        icon: formData.icon.trim() || '📄',
        description: formData.description.trim(),
        isActive: formData.isActive,
        type: 'resource',
      };

      if (editingItem) {
        await api.put(`/categories/${editingItem.id || editingItem._id}`, payload);
        toast.success('Resource type updated');
      } else {
        await api.post('/categories', payload);
        toast.success('Resource type created');
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save resource type');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      await api.put(`/categories/${item.id || item._id}`, {
        isActive: !item.isActive,
      });
      toast.success(item.isActive ? 'Category deactivated' : 'Category activated');
      loadData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/categories/${deleteTarget.id || deleteTarget._id}`);
      toast.success('Resource type deleted');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete resource type');
    }
  };

  const filteredList = list.filter((c) => {
    const matchesSearch =
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.slug || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === '' ||
      (statusFilter === 'true' && c.isActive !== false) ||
      (statusFilter === 'false' && c.isActive === false);

    return matchesSearch && matchesStatus;
  });

  const totalTypes = list.length;
  const activeTypes = list.filter((c) => c.isActive !== false).length;
  const inactiveTypes = list.filter((c) => c.isActive === false).length;

  const columns = [
    {
      key: 'name',
      label: 'Resource Type / Category',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-lg border border-purple-200 dark:border-purple-800 shrink-0">
            {row.icon || '📄'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 dark:text-white truncate">{row.name}</span>
              {row.isActive === false && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (val) => (
        <span className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 max-w-sm">
          {val || '—'}
        </span>
      ),
    },
    {
      key: 'resourceCount',
      label: 'Associated Material',
      render: (_, row) => {
        const count = libraryResources.filter(
          (r) =>
            r.type === row.slug ||
            r.type === row.name ||
            (r.fileData && (r.fileData.category === row.name || r.fileData.category === row.slug))
        ).length;
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            {count} Files
          </span>
        );
      },
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (val, row) => (
        <button
          onClick={() => handleToggleStatus(row)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
            val !== false
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-200'
          }`}
          title={val !== false ? 'Click to deactivate' : 'Click to activate'}
        >
          {val !== false ? (
            <>
              <ToggleRight className="w-4 h-4 text-emerald-600" /> Active
            </>
          ) : (
            <>
              <ToggleLeft className="w-4 h-4 text-gray-400" /> Inactive
            </>
          )}
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-primary-600 transition-colors cursor-pointer"
            title="Edit Resource Type"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 transition-colors cursor-pointer"
            title="Delete Resource Type"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Resource Type Categories
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage academic resource classifications (PYQs, Syllabus, Handwritten Notes, Formulas)
          </p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary gap-2 self-start sm:self-center">
          <Plus className="w-4 h-4" /> Add Resource Type
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setStatusFilter('')}
          className={`p-4 rounded-2xl bg-white dark:bg-gray-800 border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
            statusFilter === ''
              ? 'border-primary-500 ring-2 ring-primary-500/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Configured
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalTypes}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">All active & inactive types</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 flex items-center justify-center font-bold">
            <BookmarkCheck className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'true' ? '' : 'true')}
          className={`p-4 rounded-2xl bg-white dark:bg-gray-800 border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
            statusFilter === 'true'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Active Types
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {activeTypes}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">Visible on student portal</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'false' ? '' : 'false')}
          className={`p-4 rounded-2xl bg-white dark:bg-gray-800 border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
            statusFilter === 'false'
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-amber-300'
          }`}
        >
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Inactive Types
            </p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {inactiveTypes}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">Hidden from student portal</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-48 py-2"
          title="Filter by category active/inactive status"
        >
          <option value="">All Statuses (Active & Inactive)</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredList}
        loading={loading}
        searchable
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder="Search resource types by name, slug, or description..."
        emptyMessage="No resource categories found"
        emptyIcon={BookmarkCheck}
      />

      {/* ── Create / Edit Modal ── */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingItem ? 'Edit Resource Category' : 'Create Resource Category'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Solved PYQs & Past Papers"
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Category Slug / Identifier
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. pyq (auto-generated if blank)"
                  className="input-field font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Icon / Emoji
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g. 📝 or 📖"
                  className="input-field text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary of what documents belong in this category..."
                className="input-field"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActiveCheckbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
              />
              <label
                htmlFor="isActiveCheckbox"
                className="text-xs font-bold text-gray-800 dark:text-gray-200 cursor-pointer"
              >
                Category is active and publicly available
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary text-xs px-5 py-2">
                {submitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Resource Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}
