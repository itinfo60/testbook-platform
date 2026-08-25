import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  ArrowRight,
  BookOpen,
  IndianRupee,
  Receipt,
  RotateCcw,
  Tag,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Video,
  BookMarked,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { fetchRevenue } from '@/features/revenue/revenueSlice';
import StatsCard from '@/components/StatsCard';
import LoadingSpinner from '@/components/loadingSpinner';
import { formatCurrency, formatNumber } from '@/utils';

const PERIOD_TABS = [
  { value: '7', label: '7 Days' },
  { value: '30', label: '30 Days' },
  { value: '90', label: '3 Months' },
  { value: '365', label: '1 Year' },
];

export default function RevenueDashboard() {
  const dispatch = useDispatch();
  const { data, loading } = useSelector((s) => s.revenue);
  const [period, setPeriod] = useState('30');
  const [productTypeFilter, setProductTypeFilter] = useState('all');

  const loadData = useCallback(() => {
    dispatch(fetchRevenue({ period })).catch(() => {});
  }, [dispatch, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !data) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const d = data || {};
  const kpis = d.kpis || {};
  const revenueTrend = d.revenueTrend || [];
  const ordersByStatus = d.ordersByStatus || {
    successful: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
    total: 0,
  };
  const revenueByProduct = d.revenueByProduct || [];
  const topProducts = d.topProducts || [];
  const couponPerf = d.couponPerformance || {
    couponOrders: 0,
    discountGiven: 0,
    revenueGenerated: 0,
    avgDiscount: 0,
    couponUsageRate: 0,
  };
  const paymentPerf = d.paymentPerformance || {
    successfulPayments: 0,
    failedPayments: 0,
    pendingPayments: 0,
    refundedPayments: 0,
    successRate: 100,
  };

  // Filter top products
  const filteredProducts = topProducts.filter((p) => {
    if (productTypeFilter === 'all') return true;
    if (productTypeFilter === 'courses') return p.type?.toLowerCase().includes('course');
    if (productTypeFilter === 'test-series') return p.type?.toLowerCase().includes('test');
    if (productTypeFilter === 'live-classes') return p.type?.toLowerCase().includes('live');
    if (productTypeFilter === 'library') return p.type?.toLowerCase().includes('library');
    return true;
  });

  // Dynamic axis label text
  const getIntervalLabel = () => {
    if (period === '7') return 'Daily granularity (Last 7 Days)';
    if (period === '30') return 'Daily granularity (Last 30 Days)';
    if (period === '90') return 'Weekly granularity (Last 3 Months)';
    return 'Monthly granularity (Last 1 Year)';
  };

  const activePeriodLabel = PERIOD_TABS.find((p) => p.value === period)?.label || '30 Days';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight font-display">
            Revenue Analytics
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            Financial metrics, order performance, revenue trends, and monetization insights.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period selector */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            {PERIOD_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setPeriod(tab.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  period === tab.value
                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Link to="/payments" className="btn-primary gap-2 text-sm whitespace-nowrap">
            <Receipt className="w-4 h-4" /> View Orders
          </Link>
        </div>
      </div>

      {/* 1. Primary KPI Cards (6 Cards) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Executive Monetization KPIs
          </h2>
          <span className="text-xs font-semibold text-gray-500">
            Comparing vs. previous {activePeriodLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Gross Revenue */}
          <StatsCard
            title="Gross Revenue"
            value={formatCurrency(kpis.grossRevenue?.value || 0)}
            trend={kpis.grossRevenue?.growth}
            color="emerald"
            icon={IndianRupee}
            to="/payments"
            subtitle={`Total revenue in ${activePeriodLabel}`}
          />

          {/* 2. Net Revenue */}
          <StatsCard
            title="Net Revenue"
            value={formatCurrency(kpis.netRevenue?.value || 0)}
            trend={kpis.netRevenue?.growth}
            color="primary"
            icon={CreditCard}
            to="/payments"
            subtitle="Gross minus refunds & discounts"
          />

          {/* 3. Paid Orders */}
          <StatsCard
            title="Paid Orders"
            value={formatNumber(kpis.paidOrders?.value || 0)}
            trend={kpis.paidOrders?.growth}
            color="blue"
            icon={ShoppingCart}
            to="/payments"
            subtitle="Cleared order transactions"
          />

          {/* 4. Average Order Value */}
          <StatsCard
            title="Average Order Value"
            value={`₹${kpis.avgOrderValue?.value || 0}`}
            color="purple"
            icon={TrendingUp}
            to="/payments"
            subtitle="Revenue per paid transaction"
          />

          {/* 5. Refunds */}
          <StatsCard
            title="Refunds"
            value={formatCurrency(kpis.refunds?.value || 0)}
            color="rose"
            icon={RotateCcw}
            to="/payments?status=refunded"
            subtitle={`${kpis.refunds?.count || 0} refunded orders`}
          />

          {/* 6. Discounts & Coupons */}
          <StatsCard
            title="Discounts & Coupons"
            value={formatCurrency(kpis.discounts?.value || 0)}
            color="amber"
            icon={Tag}
            to="/coupons"
            subtitle="Promotional campaign savings"
          />
        </div>
      </div>

      {/* 2. Revenue Trend */}
      <div className="card p-6 border border-gray-200 dark:border-gray-700/80 shadow-sm bg-white dark:bg-gray-800 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display">
                Revenue Trend
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {getIntervalLabel()} — Gross Volume vs. Realized Net Revenue
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" /> Gross Revenue
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Net Revenue
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          {revenueTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="grossRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="netRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val, name) => [
                    `₹${Number(val).toLocaleString('en-IN')}`,
                    name === 'revenue' ? 'Gross Revenue' : 'Net Revenue',
                  ]}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '0.75rem',
                    color: '#f9fafb',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#grossRevGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="netRevenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#netRevGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <TrendingUp className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No revenue trend data recorded for this window</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Orders & Payment Performance + 4. Revenue by Product (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders & Payment Performance */}
        <div className="card p-6 border border-gray-200 dark:border-gray-700/80 shadow-sm bg-white dark:bg-gray-800 rounded-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary-600" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white font-display">
                Orders & Payment Performance
              </h3>
            </div>
            <Link to="/payments" className="text-xs font-semibold text-primary-600 hover:underline">
              Inspect Transactions →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Successful
              </p>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {ordersByStatus.successful || 0}
              </p>
              <span className="text-[10px] text-emerald-600 font-medium">Cleared</span>
            </div>

            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Pending</p>
              <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                {ordersByStatus.pending || 0}
              </p>
              <span className="text-[10px] text-amber-600 font-medium">Processing</span>
            </div>

            <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl">
              <p className="text-xs font-medium text-rose-700 dark:text-rose-300">Failed</p>
              <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                {ordersByStatus.failed || 0}
              </p>
              <span className="text-[10px] text-rose-600 font-medium">Declined</span>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Refunded</p>
              <p className="text-xl font-extrabold text-gray-700 dark:text-gray-300 mt-0.5">
                {ordersByStatus.refunded || 0}
              </p>
              <span className="text-[10px] text-gray-500 font-medium">Returned</span>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-100 dark:border-gray-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-600 dark:text-gray-300">Order Completion Ratio</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {paymentPerf.successRate}% Success
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(paymentPerf.successRate || 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Revenue by Product Breakdown */}
        <div className="card p-6 border border-gray-200 dark:border-gray-700/80 shadow-sm bg-white dark:bg-gray-800 rounded-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white font-display">
                Revenue by Product
              </h3>
            </div>
            <span className="text-xs text-gray-500">Monetization mix</span>
          </div>

          <div className="space-y-3.5">
            {revenueByProduct.map((p) => (
              <div key={p.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    {p.type === 'course' && <BookOpen className="w-3.5 h-3.5 text-primary-500" />}
                    {p.type === 'test-series' && <Layers className="w-3.5 h-3.5 text-amber-500" />}
                    {p.type === 'live-class' && <Video className="w-3.5 h-3.5 text-emerald-500" />}
                    {p.type === 'library' && <BookMarked className="w-3.5 h-3.5 text-indigo-500" />}
                    {p.name}
                  </span>
                  <span className="text-gray-900 dark:text-white font-bold">
                    ₹{Number(p.revenue || 0).toLocaleString('en-IN')}{' '}
                    <span className="text-gray-400 font-normal">({p.percentage}%)</span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      p.type === 'course'
                        ? 'bg-primary-500'
                        : p.type === 'test-series'
                          ? 'bg-amber-500'
                          : p.type === 'live-class'
                            ? 'bg-emerald-500'
                            : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(p.percentage || 0, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Top Performing Products */}
      <div className="card p-6 border border-gray-200 dark:border-gray-700/80 shadow-sm bg-white dark:bg-gray-800 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-display">
              Top Performing Products
            </h3>
            <p className="text-xs text-gray-500">
              Ranked by revenue contribution across courses, test series, and live batches
            </p>
          </div>

          {/* Product Type Filter Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-750 p-1 rounded-xl">
            {[
              { key: 'all', label: 'All' },
              { key: 'courses', label: 'Courses' },
              { key: 'test-series', label: 'Test Series' },
              { key: 'live-classes', label: 'Live Classes' },
              { key: 'library', label: 'Digital Library' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setProductTypeFilter(tab.key)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  productTypeFilter === tab.key
                    ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-300 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700 text-sm">
            <thead>
              <tr className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Orders</th>
                <th className="py-3 px-4">Students / Users</th>
                <th className="py-3 px-4 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p, i) => (
                  <tr key={p.id || i} className="hover:bg-gray-50 dark:hover:bg-gray-750/50">
                    <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                      {p.link ? (
                        <Link to={p.link} className="hover:text-primary-600 hover:underline">
                          {p.title}
                        </Link>
                      ) : (
                        p.title
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="badge badge-primary text-[11px] font-semibold">
                        {p.type || 'Course'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-600 dark:text-gray-300">
                      {formatNumber(p.orders || 0)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-600 dark:text-gray-300">
                      {formatNumber(p.students || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{Number(p.revenue || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400 text-sm">
                    No products found for this filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Coupon Performance & 7. Payment Performance (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coupon Performance */}
        <div className="card p-6 border border-gray-200 dark:border-gray-700/80 shadow-sm bg-white dark:bg-gray-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white font-display">
                Coupon & Discount Performance
              </h3>
            </div>
            <Link to="/coupons" className="text-xs font-semibold text-primary-600 hover:underline">
              Manage Coupons →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500">Coupon Orders</p>
              <p className="text-lg font-extrabold text-gray-900 dark:text-white mt-0.5">
                {formatNumber(couponPerf.couponOrders || 0)}
              </p>
              <span className="text-[10px] text-primary-600 font-medium">Orders redeemed</span>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500">Discounts Given</p>
              <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                {formatCurrency(couponPerf.discountGiven || 0)}
              </p>
              <span className="text-[10px] text-gray-400 font-medium">Total saved by users</span>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-100 dark:border-gray-700 col-span-2 sm:col-span-1">
              <p className="text-xs text-gray-500">Coupon Revenue</p>
              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(couponPerf.revenueGenerated || 0)}
              </p>
              <span className="text-[10px] text-emerald-600 font-medium">Volume generated</span>
            </div>
          </div>
        </div>

        {/* Payment Performance */}
        <div className="card p-6 border border-gray-200 dark:border-gray-700/80 shadow-sm bg-white dark:bg-gray-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white font-display">
                Payment Gateway Performance
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {paymentPerf.successRate}% Success Rate
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500">Successful</p>
              <p className="text-lg font-bold text-emerald-600 mt-0.5">
                {paymentPerf.successfulPayments}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500">Failed</p>
              <p className="text-lg font-bold text-rose-600 mt-0.5">{paymentPerf.failedPayments}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-lg font-bold text-amber-600 mt-0.5">
                {paymentPerf.pendingPayments}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500">Refunded</p>
              <p className="text-lg font-bold text-gray-600 dark:text-gray-300 mt-0.5">
                {paymentPerf.refundedPayments}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
