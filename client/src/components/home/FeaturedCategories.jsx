import { useEffect } from 'react';
import CategoryCard from '@/features/course/components/CategoryCard';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExamCategories } from '@/features/category/categorySlice';

const defaultCategories = [
  { _id: '1', name: 'Banking', slug: 'banking', icon: '🏦', courseCount: 120 },
  { _id: '2', name: 'SSC', slug: 'ssc', icon: '🏛️', courseCount: 95 },
  { _id: '3', name: 'Railways', slug: 'railways', icon: '🚂', courseCount: 75 },
  { _id: '4', name: 'UPSC', slug: 'upsc', icon: '📜', courseCount: 60 },
  { _id: '5', name: 'State PSC', slug: 'state-psc', icon: '🏢', courseCount: 85 },
  { _id: '6', name: 'Teaching', slug: 'teaching', icon: '📖', courseCount: 45 },
  { _id: '7', name: 'Defence', slug: 'defence', icon: '🎖️', courseCount: 55 },
  { _id: '8', name: 'Engineering', slug: 'engineering', icon: '⚙️', courseCount: 70 },
];

export default function FeaturedCategories() {
  const dispatch = useDispatch();
  const { examCategories } = useSelector(state => state.categories);

  useEffect(() => {
    dispatch(fetchExamCategories());
  }, [dispatch]);

  const categories = examCategories.length > 0 ? examCategories : defaultCategories;

  return (
    <section id="categories" className="py-16 bg-dark-50 dark:bg-dark-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="section-title">Explore by Category</h2>
          <p className="section-subtitle">Choose from top exam categories and start preparing today</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.slice(0, 8).map(cat => (
            <CategoryCard key={cat._id} category={cat} />
          ))}
        </div>
      </div>
    </section>
  );
}
