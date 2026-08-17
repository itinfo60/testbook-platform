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
  const itemTitle = item?.title || 'Unknown item';
  const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

  return (
    <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm overflow-hidden group">
      {/* Basic Info (Always visible) */}
      <div
        className="p-4 sm:p-5 cursor-pointer flex items-start gap-4 sm:gap-5 hover:bg-slate-50 dark:hover:bg-dark-800 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Thumbnail */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 dark:bg-dark-800 flex-shrink-0 overflow-hidden relative shadow-sm border border-slate-200 dark:border-dark-700">
          {item?.thumbnail?.url || item?.thumbnail ? (
            <img
              src={item.thumbnail?.url || item.thumbnail}
              alt={itemTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <HiShoppingBag className="w-8 h-8 text-slate-300 dark:text-dark-600" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${sc.cls}`}
              >
                <sc.icon className="w-3 h-3" />
                {sc.label}
              </span>
              <span className="text-xs font-bold text-slate-400">•</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {fmtDate(order.createdAt)}
              </span>
            </div>
            <h3 className="font-bold text-dark-900 dark:text-white line-clamp-2 text-sm sm:text-base group-hover:text-amber-600 transition-colors">
              {itemTitle}
            </h3>
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className="font-extrabold text-slate-900 dark:text-white text-base">
              {currency(order.finalPrice)}
            </span>
            <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors">
              {expanded ? (
                <HiChevronUp className="w-5 h-5" />
              ) : (
                <HiChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-slate-100 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-800/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
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
          <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200 dark:border-dark-800">
            {item && (
              <Link
                to={
                  itemType === 'course'
                    ? `/courses/${item.slug || item._id}/learn`
                    : `/tests/${item.slug || item._id}`
                }
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-md transition-all active:scale-95"
                onClick={(e) => e.stopPropagation()}
              >
                <HiExternalLink className="w-4 h-4" />
                {itemType === 'course' ? 'Continue Learning' : 'Go to Test'}
              </Link>
            )}
            {order.certificateIssued && order.certificateUrl && (
              <a
                href={order.certificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700 hover:bg-slate-200 dark:hover:bg-dark-700 text-sm font-bold shadow-sm transition-all"
              >
                <HiDownload className="w-4 h-4 text-green-600" />
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
    <div className="flex justify-between gap-2 text-[13px]">
      <dt className="text-slate-600 dark:text-slate-400 font-bold tracking-wide flex-shrink-0">
        {label}
      </dt>
      <dd
        className={`text-right break-all ${mono ? 'font-mono text-slate-600 dark:text-slate-300 text-xs' : 'text-slate-700 dark:text-slate-300 font-medium'} ${valueClass || ''}`}
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-dark-900 dark:text-white font-display tracking-tight">
          Purchase History & Invoices
        </h1>
        <p className="mt-2 text-sm font-bold text-slate-500">
          {total > 0
            ? `${total} order${total !== 1 ? 's' : ''} found in your account`
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
              className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-colors shadow-sm ${
                statusFilter === s
                  ? 'bg-amber-500 text-white'
                  : 'bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-800'
              }`}
            >
              {s || 'All Orders'}
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
              className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-800 p-6 animate-pulse"
            >
              <div className="flex gap-6">
                <div className="w-20 h-20 rounded-xl bg-slate-200 dark:bg-dark-800 flex-shrink-0" />
                <div className="flex-1 space-y-3 pt-1">
                  <div className="h-5 bg-slate-200 dark:bg-dark-800 rounded w-2/3" />
                  <div className="h-4 bg-slate-200 dark:bg-dark-800 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 dark:bg-dark-800 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-dark-900 p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-dark-700 shadow-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-50 dark:bg-dark-800 rounded-full mb-6">
            <HiShoppingBag className="w-10 h-10 text-slate-300 dark:text-dark-600" />
          </div>
          <h2 className="text-xl font-extrabold text-dark-900 dark:text-white mb-2">
            No orders found
          </h2>
          <p className="text-slate-500 text-sm font-medium mb-8">
            {statusFilter
              ? `No ${statusFilter} orders found in your history.`
              : 'Kickstart your preparation by enrolling in a targeted course or test series.'}
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-3 rounded-xl transition-colors shadow-md"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
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
