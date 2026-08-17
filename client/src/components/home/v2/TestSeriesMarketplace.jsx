import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { HiArrowRight, HiClipboardList } from 'react-icons/hi';
import { testSeriesAPI } from '@/services/api';
import { useExamCategories } from '@/services/categories';

export default function TestSeriesMarketplace() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const { categories } = useExamCategories();

  // Build tabs from root-level exam categories + "All"
  const tabs = [
    'All',
    ...categories
      .filter((c) => !c.parent)
      .slice(0, 6)
      .map((c) => c.name),
  ];

  useEffect(() => {
    testSeriesAPI
      .getAll({ limit: 12, isPublished: true })
      .then((res) => {
        const data = res.data?.data?.testSeries || res.data?.testSeries || res.data?.data || [];
        setSeries(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    activeTab === 'All' ? series : series.filter((s) => s.examCategory?.name === activeTab);

  if (!loading && series.length === 0) return null;

  return (
    <section className="py-20 bg-navy-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-navy-900 mb-4 tracking-tight">
            Train Topic by Topic. Then Test Yourself at Full Strength.
          </h2>
        </div>

        {/* Filter Tabs */}
        {tabs.length > 1 && (
          <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-12 justify-center pb-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  activeTab === tab
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'bg-white text-navy-600 border border-navy-200 hover:bg-navy-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* Cards */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-56 bg-white rounded-xl animate-pulse border border-navy-100"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-navy-500">
            <HiClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No test series available yet.</p>
            <p className="text-sm mt-1">Check back soon for new mock test series.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((s) => (
              <div
                key={s._id}
                className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col h-full"
              >
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">
                      {s.examCategory?.name || 'General'}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                        s.price === 0 ? 'bg-green-100 text-green-700' : 'bg-navy-100 text-navy-700'
                      }`}
                    >
                      {s.price === 0 ? 'Free' : 'Premium'}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-navy-900 mb-2 leading-tight">{s.title}</h3>
                  {s.description && (
                    <p className="text-sm text-navy-600 mb-6 flex-grow line-clamp-2">
                      {s.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-sm font-medium text-navy-700 mb-6 bg-navy-50 w-fit px-3 py-1.5 rounded-md">
                    <HiClipboardList className="text-navy-400" />
                    {s.tests?.length || s.testCount || 0} Tests
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-navy-100 mt-auto">
                    <p className="text-lg font-bold text-navy-900">
                      {s.price > 0 ? `₹${s.price}` : 'Free'}
                    </p>
                    <Link
                      to={`/test-series/${s.slug || s._id}`}
                      className="text-sm font-semibold text-white bg-accent-600 hover:bg-accent-700 px-4 py-2 rounded transition-colors flex items-center gap-1"
                    >
                      Start Series <HiArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            to="/test-series"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-navy-50 text-navy-900 border border-navy-200 rounded-full font-bold text-sm transition-all"
          >
            View All Test Series <HiArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
