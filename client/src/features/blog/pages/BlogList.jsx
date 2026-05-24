import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBlogs, setBlogFilters } from '../blogSlice';
import BlogCard from '../components/BlogCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { HiSearch, HiHashtag } from 'react-icons/hi';

export default function BlogList() {
  const dispatch = useDispatch();
  const { blogs, loading, filters, pagination } = useSelector(state => state.blogs);

  useEffect(() => {
    dispatch(fetchBlogs(filters));
  }, [dispatch, filters]);

  const handleSearch = (e) => {
    dispatch(setBlogFilters({ search: e.target.value }));
  };

  const handleTagClick = (tag) => {
    dispatch(setBlogFilters({ tag: filters.tag === tag ? '' : tag }));
  };

  const allTags = ['Education', 'Tech', 'Career', 'Tips', 'Tests', 'Learning'];

  return (
    <div className="min-h-screen bg-dark-25 dark:bg-dark-950 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-dark-900 dark:text-white mb-4 sm:mb-6 font-display">
            Insights & <span className="text-primary-600">Resources</span>
          </h1>
          <p className="text-dark-600 dark:text-dark-400 max-w-2xl mx-auto text-base sm:text-lg">
            Stay updated with the latest trends in education, exam preparation tips, and platform updates from our community of educators.
          </p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 mb-8 sm:mb-12 items-center justify-between bg-white dark:bg-dark-800 p-4 sm:p-6 rounded-3xl shadow-sm border border-dark-100 dark:border-dark-700">
          <div className="relative w-full md:max-w-md">
            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={filters.search}
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-3 bg-dark-50 dark:bg-dark-900 border border-dark-100 dark:border-dark-700 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-dark-400"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filters.tag === tag
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-dark-50 dark:bg-dark-900 text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-700'
                }`}
              >
                <HiHashtag className="h-4 w-4" />
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Grid */}
        {loading && blogs.length === 0 ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : blogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map(blog => (
              <BlogCard key={blog._id} blog={blog} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-dark-800 rounded-3xl border-2 border-dashed border-dark-100 dark:border-dark-700">
            <div className="h-16 w-16 bg-dark-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiSearch className="h-8 w-8 text-dark-400" />
            </div>
            <h3 className="text-xl font-bold text-dark-900 dark:text-white mb-2">No articles found</h3>
            <p className="text-dark-500 dark:text-dark-400">Try adjusting your search or filters to find what you're looking for.</p>
            <button 
              onClick={() => dispatch(setBlogFilters({ search: '', tag: '' }))}
              className="mt-6 text-primary-600 font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Pagination placeholder */}
        {pagination.totalPages > 1 && (
          <div className="mt-16 flex justify-center">
            {/* Standard pagination would go here */}
          </div>
        )}
      </div>
    </div>
  );
}
