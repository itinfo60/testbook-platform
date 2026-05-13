import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourses, deleteCourse, togglePublish, toggleFeatured } from '@/features/course/courseSlice';
import useDebounce from '@/hooks/useDebounce';

export default function CourseList() {
  const dispatch = useDispatch();
  const { list, pagination, loading } = useSelector((s) => s.courses);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewCourse, setViewCourse] = useState(null);

  const debouncedSearch = useDebounce(search);

  const load = useCallback(() => {
    dispatch(fetchCourses({
      page,
      limit: 10,
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      sort: `${sortOrder === 'desc' ? '-' : ''}${sortField}`,
    }));
  }, [dispatch, page, debouncedSearch, statusFilter, sortField, sortOrder]);

  useEffect(() => { load(); }, [load]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await dispatch(deleteCourse(deleteTarget));
      setDeleteTarget(null);
      load();
    }
  };

  const handleTogglePublish = async (id) => {
    await dispatch(togglePublish(id));
    load();
  };

  const handleToggleFeatured = async (id) => {
    await dispatch(toggleFeatured(id));
    load();
  };

  const columns = [
    {
      key: 'title',
      label: 'Course',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          {row.thumbnail?.url || row.thumbnail ? (
            <img src={row.thumbnail?.url || row.thumbnail} alt="" className="w-12 h-8 rounded object-cover" />
          ) : (
            <div className="w-12 h-8 rounded bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-600" />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{truncate(row.title, 40)}</p>
            <p className="text-xs text-gray-500">by {row.teacher?.name || row.instructor?.name || 'Unknown Teacher'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-medium">{val > 0 ? formatCurrency(val) : 'Free'}</p>
          {row.discountedPrice > 0 && row.discountedPrice < val && (
            <p className="text-xs text-emerald-600">Sale: {formatCurrency(row.discountedPrice)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'level',
      label: 'Level',
      render: (val) => <span className="badge-info capitalize">{val || 'N/A'}</span>,
    },
    {
      key: 'enrollmentCount',
      label: 'Students',
      sortable: true,
      render: (val, row) => val || row.enrolledStudents || row.totalEnrollments || 0,
    },
    {
      key: 'averageRating',
      label: 'Rating',
      sortable: true,
      render: (val, row) => {
        const rating = val || row.rating || 0;
        return rating > 0 ? (
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{rating.toFixed(1)}</span>
          </div>
        ) : <span className="text-gray-400">-</span>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val) => <span className={getStatusColor(val)}>{val || 'draft'}</span>,
    },
    {
      key: 'isFeatured',
      label: 'Featured',
      render: (val) => val ? (
        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
      ) : (
        <span className="text-gray-300">-</span>
      ),
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Courses</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Manage courses created by teachers
            {pagination && <span className="ml-2 text-primary-600">({pagination.total || 0} total)</span>}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field w-40 py-2"
        >
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
        emptyMessage="No courses found. Courses will appear here when teachers create them."
        emptyIcon={BookOpen}
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            {/* View Details */}
            <button
              onClick={() => setViewCourse(row)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="View details"
            >
              <Info className="w-4 h-4 text-blue-600" />
            </button>
            {/* Toggle Publish */}
            <button
              onClick={() => handleTogglePublish(row._id)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title={row.status === 'published' ? 'Unpublish' : 'Publish'}
            >
              {row.status === 'published'
                ? <Eye className="w-4 h-4 text-emerald-600" />
                : <EyeOff className="w-4 h-4 text-gray-400" />
              }
            </button>
            {/* Toggle Featured */}
            <button
              onClick={() => handleToggleFeatured(row._id)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title={row.isFeatured ? 'Unfeature' : 'Feature'}
            >
              {row.isFeatured
                ? <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                : <StarOff className="w-4 h-4 text-gray-400" />
              }
            </button>
            {/* Delete */}
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

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Course"
        message="This will permanently delete this course and all associated enrollments, reviews, and content. This cannot be undone."
        confirmText="Delete Course"
      />

      {/* Course Detail Modal */}
      <Modal
        isOpen={!!viewCourse}
        onClose={() => setViewCourse(null)}
        title="Course Details"
        size="lg"
      >
        {viewCourse && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start gap-4">
              {(viewCourse.thumbnail?.url || viewCourse.thumbnail) ? (
                <img
                  src={viewCourse.thumbnail?.url || viewCourse.thumbnail}
                  alt=""
                  className="w-40 h-24 object-cover rounded-lg"
                />
              ) : (
                <div className="w-40 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-primary-600" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{viewCourse.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  by {viewCourse.teacher?.name || viewCourse.instructor?.name || 'Unknown'}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={getStatusColor(viewCourse.status)}>{viewCourse.status || 'draft'}</span>
                  <span className="badge-info capitalize">{viewCourse.level || 'N/A'}</span>
                  {viewCourse.isFeatured && (
                    <span className="badge-warning">⭐ Featured</span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                <p className="text-xs text-gray-500">Price</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {viewCourse.price > 0 ? formatCurrency(viewCourse.price) : 'Free'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                <p className="text-xs text-gray-500">Students</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {viewCourse.enrollmentCount || viewCourse.enrolledStudents || 0}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                <p className="text-xs text-gray-500">Rating</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {(viewCourse.averageRating || viewCourse.rating || 0).toFixed(1)} ⭐
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                <p className="text-xs text-gray-500">Reviews</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {viewCourse.totalReviews || viewCourse.reviewCount || 0}
                </p>
              </div>
            </div>

            {/* Description */}
            {viewCourse.description && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Description</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                  {viewCourse.description}
                </p>
              </div>
            )}

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Category:</span>{' '}
                <span className="font-medium">{viewCourse.category?.name || 'Uncategorized'}</span>
              </div>
              <div>
                <span className="text-gray-500">Language:</span>{' '}
                <span className="font-medium">{viewCourse.language || 'English'}</span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>{' '}
                <span className="font-medium">{formatDate(viewCourse.createdAt)}</span>
              </div>
              <div>
                <span className="text-gray-500">Updated:</span>{' '}
                <span className="font-medium">{formatDate(viewCourse.updatedAt)}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-3 border-t dark:border-gray-700">
              <button
                onClick={() => { handleTogglePublish(viewCourse._id); setViewCourse(null); }}
                className={viewCourse.status === 'published' ? 'btn-secondary gap-2' : 'btn-success gap-2'}
              >
                {viewCourse.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {viewCourse.status === 'published' ? 'Unpublish' : 'Publish'}
              </button>
              <button
                onClick={() => { handleToggleFeatured(viewCourse._id); setViewCourse(null); }}
                className="btn-secondary gap-2"
              >
                {viewCourse.isFeatured ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                {viewCourse.isFeatured ? 'Unfeature' : 'Feature'}
              </button>
              <button
                onClick={() => { setDeleteTarget(viewCourse._id); setViewCourse(null); }}
                className="btn-danger gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}