import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HiLockClosed, HiShieldCheck, HiCheckCircle } from 'react-icons/hi';
import { fetchCourseById } from '@/features/course/courseSlice';
import { fetchTestById } from '@/features/test/testSlice';
import { enrollInCourse } from '@/features/enrollment/enrollmentSlice';
import {
  createOrder,
  verifyPayment,
  dummyCheckout,
  validateCoupon,
  clearPaymentState,
  clearCoupon,
} from '@/features/payment/paymentSlice';
import api, { enrollmentAPI, paymentAPI } from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PriceTag from '@/components/common/PriceTag';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

// Razorpay config from env
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;
const ALLOW_MOCK = import.meta.env.VITE_ALLOW_MOCK_PAYMENTS === 'true';

/**
 * Load Razorpay checkout.js script dynamically (only once)
 */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentCourse: course, loading: courseLoading } = useSelector((s) => s.courses);
  const { currentTest: test, loading: testLoading } = useSelector((s) => s.tests);
  const { coupon, discount, loading } = useSelector((s) => s.payments);
  const { user } = useSelector((s) => s.auth);
  const [searchParams] = useSearchParams();

  const type = searchParams.get('type') || 'course';
  const isTest = type === 'test' || type === 'test_series';

  const [testSeriesItem, setTestSeriesItem] = useState(null);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [paying, setPaying] = useState(false);
  // 'checking' until we know; 'owned' blocks the page entirely.
  const [ownership, setOwnership] = useState('checking');

  // ── Load item ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isTest) {
      setSeriesLoading(true);
      api
        .get(`/test-series/${id}`)
        .then((res) => {
          const data = res.data?.data?.testSeries || res.data?.testSeries;
          if (data) setTestSeriesItem(data);
          else dispatch(fetchTestById(id));
        })
        .catch(() => dispatch(fetchTestById(id)))
        .finally(() => setSeriesLoading(false));
    } else {
      dispatch(fetchCourseById(id));
    }
    dispatch(clearPaymentState());
  }, [dispatch, id, isTest]);

  // ── Block checkout for something already owned ───────────────────────────
  // The server rejects a duplicate order, but only after the user has committed
  // to paying. Check up front so we never show a pay button for owned content.
  const ownedCourseId = !isTest ? course?.id || course?._id : null;

  useEffect(() => {
    if (isTest) {
      // No client-side check endpoint for tests; the server still rejects
      // duplicate orders and the error is surfaced on the pay attempt.
      setOwnership('clear');
      return;
    }
    if (!ownedCourseId) return;

    let cancelled = false;
    setOwnership('checking');

    enrollmentAPI
      .checkEnrollment(ownedCourseId)
      .then((res) => {
        if (cancelled) return;
        const payload = res.data?.data ?? res.data ?? {};
        setOwnership(payload.isEnrolled === true ? 'owned' : 'clear');
      })
      .catch(() => {
        // Don't strand the user on a failed check — let the server be the
        // final authority when they try to pay.
        if (!cancelled) setOwnership('clear');
      });

    return () => {
      cancelled = true;
    };
  }, [ownedCourseId, isTest]);

  if (
    (courseLoading && !isTest) ||
    (seriesLoading && isTest) ||
    (!testSeriesItem && testLoading && isTest) ||
    (!course && !isTest) ||
    (!testSeriesItem && !test && isTest) ||
    ownership === 'checking'
  ) {
    return <LoadingSpinner fullScreen />;
  }

  const item = testSeriesItem || (isTest ? test : course);

  // Already owned — never render a price or a pay button.
  if (ownership === 'owned') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <HiCheckCircle className="h-16 w-16 mx-auto mb-5 text-emerald-500" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-dark-900 dark:text-white font-display tracking-tight mb-3">
          You already own this course
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8 text-sm max-w-md mx-auto">
          &ldquo;{item?.title}&rdquo; is already in your library, so there is nothing to pay for.
          Pick up where you left off.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={`/courses/${item?.slug || id}/learn`}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-md transition-all text-sm"
          >
            Continue Learning
          </Link>
          <Link
            to="/my-courses"
            className="bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 font-bold py-3.5 px-8 rounded-xl transition-all text-sm"
          >
            My Courses
          </Link>
        </div>
      </div>
    );
  }

  const effectivePrice = item?.effectivePrice ?? item?.price ?? 0;
  const isFree = isTest ? item?.isFree || effectivePrice === 0 : effectivePrice === 0;
  const priceBeforeDiscount = Math.max(0, effectivePrice - discount);
  const gstAmount = priceBeforeDiscount > 0 ? Math.round(priceBeforeDiscount * 0.18) : 0;
  const finalPrice = priceBeforeDiscount + gstAmount;

  // ── Coupon ───────────────────────────────────────────────────────────────
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

  /**
   * Re-checks ownership at the moment of purchase. The page may have sat open
   * while the course was bought in another tab, so the mount-time check can be
   * stale by the time the user clicks pay.
   *
   * Returns true when the purchase should be aborted.
   */
  const abortIfAlreadyOwned = async () => {
    if (isTest) return false;
    const resolvedId = item?.id || item?._id || id;
    try {
      const res = await enrollmentAPI.checkEnrollment(resolvedId);
      const payload = res.data?.data ?? res.data ?? {};
      if (payload.isEnrolled === true) {
        setOwnership('owned');
        toast.success('You already own this course.');
        navigate(`/courses/${item?.slug || id}/learn`);
        return true;
      }
    } catch {
      // Check failed — fall through and let the server reject if needed.
    }
    return false;
  };

  // ── Free enroll ──────────────────────────────────────────────────────────
  const handleFreeEnroll = async () => {
    if (isTest) {
      navigate(`/tests/${item?.slug || id}/take`);
      return;
    }
    if (await abortIfAlreadyOwned()) return;
    const resolvedId = item?.id || item?._id || id;
    try {
      await dispatch(enrollInCourse({ courseId: resolvedId })).unwrap();
      toast.success('Enrolled successfully!');
      navigate('/checkout/success', {
        state: { courseId: resolvedId, itemName: item?.title, free: true, isTest: false },
      });
    } catch (err) {
      if (typeof err === 'string' && err.toLowerCase().includes('already enrolled')) {
        toast.success('You are already enrolled!');
        navigate(`/courses/${item?.slug || id}/learn`);
      } else {
        toast.error(err || 'Enrollment failed');
      }
    }
  };

  // ── Paid enroll — Razorpay real or mock ──────────────────────────────────
  const handlePaidEnroll = async () => {
    setPaying(true);
    try {
      if (await abortIfAlreadyOwned()) return;
      const resolvedId = item?.id || item?._id || id;
      const payload = isTest ? { testId: resolvedId } : { courseId: resolvedId };
      if (coupon) payload.couponCode = coupon.coupon?.code || coupon.code;

      // ── MOCK / DEMO path ─────────────────────────────────────────────────
      if (ALLOW_MOCK) {
        await dispatch(dummyCheckout(payload)).unwrap();
        toast.success('Payment successful!');
        navigate('/checkout/success', {
          state: isTest
            ? {
                testId: resolvedId,
                testSeriesId: type === 'test_series' ? resolvedId : null,
                itemName: item?.title,
                isTest: true,
                isSeries: type === 'test_series',
              }
            : { courseId: resolvedId, itemName: item?.title, isTest: false },
        });
        return;
      }

      // ── REAL RAZORPAY path ───────────────────────────────────────────────
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Payment gateway failed to load. Please try again.');
        return;
      }

      // 1. Create order on backend
      const orderRes = await dispatch(createOrder(payload)).unwrap();
      const { orderId, amount: orderAmount, currency, paymentId: dbPaymentId } = orderRes;

      // 2. Open Razorpay checkout modal
      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: RAZORPAY_KEY,
          amount: orderAmount,
          currency: currency || 'INR',
          order_id: orderId,
          name: 'CivicsEdu',
          description: item?.title || 'Course Purchase',
          image: item?.thumbnail?.url || '',
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: user?.phone || '',
          },
          theme: { color: '#92400e' },
          modal: {
            ondismiss: async () => {
              try {
                await paymentAPI.recordFailure({
                  orderId,
                  error: { reason: 'User closed payment window before completing' },
                });
              } catch (e) {}
              toast('Payment cancelled.', { icon: '⚠️' });
              reject(new Error('dismissed'));
            },
          },
          handler: async (response) => {
            try {
              // 3. Verify on backend
              await dispatch(
                verifyPayment({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  dbPaymentId,
                })
              ).unwrap();
              toast.success('Payment verified! You are now enrolled.');

              const successState = isTest
                ? {
                    testId: resolvedId,
                    testSeriesId: type === 'test_series' ? resolvedId : null,
                    itemName: item?.title,
                    isTest: true,
                    isSeries: type === 'test_series',
                  }
                : { courseId: resolvedId, itemName: item?.title, isTest: false };

              try {
                sessionStorage.setItem('last_checkout_state', JSON.stringify(successState));
              } catch (e) {}

              const queryParams = new URLSearchParams({
                type: isTest ? (type === 'test_series' ? 'series' : 'test') : 'course',
                id: resolvedId || '',
                name: item?.title || '',
              }).toString();

              navigate(`/checkout/success?${queryParams}`, {
                state: successState,
                replace: true,
              });

              // Direct window redirect fallback to guarantee navigation out of Razorpay modal
              setTimeout(() => {
                if (
                  window.location.pathname.startsWith('/checkout') &&
                  !window.location.pathname.includes('/success')
                ) {
                  window.location.href = `/checkout/success?${queryParams}`;
                }
              }, 300);

              resolve();
            } catch (err) {
              setPaying(false);
              try {
                await paymentAPI.recordFailure({
                  orderId,
                  error: { reason: 'Signature verification failed', details: err },
                });
              } catch (e) {}
              toast.error(
                typeof err === 'string'
                  ? err
                  : err?.message || 'Payment verification failed. Contact support.'
              );
              reject(err);
            }
          },
        });

        rzp.on('payment.failed', async (response) => {
          try {
            await paymentAPI.recordFailure({
              orderId,
              error: response.error || { reason: 'Gateway payment failed' },
            });
          } catch (e) {}
          toast.error(response.error?.description || 'Payment failed at gateway');
        });

        rzp.open();
      });
    } catch (err) {
      if (err?.message !== 'dismissed') {
        if (typeof err === 'string' && err.toLowerCase().includes('already enrolled')) {
          toast.success('You are already enrolled!');
          navigate(
            isTest ? `/tests/${item?.slug || id}/take` : `/courses/${item?.slug || id}/learn`
          );
        } else if (err?.message !== 'dismissed') {
          toast.error(typeof err === 'string' ? err : err?.message || 'Payment failed');
        }
      }
    } finally {
      setPaying(false);
    }
  };

  const isLoading = loading || paying;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-dark-900 dark:text-white font-display tracking-tight mb-8">
        Secure Checkout
      </h1>

      {/* Item card */}
      <Link
        to={isTest ? `/test-series/${item?.slug || id}` : `/courses/${item?.slug || id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group bg-white dark:bg-dark-900 rounded-3xl p-5 sm:p-6 mb-6 border border-slate-200 dark:border-dark-800 shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-200 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start text-left block"
      >
        <div className="h-28 w-44 sm:h-32 sm:w-48 rounded-2xl bg-amber-50 dark:bg-dark-800 flex-shrink-0 overflow-hidden relative shadow-sm border border-slate-100 dark:border-dark-700">
          {item?.thumbnail?.url || typeof item?.thumbnail === 'string' ? (
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
          <h3 className="font-extrabold text-dark-900 dark:text-white line-clamp-2 text-base sm:text-lg group-hover:text-amber-600 transition-colors">
            {item?.title}
          </h3>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
            By{' '}
            <span className="text-dark-900 dark:text-white font-black">
              {item?.teacher?.name || 'CivicsEdu Faculty'}
            </span>
          </p>
          <PriceTag
            price={effectivePrice}
            originalPrice={item?.price > effectivePrice ? item.price : undefined}
            size="md"
            className="justify-start"
          />
        </div>
      </Link>

      {/* Coupon */}
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
              className="bg-slate-900 dark:bg-white text-white dark:text-dark-900 font-bold px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-colors shadow-sm text-sm disabled:opacity-50"
              onClick={handleApplyCoupon}
              disabled={isLoading || !couponCode.trim()}
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

      {/* Mock payment notice — only shown when ALLOW_MOCK=true */}
      {ALLOW_MOCK && !isFree && finalPrice > 0 && (
        <div className="p-4 mb-5 rounded-xl border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/10 text-sm text-amber-700 dark:text-amber-400">
          <strong>Test Mode:</strong> No real money is charged. Click Pay to simulate a successful
          payment.
        </div>
      )}

      {/* CTA button */}
      <button
        className={`w-full text-white font-bold py-4 rounded-xl shadow-md transition-all text-lg flex items-center justify-center gap-2
          ${isLoading ? 'opacity-70 cursor-not-allowed bg-slate-400' : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-[0.98]'}`}
        onClick={isFree || finalPrice === 0 ? handleFreeEnroll : handlePaidEnroll}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Processing...
          </span>
        ) : isFree || finalPrice === 0 ? (
          'Enroll for Free'
        ) : (
          <>
            <HiLockClosed className="h-5 w-5" /> Pay ₹{finalPrice.toLocaleString('en-IN')}{' '}
            {ALLOW_MOCK ? '(Test Mode)' : 'via Razorpay'}
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-dark-400">
        <HiShieldCheck className="h-4 w-4 text-secondary-500" />
        {ALLOW_MOCK
          ? 'Running in test mode. Safe for development.'
          : 'Secured by Razorpay. 256-bit SSL encrypted.'}
      </div>
    </div>
  );
}
