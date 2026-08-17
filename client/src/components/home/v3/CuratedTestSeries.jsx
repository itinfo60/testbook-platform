import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '@/services/api';
import { HiArrowRight, HiClipboardList, HiGlobe, HiQuestionMarkCircle } from 'react-icons/hi';
import { Link } from 'react-router-dom';

export default function CuratedTestSeries() {
  const navigate = useNavigate();
  const [testSeriesList, setTestSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeriesData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/test-series', { params: { limit: 4 } });
        const list = res.data?.data?.testSeries || res.data?.testSeries || res.data?.data || [];
        if (Array.isArray(list)) {
          setTestSeriesList(list.slice(0, 4));
        }
      } catch {
        setTestSeriesList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSeriesData();
  }, []);

  return (
    <section className="py-20 bg-[#faf9f6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-accent-600 mb-2">
              State-Ranked Mock Papers
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-extrabold text-navy-950 tracking-tight">
              Test Series Built for Exam Day
            </h2>
            <p className="text-base sm:text-lg text-navy-600 mt-2">
              Full-length tests, official PYQ solutions & chapter practice with instant state
              ranking and percentile breakdown.
            </p>
          </div>

          <Link
            to="/tests"
            className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-navy-950 hover:text-accent-600 transition-colors border-b-2 border-navy-200 hover:border-accent-600 pb-1 whitespace-nowrap self-start md:self-auto"
          >
            View All Test Series <HiArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Test Series Cards Grid - Matching TestSeriesCatalog style */}
        {!loading && testSeriesList.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-navy-100">
            <h3 className="text-xl font-bold text-navy-900">No test series available</h3>
            <p className="text-navy-600 mt-2">Check back later for new state-ranked mock papers.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {testSeriesList.map((series, idx) => (
              <div
                key={series._id || idx}
                onClick={() => navigate(`/test-series/${series.slug || series._id}`)}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 border border-navy-100 transition-all flex flex-col justify-between group cursor-pointer"
              >
                {/* Top Accent Gradient Bar */}
                <div
                  className={`h-1.5 bg-gradient-to-r ${
                    series.isFree
                      ? 'from-emerald-400 to-teal-500'
                      : 'from-amber-500 via-orange-500 to-rose-500'
                  }`}
                />

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-black text-navy-950 leading-snug line-clamp-2 mb-2 group-hover:text-accent-600 transition-colors font-display">
                      {series.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-navy-600 line-clamp-2 mb-4 leading-relaxed">
                      {series.description ||
                        'Complete chapter tests, full-length mocks, and previous year papers with instant solutions.'}
                    </p>
                  </div>

                  {/* Specs Box - 2 Rows */}
                  <div className="space-y-2 text-xs font-bold text-navy-600 mb-2 bg-[#faf9f6] p-3 rounded-2xl border border-navy-100">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-accent-600">
                        <HiClipboardList className="h-4 w-4" />
                        {series.testsCount || 0} Tests
                      </span>
                      <span className="flex items-center gap-1.5 text-indigo-600">
                        <HiQuestionMarkCircle className="h-4 w-4" />
                        {series.questionsCount || 0}+ Qs
                      </span>
                    </div>
                    <div className="pt-2 border-t border-navy-100/80 flex items-center justify-between text-[11px] text-navy-500">
                      <span className="flex items-center gap-1 text-emerald-600 font-bold">
                        <HiGlobe className="h-3.5 w-3.5" /> Bilingual (En / Hi)
                      </span>
                      <span className="text-navy-400 font-semibold">Instant Solution</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Strip */}
                <div className="px-6 py-4 bg-[#faf9f6] border-t border-navy-100 flex items-center justify-between">
                  <div>
                    {series.isFree || series.price === 0 ? (
                      <span className="text-sm font-black text-emerald-600">100% FREE</span>
                    ) : (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-navy-950 font-display">
                          ₹{series.price}
                        </span>
                        {series.discountPrice > series.price && (
                          <span className="text-xs text-navy-400 line-through">
                            ₹{series.discountPrice}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-navy-950 group-hover:text-accent-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                    Explore Series <HiArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))}
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[400px] bg-slate-100 animate-pulse rounded-3xl"></div>
              ))}
          </div>
        )}

        {/* Bottom Centered View All Link */}
        {!loading && (
          <div className="mt-12 text-center">
            <Link
              to="/tests"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white hover:bg-navy-50 text-navy-950 border border-navy-200 hover:border-navy-300 rounded-full font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all"
            >
              View All Test Series <HiArrowRight className="h-4 w-4 text-accent-500" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
