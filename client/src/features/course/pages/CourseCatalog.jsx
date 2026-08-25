import SeoHead from '@/components/SeoHead';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchCourses, setFilters, clearFilters } from '@/features/course/courseSlice';
import { fetchExamCategories } from '@/features/category/categorySlice';
import CourseGrid from '@/features/course/components/CourseGrid';
import SearchBar from '@/components/common/SearchBar';
import FilterSidebar from '@/components/common/FilterSidebar';
import Pagination from '@/components/common/Pagination';

export default function CourseCatalog() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { courses, loading, pagination, filters, error } = useSelector((state) => state.courses);
  const { examCategories } = useSelector((state) => state.categories);
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync URL params to Redux on mount
  useEffect(() => {
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    if (search || category) {
      dispatch(
        setFilters({
          ...(search && { search }),
          ...(category && { category }),
        })
      );
    }

    // Fetch categories if not already loaded
    if (!examCategories || examCategories.length === 0) {
      dispatch(fetchExamCategories());
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

  const mapCategoryNode = (node) => {
    const nodeId = node.id || node._id || node.slug;
    return {
      value: nodeId,
      label: node.name,
      count: node.courseCount || node.coursesCount || 0,
      children: (node.subcategories || []).map(mapCategoryNode),
    };
  };

  const filterConfig = [
    {
      key: 'sort',
      label: 'Sort By',
      type: 'radio',
      options: [
        { value: 'newest', label: 'Newest First' },
        { value: 'price_low', label: 'Price: Low to High' },
        { value: 'price_high', label: 'Price: High to Low' },
        { value: 'popular', label: 'Most Popular' },
      ],
    },
    {
      key: 'category',
      label: 'Filter by Category',
      type: 'checkbox',
      options: (examCategories || []).map(mapCategoryNode),
    },
  ];

  const handleFilterChange = (key, value) => {
    let newValue = value;

    if (key === 'category') {
      let currentCategories = filters.category ? filters.category.split(',').filter(Boolean) : [];

      const parentCat = examCategories?.find((c) => (c.id || c._id || c.slug) === value);

      // Find node anywhere in tree
      const findNodeAndChildren = (nodes) => {
        for (const n of nodes) {
          const nKey = n.id || n._id || n.slug;
          if (nKey === value) {
            // Collect all descendants
            const collectDescendants = (item) => {
              let ids = [item.id || item._id || item.slug];
              (item.subcategories || []).forEach((child) => {
                ids = ids.concat(collectDescendants(child));
              });
              return ids;
            };
            return { node: n, allDescendantIds: collectDescendants(n) };
          }
          if (n.subcategories && n.subcategories.length > 0) {
            const found = findNodeAndChildren(n.subcategories);
            if (found) return found;
          }
        }
        return null;
      };

      const match = findNodeAndChildren(examCategories || []);

      if (match && match.node.subcategories && match.node.subcategories.length > 0) {
        // Toggling a node with children
        const isSelected = currentCategories.includes(value);
        if (isSelected) {
          currentCategories = currentCategories.filter((c) => !match.allDescendantIds.includes(c));
        } else {
          match.allDescendantIds.forEach((id) => {
            if (!currentCategories.includes(id)) currentCategories.push(id);
          });
        }
      } else {
        // Toggling a leaf child node
        if (currentCategories.includes(value)) {
          currentCategories = currentCategories.filter((c) => c !== value);
        } else {
          currentCategories.push(value);
        }
      }
      newValue = currentCategories.join(',');
    }

    dispatch(setFilters({ [key]: newValue }));
    setPage(1);

    const newParams = new URLSearchParams(searchParams);
    if (newValue) newParams.set(key, newValue);
    else newParams.delete(key);
    setSearchParams(newParams, { state: { preventScroll: true } });
  };

  const handleSearch = (query) => {
    dispatch(setFilters({ search: query }));
    setPage(1);

    const newParams = new URLSearchParams(searchParams);
    if (query) newParams.set('search', query);
    else newParams.delete('search');
    setSearchParams(newParams, { state: { preventScroll: true } });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-[75vh]">
      <SeoHead
        title="Courses — EduPortal"
        description="Explore premium courses for RPSC RAS, RJS, EO/RO, Rajasthan GK, and Political Science. Live classes, video lectures, and handwritten notes."
      />
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Explore Courses
        </h1>
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
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
            />
          </svg>
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
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-lg text-dark-400 hover:text-dark-700 dark:hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <FilterSidebar
                filters={filterConfig}
                activeFilters={{
                  ...filters,
                  category: filters.category ? filters.category.split(',') : [],
                }}
                onFilterChange={(key, value) => {
                  handleFilterChange(key, value);
                  setSidebarOpen(false);
                }}
                onClear={() => {
                  dispatch(clearFilters());
                  setPage(1);
                  setSearchParams({}, { state: { preventScroll: true } });
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
            activeFilters={{
              ...filters,
              category: filters.category ? filters.category.split(',') : [],
            }}
            onFilterChange={handleFilterChange}
            onClear={() => {
              dispatch(clearFilters());
              setPage(1);
              setSearchParams({}, { state: { preventScroll: true } });
            }}
          />
        </div>

        {/* Course Grid + Pagination */}
        <div className="flex-1 min-w-0">
          {error ? (
            <div className="text-center py-16 bg-white dark:bg-dark-900 rounded-3xl border border-red-200 dark:border-red-900/30">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="font-bold text-dark-900 dark:text-white mb-1">Failed to load courses</p>
              <p className="text-sm text-slate-500 mb-4">{error}</p>
              <button
                onClick={() => dispatch(fetchCourses({ page, limit: 12, sort: 'newest' }))}
                className="btn-primary text-sm px-5 py-2"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
