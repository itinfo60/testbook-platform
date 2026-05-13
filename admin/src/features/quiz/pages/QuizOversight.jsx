import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Brain, Eye, Trash2 } from 'lucide-react';

// Actions
import { fetchQuizzes, deleteQuiz } from '@/features/quiz/quizSlice';

// Components
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';

// Utils
import { getStatusColor, formatDate, truncate } from '@/utils';
import useDebounce from '@/hooks/useDebounce';

export default function QuizOversight() {
  const dispatch = useDispatch();
  const { list, pagination, loading } = useSelector((s) => s.quizzes);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const debouncedSearch = useDebounce(search);

  const load = useCallback(() => {
    dispatch(fetchQuizzes({ page, limit: 10, search: debouncedSearch, sort: sortField, order: sortOrder }));
  }, [dispatch, page, debouncedSearch, sortField, sortOrder]);

  useEffect(() => { load(); }, [load]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const handleDelete = async () => {
    if (deleteTarget) { await dispatch(deleteQuiz(deleteTarget)); setDeleteTarget(null); }
  };

  const columns = [
    {
      key: 'title',
      label: 'Quiz',
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{truncate(row.title, 45)}</p>
          <p className="text-xs text-gray-500">Course: {row.course?.title || 'N/A'}</p>
        </div>
      ),
    },
    {
      key: 'questions',
      label: 'Questions',
      render: (val) => (Array.isArray(val) ? val.length : val || 0),
    },
    {
      key: 'totalAttempts',
      label: 'Attempts',
      sortable: true,
      render: (val) => val || 0,
    },
    {
      key: 'passingScore',
      label: 'Pass %',
      render: (val) => val ? `${val}%` : 'N/A',
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <span className={getStatusColor(val)}>{val || 'active'}</span>,
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (val) => formatDate(val),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quiz Oversight</h2>
        <p className="mt-1 text-gray-500 dark:text-gray-400">Monitor all quizzes across the platform</p>
      </div>

      <DataTable
        columns={columns}
        data={list}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        searchable
        searchValue={search}
        onSearch={(val) => { setSearch(val); setPage(1); }}
        searchPlaceholder="Search quizzes..."
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyMessage="No quizzes found"
        emptyIcon={Brain}
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="View">
              <Eye className="w-4 h-4 text-blue-600" />
            </button>
            <button onClick={() => setDeleteTarget(row._id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Delete">
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Quiz"
        message="Are you sure? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
