import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiArrowRight } from 'react-icons/hi';
import CourseCard from '@/features/course/components/CourseCard';
import CourseCardSkeleton from '@/components/skeleton/CourseCardSkeleton';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeaturedCourses } from '@/features/course/courseSlice';

export default function PopularCourses() {
  const dispatch = useDispatch();
  const { featured, loading } = useSelector(state => state.courses);

  useEffect(() => {
    dispatch(fetchFeaturedCourses());
  }, [dispatch]);

  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 sm:mb-10">
          <div>
            <h2 className="section-title">Popular Courses</h2>
            <p className="section-subtitle">Top-rated courses loved by students</p>
          </div>
          <Link to="/courses" className="hidden sm:flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium hover:gap-2 transition-all">
            View All <HiArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <CourseCardSkeleton count={3} />
          ) : featured.length > 0 ? (
            featured.slice(0, 6).map(course => <CourseCard key={course._id} course={course} />)
          ) : (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-12 text-dark-400">
              No courses available yet. Check back soon!
            </div>
          )}
        </div>

        <Link to="/courses" className="sm:hidden flex items-center justify-center gap-1 mt-6 text-primary-600 dark:text-primary-400 font-medium">
          View All Courses <HiArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
