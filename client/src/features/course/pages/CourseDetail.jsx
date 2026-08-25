import SeoHead from '@/components/SeoHead';
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
import { fetchCourseById } from '@/features/course/courseSlice';
import { fetchCourseReviews, createReview, updateReview } from '@/features/review/reviewSlice';
import { checkWishlist, toggleWishlist } from '@/features/wishlist/wishlistSlice';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import RatingStars from '@/components/common/RatingStars';
import PriceTag from '@/components/common/PriceTag';
import ReviewCard from '@/features/course/components/ReviewCard';
import Tabs from '@/components/common/Tabs';
import Accordion from '@/components/common/Accordion';
import { enrollmentAPI } from '@/services/api';
import toast from 'react-hot-toast';
import {
  HiAcademicCap,
  HiBadgeCheck,
  HiBookOpen,
  HiCheck,
  HiClock,
  HiDocumentDownload,
  HiDocumentText,
  HiGlobe,
  HiHeart,
  HiLockClosed,
  HiPencilAlt,
  HiPlay,
  HiUsers,
  HiVideoCamera,
} from 'react-icons/hi';
import { Link } from 'react-router-dom';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    currentCourse: course,
    currentCourseIsEnrolled: courseSaysEnrolled,
    loading,
  } = useSelector((state) => state.courses);
  const { reviews } = useSelector((state) => state.reviews);
  const { wishlistMap } = useSelector((state) => state.wishlist);
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [enrollmentChecked, setEnrollmentChecked] = useState(false);
  // Two independent sources say whether the viewer has access: the course
  // payload and the dedicated check endpoint. Trust either one, so a
  // disagreement can never downgrade a paying user to "Buy Course Now".
  const isEnrolled = courseSaysEnrolled || enrollmentChecked;
  // Start in checking state if user is authenticated so button doesn't flash "Buy Course Now"
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const enrollmentCheckedRef = useRef(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewHover, setReviewHover] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewRating) {
      toast.error('Please select a rating');
      return;
    }
    if (!reviewText.trim()) {
      toast.error('Please write your review');
      return;
    }
    if (reviewText.trim().length < 5) {
      toast.error('Review must be at least 5 characters');
      return;
    }
    setSubmittingReview(true);
    try {
      await dispatch(
        createReview({
          course: course.id || course.id || course._id,
          rating: reviewRating,
          comment: reviewText.trim(),
        })
      ).unwrap();
      toast.success('Review submitted! It will appear after moderation.');
      setReviewRating(0);
      setReviewText('');
      setReviewSubmitted(true);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = async (reviewId, data) => {
    try {
      await dispatch(updateReview({ id: reviewId, ...data })).unwrap();
      toast.success('Review updated!');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to update review');
      throw err; // let ReviewCard stay in edit mode on failure
    }
  };

  // True when the current user already has a review visible in the loaded list.
  const currentUserId = user?.id || user?._id;
  const myExistingReview = reviews.find(
    (r) => String(r.user?.id || r.user?._id || r.user || r.userId) === String(currentUserId)
  );

  useEffect(() => {
    if (myExistingReview && !reviewSubmitted) {
      setReviewRating(myExistingReview.rating || 0);
      setReviewText(myExistingReview.comment || '');
    }
  }, [myExistingReview, reviewSubmitted]);
  useEffect(() => {
    window.scrollTo(0, 0);
    enrollmentCheckedRef.current = ''; // reset on new course page
    setEnrollmentChecked(false);
    // Only show checking spinner if user is logged in
    setCheckingEnrollment(!!isAuthenticated);
    dispatch(fetchCourseById(id));
    // Use the URL param for now; once the course loads we re-fetch with the real _id below
    dispatch(fetchCourseReviews({ courseId: id }));
  }, [dispatch, id]);

  // Once the course loads we know the real ObjectId — re-fetch reviews with
  // it so the slug-based initial fetch (which may fail) is replaced with a
  // reliable ID-based one.
  useEffect(() => {
    if (!(course?.id || course?.id || course?._id)) return;
    const courseIdString = (course.id || course.id || course._id).toString();
    const courseMatchesUrl = courseIdString === id || course.slug === id;
    if (courseMatchesUrl) {
      dispatch(fetchCourseReviews({ courseId: courseIdString }));
    }
  }, [dispatch, course, id]);

  // Once course loads, check enrollment using the real _id
  // Re-runs when auth state changes (user logs in/out on same page)
  useEffect(() => {
    if (!(course?.id || course?.id || course?._id) || !isAuthenticated) {
      if (!isAuthenticated) {
        setEnrollmentChecked(false);
        setCheckingEnrollment(false);
      }
      return;
    }

    const courseIdString = (course.id || course.id || course._id).toString();
    const courseMatchesUrl = courseIdString === id || course.slug === id;
    if (!courseMatchesUrl) return;

    const courseId = courseIdString;

    // Avoid duplicate calls for the same course + auth state
    const checkKey = `${courseId}:${isAuthenticated}`;
    if (enrollmentCheckedRef.current === checkKey) return;
    enrollmentCheckedRef.current = checkKey;

    dispatch(checkWishlist(courseId));

    const checkStatus = async () => {
      setCheckingEnrollment(true);
      try {
        const res = await enrollmentAPI.checkEnrollment(courseId);
        const payload = res.data?.data ?? res.data ?? {};
        setEnrollmentChecked(payload.isEnrolled === true);
      } catch (error) {
        console.error('Enrollment check failed:', error?.response?.data || error.message);
        setEnrollmentChecked(false);
      } finally {
        setCheckingEnrollment(false);
      }
    };

    checkStatus();
  }, [dispatch, course?.id || course?._id, course?.slug, isAuthenticated, id]);

  const handleEnroll = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/courses/${id}` } } });
      return;
    }
    const courseId = course?.id || course?._id || id;
    if (isEnrolled) {
      navigate(`/courses/${course?.slug || id}/learn`);
      return;
    }
    // Use effectivePrice — `price` ignores an active discount
    if ((course?.effectivePrice ?? course?.price) > 0) {
      navigate(`/checkout/${courseId}`);
    } else {
      navigate(`/checkout/${courseId}?free=true`);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const courseId = course?.id || course?._id || id;
    const wasWishlisted = !!wishlistMap[courseId];
    const result = await dispatch(toggleWishlist(courseId));
    if (!result.error) {
      toast.success(wasWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    }
  };

  if (loading || checkingEnrollment) return <LoadingSpinner fullScreen />;

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">📚</div>
        <h2 className="text-2xl font-black text-dark-900 dark:text-white mb-2 font-display">
          Course Not Found
        </h2>
        <p className="text-slate-500 max-w-md mb-6 text-sm">
          The course you are looking for may have been updated or moved.
        </p>
        <Link
          to="/courses"
          className="bg-amber-800 hover:bg-amber-900 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all text-sm"
        >
          Browse All Courses
        </Link>
      </div>
    );
  }

  const lessons = (course.sections || []).flatMap((s) => s.lessons || []);

  // Compute live rating and count from reviews list
  const totalReviewsCount = reviews?.length || course.totalReviews || 0;
  const computedAvgRating =
    reviews?.length > 0
      ? Math.round(
          (reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reviews.length) * 10
        ) / 10
      : Number(course.averageRating || course.rating || 0);

  // Lesson durations are authored in MINUTES (see the course builder form) and
  // course.totalDuration is their sum, so treat the input as minutes.
  const formatDuration = (mins) => {
    if (!mins) return 'Self-paced';
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}`.trim() : `${m} min`;
  };

  // `text` lessons are reading material — label them Notes, not "Text"
  const lessonTypeLabel = (type) => {
    if (type === 'video') return 'Video Lecture';
    if (type === 'quiz') return 'Quiz';
    return 'Notes';
  };

  const lessonTypeIcon = (type) => {
    if (type === 'video') return <HiPlay className="h-5 w-5 ml-0.5" />;
    if (type === 'quiz') return <HiPencilAlt className="h-4 w-4" />;
    return <HiDocumentText className="h-4 w-4" />;
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'curriculum', label: 'Curriculum', count: lessons.length },
    { key: 'reviews', label: 'Reviews', count: reviews.length },
    { key: 'instructor', label: 'Instructor' },
  ];

  const rawTeacherName = course.teacher?.name;
  const teacherName = rawTeacherName || 'Instructor';

  return (
    <div>
      <SeoHead
        title={course?.title || 'Course Detail'}
        description={
          course?.description?.substring(0, 160) ||
          'Detailed course information, curriculum, and pricing.'
        }
        image={course?.thumbnail?.url || course?.thumbnail}
        type="product"
        jsonLd={
          course
            ? {
                '@context': 'https://schema.org',
                '@type': 'Course',
                name: course.title,
                description: course.description,
                provider: { '@type': 'Organization', name: 'CivicsHub' },
                offers: {
                  '@type': 'Offer',
                  price: course.discountedPrice || course.price || 0,
                  priceCurrency: 'INR',
                },
              }
            : null
        }
      />
      {/* Hero Section */}
      <div className="bg-[#172554] relative overflow-hidden border-b border-blue-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative z-10">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 mt-6">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-4">
                {course.category && (
                  <span className="text-[11px] font-bold text-white bg-blue-600/40 border border-blue-500/30 px-2.5 py-1 rounded uppercase tracking-widest backdrop-blur-sm">
                    {typeof course.category === 'string' ? course.category : course.category.name}
                  </span>
                )}
                {course.level && course.level !== 'all_levels' && (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded capitalize">
                    {course.level}
                  </span>
                )}
              </div>

              <h1 className="text-[30px] md:text-[42px] lg:text-[48px] font-extrabold text-white mb-5 leading-[1.15] tracking-tight">
                {course.title}
              </h1>

              <p className="text-blue-100/80 mb-8 text-[15px] sm:text-[17px] leading-relaxed max-w-3xl font-medium">
                {course.description}
              </p>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-8 bg-black/20 p-4 rounded-xl w-fit border border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-1.5">
                  <RatingStars
                    rating={computedAvgRating || 5.0}
                    count={totalReviewsCount}
                    size="md"
                    showValue={false}
                  />
                  <span className="text-white font-bold text-[14px] ml-1">
                    {Number(computedAvgRating || 5.0).toFixed(1)}
                  </span>
                </div>
                <div className="w-px h-5 bg-white/10 hidden sm:block"></div>
                <span className="text-blue-100 flex items-center gap-2 text-[14px] font-semibold">
                  <HiUsers className="h-4 w-4 text-emerald-400" />
                  {course.enrollmentCount ||
                    course._count?.enrollments ||
                    (course.enrollments ? course.enrollments.length : isEnrolled ? 1 : 0)}{' '}
                  Aspirants
                </span>
                <div className="w-px h-5 bg-white/10 hidden sm:block"></div>
                <span className="text-blue-100 flex items-center gap-2 text-[14px] font-semibold">
                  <HiGlobe className="h-4 w-4 text-emerald-400" />
                  {course.language || 'Hindi & English'}
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 text-xl shadow-lg border-2 border-white/10">
                  {teacherName.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-bold text-[15px]">{teacherName}</p>
                  <p className="text-blue-300 text-[13px] font-semibold">Expert Faculty</p>
                </div>
              </div>
            </div>

            {/* Sidebar Card - Desktop */}
            <div className="hidden lg:block">
              <div className="bg-white dark:bg-dark-900 rounded-[24px] p-6 border border-dark-200 dark:border-dark-800 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] sticky top-24 transition-all duration-300">
                {/* Price is irrelevant once the course is owned — show access
                    status instead of asking the user to buy again. */}
                {isEnrolled ? (
                  <div className="mb-6 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 px-4 py-3">
                    <HiBadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-emerald-800 dark:text-emerald-300 leading-tight">
                        You own this course
                      </p>
                      <p className="text-[12px] text-emerald-700/80 dark:text-emerald-400/80">
                        Full lifetime access
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 flex items-baseline gap-2">
                    <PriceTag
                      price={course.effectivePrice ?? course.price}
                      originalPrice={course.discountPrice > 0 ? course.price : undefined}
                      size="xl"
                    />
                  </div>
                )}

                <button
                  onClick={handleEnroll}
                  disabled={checkingEnrollment}
                  className="w-full bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl shadow-md transition-all duration-300 text-[15px] mb-3 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {checkingEnrollment
                    ? 'Checking...'
                    : isEnrolled
                      ? 'Resume Learning'
                      : (course.effectivePrice ?? course.price) > 0
                        ? 'Buy Course Now'
                        : 'Enroll for Free'}
                </button>
                <button
                  onClick={handleWishlist}
                  className={`w-full py-3.5 flex items-center justify-center gap-2 rounded-xl border transition-colors text-[14px] font-bold ${wishlistMap[course?.id || course?._id || id] ? 'bg-red-50 text-red-500 border-red-200 dark:bg-red-900/20 dark:border-red-900/30' : 'bg-dark-50 dark:bg-dark-800 text-dark-700 dark:text-dark-300 border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-700'}`}
                >
                  <HiHeart
                    className={`h-5 w-5 ${wishlistMap[course?.id || course?._id || id] ? 'fill-current' : ''}`}
                  />
                  {wishlistMap[course?.id || course?._id || id] ? 'Wishlisted' : 'Add to Wishlist'}
                </button>

                <div className="mt-6 border-t border-dark-100 dark:border-dark-800 pt-5">
                  <p className="text-[12px] font-bold text-dark-400 dark:text-dark-500 uppercase tracking-wider mb-4">
                    This course includes
                  </p>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                    <div className="flex items-center gap-2 text-[13px] text-dark-700 dark:text-dark-300 font-medium">
                      <HiGlobe className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="truncate">{course.language || 'English & Hindi'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-dark-700 dark:text-dark-300 font-medium">
                      <HiVideoCamera className="h-4 w-4 text-blue-500 shrink-0" />
                      <span className="truncate">
                        {course.totalLessons || lessons.length || '40+'} Lectures
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-dark-700 dark:text-dark-300 font-medium">
                      <HiBookOpen className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span className="truncate">Mock Tests</span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-dark-700 dark:text-dark-300 font-medium">
                      <HiBadgeCheck className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="truncate">Certificate</span>
                    </div>
                  </div>

                  {/* Key Highlights */}
                  {(course.highlights || []).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-dark-100 dark:border-dark-800">
                      <p className="text-[12px] font-bold text-dark-400 dark:text-dark-500 uppercase tracking-wider mb-3">
                        Key Highlights
                      </p>
                      <ul className="space-y-2">
                        {course.highlights.map((h, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-[13px] text-dark-700 dark:text-dark-300 font-medium"
                          >
                            <HiCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Buy Bar (Sticky Bottom CTA) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-dark-900 border-t border-dark-200 dark:border-dark-800 p-4 pb-safe shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] flex items-center justify-between gap-4">
        <div>
          {isEnrolled ? (
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-700 dark:text-emerald-400">
              <HiBadgeCheck className="h-4 w-4 shrink-0" />
              Purchased
            </span>
          ) : (
            <PriceTag
              price={course.effectivePrice ?? course.price}
              originalPrice={course.discountPrice > 0 ? course.price : undefined}
              size="md"
            />
          )}
        </div>
        <div className="flex gap-2.5 flex-1 justify-end max-w-[200px]">
          <button
            onClick={handleWishlist}
            className="p-3.5 rounded-xl border border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800 active:scale-95 transition-transform flex-shrink-0"
          >
            <HiHeart
              className={`h-5 w-5 ${wishlistMap[course?.id || course?._id || id] ? 'text-red-500 fill-current' : 'text-dark-500'}`}
            />
          </button>
          <button
            onClick={handleEnroll}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all duration-300 text-sm whitespace-nowrap active:scale-95"
          >
            {isEnrolled
              ? 'Resume'
              : (course?.effectivePrice ?? course?.price) > 0
                ? 'Buy Course'
                : 'Enroll Free'}
          </button>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 lg:pb-8">
        <div className="lg:pr-[380px]">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-8" />

          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="bg-white dark:bg-dark-900 rounded-[24px] p-6 sm:p-8 shadow-sm border border-dark-200/80 dark:border-dark-800/80">
                <h3 className="text-[22px] font-extrabold text-[#172554] dark:text-white mb-4">
                  About this Course
                </h3>
                <p className="text-[15px] text-dark-600 dark:text-dark-400 leading-relaxed">
                  {course.description}
                </p>
              </div>

              {course.whatYouLearn?.length > 0 && (
                <div className="bg-[#F8FAFC] dark:bg-dark-900/50 rounded-[24px] p-6 sm:p-8 border border-dark-100 dark:border-dark-800">
                  <h3 className="text-[22px] font-extrabold text-[#172554] dark:text-white mb-6">
                    What You'll Learn
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {course.whatYouLearn.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 bg-white dark:bg-dark-900 p-4 rounded-xl border border-dark-100 dark:border-dark-800 shadow-sm"
                      >
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1 rounded-full flex-shrink-0 mt-0.5">
                          <HiCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-[14px] font-medium text-dark-700 dark:text-dark-300 leading-relaxed">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {course.requirements && (
                <div className="bg-white dark:bg-dark-900 rounded-[24px] p-6 sm:p-8 shadow-sm border border-dark-200/80 dark:border-dark-800/80">
                  <h3 className="text-[22px] font-extrabold text-[#172554] dark:text-white mb-4">
                    Requirements
                  </h3>
                  <ul className="space-y-3">
                    {(Array.isArray(course.requirements)
                      ? course.requirements
                      : [course.requirements]
                    ).map((req, i) => (
                      <li
                        key={i}
                        className="text-[15px] text-dark-600 dark:text-dark-400 flex items-start gap-3"
                      >
                        <span className="h-2 w-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                        <span className="leading-relaxed">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'curriculum' && (
            <div className="bg-white dark:bg-dark-900 rounded-[24px] p-6 sm:p-8 shadow-sm border border-dark-200/80 dark:border-dark-800/80 transition-all duration-300">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-dark-100 dark:border-dark-800 pb-6">
                <h3 className="text-[22px] font-extrabold text-[#172554] dark:text-white">
                  Course Curriculum
                </h3>
                <span className="text-[13px] font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400 px-4 py-1.5 rounded-full">
                  {course.totalLessons || lessons.length} lessons •{' '}
                  {formatDuration(course.totalDuration)}
                </span>
              </div>

              {(course.sections || []).length > 0 ? (
                <Accordion
                  items={(course.sections || []).map((section) => ({
                    title: section.title,
                    subtitle: `${section.lessons?.length || 0} lessons`,
                    content: (
                      <div className="space-y-2 py-3 px-2">
                        {(section.lessons || []).map((lesson, li) => {
                          // Free lessons are demo classes — open to everyone,
                          // no purchase required. Everything else needs access.
                          const openable = lesson.isFree || isEnrolled;

                          const body = (
                            <>
                              <div
                                className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                                  openable
                                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 group-hover:bg-primary-200'
                                    : 'bg-dark-50 dark:bg-dark-800 text-dark-400'
                                }`}
                              >
                                {openable ? (
                                  lessonTypeIcon(lesson.type)
                                ) : (
                                  <HiLockClosed className="h-4 w-4" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <span
                                  className={`block text-[15px] font-semibold transition-colors ${
                                    openable
                                      ? 'text-dark-700 dark:text-dark-300 group-hover:text-[#172554] dark:group-hover:text-white'
                                      : 'text-dark-500 dark:text-dark-400'
                                  }`}
                                >
                                  {lesson.title}
                                </span>
                                <span className="block text-[12px] font-medium text-dark-400 mt-0.5">
                                  {lessonTypeLabel(lesson.type)}
                                  {lesson.duration > 0 && ` · ${formatDuration(lesson.duration)}`}
                                </span>
                              </div>

                              {lesson.isFree ? (
                                <span className="ml-auto flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-800/50 px-2.5 py-1 rounded-md">
                                  {lesson.type === 'video' ? 'Free Demo' : 'Free Preview'}
                                </span>
                              ) : isEnrolled ? (
                                <HiClock className="ml-auto flex-shrink-0 h-4 w-4 text-dark-300 dark:text-dark-600" />
                              ) : (
                                <span className="ml-auto flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-dark-400 bg-dark-50 dark:bg-dark-800 border border-dark-200/60 dark:border-dark-700 px-2.5 py-1 rounded-md">
                                  Locked
                                </span>
                              )}
                            </>
                          );

                          const shared =
                            'w-full flex items-center gap-4 py-3 px-4 rounded-xl transition-colors group border border-transparent text-left';

                          // Demo classes link straight into the player.
                          return openable ? (
                            <Link
                              key={lesson._id || li}
                              to={`/courses/${course.slug || id}/learn${
                                lesson._id ? `?lesson=${lesson._id}` : ''
                              }`}
                              className={`${shared} hover:bg-[#F8FAFC] dark:hover:bg-dark-800/50 hover:border-dark-100 dark:hover:border-dark-700`}
                            >
                              {body}
                            </Link>
                          ) : (
                            <div
                              key={lesson._id || li}
                              className={`${shared} cursor-not-allowed opacity-80`}
                            >
                              {body}
                            </div>
                          );
                        })}
                      </div>
                    ),
                  }))}
                />
              ) : (
                <div className="text-center py-16 bg-[#F8FAFC] dark:bg-dark-900/50 rounded-2xl border border-dashed border-dark-200 dark:border-dark-800">
                  <HiBookOpen className="h-12 w-12 text-dark-300 dark:text-dark-600 mx-auto mb-4" />
                  <p className="text-dark-500 font-medium text-[15px]">
                    Curriculum is being updated by the faculty.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-5">
              {/* ── Write Review Form (Only if enrolled and has NOT reviewed yet) ── */}
              {isAuthenticated && isEnrolled && !myExistingReview && (
                <div className="bg-white dark:bg-dark-900 rounded-[24px] p-6 sm:p-8 shadow-sm border border-dark-200/80 dark:border-dark-800/80">
                  <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-5">
                    Write a Review
                  </h3>
                  <form onSubmit={handleSubmitReview} className="space-y-5">
                    <div>
                      <p className="text-sm font-semibold text-dark-600 dark:text-dark-400 mb-2">
                        Your Rating *
                      </p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            onMouseEnter={() => setReviewHover(star)}
                            onMouseLeave={() => setReviewHover(0)}
                            className="text-3xl leading-none transition-transform hover:scale-110 focus:outline-none"
                          >
                            <span
                              className={
                                star <= (reviewHover || reviewRating)
                                  ? 'text-amber-400'
                                  : 'text-slate-300 dark:text-slate-600'
                              }
                            >
                              ★
                            </span>
                          </button>
                        ))}
                        {reviewRating > 0 && (
                          <span className="ml-2 text-sm font-semibold text-amber-600">
                            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-dark-600 dark:text-dark-400 mb-2">
                        Your Review *
                      </p>
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Share your experience — minimum 5 characters"
                        rows={4}
                        maxLength={1000}
                        className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl text-dark-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none leading-relaxed"
                      />
                      <p className="text-right text-xs text-slate-400 mt-1">
                        {reviewText.length}/1000
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={submittingReview || !reviewRating}
                      className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-sm flex items-center gap-2 active:scale-95 shadow-sm"
                    >
                      {submittingReview ? 'Submitting…' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              )}

              {/* ── Submitted-this-session banner ── */}
              {reviewSubmitted && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-[24px] p-5 border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-3">
                  <span className="text-2xl">🎉</span>
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">
                    Thanks for your review! Your rating and feedback have been saved.
                  </p>
                </div>
              )}

              {/* ── Not enrolled prompt ── */}
              {isAuthenticated && !isEnrolled && (
                <div className="bg-slate-50 dark:bg-dark-800 rounded-[24px] p-6 border border-slate-200 dark:border-dark-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📚</span>
                    <p className="text-sm text-dark-500 dark:text-dark-400">
                      Enroll to leave a review
                    </p>
                  </div>
                  <button
                    onClick={handleEnroll}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-all flex-shrink-0"
                  >
                    {(course?.effectivePrice ?? course?.price) > 0 ? 'Buy Course' : 'Enroll Free'}
                  </button>
                </div>
              )}

              {/* ── Not logged in prompt ── */}
              {!isAuthenticated && (
                <div className="bg-slate-50 dark:bg-dark-800 rounded-[24px] p-6 border border-slate-200 dark:border-dark-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-dark-500 dark:text-dark-400">
                    Sign in to leave a review
                  </p>
                  <button
                    onClick={() =>
                      navigate('/login', { state: { from: { pathname: `/courses/${id}` } } })
                    }
                    className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-all flex-shrink-0"
                  >
                    Sign in
                  </button>
                </div>
              )}

              {/* ── Review list ── */}
              {reviews.length === 0 ? (
                <div className="text-center py-12 text-dark-400">
                  <div className="text-5xl mb-3">⭐</div>
                  <p className="text-base font-semibold text-dark-700 dark:text-dark-300 mb-1">
                    No reviews yet
                  </p>
                  <p className="text-sm text-dark-400">
                    {isEnrolled
                      ? 'Be the first to review this course!'
                      : 'Enroll to be the first to review!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard
                      key={review.id || review._id}
                      review={review}
                      currentUserId={user?.id || user?._id}
                      onEdit={handleEditReview}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'instructor' && (
            <div className="bg-white dark:bg-dark-900 rounded-[24px] p-6 sm:p-8 shadow-sm border border-dark-200/80 dark:border-dark-800/80 transition-all duration-300">
              <div className="flex items-center gap-5 mb-6 pb-6 border-b border-dark-100 dark:border-dark-800">
                <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg border-4 border-blue-50">
                  {teacherName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-[22px] font-extrabold text-[#172554] dark:text-white mb-1">
                    {teacherName}
                  </h3>
                  <p className="text-primary-600 dark:text-primary-400 font-medium text-[15px]">
                    Expert Instructor
                  </p>
                </div>
              </div>
              <p className="text-[15px] text-dark-600 dark:text-dark-400 leading-relaxed max-w-3xl">
                {course.teacher?.bio ||
                  'An experienced educator passionate about helping students achieve their goals through structured learning and comprehensive test series.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
