import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchCourses, setFilters, clearFilters } from '@/features/course/courseSlice';
import CourseGrid from '@/features/course/components/CourseGrid';
import SearchBar from '@/components/common/SearchBar';
import FilterSidebar from '@/components/common/FilterSidebar';
import Pagination from '@/components/common/Pagination';

export default function CourseCatalog() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { courses, loading, pagination, filters } = useSelector((state) => state.courses);
  const { examCategories } = useSelector((state) => state.categories);
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync URL params to Redux on mount
  useEffect(() => {
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    if (search || category) {
      dispatch(setFilters({ 
        ...(search && { search }),
        ...(category && { category })
      }));
    }
  }, [dispatch, searchParams]);

  useEffect(() => {
    const params = {
      page,
      limit: 12,
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.level ? { level: filters.level } : {}),
      ...(filters.sort ? { sort: filters.sort } : { sort: 'newest' }),
    };
    dispatch(fetchCourses(params));
  }, [dispatch, page, filters]);

  const filterConfig = [
    {
      key: 'category',
      label: 'Category',
      type: 'radio',
      options: [
        { value: '', label: 'All Categories' },
        ...(examCategories?.map(cat => ({ value: cat._id, label: cat.name })) || []),
      ],
    },
    {
      key: 'level',
      label: 'Level',
      type: 'radio',
      options: [
        { value: '', label: 'All Levels' },
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' },
      ],
    },
    {
      key: 'sort',
      label: 'Sort By',
      type: 'radio',
      options: [
        { value: 'newest', label: 'Newest' },
        { value: 'price_low', label: 'Price: Low to High' },
        { value: 'price_high', label: 'Price: High to Low' },
        { value: 'rating', label: 'Highest Rated' },
        { value: 'popular', label: 'Most Popular' },
      ],
    },
  ];

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
    setPage(1);

    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  const handleSearch = (query) => {
    dispatch(setFilters({ search: query }));
    setPage(1);
    
    const newParams = new URLSearchParams(searchParams);
    if (query) newParams.set('search', query);
    else newParams.delete('search');
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Explore Courses</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Find the perfect course for your learning goals
        </p>
      </div>

      {/* Search + Mobile Filter Button — same row */}
      <div className="flex items-center gap-3 mb-6">
        <SearchBar
          value={filters.search || ''}
          onSearch={handleSearch}
          placeholder="Search courses..."
          className="flex-1 min-w-0"
        />
        {/* Mobile filter toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-dark-200 dark:border-dark-700 text-sm text-dark-600 dark:text-dark-300 bg-white dark:bg-dark-800"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
          Filters
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white dark:bg-dark-900 overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-dark-100 dark:border-dark-700">
              <span className="font-semibold text-dark-900 dark:text-white">Filters</span>
              <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg text-dark-400 hover:text-dark-700 dark:hover:text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4">
              <FilterSidebar
                filters={filterConfig}
                activeFilters={filters}
                onFilterChange={(key, value) => { handleFilterChange(key, value); setSidebarOpen(false); }}
                onClear={() => {
                  dispatch(clearFilters());
                  setPage(1);
                  setSearchParams({});
                  setSidebarOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Sidebar + Grid */}
      <div className="flex gap-6 lg:gap-8">
        {/* Filter Sidebar — desktop only */}
        <div className="hidden lg:block flex-shrink-0">
          <FilterSidebar
            filters={filterConfig}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
            onClear={() => {
              dispatch(clearFilters());
              setPage(1);
              setSearchParams({});
            }}
          />
        </div>

        {/* Course Grid + Pagination */}
        <div className="flex-1 min-w-0">
          <CourseGrid courses={courses} loading={loading} />
          {pagination && (
            <div className="mt-6 sm:mt-8">
              <Pagination
                currentPage={pagination.page || page}
                totalPages={pagination.totalPages || 1}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}