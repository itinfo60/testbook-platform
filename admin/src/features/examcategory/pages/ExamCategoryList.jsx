import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Edit, Trash2 } from 'lucide-react';

// Actions
import { fetchExamCategories, deleteExamCategory } from '@/features/examcategory/examCategorySlice';

// Components
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';

// Utils
import { formatDate } from '@/utils';

export default function ExamCategoryList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, pagination, loading } = useSelector((s) => s.examCategories);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { dispatch(fetchExamCategories({ page, limit: 20 })); }, [dispatch, page]);

  const handleDelete = async () => {
    if (deleteTarget) { await dispatch(deleteExamCategory(deleteTarget)); setDeleteTarget(null); }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true, render: (val, row) => (
      <div className="flex items-center gap-2">
        {row.icon && <span className="text-xl">{row.icon}</span>}
        <span className="font-medium text-gray-900 dark:text-white">{val}</span>
      </div>
    )},
    { key: 'slug', label: 'Slug', render: (val) => <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{val}</code> },
    { key: 'testsCount', label: 'Tests', render: (val) => val || 0 },
    { key: 'isActive', label: 'Active', render: (val) => <span className={val !== false ? 'badge-success' : 'badge-gray'}>{val !== false ? 'Yes' : 'No'}</span> },
    { key: 'createdAt', label: 'Created', render: (val) => formatDate(val) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Exam Categories</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Manage exam categories for tests</p>
        </div>
        <button onClick={() => navigate('/exam-categories/create')} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <DataTable
        columns={columns}
        data={list}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyMessage="No exam categories found"
        emptyIcon={FolderOpen}
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => navigate(`/exam-categories/${row._id}/edit`)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><Edit className="w-4 h-4 text-blue-600" /></button>
            <button onClick={() => setDeleteTarget(row._id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><Trash2 className="w-4 h-4 text-red-600" /></button>
          </div>
        )}
      />

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Exam Category" message="Are you sure?" confirmText="Delete" />
    </div>
  );
}
