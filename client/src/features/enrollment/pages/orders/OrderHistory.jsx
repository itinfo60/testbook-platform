import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiShoppingBag,
  HiReceiptTax,
  HiTag,
  HiCreditCard,
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiRefresh,
  HiChevronDown,
  HiChevronUp,
  HiDownload,
  HiExternalLink,
} from 'react-icons/hi';
import { enrollmentAPI } from '@/services/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    icon: HiCheckCircle,
    cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  completed: {
    label: 'Completed',
    icon: HiCheckCircle,
    cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  pending: {
    label: 'Pending',
    icon: HiClock,
    cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  expired: {
    label: 'Expired',
    icon: HiXCircle,
    cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  },
  refunded: {
    label: 'Refunded',
    icon: HiRefresh,
    cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
};

const PAYMENT_STATUS_CONFIG = {
  completed: {
    label: 'Paid',
    cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  pending: {
    label: 'Pending',
    cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  failed: { label: 'Failed', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  refunded: {
    label: 'Refunded',
    cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
};

const PROVIDER_LABELS = {
  razorpay: 'Razorpay',
  stripe: 'Stripe',
  free: 'Free',
  demo: 'Demo',
};

function fmt(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function currency(amount, cur = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: cur,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);

  const item = order.course || order.test;
  const itemType = order.course ? 'course' : 'test';
  const payment = order.paymentId;

  const enrollment = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const payStatus = payment
    ? PAYMENT_STATUS_CONFIG[payment.status] || PAYMENT_STATUS_CONFIG.pending
    : null;

  const isFree = order.amountPaid === 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* ── Summary row ── */}
      <div
        className="flex items-start gap-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
          {item?.thumbnail ? (
            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <HiShoppingBag className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white truncate">
                {item?.title || 'Unknown item'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">
                {itemType}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${enrollment.cls}`}
              >
                <enrollment.icon className="w-3 h-3" />
                {enrollment.label}
              </span>
              {expanded ? (
                <HiChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <HiChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Purchased {fmtDate(order.enrolledAt)}
            </span>
            {payment?.orderId && (
              <span className="text-xs text-gray-400 font-mono">#{payment.orderId}</span>
            )}
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {isFree ? (
                <span className="text-green-600 dark:text-green-400">Free</span>
              ) : (
                currency(order.amountPaid, payment?.currency)
              )}
            </span>
            {payStatus && (
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${payStatus.cls}`}
              >
                {payStatus.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Expanded details ── */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Payment summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <HiCreditCard className="w-3.5 h-3.5" /> Payment Summary
              </h4>
              <dl className="space-y-1.5">
                {!isFree &&
                  payment?.amount !== undefined &&
                  payment?.amount !== payment?.netAmount && (
                    <Row
                      label="Original price"
                      value={currency(payment.amount, payment.currency)}
                    />
                  )}
                {payment?.discount > 0 && (
                  <Row
                    label="Discount"
                    value={`− ${currency(payment.discount, payment.currency)}`}
                    valueClass="text-green-600 dark:text-green-400"
                  />
                )}
                {payment?.tax > 0 && (
                  <Row label="Tax" value={`+ ${currency(payment.tax, payment.currency)}`} />
                )}
                <Row
                  label="Amount paid"
                  value={isFree ? 'Free' : currency(order.amountPaid, payment?.currency)}
                  valueClass="font-bold text-gray-900 dark:text-white"
                />
                {payment?.currency && <Row label="Currency" value={payment.currency} />}
              </dl>
            </div>

            {/* Transaction details */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <HiReceiptTax className="w-3.5 h-3.5" /> Transaction Details
              </h4>
              <dl className="space-y-1.5">
                {payment?.orderId && <Row label="Order ID" value={payment.orderId} mono />}
                {payment?.paymentId && <Row label="Payment ID" value={payment.paymentId} mono />}
                {payment?.provider && (
                  <Row
                    label="Payment via"
                    value={PROVIDER_LABELS[payment.provider] || payment.provider}
                  />
                )}
                <Row label="Payment date" value={fmt(payment?.createdAt || order.enrolledAt)} />
                {order.lastAccessedAt && (
                  <Row label="Last accessed" value={fmt(order.lastAccessedAt)} />
                )}
              </dl>
            </div>

            {/* Coupon & extras */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <HiTag className="w-3.5 h-3.5" /> Extras
              </h4>
              <dl className="space-y-1.5">
                {(order.couponUsed || payment?.coupon) &&
                  (() => {
                    const c = order.couponUsed || payment?.coupon;
                    const discountText =
                      c?.discountType === 'percentage'
                        ? `${c.discountValue}% off`
                        : c?.discountValue
                          ? currency(c.discountValue, payment?.currency)
                          : null;
                    return (
                      <Row
                        label="Coupon used"
                        value={`${c?.code || '—'}${discountText ? ` (${discountText})` : ''}`}
                        valueClass="text-primary-600 dark:text-primary-400"
                      />
                    );
                  })()}
                {order.progressPercentage !== undefined && itemType === 'course' && (
                  <Row label="Progress" value={`${order.progressPercentage}%`} />
                )}
                {order.completedAt && (
                  <Row label="Completed on" value={fmtDate(order.completedAt)} />
                )}
                {order.certificateIssued && (
                  <Row
                    label="Certificate"
                    value="Issued"
                    valueClass="text-green-600 dark:text-green-400"
                  />
                )}
              </dl>

              {/* Refund info */}
              {payment?.refundId && (
                <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">
                    Refund
                  </p>
                  <dl className="space-y-1">
                    <Row label="Refund ID" value={payment.refundId} mono />
                    {payment.refundAmount > 0 && (
                      <Row
                        label="Amount"
                        value={currency(payment.refundAmount, payment.currency)}
                      />
                    )}
                    {payment.refundedAt && <Row label="Date" value={fmtDate(payment.refundedAt)} />}
                  </dl>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            {item && (
              <Link
                to={
                  itemType === 'course'
                    ? `/courses/${item.slug || item._id}/learn`
                    : `/tests/${item.slug || item._id}`
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <HiExternalLink className="w-3.5 h-3.5" />
                {itemType === 'course' ? 'Continue Learning' : 'Go to Test'}
              </Link>
            )}
            {order.certificateIssued && order.certificateUrl && (
              <a
                href={order.certificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <HiDownload className="w-3.5 h-3.5" />
                Download Certificate
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono, valueClass }) {
  return (
    <div className="flex justify-between gap-2 text-xs">
      <dt className="text-gray-500 dark:text-gray-400 flex-shrink-0">{label}</dt>
      <dd
        className={`text-right break-all ${mono ? 'font-mono text-gray-600 dark:text-gray-300' : 'text-gray-700 dark:text-gray-300'} ${valueClass || ''}`}
      >
        {value || '—'}
      </dd>
    </div>
  );
}

const STATUS_FILTERS = ['', 'active', 'completed', 'pending', 'expired', 'refunded'];

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (statusFilter) params.status = statusFilter;

    enrollmentAPI
      .getOrderHistory(params)
      .then(({ data }) => {
        setOrders(data.data?.orders || []);
        setPages(data.data?.pages || 1);
        setTotal(data.data?.total || 0);
      })
      .catch(() => toast.error('Failed to load order history'))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order History</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          {total > 0
            ? `${total} purchase${total !== 1 ? 's' : ''}`
            : 'Your purchase history will appear here'}
        </p>
      </div>

      {/* Filters */}
      {(total > 0 || statusFilter) && (
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse"
            >
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <HiShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No orders yet
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {statusFilter
              ? `No ${statusFilter} orders found.`
              : 'Start learning by enrolling in a course or test.'}
          </p>
          <Link to="/courses" className="btn-primary">
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && !loading && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
