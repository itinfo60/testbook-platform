import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  IndianRupee,
  Search,
  Eye,
  Download,
  Users,
  TrendingUp,
  Receipt,
  RotateCcw,
  AlertCircle,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { paymentsAPI } from '@/services/api';
import DataTable from '@/components/DataTable';
import StatsCard from '@/components/StatsCard';
import Modal from '@/components/Modal';
import { formatCurrency, formatDate, formatNumber } from '@/utils';
import useDebounce from '@/hooks/useDebounce';
import toast from 'react-hot-toast';

export default function PaymentList() {
  const [list, setList] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'completed' | 'pending' | 'failed' | 'refunded'
  const [methodFilter, setMethodFilter] = useState('all');
  const [gatewayFilter, setGatewayFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);

  const debouncedSearch = useDebounce(search);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: debouncedSearch,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        method: methodFilter !== 'all' ? methodFilter : undefined,
      };
      const res = await paymentsAPI.getAll(params);
      const payload = res.data?.data || res.data || {};
      const docs = Array.isArray(res.data?.data)
        ? res.data.data
        : payload.docs || payload.payments || [];
      setList(docs);
      setPagination(
        res.data?.pagination ||
          payload.pagination || {
            page,
            totalPages: Math.ceil((payload.total || docs.length || 0) / 10),
            total: payload.total || docs.length || 0,
          }
      );
      if (res.data?.stats || payload.stats) setStats(res.data?.stats || payload.stats);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, methodFilter]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const columns = [
    {
      key: 'user',
      label: 'Student',
      render: (val, row) => {
        const user = row.user || val;
        const userId = user?.id || user?._id || row.userId;
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div className="min-w-0">
              {userId ? (
                <Link
                  to={`/users/${userId}`}
                  className="font-bold text-gray-900 dark:text-white hover:text-primary-600 hover:underline truncate block"
                >
                  {user?.name || 'Student'}
                </Link>
              ) : (
                <span className="font-bold text-gray-900 dark:text-white truncate block">
                  {user?.name || 'Student'}
                </span>
              )}
              <p className="text-xs text-gray-500 truncate">{user?.email || '—'}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'orderId',
      label: 'Order ID',
      render: (val, row) => (
        <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          {val || `ORD-${(row.id || '').substring(0, 6).toUpperCase()}`}
        </span>
      ),
    },
    {
      key: 'transactionId',
      label: 'Transaction ID',
      render: (val, row) => (
        <span className="font-mono text-xs text-gray-600 dark:text-gray-400 truncate block max-w-[140px]">
          {val || `TXN-${(row.id || '').substring(0, 8).toUpperCase()}`}
        </span>
      ),
    },
    {
      key: 'product',
      label: 'Product',
      render: (_, row) => {
        const title =
          row.notes?.productTitle ||
          row.courseTitle ||
          row.receipt ||
          (row.orderId ? `Order #${row.orderId}` : '—');
        return (
          <div>
            <span className="text-xs font-semibold text-gray-900 dark:text-white block truncate max-w-[160px]">
              {title}
            </span>
          </div>
        );
      },
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (val, row) => (
        <span className="font-bold text-gray-900 dark:text-white text-sm">
          ₹{Number(val || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'method',
      label: 'Payment Method',
      render: (val) => (
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
          {val || 'UPI / Razorpay'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val) => {
        const isPaid = val === 'completed' || val === 'paid';
        const isFailed = val === 'failed';
        const isRefunded = val === 'refunded';
        return (
          <span
            className={`badge ${
              isPaid
                ? 'badge-success'
                : isFailed
                  ? 'badge-danger'
                  : isRefunded
                    ? 'badge-gray'
                    : 'badge-warning'
            }`}
          >
            {isPaid ? 'Paid' : isFailed ? 'Failed' : isRefunded ? 'Refunded' : 'Pending'}
          </span>
        );
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
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight font-display">
            Orders & Payments
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            Operational payment gateway records, transaction statuses, and refund tracking
          </p>
        </div>

        <Link to="/revenue" className="btn-secondary gap-2 text-sm self-start sm:self-auto">
          <TrendingUp className="w-4 h-4" /> Revenue Analytics
        </Link>
      </div>

      {/* Row 1 — Transaction KPIs (4 Cards) */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
          Transaction Volume & Health
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Gross Payment Volume (GPV)"
            value={formatCurrency(stats.grossPaymentVolume || stats.totalRevenue || 0)}
            color="emerald"
            icon={IndianRupee}
            subtitle="Total successfully collected"
          />
          <StatsCard
            title="Total Transactions"
            value={formatNumber(stats.totalTransactions || 0)}
            color="primary"
            icon={Receipt}
            subtitle="All payment attempts"
          />
          <StatsCard
            title="Successful Orders"
            value={formatNumber(stats.successfulOrders || 0)}
            color="emerald"
            icon={CheckCircle2}
            subtitle="Completed purchases"
          />
          <StatsCard
            title="Payment Success Rate"
            value={`${stats.successRate ?? 100}%`}
            color="blue"
            icon={TrendingUp}
            subtitle="Successful ÷ total attempts"
          />
        </div>
      </div>

      {/* Row 2 — Operational Payment KPIs (4 Cards) */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
          Operational Payment Statuses
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Pending Payments"
            value={formatNumber(stats.pendingPayments || 0)}
            color="amber"
            icon={Clock}
            onClick={() => setStatusFilter('pending')}
            subtitle="Awaiting completion"
          />
          <StatsCard
            title="Failed Payments"
            value={formatNumber(stats.failedPayments || 0)}
            color="rose"
            icon={XCircle}
            onClick={() => setStatusFilter('failed')}
            subtitle="Payment attempts failed"
          />
          <StatsCard
            title="Refunded Orders"
            value={formatNumber(stats.refundedOrders || 0)}
            color="purple"
            icon={RotateCcw}
            onClick={() => setStatusFilter('refunded')}
            subtitle="Orders refunded"
          />
          <StatsCard
            title="Refund Amount"
            value={formatCurrency(stats.refundAmount || 0)}
            color="rose"
            icon={IndianRupee}
            subtitle="Total money refunded"
          />
        </div>
      </div>

      {/* Filters Bar */}
      <div className="space-y-3">
        {/* Status Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 gap-4 overflow-x-auto">
          {[
            { key: 'all', label: 'All Transactions' },
            { key: 'completed', label: 'Successful (Paid)' },
            { key: 'pending', label: 'Pending' },
            { key: 'failed', label: 'Failed' },
            { key: 'refunded', label: 'Refunded' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className={`pb-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
                statusFilter === tab.key
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search and Secondary Dropdowns */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 shadow-sm text-xs font-semibold">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent border-none outline-none cursor-pointer text-gray-700 dark:text-gray-200"
            >
              <option value="all">All Payment Methods</option>
              <option value="upi">UPI</option>
              <option value="card">Credit / Debit Card</option>
              <option value="netbanking">Net Banking</option>
              <option value="wallet">Wallet</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 shadow-sm text-xs font-semibold">
            <select
              value={gatewayFilter}
              onChange={(e) => {
                setGatewayFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent border-none outline-none cursor-pointer text-gray-700 dark:text-gray-200"
            >
              <option value="all">All Gateways</option>
              <option value="razorpay">Razorpay</option>
              <option value="stripe">Stripe</option>
              <option value="manual">Manual / Cash</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Data Table */}
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
        searchPlaceholder="Search student name, email, order ID, or transaction ID..."
        emptyMessage="No transaction records match your filters"
        emptyIcon={CreditCard}
        actions={(row) => (
          <button
            onClick={() => setSelectedPayment(row)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-primary-600 font-semibold text-xs flex items-center gap-1"
            title="Inspect Transaction"
          >
            <Eye className="w-3.5 h-3.5" /> View
          </button>
        )}
      />

      {/* Transaction Details Modal */}
      {selectedPayment && (
        <Modal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          title="Payment Transaction Receipt"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                  Amount Paid
                </p>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-0.5">
                  ₹{selectedPayment.amount} {selectedPayment.currency || 'INR'}
                </p>
              </div>
              <span
                className={`badge ${
                  selectedPayment.status === 'completed'
                    ? 'badge-success'
                    : selectedPayment.status === 'failed'
                      ? 'badge-danger'
                      : selectedPayment.status === 'refunded'
                        ? 'badge-gray'
                        : 'badge-warning'
                }`}
              >
                {selectedPayment.status === 'completed'
                  ? 'Paid'
                  : selectedPayment.status || 'Pending'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-500">Student Name</p>
                <p className="font-semibold text-gray-900 dark:text-white mt-1">
                  {selectedPayment.user?.name || 'Student'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-500">Student Email</p>
                <p className="font-semibold text-gray-900 dark:text-white mt-1">
                  {selectedPayment.user?.email || '—'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-500">Order ID</p>
                <p className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200 mt-1">
                  {selectedPayment.orderId ||
                    `ORD-${(selectedPayment.id || '').substring(0, 6).toUpperCase()}`}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-500">Payment Gateway</p>
                <p className="font-semibold text-gray-900 dark:text-white mt-1 capitalize">
                  {selectedPayment.method || 'Razorpay Online'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg col-span-2">
                <p className="text-xs text-gray-500">Transaction ID</p>
                <p className="font-mono text-xs font-bold text-primary-600 mt-1 break-all">
                  {selectedPayment.transactionId ||
                    `TXN-${(selectedPayment.id || '').substring(0, 8).toUpperCase()}`}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg col-span-2">
                <p className="text-xs text-gray-500">Timestamp</p>
                <p className="font-medium text-gray-800 dark:text-gray-200 mt-1">
                  {formatDate(selectedPayment.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedPayment(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
