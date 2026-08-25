import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCategories, deleteCategory } from '@/features/category/categorySlice';
import { formatDate } from '@/utils';
import DataTable from '@/components/DataTable';
import StatsCard from '@/components/StatsCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  Plus,
  FolderOpen,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  Layers,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export default function CategoryList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, loading } = useSelector((s) => s.categories);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleDelete = async () => {
    if (deleteTarget) {
      await dispatch(deleteCategory(deleteTarget));
      setDeleteTarget(null);
    }
  };

  const filteredList = list.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.slug || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalCategories = list.length;
  const activeCategories = list.filter((c) => c.isActive !== false).length;
  const totalCourses = list.reduce(
    (acc, c) => acc + (c.coursesCount || c.courseCount || c._count?.courses || 0),
    0
  );
  const totalTests = list.reduce(
    (acc, c) => acc + (c.testsCount || c.testCount || c._count?.tests || 0),
    0
  );

  const columns = [
    {
      key: 'name',
      label: 'Category Name',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-sm">
            {row.icon || <FolderOpen className="w-4 h-4" />}
          </div>
          <div>
            <span className="font-semibold text-gray-900 dark:text-white">{row.name}</span>
            <p className="text-xs text-gray-400 font-mono">{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (val) => (val ? val.substring(0, 60) + (val.length > 60 ? '...' : '') : '—'),
    },
    {
      key: 'coursesCount',
      label: 'Courses',
      render: (val, row) => (
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          {val || row.courseCount || row._count?.courses || 0}
        </span>
      ),
    },
    {
      key: 'testsCount',
      label: 'Mock Tests',
      render: (val, row) => (
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          {val || row.testCount || row._count?.tests || 0}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (val) => (
        <span className={`badge ${val !== false ? 'badge-success' : 'badge-neutral'}`}>
          {val !== false ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (val) => formatDate(val),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Academic Categories</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Organize exams, subjects, and curriculum disciplines
          </p>
        </div>
        <button onClick={() => navigate('/categories/create')} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          icon={FolderOpen}
          label="Total Categories"
          value={totalCategories}
          color="primary"
        />
        <StatsCard
          icon={CheckCircle2}
          label="Active Categories"
          value={activeCategories}
          color="emerald"
        />
        <StatsCard icon={BookOpen} label="Linked Courses" value={totalCourses} color="amber" />
        <StatsCard icon={FileText} label="Mock Tests" value={totalTests} color="blue" />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredList}
        loading={loading}
        searchable
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder="Search categories by title or slug..."
        emptyMessage="No categories found"
        emptyIcon={FolderOpen}
        actions={(row) => {
          const rowId = row.id || row._id;
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => navigate(`/categories/${rowId}`)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
                title="View Category Hierarchy & Associated Content"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate(`/categories/${rowId}/edit`)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
                title="Edit Category"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteTarget(rowId)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Are you sure? Courses in this category will be unassigned."
        confirmText="Delete"
      />
    </div>
  );
}
