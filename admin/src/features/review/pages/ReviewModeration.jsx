import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Star, Trash2, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { fetchReviews, deleteReview, toggleReviewApproval } from '@/features/review/reviewSlice';
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import Modal from '@/components/Modal';
import { getStatusColor, formatDate, truncate } from '@/utils';
import useDebounce from '@/hooks/useDebounce';

export default function ReviewModeration() {
  const dispatch = useDispatch();
  const { list, pagination, loading } = useSelector((s) => s.reviews);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewReview, setViewReview] = useState(null);
  const debouncedSearch = useDebounce(search);

  const load = useCallback(() => {
    dispatch(fetchReviews({ page, limit: 10, search: debouncedSearch }));
  }, [dispatch, page, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (deleteTarget) {
      await dispatch(deleteReview(deleteTarget));
      setDeleteTarget(null);
    }
  };

  const renderStars = (rating) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
        />
      ))}
      <span className="ml-1 text-sm text-gray-500">({rating})</span>
    </div>
  );

  const filtered =
    statusFilter === 'pending'
      ? list.filter((r) => !r.isApproved)
      : statusFilter === 'approved'
        ? list.filter((r) => r.isApproved)
        : list;

  const columns = [
    {
      key: 'user',
      label: 'Reviewer',
      render: (val) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{val?.name || 'Anonymous'}</p>
          <p className="text-xs text-gray-500">{val?.email || ''}</p>
        </div>
      ),
    },
    {
      key: 'course',
      label: 'Course',
      render: (val) => truncate(val?.title || 'N/A', 30),
    },
    {
      key: 'rating',
      label: 'Rating',
      sortable: true,
      render: (val) => renderStars(val),
    },
    {
      key: 'comment',
      label: 'Comment',
      render: (val) => (
        <p className="text-sm max-w-xs text-gray-600 dark:text-gray-300">{truncate(val, 60)}</p>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => {
        const stat = row.isApproved ? 'approved' : 'pending';
        return <span className={getStatusColor(stat)}>{stat}</span>;
      },
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (val) => formatDate(val),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review Moderation</h2>
        <p className="mt-1 text-gray-500 dark:text-gray-400">Moderate and manage user reviews</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30">
            <Star className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Reviews</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {pagination?.total || list.length}
            </p>
          </div>
        </div>
        <div
          className="card p-4 flex items-center gap-3 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors"
          onClick={() => setStatusFilter(statusFilter === 'pending' ? '' : 'pending')}
        >
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {list.filter((r) => !r.isApproved).length}
            </p>
          </div>
        </div>
        <div
          className="card p-4 flex items-center gap-3 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors"
          onClick={() => setStatusFilter(statusFilter === 'approved' ? '' : 'approved')}
        >
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {list.filter((r) => r.isApproved).length}
            </p>
          </div>
        </div>
      </div>

      {/* Status filter buttons */}
      <div className="flex gap-2">
        {['', 'pending', 'approved'].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              statusFilter === s
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        searchable
        searchValue={search}
        onSearch={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search reviews..."
        emptyMessage="No reviews found"
        emptyIcon={Star}
        actions={(row) => {
          const rowId = row.id || row._id;
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => setViewReview(row)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 transition-colors"
                title="View Full Student Review Feedback"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => dispatch(toggleReviewApproval(rowId))}
                className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${row.isApproved ? 'text-emerald-600' : 'text-amber-600'}`}
                title={row.isApproved ? 'Unapprove / Hide Review' : 'Approve & Publish Review'}
              >
                <CheckCircle
                  className={`w-4 h-4 ${row.isApproved ? 'text-emerald-600' : 'text-gray-400'}`}
                />
              </button>
              <button
                onClick={() => setDeleteTarget(rowId)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 transition-colors"
                title="Delete Student Review"
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
        title="Delete Review"
        message="Are you sure you want to delete this review?"
        confirmText="Delete"
      />

      {/* Full review modal */}
      <Modal
        isOpen={!!viewReview}
        onClose={() => setViewReview(null)}
        title="Full Review"
        size="sm"
      >
        {viewReview && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {viewReview.user?.name || 'Anonymous'}
                </p>
                <p className="text-xs text-gray-500">{viewReview.course?.title || ''}</p>
              </div>
              {renderStars(viewReview.rating)}
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              {viewReview.comment || 'No comment provided.'}
            </p>
            <p className="text-xs text-gray-400">{formatDate(viewReview.createdAt)}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
