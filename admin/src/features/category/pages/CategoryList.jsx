import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCategories, deleteCategory } from '@/features/category/categorySlice';
import { formatDate } from '@/utils';
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Plus, FolderOpen, Edit, Trash2 } from 'lucide-react';

export default function CategoryList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, loading } = useSelector((s) => s.categories);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { dispatch(fetchCategories()); }, [dispatch]);

  const handleDelete = async () => {
    if (deleteTarget) { await dispatch(deleteCategory(deleteTarget)); setDeleteTarget(null); }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true, render: (val) => <span className="font-medium text-gray-900 dark:text-white">{val}</span> },
    { key: 'slug', label: 'Slug', render: (val) => <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{val}</code> },
    { key: 'description', label: 'Description', render: (val) => val ? val.substring(0, 50) + '...' : '-' },
    { key: 'coursesCount', label: 'Courses', render: (val) => val || 0 },
    { key: 'createdAt', label: 'Created', render: (val) => formatDate(val) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Manage course categories</p>
        </div>
        <button onClick={() => navigate('/categories/create')} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <DataTable
        columns={columns}
        data={list}
        loading={loading}
        emptyMessage="No categories found"
        emptyIcon={FolderOpen}
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => navigate(`/categories/${row._id}/edit`)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Edit">
              <Edit className="w-4 h-4 text-blue-600" />
            </button>
            <button onClick={() => setDeleteTarget(row._id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Delete">
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}
      />

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Category" message="Are you sure? Courses in this category will be unassigned." confirmText="Delete" />
    </div>
  );
}
