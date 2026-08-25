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

  // Sync URL params to Redux on mount and param change
  useEffect(() => {
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    dispatch(
      setFilters({
        search: search || '',
        category: category || '',
      })
    );

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

      // Find node anywhere in tree
      const findNodeAndChildren = (nodes) => {
        for (const n of nodes) {
          const nKey = n.id || n._id || n.slug;
          if (nKey === value) {
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
        const isSelected = currentCategories.includes(value);
        if (isSelected) {
          currentCategories = currentCategories.filter((c) => !match.allDescendantIds.includes(c));
        } else {
          match.allDescendantIds.forEach((id) => {
            if (!currentCategories.includes(id)) {
              currentCategories.push(id);
            }
          });
        }
      } else {
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

    const nextParams = new URLSearchParams(searchParams);
    if (newValue) {
      nextParams.set(key, newValue);
    } else {
      nextParams.delete(key);
    }
    setSearchParams(nextParams, { state: { preventScroll: true } });
  };

  const handleSearch = (term) => {
    dispatch(setFilters({ search: term }));
    setPage(1);
    const nextParams = new URLSearchParams(searchParams);
    if (term) {
      nextParams.set('search', term);
    } else {
      nextParams.delete('search');
    }
    setSearchParams(nextParams, { state: { preventScroll: true } });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.category ? filters.category.split(',').filter(Boolean).length : 0) +
    (filters.level ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SeoHead
        title="Explore All Courses | CivicsEdu"
        description="Browse comprehensive courses and test series taught by India's top educators on CivicsEdu."
      />

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-dark-900 dark:text-white font-display">
          All Courses & Syllabus Batches
        </h1>
        <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
          Explore structured courses, video lectures, and notes prepared by specialized faculty.
        </p>
      </div>

      {/* Search and Mobile Filter Trigger */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search by course title, topic, or faculty name..."
            defaultValue={filters.search || ''}
          />
        </div>
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
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
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
            <div className="text-center py-12">
              <p className="text-red-500 font-medium">{error}</p>
              <button
                onClick={() => dispatch(fetchCourses({ page: 1, limit: 12 }))}
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <CourseGrid courses={courses} loading={loading} />

              {!loading && pagination && pagination.totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
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
