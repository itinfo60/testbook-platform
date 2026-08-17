import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ClipboardList, Edit, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { testSeriesAPI } from '@/services/api';
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDate, getStatusColor } from '@/utils';
import useDebounce from '@/hooks/useDebounce';

export default function TestSeriesList() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const debouncedSearch = useDebounce(search);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await testSeriesAPI.getAll({ page, limit: 10, search: debouncedSearch });
      const data = res.data?.data || res.data || {};
      setList(data.testSeries || data.docs || data || []);
      setPagination(data.pagination || res.data?.pagination || null);
    } catch {
      toast.error('Failed to load test series');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await testSeriesAPI.delete(deleteTarget);
      toast.success('Test series deleted');
      setDeleteTarget(null);
      load();
    } catch {
      // handled by interceptor
    }
  };

  const handleTogglePublish = async (id, current) => {
    try {
      await testSeriesAPI.update(id, { isPublished: !current });
      toast.success(`Test series ${!current ? 'published' : 'unpublished'}`);
      load();
    } catch {
      // handled by interceptor
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{val}</p>
          <p className="text-xs text-gray-500">
            {row.examCategory?.name || row.category?.name || 'No category'} •{' '}
            {row.tests?.length || row.testCount || 0} tests
          </p>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      render: (val) => (val > 0 ? `₹${val}` : 'Free'),
    },
    {
      key: 'isPublished',
      label: 'Published',
      render: (val) => (
        <span className={val ? 'badge-success' : 'badge-gray'}>{val ? 'Live' : 'Draft'}</span>
      ),
    },
    {
      key: 'enrollmentCount',
      label: 'Enrolled',
      render: (val) => val || 0,
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Test Series</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Manage all test series across the platform
          </p>
        </div>
        <button onClick={() => navigate('/test-series/create')} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Create Test Series
        </button>
      </div>

      <DataTable
        columns={columns}
        data={list}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        searchable
        searchValue={search}
        onSearch={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search test series..."
        emptyMessage="No test series found"
        emptyIcon={ClipboardList}
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => handleTogglePublish(row._id, row.isPublished)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title={row.isPublished ? 'Unpublish' : 'Publish'}
            >
              {row.isPublished ? (
                <ToggleRight className="w-4 h-4 text-emerald-600" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <a
              href={`${import.meta.env.VITE_CLIENT_URL || 'http://localhost:5173'}/test-series/${row.slug || row._id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="View on student site"
            >
              <Eye className="w-4 h-4 text-blue-600" />
            </a>
            <button
              onClick={() => navigate(`/test-series/${row._id}/edit`)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Edit"
            >
              <Edit className="w-4 h-4 text-blue-600" />
            </button>
            <button
              onClick={() => setDeleteTarget(row._id)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Delete"
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
        title="Delete Test Series"
        message="Are you sure? This will remove the test series and all its enrolled students will lose access."
        confirmText="Delete"
      />
    </div>
  );
}
