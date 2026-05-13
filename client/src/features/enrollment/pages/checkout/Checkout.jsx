import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourseById } from '@/features/course/courseSlice';
import { enrollInCourse } from '@/features/enrollment/enrollmentSlice';
import { createOrder, verifyPayment, validateCoupon, clearPaymentState, clearCoupon } from '@/features/payment/paymentSlice';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PriceTag from '@/components/common/PriceTag';
import { Button, Input } from '@/components/ui';
import toast from 'react-hot-toast';

export default function Checkout() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentCourse: course, loading: courseLoading } = useSelector(state => state.courses);
  const { order, coupon, discount, loading, paymentSuccess } = useSelector(state => state.payments);
  const [couponCode, setCouponCode] = useState('');
  const isFree = searchParams.get('free') === 'true' || course?.price === 0;

  useEffect(() => {
    dispatch(fetchCourseById(id));
    dispatch(clearPaymentState());
  }, [dispatch, id]);

  useEffect(() => {
    if (paymentSuccess) {
      navigate('/checkout/success', { state: { courseId: id, courseName: course?.title } });
    }
  }, [paymentSuccess, navigate, id, course]);

  const finalPrice = Math.max(0, (course?.price || 0) - discount);

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    dispatch(validateCoupon({ code: couponCode, courseId: id }));
  };

  const handleFreeEnroll = async () => {
    try {
      await dispatch(enrollInCourse({ courseId: id })).unwrap();
      toast.success('Enrolled successfully!');
      navigate('/checkout/success', { state: { courseId: id, courseName: course?.title, free: true } });
    } catch (err) {
      toast.error(err || 'Enrollment failed');
    }
  };

  const handlePayment = async () => {
    try {
      const orderResult = await dispatch(createOrder({ courseId: id, couponCode: coupon ? couponCode : undefined })).unwrap();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_demo',
        amount: orderResult.amount,
        currency: orderResult.currency || 'INR',
        name: 'LearnHub',
        description: course?.title,
        order_id: orderResult.orderId || orderResult.id,
        handler: async response => {
          try {
            await dispatch(verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              courseId: id,
            })).unwrap();
          } catch {
            toast.error('Payment verification failed');
          }
        },
        prefill: { email: course?.email },
        theme: { color: '#2563eb' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err || 'Failed to create order');
    }
  };

  if (courseLoading || !course) return <LoadingSpinner fullScreen />;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="section-title mb-8">Checkout</h1>

      <div className="card p-6 mb-6">
        <div className="flex gap-4">
          <div className="h-20 w-28 rounded-lg bg-dark-100 dark:bg-dark-700 flex-shrink-0 overflow-hidden">
            {course.thumbnail ? (
              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">📘</div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-dark-900 dark:text-white">{course.title}</h3>
            <p className="text-sm text-dark-500 mt-1">{course.instructor?.name}</p>
            <PriceTag price={course.price} originalPrice={course.originalPrice} size="sm" className="mt-2" />
          </div>
        </div>
      </div>

      {!isFree && (
        <div className="card p-6 mb-6">
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
                🎉 Coupon applied! You save ₹{discount}
              </span>
              <button onClick={() => { dispatch(clearCoupon()); setCouponCode(''); }} className="text-xs text-dark-400 hover:text-red-500">Remove</button>
            </div>
          )}
        </div>
      )}

      {/* Order Summary */}
      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-dark-900 dark:text-white mb-4">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-dark-500">Course Price</span>
            <span className="text-dark-900 dark:text-white">₹{course.price?.toLocaleString('en-IN') || 'Free'}</span>
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
              <span className="text-dark-900 dark:text-white">
                {isFree || finalPrice === 0 ? 'Free' : `₹${finalPrice.toLocaleString('en-IN')}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={isFree || finalPrice === 0 ? handleFreeEnroll : handlePayment}
        loading={loading}
      >
        {isFree || finalPrice === 0 ? 'Enroll for Free' : `Pay ₹${finalPrice.toLocaleString('en-IN')}`}
      </Button>

      <p className="text-xs text-dark-400 text-center mt-4">
        By proceeding, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
