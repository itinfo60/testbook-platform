import SeoHead from '@/components/SeoHead';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@/hooks/useAuth';
import { fetchCourseById } from '@/features/course/courseSlice';
import { fetchCourseReviews } from '@/features/review/reviewSlice';
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
  HiGlobe,
  HiHeart,
  HiPlay,
  HiUsers,
  HiVideoCamera,
} from 'react-icons/hi';
import { Link } from 'react-router-dom';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentCourse: course, loading } = useSelector((state) => state.courses);
  const { reviews } = useSelector((state) => state.reviews);
  const { wishlistMap } = useSelector((state) => state.wishlist);
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(fetchCourseById(id));
    dispatch(fetchCourseReviews({ courseId: id }));
    if (isAuthenticated) {
      dispatch(checkWishlist(id));
      const checkStatus = async () => {
        setCheckingEnrollment(true);
        try {
          const res = await enrollmentAPI.checkEnrollment(id);
          setIsEnrolled(res.data.data?.isEnrolled || false);
        } catch (error) {
          console.error(error);
        } finally {
          setCheckingEnrollment(false);
        }
      };
      checkStatus();
    }
  }, [dispatch, id, isAuthenticated]);

  const handleEnroll = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/courses/${id}` } } });
      return;
    }
    if (isEnrolled) {
      navigate(`/courses/${id}/learn`);
      return;
    }
    if (course?.price > 0) {
      navigate(`/checkout/${id}`);
    } else {
      navigate(`/checkout/${id}?free=true`);
    }
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    dispatch(toggleWishlist(id));
    toast.success(wishlistMap[id] ? 'Removed from wishlist' : 'Added to wishlist');
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
          className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all text-sm"
        >
          Browse All Courses
        </Link>
      </div>
    );
  }

  const lessons = (course.sections || []).flatMap((s) => s.lessons || []);

  const formatDuration = (secs) => {
    if (!secs) return 'Self-paced';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
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
                provider: { '@type': 'Organization', name: 'EduHub' },
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
                {course.level && (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded capitalize">
                    {course.level}
                  </span>
                )}
                <span className="text-[11px] font-bold text-white bg-white/10 border border-white/10 px-2.5 py-1 rounded flex items-center gap-1.5 backdrop-blur-sm">
                  <HiVideoCamera className="h-3.5 w-3.5" /> Live & Recorded
                </span>
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
                    rating={course.averageRating || 0}
                    count={course.totalReviews}
                    size="md"
                  />
                  <span className="text-white font-bold text-[14px] ml-1">
                    {Number(course.averageRating || 0).toFixed(1)}
                  </span>
                </div>
                <div className="w-px h-5 bg-white/10 hidden sm:block"></div>
                <span className="text-blue-100 flex items-center gap-2 text-[14px] font-semibold">
                  <HiUsers className="h-4 w-4 text-emerald-400" />
                  {course.enrollmentCount || 0} Aspirants
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
                <div className="mb-6 flex items-baseline gap-2">
                  <PriceTag
                    price={course.effectivePrice ?? course.price}
                    originalPrice={course.discountPrice > 0 ? course.price : undefined}
                    size="xl"
                  />
                </div>

                <button
                  onClick={handleEnroll}
                  className="w-full bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl shadow-md transition-all duration-300 text-[15px] mb-3 flex items-center justify-center gap-2"
                >
                  {isEnrolled
                    ? 'Resume Learning'
                    : course.price > 0
                      ? 'Buy Course Now'
                      : 'Enroll for Free'}
                </button>
                <button
                  onClick={handleWishlist}
                  className={`w-full py-3.5 flex items-center justify-center gap-2 rounded-xl border transition-colors text-[14px] font-bold ${wishlistMap[id] ? 'bg-red-50 text-red-500 border-red-200 dark:bg-red-900/20 dark:border-red-900/30' : 'bg-dark-50 dark:bg-dark-800 text-dark-700 dark:text-dark-300 border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-700'}`}
                >
                  <HiHeart className={`h-5 w-5 ${wishlistMap[id] ? 'fill-current' : ''}`} />
                  {wishlistMap[id] ? 'Wishlisted' : 'Add to Wishlist'}
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Buy Bar (Sticky Bottom CTA) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-dark-900 border-t border-dark-200 dark:border-dark-800 p-4 pb-safe shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] flex items-center justify-between gap-4">
        <div>
          <PriceTag
            price={course.effectivePrice ?? course.price}
            originalPrice={course.discountPrice > 0 ? course.price : undefined}
            size="md"
          />
        </div>
        <div className="flex gap-2.5 flex-1 justify-end max-w-[200px]">
          <button
            onClick={handleWishlist}
            className="p-3.5 rounded-xl border border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800 active:scale-95 transition-transform flex-shrink-0"
          >
            <HiHeart
              className={`h-5 w-5 ${wishlistMap[id] ? 'text-red-500 fill-current' : 'text-dark-500'}`}
            />
          </button>
          <button
            onClick={handleEnroll}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all duration-300 text-sm whitespace-nowrap active:scale-95"
          >
            {isEnrolled ? 'Resume' : 'Buy Course'}
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
                        {(section.lessons || []).map((lesson, li) => (
                          <div
                            key={li}
                            className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-dark-800/50 transition-colors group cursor-pointer border border-transparent hover:border-dark-100 dark:hover:border-dark-700"
                          >
                            <div
                              className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${lesson.isFree ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 group-hover:bg-primary-200' : 'bg-dark-50 dark:bg-dark-800 text-dark-400 group-hover:bg-dark-100 dark:group-hover:bg-dark-700'}`}
                            >
                              <HiPlay className="h-5 w-5 ml-0.5" />
                            </div>
                            <span className="text-[15px] font-semibold text-dark-700 dark:text-dark-300 group-hover:text-[#172554] dark:group-hover:text-white transition-colors">
                              {lesson.title}
                            </span>

                            {lesson.isFree ? (
                              <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-800/50 px-2.5 py-1 rounded-md">
                                Demo Class
                              </span>
                            ) : (
                              <HiClock className="ml-auto h-4 w-4 text-dark-300 dark:text-dark-600" />
                            )}
                          </div>
                        ))}
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
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-10 text-dark-400">
                  <div className="text-4xl mb-2">⭐</div>
                  <p>No reviews yet. Be the first to review!</p>
                </div>
              ) : (
                reviews.map((review) => <ReviewCard key={review._id} review={review} />)
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
