import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCourses, deleteCourse, togglePublish, toggleFeatured } from '@/features/course/courseSlice';
import { formatCurrency, formatDate, getStatusColor, truncate } from '@/utils';
import useDebounce from '@/hooks/useDebounce';
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import { 
  BookOpen, Plus, Eye, EyeOff, Star, StarOff, 
  Edit, Trash2, Search, Filter, 
  ChevronRight, ChevronLeft, MoreHorizontal, Download 
} from 'lucide-react';

export default function CourseList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, pagination, loading } = useSelector((s) => s.courses);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const debouncedSearch = useDebounce(search);

  const load = useCallback(() => {
    dispatch(fetchCourses({ page, limit: 10, search: debouncedSearch, status: statusFilter, sort: sortField, order: sortOrder }));
  }, [dispatch, page, debouncedSearch, statusFilter, sortField, sortOrder]);

  useEffect(() => { load(); }, [load]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const handleDelete = async () => {
    if (deleteTarget) { await dispatch(deleteCourse(deleteTarget)); setDeleteTarget(null); }
  };

  const columns = [
    {
      key: 'title',
      label: 'Course',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          {row.thumbnail ? (
            <img src={row.thumbnail} alt="" className="w-12 h-8 rounded object-cover" />
          ) : (
            <div className="w-12 h-8 rounded bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-600" />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{truncate(row.title, 40)}</p>
            <p className="text-xs text-gray-500">{row.teacher?.name || 'Unknown'}</p>
          </div>
        </div>
      ),
    },
    { key: 'price', label: 'Price', sortable: true, render: (val) => formatCurrency(val) },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val) => <span className={getStatusColor(val)}>{val || 'draft'}</span>,
    },
    { key: 'enrollmentCount', label: 'Students', sortable: true, render: (val) => val || 0 },
    { key: 'createdAt', label: 'Created', sortable: true, render: (val) => formatDate(val) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Courses</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Manage all courses on the platform</p>
        </div>
        <button onClick={() => navigate('/courses/create')} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Add Course
        </button>
      </div>

      <div className="flex gap-3">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-40 py-2">
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
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
        searchPlaceholder="Search courses..."
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyMessage="No courses found"
        emptyIcon={BookOpen}
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => dispatch(togglePublish(row._id))} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Toggle publish">
              {row.status === 'published' ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
            </button>
            <button onClick={() => dispatch(toggleFeatured(row._id))} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Toggle featured">
              {row.isFeatured ? <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> : <StarOff className="w-4 h-4 text-gray-400" />}
            </button>
            <button onClick={() => navigate(`/courses/${row._id}/edit`)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Edit">
              <Edit className="w-4 h-4 text-blue-600" />
            </button>
            <button onClick={() => setDeleteTarget(row._id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Delete">
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}
      />

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Course" message="This will permanently delete this course and all associated data." confirmText="Delete" />
    </div>
  );
}
