import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HiLockClosed, HiShieldCheck, HiCheckCircle, HiBeaker } from 'react-icons/hi';
import { fetchCourseById } from '@/features/course/courseSlice';
import { fetchTestById } from '@/features/test/testSlice';
import { enrollInCourse } from '@/features/enrollment/enrollmentSlice';
import { dummyCheckout, validateCoupon, clearPaymentState, clearCoupon } from '@/features/payment/paymentSlice';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PriceTag from '@/components/common/PriceTag';
import { Button, Input } from '@/components/ui';
import toast from 'react-hot-toast';

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentCourse: course, loading: courseLoading } = useSelector(state => state.courses);
  const { currentTest: test, loading: testLoading } = useSelector(state => state.tests);
  const { coupon, discount, loading } = useSelector(state => state.payments);
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'course';
  const isTest = type === 'test';

  const [couponCode, setCouponCode] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (isTest) {
      dispatch(fetchTestById(id));
    } else {
      dispatch(fetchCourseById(id));
    }
    dispatch(clearPaymentState());
  }, [dispatch, id, isTest]);

  if ((courseLoading && !isTest) || (testLoading && isTest) || (!course && !isTest) || (!test && isTest)) {
    return <LoadingSpinner fullScreen />;
  }

  const item = isTest ? test : course;
  const effectivePrice = item.effectivePrice ?? item.price ?? 0;
  const isFree = isTest ? item.isFree || effectivePrice === 0 : effectivePrice === 0;
  const finalPrice = Math.max(0, effectivePrice - discount);

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    dispatch(validateCoupon({ code: couponCode, courseId: id }));
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
      navigate('/checkout/success', { state: { courseId: id, itemName: item.title, free: true, isTest: false } });
    } catch (err) {
      toast.error(err || 'Enrollment failed');
    }
  };

  const handlePaidEnroll = async () => {
    if (!confirmed) {
      toast.error('Please confirm the test payment to proceed');
      return;
    }
    try {
      const payload = isTest ? { testId: id } : { courseId: id };
      await dispatch(dummyCheckout(payload)).unwrap();
      toast.success(`Payment successful! Purchased ${isTest ? 'test' : 'course'}.`);
      navigate('/checkout/success', {
        state: isTest
          ? { testId: id, itemName: item.title, isTest: true }
          : { courseId: id, itemName: item.title, isTest: false },
      });
    } catch (err) {
      toast.error(err || 'Payment failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="section-title mb-6 sm:mb-8">Checkout</h1>

      {/* Course card */}
      <div className="card p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex gap-3 sm:gap-4">
          <div className="h-16 w-22 sm:h-20 sm:w-28 rounded-lg bg-dark-100 dark:bg-dark-700 flex-shrink-0 overflow-hidden" style={{minWidth:'5.5rem'}}>
            {(item.thumbnail?.url || item.thumbnail) ? (
              <img src={item.thumbnail?.url || item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">📘</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-dark-900 dark:text-white line-clamp-2">{item.title}</h3>
            <p className="text-sm text-dark-500 mt-1">{item.teacher?.name}</p>
            <PriceTag
              price={effectivePrice}
              originalPrice={item.discountPrice > 0 ? item.price : undefined}
              size="sm"
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Coupon — only for paid courses/tests */}
      {!isFree && !isTest && (
        <div className="card p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="font-semibold text-dark-900 dark:text-white mb-3">Have a coupon?</h3>
          <div className="flex gap-2">
            <Input
              value={couponCode}
              onChange={e => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="flex-1"
            />
            <Button variant="outline" onClick={handleApplyCoupon} loading={loading}>Apply</Button>
          </div>
          {coupon && (
            <div className="mt-3 flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-900/20 rounded-lg">
              <span className="text-sm text-secondary-700 dark:text-secondary-400 font-medium">
                Coupon applied! You save ₹{discount}
              </span>
              <button
                onClick={() => { dispatch(clearCoupon()); setCouponCode(''); }}
                className="text-xs text-dark-400 hover:text-red-500"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order Summary */}
      <div className="card p-4 sm:p-6 mb-4 sm:mb-6">
        <h3 className="font-semibold text-dark-900 dark:text-white mb-4">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-dark-500">{isTest ? 'Test Price' : 'Course Price'}</span>
            <span className="text-dark-900 dark:text-white">
              {effectivePrice > 0 ? `₹${effectivePrice.toLocaleString('en-IN')}` : 'Free'}
            </span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-secondary-600">
              <span>Coupon Discount</span>
              <span>-₹{discount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="border-t border-dark-100 dark:border-dark-700 pt-2 mt-2">
            <div className="flex justify-between text-lg font-bold">
              <span className="text-dark-900 dark:text-white">Total</span>
              <span className="text-primary-600 dark:text-primary-400">
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
            This is a demo app. No real money is charged. Check the box below to simulate a successful payment.
          </p>
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                className="sr-only peer"
              />
              <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all
                ${confirmed
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

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={isFree || finalPrice === 0 ? handleFreeEnroll : handlePaidEnroll}
        loading={loading}
        disabled={!isFree && finalPrice > 0 && !confirmed}
      >
        {isFree || finalPrice === 0
          ? 'Enroll for Free'
          : (
            <span className="flex items-center justify-center gap-2">
              <HiLockClosed className="h-4 w-4" />
              Pay ₹{finalPrice.toLocaleString('en-IN')}
            </span>
          )
        }
      </Button>

      {!isFree && finalPrice > 0 && !confirmed && (
        <p className="text-xs text-dark-400 text-center mt-2">Check the box above to enable payment</p>
      )}

      <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-dark-400">
        <HiShieldCheck className="h-4 w-4 text-secondary-500" />
        By proceeding, you agree to our Terms of Service and Privacy Policy.
      </div>
    </div>
  );
}
