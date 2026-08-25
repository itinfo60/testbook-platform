import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'published' | 'draft'
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const debouncedSearch = useDebounce(search);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        sort: sortField,
        order: sortOrder,
      };
      if (statusFilter === 'published') params.isPublished = 'true';
      else if (statusFilter === 'draft') params.isPublished = 'false';
      else params.isPublished = 'all';

      const res = await testSeriesAPI.getAll(params);
      const data = res.data?.data || res.data || {};
      setList(data.testSeries || data.docs || data || []);
      setPagination(data.pagination || res.data?.pagination || null);
    } catch {
      toast.error('Failed to load test series');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, sortField, sortOrder]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

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

  // Client-side fallback filter if backend didn't filter
  const displayedList = list.filter((item) => {
    if (statusFilter === 'published') return item.isPublished === true;
    if (statusFilter === 'draft') return !item.isPublished;
    return true;
  });

  const columns = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (val, row) => {
        const rowId = row.id || row._id;
        return (
          <div>
            <Link
              to={`/test-series/${rowId}`}
              className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
            >
              {val}
            </Link>
            <p className="text-xs text-gray-500">
              {row.examCategory?.name || row.category?.name || 'General'} •{' '}
              {row.tests?.length || row.testCount || 0} tests
            </p>
          </div>
        );
      },
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (val) =>
        val > 0 ? `₹${val}` : <span className="text-emerald-600 font-semibold">Free</span>,
    },
    {
      key: 'isPublished',
      label: 'Status',
      sortable: true,
      render: (val) => (
        <span className={val ? 'badge-success' : 'badge-gray'}>{val ? 'Live' : 'Draft'}</span>
      ),
    },
    {
      key: 'enrollmentCount',
      label: 'Enrolled',
      sortable: true,
      render: (val, row) => {
        const count =
          row.enrollmentCount ||
          row.enrollmentsCount ||
          row._count?.enrollments ||
          row.totalEnrollments ||
          0;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
              count > 0
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                : 'text-gray-400 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {count} {count === 1 ? 'Student' : 'Students'}
          </span>
        );
      },
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Test Series</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Manage assessment bundles and test packages
          </p>
        </div>
        <button onClick={() => navigate('/test-series/create')} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Create Test Series
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 gap-4">
        {[
          { key: 'all', label: 'All Series' },
          { key: 'published', label: 'Live (Published)' },
          { key: 'draft', label: 'Drafts' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setStatusFilter(tab.key);
              setPage(1);
            }}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${
              statusFilter === tab.key
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={displayedList}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        searchable
        searchValue={search}
        onSearch={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search test series..."
        emptyMessage="No test series found"
        emptyIcon={ClipboardList}
        actions={(row) => {
          const rowId = row.id || row._id;
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => handleTogglePublish(rowId, row.isPublished)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={
                  row.isPublished
                    ? 'Unpublish Test Series (Set to Draft)'
                    : 'Publish Test Series Live'
                }
              >
                {row.isPublished ? (
                  <ToggleRight className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <button
                onClick={() => navigate(`/test-series/${rowId}`)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 transition-colors"
                title="View Test Series Package & Tests"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate(`/test-series/${rowId}/edit`)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 transition-colors"
                title="Edit Test Series Package"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteTarget(rowId)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 transition-colors"
                title="Delete Test Series"
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
        title="Delete Test Series"
        message="Are you sure? This will remove the test series and all its enrolled students will lose access."
        confirmText="Delete"
      />
    </div>
  );
}
