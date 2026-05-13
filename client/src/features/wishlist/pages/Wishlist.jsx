import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import CourseCard from '@/features/course/components/CourseCard';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWishlist } from '@/features/wishlist/wishlistSlice';

export default function Wishlist() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector(state => state.wishlist);

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  if (loading) return <LoadingSpinner />;

  const courses = items.map(i => i.course || i).filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="section-title mb-8">❤️ My Wishlist</h1>

      {courses.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">💝</div>
          <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-2">Your wishlist is empty</h2>
          <p className="text-dark-500 mb-6">Save courses you're interested in for later</p>
          <Link to="/courses" className="btn-primary">Browse Courses</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
