import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTests } from '@/features/test/testSlice';
import { fetchExamCategories } from '@/features/category/categorySlice';
import SearchBar from '@/components/common/SearchBar';
import Tabs from '@/components/common/Tabs';
import CourseCardSkeleton from '@/components/skeleton/CourseCardSkeleton';
import TestCard from '@/features/test/components/TestCard';

export default function TestCatalog() {
  const dispatch = useDispatch();
  const { tests, loading } = useSelector(state => state.tests);
  const { examCategories } = useSelector(state => state.categories);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    dispatch(fetchTests());
    dispatch(fetchExamCategories());
  }, [dispatch]);

  const filteredTests = tests.filter(t => {
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'all' || t.category === activeCategory;
    return matchSearch && matchCat;
  });

  const categoryTabs = [
    { key: 'all', label: 'All Tests' },
    ...examCategories.slice(0, 6).map(c => ({ key: c.name || c._id, label: c.name })),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="section-title">Test Series</h1>
        <p className="section-subtitle">Practice with the most comprehensive test series</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchBar value={search} onChange={setSearch} placeholder="Search tests..." className="flex-1" />
      </div>

      <Tabs tabs={categoryTabs} activeTab={activeCategory} onChange={setActiveCategory} className="mb-6" />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <CourseCardSkeleton count={6} />
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">No tests found</h3>
          <p className="text-dark-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map(test => (
            <TestCard key={test._id} test={test} />
          ))}
        </div>
      )}
    </div>
  );
}
