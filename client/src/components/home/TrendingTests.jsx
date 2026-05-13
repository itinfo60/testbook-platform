import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';

const TrendingTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await api.get('/tests?limit=6&sort=-attemptCount');
        setTests(res.data?.data || res.data || []);
      } catch (err) {
        console.error('Failed to fetch tests:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  if (loading) return <div className="text-center py-8">Loading tests...</div>;
  if (!tests.length) return null;

  // ✅ Helper to safely get category name
  const getCategoryName = (category) => {
    if (!category) return 'General';
    if (typeof category === 'object') return category.name || 'General';
    return category; // it's already a string
  };

  // ✅ Helper to safely get instructor name
  const getInstructorName = (instructor) => {
    if (!instructor) return 'Unknown';
    if (typeof instructor === 'object') return instructor.name || 'Unknown';
    return instructor;
  };

  return (
    <section className="py-12 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">🔥 Trending Tests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <Link
              key={test._id}
              to={`/tests/${test._id}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {getCategoryName(test.category)}  {/* ✅ FIXED */}
                </span>
                <span className="text-xs text-gray-500">
                  {test.duration} min
                </span>
              </div>

              <h3 className="font-semibold text-lg mb-2">{test.title}</h3>
              
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                {test.description}
              </p>

              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{test.questions?.length || 0} Questions</span>
                <span>{test.totalMarks} Marks</span>
              </div>

              <div className="flex justify-between items-center mt-3 pt-3 border-t">
                <span className="text-xs text-gray-400">
                  {test.attemptCount?.toLocaleString() || 0} attempts
                </span>
                <span className={`text-xs font-semibold ${
                  test.isFree ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {test.isFree ? 'FREE' : `₹${test.price}`}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingTests;