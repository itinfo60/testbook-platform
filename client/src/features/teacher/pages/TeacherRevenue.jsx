import { useEffect, useState } from 'react';
import { paymentAPI } from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { HiCurrencyRupee, HiShoppingCart, HiTrendingUp, HiCalendar, HiUser } from 'react-icons/hi';
import { format } from 'date-fns';

export default function TeacherRevenue() {
  const [data, setData] = useState({ payments: [], totalRevenue: 0, totalOrders: 0 });
  const [loading, setLoading] = useState(true);

  const [expandedCourseId, setExpandedCourseId] = useState(null);

  useEffect(() => {
    paymentAPI
      .getTeacherRevenue()
      .then((res) => setData(res.data?.data || { payments: [], totalRevenue: 0, totalOrders: 0 }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const { payments, totalRevenue, totalOrders } = data;
  const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const stats = [
    {
      label: 'Total Earned',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      icon: HiCurrencyRupee,
      color: 'from-emerald-400 to-teal-500',
    },
    {
      label: 'Total Orders',
      value: totalOrders,
      icon: HiShoppingCart,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Completed',
      value: totalOrders,
      icon: HiTrendingUp,
      color: 'from-purple-500 to-pink-600',
    },
    {
      label: 'Avg. Order',
      value: `₹${avgOrder.toLocaleString('en-IN')}`,
      icon: HiCalendar,
      color: 'from-amber-400 to-orange-500',
    },
  ];

  // Group by course
  const groupedByCourse = Object.values(
    payments.reduce((acc, payment) => {
      const courseId = payment.course?._id || 'unknown';
      if (!acc[courseId]) {
        acc[courseId] = {
          course: payment.course,
          payments: [],
          totalRevenue: 0,
          totalOrders: 0,
        };
      }
      acc[courseId].payments.push(payment);
      acc[courseId].totalRevenue += payment.amount || 0;
      acc[courseId].totalOrders += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.totalRevenue - a.totalRevenue);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-dark-700">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Revenue Analytics
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Track your course sales and performance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
        {stats.map((stat, idx) => (
          <div
            key={stat.label}
            className="relative p-6 rounded-2xl bg-white dark:bg-dark-800 border border-slate-100 dark:border-dark-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div
              className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            ></div>
            <div className="flex items-center mb-4">
              <div
                className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg text-white transform group-hover:scale-110 transition-transform duration-300`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                {stat.label}
              </div>
            </div>
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none`}
            ></div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 border border-slate-100 dark:border-dark-700 shadow-sm">
        <div className="mb-6 pb-4 border-b border-slate-100 dark:border-dark-700">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Course-wise Revenue</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Breakdown of earnings and orders by course
          </p>
        </div>

        {groupedByCourse.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-20 w-20 rounded-full bg-slate-50 dark:bg-dark-700 flex items-center justify-center mb-4">
              <span className="text-5xl">💰</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              No revenue yet
            </h3>
            <p className="text-slate-500">Payments from student enrollments will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedByCourse.map((group, i) => {
              const courseId = group.course?._id || 'unknown';
              const isExpanded = expandedCourseId === courseId;

              return (
                <div
                  key={courseId}
                  className="border border-slate-100 dark:border-dark-700 rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <div
                    className="p-4 sm:p-5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-dark-900/50 transition-colors"
                    onClick={() => setExpandedCourseId(isExpanded ? null : courseId)}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-md">
                        📘
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                          {group.course?.title || 'Unknown Course'}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                          {group.totalOrders} order{group.totalOrders !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0 ml-auto">
                      <div className="text-right">
                        <p className="font-extrabold text-base sm:text-lg text-emerald-600 dark:text-emerald-400">
                          ₹{group.totalRevenue.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                          Earned
                        </p>
                      </div>
                      <div
                        className={`p-2 rounded-full bg-slate-100 dark:bg-dark-700 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-slate-50 dark:bg-dark-900/30 border-t border-slate-100 dark:border-dark-700 animate-fade-in p-5">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                        Payment History ({group.payments.length})
                      </h5>
                      <div className="divide-y divide-slate-100 dark:divide-dark-700/50">
                        {group.payments.map((payment, idx) => {
                          const avatarUrl =
                            payment.user?.avatar?.url ||
                            (typeof payment.user?.avatar === 'string'
                              ? payment.user?.avatar
                              : null);
                          return (
                            <div
                              key={payment._id || idx}
                              className="py-3 flex items-center justify-between first:pt-0 last:pb-0"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-dark-700 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-100 dark:border-dark-600">
                                  {avatarUrl ? (
                                    <img
                                      src={avatarUrl}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <HiUser className="h-4 w-4 text-slate-400" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                                    {payment.user?.name || 'Student'}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {payment.createdAt
                                      ? format(new Date(payment.createdAt), 'MMM dd, yyyy')
                                      : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                +₹{(payment.amount || 0).toLocaleString('en-IN')}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
