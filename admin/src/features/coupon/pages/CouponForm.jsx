import LoadingSpinner from '@/components/loadingSpinner';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import {
  createCoupon,
  updateCoupon,
  fetchCouponById,
  clearSelected,
} from '@/features/coupon/couponSlice';

// Helper: format date for input[type=date]
const toDateInput = (d) => {
  if (!d) return '';
  return new Date(d).toISOString().split('T')[0];
};

// Helper: get date 30 days from now
const defaultEndDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
};

export default function CouponForm() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selected, loading } = useSelector((s) => s.coupons);
  const isEdit = Boolean(id && id !== 'undefined');

  const [form, setForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxDiscount: '',
    maxUsage: '',
    maxUsagePerUser: '1',
    startDate: new Date().toISOString().split('T')[0],
    endDate: defaultEndDate(),
    expiresAt: '',
    isActive: true,
    description: '',
  });

  useEffect(() => {
    if (isEdit) dispatch(fetchCouponById(id));
    return () => dispatch(clearSelected());
  }, [dispatch, id, isEdit]);

  useEffect(() => {
    if (isEdit && selected) {
      setForm({
        code: selected.code || '',
        discountType: selected.discountType || 'percentage',
        discountValue: selected.discountValue || '',
        minOrderAmount: selected.minOrderAmount || selected.minPurchaseAmount || '',
        maxDiscount: selected.maxDiscount || selected.maxDiscountAmount || '',
        maxUsage: selected.maxUsage || selected.usageLimit || '',
        maxUsagePerUser: selected.maxUsagePerUser || '1',
        startDate: toDateInput(selected.startDate) || new Date().toISOString().split('T')[0],
        endDate: toDateInput(selected.endDate || selected.expiresAt) || defaultEndDate(),
        expiresAt: toDateInput(selected.expiresAt || selected.endDate) || '',
        isActive: selected.isActive !== false,
        description: selected.description || '',
      });
    }
  }, [selected, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Build payload with ALL possible field names the server might expect
    const data = {
      code: form.code.toUpperCase().trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      isActive: form.isActive,
    };

    // Add dates (server requires startDate + endDate)
    if (form.startDate) {
      data.startDate = new Date(form.startDate).toISOString();
    }
    if (form.endDate) {
      data.endDate = new Date(form.endDate).toISOString();
      data.expiresAt = new Date(form.endDate).toISOString(); // Also set expiresAt
    }
    if (form.expiresAt && !form.endDate) {
      data.expiresAt = new Date(form.expiresAt).toISOString();
      data.endDate = new Date(form.expiresAt).toISOString();
    }

    // Optional fields
    if (form.minOrderAmount) {
      data.minOrderAmount = Number(form.minOrderAmount);
      data.minPurchaseAmount = Number(form.minOrderAmount); // alias
    }
    if (form.maxDiscount) {
      data.maxDiscount = Number(form.maxDiscount);
      data.maxDiscountAmount = Number(form.maxDiscount); // alias
    }
    if (form.maxUsage) {
      data.maxUsage = Number(form.maxUsage);
      data.usageLimit = Number(form.maxUsage); // alias
    }
    if (form.maxUsagePerUser) {
      data.maxUsagePerUser = Number(form.maxUsagePerUser);
    }
    if (form.description) {
      data.description = form.description;
    }

    const action = isEdit ? updateCoupon({ id, data }) : createCoupon(data);
    const result = await dispatch(action);
    if (!result.error) navigate('/coupons');
  };

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  if (isEdit && loading && !selected) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/coupons')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Edit Coupon' : 'Create Coupon'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Coupon Code *
          </label>
          <input
            type="text"
            value={form.code}
            onChange={handleChange('code')}
            className="input-field uppercase"
            required
            placeholder="SAVE20"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <input
            type="text"
            value={form.description}
            onChange={handleChange('description')}
            className="input-field"
            placeholder="20% off on all courses"
          />
        </div>

        {/* Discount Type + Value */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Discount Type
            </label>
            <select
              value={form.discountType}
              onChange={handleChange('discountType')}
              className="input-field"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Discount Value *
            </label>
            <input
              type="number"
              value={form.discountValue}
              onChange={handleChange('discountValue')}
              className="input-field"
              required
              min="0"
              max={form.discountType === 'percentage' ? 100 : undefined}
              placeholder={form.discountType === 'percentage' ? '20' : '500'}
            />
          </div>
        </div>

        {/* Start Date + End Date (REQUIRED by server) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={handleChange('startDate')}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date *
            </label>
            <input
              type="date"
              value={form.endDate}
              onChange={handleChange('endDate')}
              className="input-field"
              required
            />
          </div>
        </div>

        {/* Min Order + Max Discount */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Min Order Amount (₹)
            </label>
            <input
              type="number"
              value={form.minOrderAmount}
              onChange={handleChange('minOrderAmount')}
              className="input-field"
              min="0"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Discount (₹)
            </label>
            <input
              type="number"
              value={form.maxDiscount}
              onChange={handleChange('maxDiscount')}
              className="input-field"
              min="0"
              placeholder="Optional"
            />
          </div>
        </div>

        {/* Usage Limits */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Total Usage
            </label>
            <input
              type="number"
              value={form.maxUsage}
              onChange={handleChange('maxUsage')}
              className="input-field"
              min="0"
              placeholder="Unlimited"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Usage Per User
            </label>
            <input
              type="number"
              value={form.maxUsagePerUser}
              onChange={handleChange('maxUsagePerUser')}
              className="input-field"
              min="1"
              placeholder="1"
            />
          </div>
        </div>

        {/* Active */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            value={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
            className="input-field"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary gap-2">
            <Save className="w-4 h-4" /> {isEdit ? 'Update' : 'Create'}
          </button>
          <button type="button" onClick={() => navigate('/coupons')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
