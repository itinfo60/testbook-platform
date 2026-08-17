import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Edit, Trash2, GitBranch } from 'lucide-react';
import { fetchExamCategories, deleteExamCategory } from '@/features/examcategory/examCategorySlice';
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDate } from '@/utils';

export default function ExamCategoryList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, pagination, loading } = useSelector((s) => s.examCategories);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchExamCategories({ page, limit: 50 }));
  }, [dispatch, page]);

  const handleDelete = async () => {
    if (deleteTarget) {
      await dispatch(deleteExamCategory(deleteTarget));
      setDeleteTarget(null);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          {row.icon && <span className="text-xl">{row.icon}</span>}
          <div>
            <span className="font-medium text-gray-900 dark:text-white">{val}</span>
            {row.parent && (
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <GitBranch className="w-3 h-3" />
                <span>Sub-exam of: {row.parent?.name || 'Parent'}</span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'parent',
      label: 'Type',
      render: (val) =>
        val ? (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            Sub-exam
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
            Parent
          </span>
        ),
    },
    {
      key: 'slug',
      label: 'Slug',
      render: (val) => (
        <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{val}</code>
      ),
    },
    {
      key: 'conductingBody',
      label: 'Body',
      render: (val) => val || '—',
    },
    {
      key: 'courseCount',
      label: 'Courses',
      render: (val) => val || 0,
    },
    {
      key: 'testCount',
      label: 'Tests',
      render: (val) => val || 0,
    },
    {
      key: 'isActive',
      label: 'Active',
      render: (val) => (
        <span className={val !== false ? 'badge-success' : 'badge-gray'}>
          {val !== false ? 'Yes' : 'No'}
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Exam Categories</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Manage parent exam groups and individual exams. Parent categories group related exams
            (e.g. "RPSC Exams" → RAS, SI, Grade 1).
          </p>
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
            <button
              onClick={() => navigate(`/exam-categories/${row._id}/edit`)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit className="w-4 h-4 text-blue-600" />
            </button>
            <button
              onClick={() => setDeleteTarget(row._id)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Exam Category"
        message="Are you sure? Any sub-exams linked to this parent will lose their parent reference."
        confirmText="Delete"
      />
    </div>
  );
}
