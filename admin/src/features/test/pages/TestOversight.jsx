import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTests, deleteTest } from '@/features/test/testSlice';
import useDebounce from '@/hooks/useDebounce';

export default function TestOversight() {
  const dispatch = useDispatch();
  const { list, pagination, loading } = useSelector((s) => s.tests);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const debouncedSearch = useDebounce(search);

  const load = useCallback(() => {
    dispatch(fetchTests({ page, limit: 10, search: debouncedSearch, sort: sortField, order: sortOrder }));
  }, [dispatch, page, debouncedSearch, sortField, sortOrder]);

  useEffect(() => { load(); }, [load]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const handleDelete = async () => {
    if (deleteTarget) { await dispatch(deleteTest(deleteTarget)); setDeleteTarget(null); }
  };

  const columns = [
    {
      key: 'title',
      label: 'Test',
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{truncate(row.title, 45)}</p>
          <p className="text-xs text-gray-500">{row.teacher?.name || row.createdBy?.name || 'N/A'}</p>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (val) => val?.name || val || 'N/A',
    },
    {
      key: 'questions',
      label: 'Questions',
      render: (val) => (Array.isArray(val) ? val.length : val || 0),
    },
    {
      key: 'duration',
      label: 'Duration',
      sortable: true,
      render: (val) => val ? `${val} min` : 'N/A',
    },
    {
      key: 'totalAttempts',
      label: 'Attempts',
      sortable: true,
      render: (val) => val || 0,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val) => <span className={getStatusColor(val)}>{val || 'draft'}</span>,
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Test Oversight</h2>
        <p className="mt-1 text-gray-500 dark:text-gray-400">Monitor all tests across the platform</p>
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
        searchPlaceholder="Search tests..."
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyMessage="No tests found"
        emptyIcon={FileText}
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
        title="Delete Test"
        message="Are you sure you want to delete this test? All associated attempts will also be removed."
        confirmText="Delete"
      />
    </div>
  );
}
