import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchTests } from '@/features/test/testSlice';
import { fetchExamCategories } from '@/features/category/categorySlice';
import SearchBar from '@/components/common/SearchBar';
import Tabs from '@/components/common/Tabs';
import CourseCardSkeleton from '@/components/skeleton/CourseCardSkeleton';
import TestCard from '@/features/test/components/TestCard';

export default function TestCatalog() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tests, loading } = useSelector((state) => state.tests);
  const { examCategories } = useSelector((state) => state.categories);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');
  const [activeType, setActiveType] = useState(searchParams.get('type') || 'all');

  useEffect(() => {
    dispatch(fetchTests());
    dispatch(fetchExamCategories());
  }, [dispatch]);

  useEffect(() => {
    const cat = searchParams.get('category');
    const q = searchParams.get('search');
    const type = searchParams.get('type');
    if (cat) setActiveCategory(cat);
    if (q) setSearch(q);
    if (type) setActiveType(type);
  }, [searchParams]);

  const handleCategoryChange = (catKey) => {
    setActiveCategory(catKey);
    const p = new URLSearchParams(searchParams);
    if (catKey === 'all') p.delete('category');
    else p.set('category', catKey);
    setSearchParams(p);
  };

  const handleTypeChange = (typeKey) => {
    setActiveType(typeKey);
    const p = new URLSearchParams(searchParams);
    if (typeKey === 'all') p.delete('type');
    else p.set('type', typeKey);
    setSearchParams(p);
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    const p = new URLSearchParams(searchParams);
    if (val) p.set('search', val);
    else p.delete('search');
    setSearchParams(p);
  };

  const filteredTests = tests.filter((t) => {
    const matchSearch =
      !search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());

    let matchCat = activeCategory === 'all';
    if (!matchCat) {
      const selectedCat = examCategories.find((c) => c._id === activeCategory);
      if (selectedCat && selectedCat.subcategories?.length > 0) {
        const subIds = selectedCat.subcategories.map((s) => s._id);
        const targetIds = [selectedCat._id, ...subIds];
        matchCat = targetIds.some(
          (id) =>
            t.category === id ||
            t.category?._id === id ||
            t.examCategory === id ||
            t.category?.parent === activeCategory
        );
      } else {
        matchCat =
          t.category === activeCategory ||
          t.category?._id === activeCategory ||
          t.category?.name === activeCategory ||
          t.examCategory === activeCategory;
      }
    }

    const matchType =
      activeType === 'all' ||
      t.testType === activeType ||
      (activeType === 'full_length' && (!t.testType || t.testType === 'full_length'));

    return matchSearch && matchCat && matchType;
  });

  const categoryTabs = [
    { key: 'all', label: 'All Categories' },
    ...examCategories.map((c) => ({ key: c._id, label: c.name })),
  ];

  const typeFilterOptions = [
    { id: 'all', label: 'All Tests' },
    { id: 'full_length', label: '🏆 Full Length Test Series' },
    { id: 'subject_wise', label: '📚 Subject-Wise Tests' },
    { id: 'topic_wise', label: '📖 Chapter & Topic Tests' },
    { id: 'pyq', label: '📜 Previous Year Papers (PYQ)' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="section-title">Mock Tests & Test Series</h1>
          <p className="section-subtitle">
            Practice with Full Length Series, Subject-Wise Tests, Topic Tests & PYQs
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 p-1.5 rounded-2xl self-start md:self-auto">
          <Link
            to="/test-series"
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900"
          >
            🏆 Test Series Packages
          </Link>
          <span className="px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm">
            📝 Individual Tests
          </span>
        </div>
      </div>

      {/* Test Mode / Type Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 hide-scrollbar">
        {typeFilterOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleTypeChange(opt.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeType === opt.id
                ? 'bg-amber-800 text-white shadow-md'
                : 'bg-white dark:bg-dark-800 text-dark-700 dark:text-dark-300 border border-dark-200 dark:border-dark-700 hover:bg-dark-50 dark:hover:bg-dark-750'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-5 sm:mb-6">
        <SearchBar
          value={search}
          onSearch={handleSearchChange}
          placeholder="Search tests..."
          className="flex-1 min-w-0"
        />
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
        <Tabs
          tabs={categoryTabs}
          activeTab={activeCategory}
          onChange={handleCategoryChange}
          className="min-w-max sm:min-w-0"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <CourseCardSkeleton count={6} />
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">
            No tests found
          </h3>
          <p className="text-dark-500 text-sm sm:text-base">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredTests.map((test) => (
            <TestCard key={test._id} test={test} />
          ))}
        </div>
      )}
    </div>
  );
}
