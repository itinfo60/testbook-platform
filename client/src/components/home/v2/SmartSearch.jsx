import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiSearch } from 'react-icons/hi';
import { useExamCategories } from '@/services/categories';

export default function SmartSearch() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { categories } = useExamCategories();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleChipClick = (term) => {
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  // Use root-level exam category names as popular searches (up to 6)
  const popularSearches = categories
    .filter((c) => !c.parent)
    .slice(0, 6)
    .map((c) => c.name);

  return (
    <section className="bg-white py-12 relative -mt-8 z-20 mx-4 sm:mx-6 lg:mx-8 rounded-2xl shadow-xl shadow-navy-900/5 max-w-5xl xl:mx-auto border border-navy-50">
      <div className="px-6 sm:px-10 text-center">
        <h2 className="text-2xl font-display font-bold text-navy-900 mb-6">
          What are you preparing for?
        </h2>

        <form
          onSubmit={handleSearch}
          className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3 mb-6"
        >
          <div className="relative flex-1">
            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-navy-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses, tests, subjects..."
              className="w-full pl-12 pr-4 py-4 bg-navy-50 border border-navy-100 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all placeholder:text-navy-400"
            />
          </div>
          <button
            type="submit"
            className="bg-navy-900 text-white font-semibold px-8 py-4 rounded-xl hover:bg-navy-800 transition-all sm:w-auto w-full"
          >
            Explore
          </button>
        </form>

        {popularSearches.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            <span className="text-sm font-medium text-navy-500 mr-2">Popular searches:</span>
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => handleChipClick(term)}
                className="text-xs font-medium text-navy-700 bg-navy-50 border border-navy-100 px-3 py-1.5 rounded-full hover:bg-accent-50 hover:text-accent-700 hover:border-accent-200 transition-all cursor-pointer"
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
