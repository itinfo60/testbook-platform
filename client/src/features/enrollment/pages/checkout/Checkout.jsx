import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HiLockClosed, HiShieldCheck, HiCheckCircle, HiBeaker } from 'react-icons/hi';
import { fetchCourseById } from '@/features/course/courseSlice';
import { fetchTestById } from '@/features/test/testSlice';
import { enrollInCourse } from '@/features/enrollment/enrollmentSlice';
import {
  dummyCheckout,
  validateCoupon,
  clearPaymentState,
  clearCoupon,
} from '@/features/payment/paymentSlice';
import api from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PriceTag from '@/components/common/PriceTag';
import { Button, Input } from '@/components/ui';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentCourse: course, loading: courseLoading } = useSelector((state) => state.courses);
  const { currentTest: test, loading: testLoading } = useSelector((state) => state.tests);
  const { coupon, discount, loading } = useSelector((state) => state.payments);
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'course';
  const isTest = type === 'test' || type === 'test_series';

  const [testSeriesItem, setTestSeriesItem] = useState(null);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (isTest) {
      setSeriesLoading(true);
      // Try fetching as TestSeries first if type=test_series, or fallback
      api
        .get(`/test-series/${id}`)
        .then((res) => {
          const data = res.data?.data?.testSeries || res.data?.testSeries;
          if (data) setTestSeriesItem(data);
          else dispatch(fetchTestById(id));
        })
        .catch(() => {
          dispatch(fetchTestById(id));
        })
        .finally(() => setSeriesLoading(false));
    } else {
      dispatch(fetchCourseById(id));
    }
    dispatch(clearPaymentState());
  }, [dispatch, id, isTest]);

  if (
    (courseLoading && !isTest) ||
    (seriesLoading && isTest) ||
    (!testSeriesItem && testLoading && isTest) ||
    (!course && !isTest) ||
    (!testSeriesItem && !test && isTest)
  ) {
    return <LoadingSpinner fullScreen />;
  }

  const item = testSeriesItem || (isTest ? test : course);
  const effectivePrice = item?.effectivePrice ?? item?.price ?? 0;
  const isFree = isTest ? item?.isFree || effectivePrice === 0 : effectivePrice === 0;

  // Base calculations
  const priceBeforeDiscount = Math.max(0, effectivePrice - discount);
  const gstAmount = priceBeforeDiscount > 0 ? Math.round(priceBeforeDiscount * 0.18) : 0;
  const finalPrice = priceBeforeDiscount + gstAmount;

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    dispatch(
      validateCoupon({
        code: couponCode,
        courseId: isTest ? undefined : id,
        amount: effectivePrice,
      })
    );
  };

  const handleFreeEnroll = async () => {
    if (isTest) {
      // Free tests can be started directly, so we just redirect them to start test
      navigate(`/tests/${item?.slug || id}/take`);
      return;
    }
    const resolvedCourseId = item?._id || id;
    try {
      await dispatch(enrollInCourse({ courseId: resolvedCourseId })).unwrap();
      toast.success('Enrolled successfully!');
      navigate('/checkout/success', {
        state: { courseId: resolvedCourseId, itemName: item?.title, free: true, isTest: false },
      });
    } catch (err) {
      if (typeof err === 'string' && err.toLowerCase().includes('already enrolled')) {
        toast.success('You are already enrolled in this course!');
        navigate(`/courses/${item?.slug || id}/learn`);
      } else {
        toast.error(err || 'Enrollment failed');
      }
    }
  };

  const handlePaidEnroll = async () => {
    if (!confirmed) {
      toast.error('Please confirm the payment to proceed');
      return;
    }
    try {
      const resolvedId = item?._id || id;
      const payload = isTest ? { testId: resolvedId } : { courseId: resolvedId };
      if (coupon) {
        payload.couponCode = coupon.coupon?.code || coupon.code;
      }
      await dispatch(dummyCheckout(payload)).unwrap();
      toast.success(`Payment successful! Purchased ${isTest ? 'test' : 'course'}.`);
      navigate('/checkout/success', {
        state: isTest
          ? { testId: resolvedId, itemName: item?.title, isTest: true }
          : { courseId: resolvedId, itemName: item?.title, isTest: false },
      });
    } catch (err) {
      if (typeof err === 'string' && err.toLowerCase().includes('already enrolled')) {
        toast.success(`You are already enrolled in this ${isTest ? 'test' : 'course'}!`);
        navigate(isTest ? `/tests/${item?.slug || id}/take` : `/courses/${item?.slug || id}/learn`);
      } else {
        toast.error(err || 'Payment failed');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-dark-900 dark:text-white font-display tracking-tight mb-8">
        Secure Checkout
      </h1>

      {/* Informative & Clickable Course/Test Card */}
      <Link
        to={
          isTest
            ? item?.isSeries
              ? `/test-series/${item?.slug || id}`
              : `/tests/${item?.slug || id}`
            : `/courses/${item?.slug || id}`
        }
        target="_blank"
        rel="noopener noreferrer"
        className="group bg-white dark:bg-dark-900 rounded-3xl p-5 sm:p-6 mb-6 border border-slate-200 dark:border-dark-800 shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-200 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start text-left block"
      >
        <div className="h-28 w-44 sm:h-32 sm:w-48 rounded-2xl bg-amber-50 dark:bg-dark-800 flex-shrink-0 overflow-hidden relative shadow-sm border border-slate-100 dark:border-dark-700">
          {item.thumbnail?.url || (typeof item.thumbnail === 'string' && item.thumbnail) ? (
            <img
              src={item.thumbnail?.url || item.thumbnail}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">📘</div>
          )}
          <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
            {isTest ? 'Test Series' : 'Course'}
          </span>
        </div>

        <div className="flex-1 min-w-0 w-full space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-extrabold text-dark-900 dark:text-white line-clamp-2 text-base sm:text-lg group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {item.title}
            </h3>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 group-hover:underline flex-shrink-0 hidden sm:inline-block">
              View details ↗
            </span>
          </div>

          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            By{' '}
            <span className="text-dark-900 dark:text-white font-black">
              {item.teacher?.name || 'EduPortal Expert Faculty'}
            </span>
          </p>

          {/* High-Yield Meta Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {!isTest && (
              <>
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300">
                  📚{' '}
                  {item.totalLessons ||
                    item.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) ||
                    24}{' '}
                  Lessons
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300">
                  📄 PDF Notes & Handouts
                </span>
              </>
            )}
            {isTest && (
              <>
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300">
                  📝 {item.questionsCount || item.tests?.length || 10} Mock Tests
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300">
                  🎯 Full Solutions & Rank
                </span>
              </>
            )}
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold">
              ⚡ Instant Access
            </span>
          </div>

          <div className="pt-2">
            <PriceTag
              price={effectivePrice}
              originalPrice={
                item.discountPrice > 0 || (item.price && item.price > effectivePrice)
                  ? item.price
                  : undefined
              }
              size="md"
              className="justify-start"
            />
          </div>
        </div>
      </Link>

      {/* Coupon — only for paid courses/tests */}
      {!isFree && (
        <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 mb-6 border border-slate-200 dark:border-dark-800 shadow-sm">
          <h3 className="font-bold text-dark-900 dark:text-white mb-4 text-sm uppercase tracking-wider">
            Have a coupon?
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="flex-1 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none uppercase"
            />
            <button
              className="bg-slate-900 dark:bg-white text-white dark:text-dark-900 font-bold px-6 py-2.5 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-sm text-sm"
              onClick={handleApplyCoupon}
              disabled={loading}
            >
              Apply
            </button>
          </div>
          {coupon && (
            <div className="mt-4 flex items-center justify-between p-3.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-xl">
              <span className="text-sm text-green-700 dark:text-green-400 font-bold flex items-center gap-2">
                <HiCheckCircle className="h-5 w-5" /> Coupon applied! You save ₹{discount}
              </span>
              <button
                onClick={() => {
                  dispatch(clearCoupon());
                  setCouponCode('');
                }}
                className="text-xs font-bold text-slate-400 hover:text-red-500 uppercase tracking-wider"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order Summary */}
      <div className="bg-slate-50 dark:bg-dark-800 rounded-2xl p-6 sm:p-8 mb-6 border border-slate-200 dark:border-dark-700 shadow-inner">
        <h3 className="font-bold text-dark-900 dark:text-white mb-6 text-sm uppercase tracking-wider">
          Order Summary
        </h3>
        <div className="space-y-4 text-sm font-medium">
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span>{isTest ? 'Test Price' : 'Course Price'}</span>
            <span className="text-dark-900 dark:text-white font-bold">
              {effectivePrice > 0 ? `₹${effectivePrice.toLocaleString('en-IN')}` : 'Free'}
            </span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between items-center text-green-600">
              <span>Coupon Discount</span>
              <span className="font-bold">-₹{discount.toLocaleString('en-IN')}</span>
            </div>
          )}
          {!isFree && (
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>GST (18%)</span>
              <span className="font-bold text-dark-900 dark:text-white">
                +₹{gstAmount.toLocaleString('en-IN')}
              </span>
            </div>
          )}
          <div className="border-t border-slate-200 dark:border-dark-700 pt-4 mt-2">
            <div className="flex justify-between items-center text-xl font-extrabold">
              <span className="text-dark-900 dark:text-white">Total Amount</span>
              <span className="text-amber-600 dark:text-amber-500">
                {isFree || finalPrice === 0 ? 'Free' : `₹${finalPrice.toLocaleString('en-IN')}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo payment confirmation — only for paid courses */}
      {!isFree && finalPrice > 0 && (
        <div className="card p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/10">
          <div className="flex items-center gap-2 mb-3">
            <HiBeaker className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <h3 className="font-semibold text-amber-800 dark:text-amber-300">Demo / Test Mode</h3>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-400 mb-4">
            This is a demo app. No real money is charged. Check the box below to simulate a
            successful payment.
          </p>
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="sr-only peer"
              />
              <div
                className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all
                ${
                  confirmed
                    ? 'bg-primary-600 border-primary-600'
                    : 'bg-white dark:bg-dark-700 border-dark-300 dark:border-dark-500 group-hover:border-primary-400'
                }`}
              >
                {confirmed && <HiCheckCircle className="h-4 w-4 text-white" />}
              </div>
            </div>
            <span className="text-sm text-dark-700 dark:text-dark-300 leading-snug">
              I understand this is a <strong>test payment</strong> and confirm the purchase of{' '}
              <strong>{item.title}</strong> for{' '}
              <strong>₹{finalPrice.toLocaleString('en-IN')}</strong>.
            </span>
          </label>
        </div>
      )}

      <button
        className={`w-full text-white font-bold py-4 rounded-xl shadow-md transition-all text-lg flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : !isFree && finalPrice > 0 && !confirmed ? 'bg-slate-300 dark:bg-dark-700 text-slate-500' : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-[0.98]'}`}
        onClick={isFree || finalPrice === 0 ? handleFreeEnroll : handlePaidEnroll}
        disabled={loading || (!isFree && finalPrice > 0 && !confirmed)}
      >
        {isFree || finalPrice === 0 ? (
          'Enroll for Free'
        ) : (
          <>
            <HiLockClosed className="h-5 w-5" />
            Pay Securely ₹{finalPrice.toLocaleString('en-IN')}
          </>
        )}
      </button>

      {!isFree && finalPrice > 0 && !confirmed && (
        <p className="text-xs text-dark-400 text-center mt-2">
          Check the box above to enable payment
        </p>
      )}

      <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-dark-400">
        <HiShieldCheck className="h-4 w-4 text-secondary-500" />
        By proceeding, you agree to our Terms of Service and Privacy Policy.
      </div>
    </div>
  );
}
