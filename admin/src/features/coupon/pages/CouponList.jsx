import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Copy, Plus, Tag, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Actions
import { fetchCoupons, deleteCoupon } from '@/features/coupon/couponSlice';

// Components
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';

// Utils
import { formatCurrency, formatDate } from '@/utils';

export default function CouponList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, pagination, loading } = useSelector((s) => s.coupons);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchCoupons({ page, limit: 10 }));
  }, [dispatch, page]);

  const handleDelete = async () => {
    if (deleteTarget) {
      await dispatch(deleteCoupon(deleteTarget));
      setDeleteTarget(null);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied: ${code}`);
  };

  const columns = [
    {
      key: 'code',
      label: 'Code',
      render: (val) => (
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded">
            {val}
          </code>
          <button
            onClick={() => copyCode(val)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <Copy className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      ),
    },
    {
      key: 'discountType',
      label: 'Discount',
      render: (val, row) =>
        val === 'percentage' ? `${row.discountValue}%` : formatCurrency(row.discountValue),
    },
    {
      key: 'usedCount',
      label: 'Used',
      render: (val, row) => `${val ?? row.usageCount ?? 0} / ${row.maxUsage ?? row.maxUses ?? '∞'}`,
    },
    {
      key: 'expiresAt',
      label: 'Expires',
      render: (val) => {
        if (!val) return 'Never';
        const expired = new Date(val) < new Date();
        return <span className={expired ? 'text-red-500' : ''}>{formatDate(val)}</span>;
      },
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (val) => (
        <span className={val !== false ? 'badge-success' : 'badge-gray'}>
          {val !== false ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Coupons</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Manage discount coupons</p>
        </div>
        <button onClick={() => navigate('/coupons/create')} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      <DataTable
        columns={columns}
        data={list}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyMessage="No coupons found"
        emptyIcon={Tag}
        actions={(row) => {
          const rowId = row.id || row._id;
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => navigate(`/coupons/${rowId}/edit`)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Edit className="w-4 h-4 text-blue-600" />
              </button>
              <button
                onClick={() => setDeleteTarget(rowId)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          );
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Coupon"
        message="Are you sure?"
        confirmText="Delete"
      />
    </div>
  );
}
