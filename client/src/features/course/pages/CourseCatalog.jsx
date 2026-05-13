import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchCourses, setFilters } from '@/features/course/courseSlice';
import CourseGrid from '@/features/course/components/CourseGrid';
import SearchBar from '@/components/common/SearchBar';
import FilterSidebar from '@/components/common/FilterSidebar';
import Pagination from '@/components/common/Pagination';

export default function CourseCatalog() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { courses, loading, pagination, filters } = useSelector((state) => state.courses);
  const [page, setPage] = useState(1);

  const searchFromUrl = searchParams.get('search') || '';

  useEffect(() => {
    const params = {
      page,
      limit: 12,
      ...(filters.search || searchFromUrl ? { search: filters.search || searchFromUrl } : {}),
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.level ? { level: filters.level } : {}),
      ...(filters.sort ? { sort: filters.sort } : { sort: '-createdAt' }),
    };
    dispatch(fetchCourses(params));
  }, [dispatch, page, filters, searchFromUrl]);

  const filterConfig = [
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
  };

  const handleSearch = (query) => {
    dispatch(setFilters({ search: query }));
    setPage(1);
    if (query) setSearchParams({ search: query });
    else setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Explore Courses</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Find the perfect course for your learning goals
        </p>
      </div>

      {/* Search + Mobile Filter Button — same row */}
      <div className="flex items-center gap-3 mb-6">
        <SearchBar
          value={filters.search || searchFromUrl}
          onSearch={handleSearch}
          placeholder="Search courses..."
          className="flex-1"
        />
        {/* Mobile-only filter button (FilterSidebar renders it) */}
      </div>

      {/* Main Content: Sidebar + Grid */}
      <div className="flex gap-8">
        {/* Filter Sidebar — renders desktop sidebar + mobile trigger */}
        <FilterSidebar
          filters={filterConfig}
          activeFilters={filters}
          onFilterChange={handleFilterChange}
          onClear={() => {
            dispatch(setFilters({ category: '', level: '', search: '', sort: 'newest' }));
            setPage(1);
          }}
        />

        {/* Course Grid + Pagination */}
        <div className="flex-1 min-w-0">
          <CourseGrid courses={courses} loading={loading} />
          {pagination && (
            <div className="mt-8">
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