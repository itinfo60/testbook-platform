import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HiClock, HiBookOpen, HiGlobe, HiAcademicCap, HiUsers, HiHeart, HiCheck, HiPlay } from 'react-icons/hi';
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
import toast from 'react-hot-toast';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentCourse: course, loading } = useSelector(state => state.courses);
  const { reviews } = useSelector(state => state.reviews);
  const { wishlistMap } = useSelector(state => state.wishlist);
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    dispatch(fetchCourseById(id));
    dispatch(fetchCourseReviews({ courseId: id }));
    if (isAuthenticated) dispatch(checkWishlist(id));
  }, [dispatch, id, isAuthenticated]);

  const  handleEnroll = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/courses/${id}` } } });
      return;
    }
    if (course?.price > 0) {
      navigate(`/checkout/${id}`);
    } else {
      navigate(`/checkout/${id}?free=true`);
    }
  };

  const handleWishlist = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    dispatch(toggleWishlist(id));
    toast.success(wishlistMap[id] ? 'Removed from wishlist' : 'Added to wishlist');
  };

  if (loading || !course) return <LoadingSpinner fullScreen />;

  const lessons = course.lessons || course.curriculum || [];
  const curriculumItems = lessons.map((lesson, i) => ({
    title: lesson.title || `Lesson ${i + 1}`,
    subtitle: `${lesson.duration || '10 min'} • ${lesson.type || 'Video'}`,
    icon: <HiPlay className="h-4 w-4" />,
    content: <p className="text-sm">{lesson.description || 'Lesson content'}</p>,
  }));

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-3">
                {course.category && <span className="badge-primary">{typeof course.category === 'string' ? course.category : course.category.name}</span>}
                {course.level && <span className="badge-warning capitalize">{course.level}</span>}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">{course.title}</h1>
              <p className="text-dark-300 mb-4 line-clamp-3">{course.description}</p>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <RatingStars rating={course.rating || 0} count={course.reviewCount} size="md" />
                <span className="text-dark-400 flex items-center gap-1"><HiUsers className="h-4 w-4" />{course.studentsEnrolled || 0} students</span>
                <span className="text-dark-400 flex items-center gap-1"><HiGlobe className="h-4 w-4" />{course.language || 'English'}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                  {course.instructor?.name?.charAt(0) || 'T'}
                </div>
                <div>
                  <p className="text-white font-medium">{course.instructor?.name || 'Instructor'}</p>
                  <p className="text-dark-400 text-sm">{course.instructor?.title || 'Expert Teacher'}</p>
                </div>
              </div>
            </div>

            {/* Sidebar Card - Desktop */}
            <div className="hidden lg:block">
              <div className="card p-6 sticky top-24">
                {course.thumbnail && (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-44 object-cover rounded-xl mb-4" />
                )}
                <PriceTag price={course.price} originalPrice={course.originalPrice} size="lg" className="mb-4" />

                <button onClick={handleEnroll} className="btn-primary w-full text-base py-3 mb-3">
                  {course.price > 0 ? 'Buy Now' : 'Enroll Free'}
                </button>
                <button onClick={handleWishlist} className={`btn-outline w-full flex items-center justify-center gap-2 ${wishlistMap[id] ? 'text-red-500 border-red-500' : ''}`}>
                  <HiHeart className={`h-4 w-4 ${wishlistMap[id] ? 'fill-current' : ''}`} />
                  {wishlistMap[id] ? 'Wishlisted' : 'Add to Wishlist'}
                </button>

                <div className="mt-4 pt-4 border-t border-dark-100 dark:border-dark-700 space-y-3 text-sm">
                  {[
                    { icon: HiBookOpen, text: `${lessons.length} Lessons` },
                    { icon: HiClock, text: course.duration || 'Self-paced' },
                    { icon: HiAcademicCap, text: 'Certificate of Completion' },
                    { icon: HiGlobe, text: 'Lifetime Access' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-dark-600 dark:text-dark-400">
                      <item.icon className="h-4 w-4 text-primary-500" />
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Buy Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-dark-800 border-t border-dark-100 dark:border-dark-700 p-4 flex items-center justify-between gap-4">
        <PriceTag price={course.price} originalPrice={course.originalPrice} size="md" />
        <div className="flex gap-2">
          <button onClick={handleWishlist} className="p-2.5 rounded-xl border border-dark-200 dark:border-dark-700">
            <HiHeart className={`h-5 w-5 ${wishlistMap[id] ? 'text-red-500 fill-current' : 'text-dark-400'}`} />
          </button>
          <button onClick={handleEnroll} className="btn-primary px-6">
            {course.price > 0 ? 'Buy Now' : 'Enroll Free'}
          </button>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:pb-8 pb-24">
        <div className="lg:pr-[380px]">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-8" />

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-3">About this Course</h3>
                <p className="text-dark-600 dark:text-dark-400 leading-relaxed">{course.description}</p>
              </div>

              {course.whatYouWillLearn && (
                <div>
                  <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-3">What You'll Learn</h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {(Array.isArray(course.whatYouWillLearn) ? course.whatYouWillLearn : [course.whatYouWillLearn]).map((item, i) => (
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
                  <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-3">Requirements</h3>
                  <ul className="space-y-1">
                    {(Array.isArray(course.requirements) ? course.requirements : [course.requirements]).map((req, i) => (
                      <li key={i} className="text-sm text-dark-600 dark:text-dark-400 flex items-center gap-2">
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
            <div>
              <p className="text-sm text-dark-500 mb-4">{lessons.length} lessons • {course.duration || 'Self-paced'}</p>
              <Accordion items={curriculumItems} />
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
                reviews.map(review => <ReviewCard key={review._id} review={review} />)
              )}
            </div>
          )}

          {activeTab === 'instructor' && (
            <div className="card p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl font-bold">
                  {course.instructor?.name?.charAt(0) || 'T'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-dark-900 dark:text-white">{course.instructor?.name}</h3>
                  <p className="text-dark-500">{course.instructor?.title || 'Expert Instructor'}</p>
                </div>
              </div>
              <p className="text-dark-600 dark:text-dark-400">
                {course.instructor?.bio || 'An experienced educator passionate about helping students achieve their goals.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
