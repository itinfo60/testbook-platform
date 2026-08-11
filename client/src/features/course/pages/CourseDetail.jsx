import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiClock,
  HiBookOpen,
  HiGlobe,
  HiAcademicCap,
  HiUsers,
  HiHeart,
  HiCheck,
  HiPlay,
} from 'react-icons/hi';
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
import { HiVideoCamera, HiDocumentDownload } from 'react-icons/hi';

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

  if (loading || checkingEnrollment || !course) return <LoadingSpinner fullScreen />;

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

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-dark-900 dark:bg-dark-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-3">
                {course.category && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-1 rounded uppercase tracking-wider">
                    {typeof course.category === 'string' ? course.category : course.category.name}
                  </span>
                )}
                {course.level && (
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded capitalize">
                    {course.level}
                  </span>
                )}
                <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-950 px-2 py-1 rounded flex items-center gap-1">
                  <HiVideoCamera className="h-3 w-3" /> Live & Recorded
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-display text-white mb-4 leading-tight">
                {course.title}
              </h1>
              <p className="text-slate-300 dark:text-slate-400 mb-6 text-sm sm:text-base line-clamp-3 leading-relaxed max-w-3xl">
                {course.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6 bg-slate-800/50 p-4 rounded-2xl w-fit border border-slate-700/50">
                <RatingStars
                  rating={course.averageRating || 0}
                  count={course.totalReviews}
                  size="md"
                />
                <div className="w-px h-6 bg-slate-700 hidden sm:block"></div>
                <span className="text-slate-300 flex items-center gap-1.5 text-sm font-medium">
                  <HiUsers className="h-4 w-4 text-amber-500" />
                  {course.enrollmentCount || 0} Aspirants
                </span>
                <div className="w-px h-6 bg-slate-700 hidden sm:block"></div>
                <span className="text-slate-300 flex items-center gap-1.5 text-sm font-medium">
                  <HiGlobe className="h-4 w-4 text-amber-500" />
                  {course.language || 'Hindi & English'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold flex-shrink-0 text-lg shadow-md">
                  {course.teacher?.name?.charAt(0) || 'T'}
                </div>
                <div>
                  <p className="text-white font-bold text-sm sm:text-base">
                    {course.teacher?.name || 'Expert Faculty'}
                  </p>
                  <p className="text-amber-400 text-xs sm:text-sm font-medium">
                    Subject Specialist
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar Card - Desktop */}
            <div className="hidden lg:block">
              <div className="bg-white dark:bg-dark-900 rounded-3xl p-6 border border-slate-200 dark:border-dark-800 shadow-xl sticky top-24">
                {course.thumbnail?.url || course.thumbnail ? (
                  <img
                    src={course.thumbnail?.url || course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover rounded-2xl mb-6 shadow-md"
                  />
                ) : (
                  <div className="w-full h-48 bg-slate-100 dark:bg-dark-800 rounded-2xl mb-6 flex items-center justify-center text-slate-400 shadow-inner">
                    <HiPlay className="h-12 w-12" />
                  </div>
                )}

                <div className="mb-6">
                  <PriceTag
                    price={course.effectivePrice ?? course.price}
                    originalPrice={course.discountPrice > 0 ? course.price : undefined}
                    size="lg"
                  />
                  <p className="text-xs text-red-500 font-bold mt-2">🔥 Limited Time Offer!</p>
                </div>

                <button
                  onClick={handleEnroll}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all text-sm mb-3"
                >
                  {isEnrolled
                    ? 'Resume Learning'
                    : course.price > 0
                      ? 'Buy Course Now'
                      : 'Enroll for Free'}
                </button>
                <button
                  onClick={handleWishlist}
                  className={`w-full py-3 flex items-center justify-center gap-2 rounded-xl border transition-colors text-sm font-bold ${wishlistMap[id] ? 'bg-red-50 text-red-500 border-red-200 dark:bg-red-900/20 dark:border-red-900/30' : 'bg-slate-50 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-700 hover:bg-slate-100 dark:hover:bg-dark-700'}`}
                >
                  <HiHeart className={`h-5 w-5 ${wishlistMap[id] ? 'fill-current' : ''}`} />
                  {wishlistMap[id] ? 'Wishlisted' : 'Add to Wishlist'}
                </button>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-dark-800 space-y-4">
                  <h4 className="font-bold text-sm text-dark-900 dark:text-white">
                    This course includes:
                  </h4>
                  {[
                    {
                      icon: HiVideoCamera,
                      text: `${course.totalLessons || lessons.length} Live & Recorded Classes`,
                    },
                    { icon: HiClock, text: formatDuration(course.totalDuration) },
                    { icon: HiDocumentDownload, text: 'Downloadable PDFs & Notes' },
                    { icon: HiCheck, text: 'Test Series Included' },
                    { icon: HiGlobe, text: '1 Year Validity' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400"
                    >
                      <item.icon className="h-5 w-5 text-amber-500 flex-shrink-0" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Buy Bar (Sticky Bottom CTA) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-dark-900 border-t border-slate-200 dark:border-dark-800 p-4 pb-safe shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] flex items-center justify-between gap-4">
        <div>
          <PriceTag
            price={course.effectivePrice ?? course.price}
            originalPrice={course.discountPrice > 0 ? course.price : undefined}
            size="md"
          />
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">1 Year Validity</p>
        </div>
        <div className="flex gap-2.5 flex-1 justify-end max-w-[200px]">
          <button
            onClick={handleWishlist}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 active:scale-95 transition-transform flex-shrink-0"
          >
            <HiHeart
              className={`h-5 w-5 ${wishlistMap[id] ? 'text-red-500 fill-current' : 'text-slate-500'}`}
            />
          </button>
          <button
            onClick={handleEnroll}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all text-sm whitespace-nowrap active:scale-95"
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
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-3">
                  About this Course
                </h3>
                <p className="text-dark-600 dark:text-dark-400 leading-relaxed">
                  {course.description}
                </p>
              </div>

              {course.whatYouLearn?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-3">
                    What You'll Learn
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {course.whatYouLearn.map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <HiCheck className="h-5 w-5 text-secondary-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-dark-600 dark:text-dark-400">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {course.requirements && (
                <div>
                  <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-3">
                    Requirements
                  </h3>
                  <ul className="space-y-1">
                    {(Array.isArray(course.requirements)
                      ? course.requirements
                      : [course.requirements]
                    ).map((req, i) => (
                      <li
                        key={i}
                        className="text-sm text-dark-600 dark:text-dark-400 flex items-center gap-2"
                      >
                        <span className="h-1.5 w-1.5 bg-dark-400 rounded-full" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'curriculum' && (
            <div className="bg-white dark:bg-dark-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-dark-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-extrabold font-display">Course Curriculum</h3>
                <span className="text-sm font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-3 py-1 rounded-full">
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
                      <div className="space-y-2 py-2">
                        {(section.lessons || []).map((lesson, li) => (
                          <div
                            key={li}
                            className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-800 transition-colors group cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-dark-700"
                          >
                            <div
                              className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${lesson.isFree ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600' : 'bg-slate-100 dark:bg-dark-800 text-slate-400'}`}
                            >
                              <HiPlay className="h-4 w-4 ml-0.5" />
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-dark-900 dark:group-hover:text-white transition-colors">
                              {lesson.title}
                            </span>

                            {lesson.isFree ? (
                              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">
                                Demo Class
                              </span>
                            ) : (
                              <HiClock className="ml-auto h-4 w-4 text-slate-300" />
                            )}
                          </div>
                        ))}
                      </div>
                    ),
                  }))}
                />
              ) : (
                <div className="text-center py-10 bg-slate-50 dark:bg-dark-800 rounded-2xl border border-dashed border-slate-200 dark:border-dark-700">
                  <HiBookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium text-sm">
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
            <div className="card p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl font-bold">
                  {course.teacher?.name?.charAt(0) || 'T'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
                    {course.teacher?.name || 'Instructor'}
                  </h3>
                  <p className="text-dark-500">Expert Instructor</p>
                </div>
              </div>
              <p className="text-dark-600 dark:text-dark-400">
                {course.teacher?.bio ||
                  'An experienced educator passionate about helping students achieve their goals.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
