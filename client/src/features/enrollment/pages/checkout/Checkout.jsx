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
      navigate(`/tests/${id}/take`);
      return;
    }
    try {
      await dispatch(enrollInCourse({ courseId: id })).unwrap();
      toast.success('Enrolled successfully!');
      navigate('/checkout/success', {
        state: { courseId: id, itemName: item.title, free: true, isTest: false },
      });
    } catch (err) {
      if (typeof err === 'string' && err.toLowerCase().includes('already enrolled')) {
        toast.success('You are already enrolled in this course!');
        navigate(`/courses/${id}/learn`);
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
      const payload = isTest ? { testId: id } : { courseId: id };
      if (coupon) {
        payload.couponCode = coupon.coupon?.code || coupon.code;
      }
      await dispatch(dummyCheckout(payload)).unwrap();
      toast.success(`Payment successful! Purchased ${isTest ? 'test' : 'course'}.`);
      navigate('/checkout/success', {
        state: isTest
          ? { testId: id, itemName: item.title, isTest: true }
          : { courseId: id, itemName: item.title, isTest: false },
      });
    } catch (err) {
      if (typeof err === 'string' && err.toLowerCase().includes('already enrolled')) {
        toast.success(`You are already enrolled in this ${isTest ? 'test' : 'course'}!`);
        navigate(isTest ? `/tests/${id}/take` : `/courses/${id}/learn`);
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

      {/* Course card */}
      <div className="bg-white dark:bg-dark-900 rounded-3xl p-6 mb-6 border border-slate-200 dark:border-dark-800 shadow-sm flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start text-center sm:text-left">
        <div className="h-24 w-36 sm:h-28 sm:w-40 rounded-2xl bg-slate-100 dark:bg-dark-800 flex-shrink-0 overflow-hidden relative shadow-sm">
          {item.thumbnail?.url || item.thumbnail ? (
            <img
              src={item.thumbnail?.url || item.thumbnail}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">📘</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-dark-900 dark:text-white line-clamp-2 text-lg sm:text-xl">
            {item.title}
          </h3>
          <p className="text-sm font-bold text-amber-600 dark:text-amber-500 mt-1 uppercase tracking-wider">
            {item.teacher?.name || 'EduPortal Faculty'}
          </p>
          <PriceTag
            price={effectivePrice}
            originalPrice={item.discountPrice > 0 ? item.price : undefined}
            size="md"
            className="mt-3 justify-center sm:justify-start"
          />
        </div>
      </div>

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
