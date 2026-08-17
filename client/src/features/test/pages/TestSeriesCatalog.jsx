import SeoHead from '@/components/SeoHead';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HiSearch,
  HiClipboardList,
  HiQuestionMarkCircle,
  HiArrowRight,
  HiArrowLeft,
  HiSparkles,
  HiUsers,
  HiAcademicCap,
  HiGlobe,
  HiChevronRight,
  HiX,
  HiLightningBolt,
  HiFire,
  HiCheckCircle,
  HiCollection,
} from 'react-icons/hi';
import api from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function TestSeriesCatalog() {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [testSeriesList, setTestSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all'); // 'all', or category ID
  const [selectedExam, setSelectedExam] = useState(null);
  const [examTestSeries, setExamTestSeries] = useState([]);
  const [loadingExamSeries, setLoadingExamSeries] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catRes, seriesRes] = await Promise.all([
          api.get('/categories'),
          api.get('/test-series', { params: { limit: 100 } }),
        ]);

        const catData =
          catRes.data?.categories || catRes.data?.data?.categories || catRes.data?.data || [];
        let cats = Array.isArray(catData) ? catData : [];
        const seen = new Set();
        cats = cats.filter((c) => {
          const id = c._id || c.slug;
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        setCategories(cats);

        const seriesData = seriesRes.data?.data?.testSeries || seriesRes.data?.testSeries || [];
        setTestSeriesList(Array.isArray(seriesData) ? seriesData : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load test series');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (location.state?.filterExam && categories.length > 0) {
      handleSelectExam(location.state.filterExam);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, categories]);

  // Handle Exam Selection -> Directly show all Test Series for that exam
  const handleSelectExam = async (exam) => {
    setSelectedExam(exam);
    try {
      setLoadingExamSeries(true);
      const res = await api.get('/test-series', {
        params: { examCategory: exam._id || exam.slug, limit: 30 },
      });
      const list = res.data?.data?.testSeries || res.data?.testSeries || [];
      if (Array.isArray(list)) {
        setExamTestSeries(list);
      }
    } catch (err) {
      console.error(err);
      setExamTestSeries([]);
    } finally {
      setLoadingExamSeries(false);
    }
  };

  const clearExamFilter = () => {
    setSelectedExam(null);
    setExamTestSeries([]);
  };

  // Flatten all exams under categories
  const allExamsList = categories.flatMap((cat) => {
    if (cat.subcategories && cat.subcategories.length > 0) {
      return cat.subcategories.map((sub) => ({ ...sub, parentCategory: cat }));
    }
    return [{ ...cat, parentCategory: cat }];
  });

  // Filter exams based on left selection
  const displayedExams = allExamsList.filter((exam) => {
    if (activeCategoryFilter === 'all') return true;
    return (
      exam.parentCategory?._id === activeCategoryFilter ||
      exam.parentCategory?.slug === activeCategoryFilter ||
      exam._id === activeCategoryFilter ||
      exam.slug === activeCategoryFilter
    );
  });

  const filteredDisplayList = searchQuery
    ? testSeriesList.filter(
        (s) =>
          s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : testSeriesList;

  const freeList = testSeriesList.filter((s) => s.isFree || s.price === 0);

  /* ─── Test Series Card ─── */
  const renderSeriesCard = (series) => (
    <div
      key={series._id || series.slug}
      onClick={() => navigate(`/test-series/${series.slug || series._id}`)}
      className="group relative bg-white dark:bg-dark-900 rounded-3xl border border-dark-100 dark:border-dark-800 hover:border-primary-400 dark:hover:border-primary-500 transition-all duration-300 cursor-pointer overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
    >
      <div
        className={`h-1.5 bg-gradient-to-r ${
          series.isFree
            ? 'from-emerald-400 to-teal-500'
            : 'from-primary-500 via-indigo-500 to-purple-600'
        }`}
      />
      <div className="p-6">
        <h3 className="text-base sm:text-lg font-black text-dark-900 dark:text-white leading-snug line-clamp-2 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors font-display">
          {series.title}
        </h3>

        <p className="text-xs text-dark-500 dark:text-dark-400 line-clamp-2 mb-4 leading-relaxed">
          {series.description ||
            'Complete chapter tests, full-length mocks, and previous year papers with instant solutions.'}
        </p>

        {/* Specs Box - 2 Rows Multiline */}
        <div className="space-y-2 text-xs font-bold text-dark-600 dark:text-dark-300 mb-4 bg-dark-50 dark:bg-dark-800/60 p-3.5 rounded-2xl border border-dark-100 dark:border-dark-700/50">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400">
              <HiClipboardList className="h-4 w-4" />
              {series.testsCount || 0} Tests
            </span>
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <HiQuestionMarkCircle className="h-4 w-4" />
              {series.questionsCount || 0}+ Qs
            </span>
          </div>
          <div className="pt-2 border-t border-dark-100 dark:border-dark-700/60 flex items-center justify-between text-[11px] text-dark-500 dark:text-dark-400">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <HiGlobe className="h-3.5 w-3.5" /> Bilingual (En / Hi)
            </span>
            <span className="font-semibold text-dark-400">Instant Solution</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-dark-50/60 dark:bg-dark-800/40 border-t border-dark-100 dark:border-dark-800 flex items-center justify-between">
        <div>
          {series.isPurchased || series.isEnrolled ? (
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              Enrolled
            </span>
          ) : series.isFree || series.price === 0 ? (
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              100% FREE
            </span>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-dark-900 dark:text-white">
                ₹{series.price}
              </span>
              {series.discountPrice > series.price && (
                <span className="text-xs text-dark-400 line-through">₹{series.discountPrice}</span>
              )}
            </div>
          )}
        </div>
        <span className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1 group-hover:gap-2 transition-all">
          Explore Series <HiArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-50/50 dark:bg-dark-950">
      <SeoHead
        title="Mock Test Series — RPSC, RAS, RJS & Political Science"
        description="Take proctored mock tests for RPSC RAS Prelims & Mains, RJS, EO/RO, and Political Science. Full-length tests, PYQ papers, and topic-wise practice."
      />
      {/* ════════ HERO ════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-indigo-800 to-dark-900">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs font-extrabold mb-4 border border-white/10">
                <HiLightningBolt className="h-3.5 w-3.5 text-amber-300" /> {testSeriesList.length}+
                Test Series · {allExamsList.length} Exams
              </div>
              <h1 className="text-3xl md:text-5xl font-black font-display text-white tracking-tight">
                Online Mock Test Series
              </h1>
              <p className="text-primary-100/90 mt-2 text-sm md:text-base max-w-xl leading-relaxed">
                Practice chapter-wise tests, state-level mock exams, and previous year papers with
                instant All India Rank & detailed step-by-step solutions.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (selectedExam) clearExamFilter();
                }}
                placeholder="Search test series, RAS, PGT..."
                className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-dark-800 rounded-2xl text-sm font-medium shadow-xl shadow-black/10 focus:outline-none focus:ring-2 focus:ring-primary-400 text-dark-900 dark:text-white placeholder-dark-400 border-0"
              />
            </div>
          </div>

          {/* Stats Badges */}
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            {[
              { val: `${testSeriesList.length}+`, label: 'Test Series' },
              { val: `${allExamsList.length}`, label: 'Exams' },
              { val: `${freeList.length}`, label: 'Free Sets' },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/10 text-center"
              >
                <div className="text-lg font-black text-white">{s.val}</div>
                <div className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ BROWSE BY EXAM (SPLIT PANE BROWSER) ════════ */}
      {!selectedExam && !searchQuery && (
        <section className="bg-white dark:bg-dark-900 border-b border-dark-100 dark:border-dark-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-dark-900 dark:text-white flex items-center gap-2">
                <HiAcademicCap className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                Select Category to Explore Exam Test Series
              </h2>
              <p className="text-xs sm:text-sm text-dark-500 dark:text-dark-400 mt-1">
                Select a category on the left to view exams on the right.
              </p>
            </div>

            <div className="flex flex-col md:flex-row border border-dark-200 dark:border-dark-700/80 rounded-3xl overflow-hidden bg-white dark:bg-dark-900 shadow-sm">
              {/* Left Pane: Categories Selector */}
              <div className="md:w-72 flex-shrink-0 border-b md:border-b-0 md:border-r border-dark-200 dark:border-dark-700 bg-dark-50/70 dark:bg-dark-800/40 p-2 space-y-1">
                {/* 1. All Exams Option */}
                <button
                  onClick={() => setActiveCategoryFilter('all')}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                    activeCategoryFilter === 'all'
                      ? 'bg-white dark:bg-dark-800 shadow-md text-primary-600 dark:text-primary-400 font-extrabold border-l-4 border-primary-500'
                      : 'text-dark-600 dark:text-dark-300 font-semibold hover:bg-dark-100/60 dark:hover:bg-dark-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🌟</span>
                    <span className="text-sm">All Exams</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-dark-100 dark:bg-dark-700 text-dark-500">
                    {allExamsList.length}
                  </span>
                </button>

                {/* 2. Dynamic Categories from DB (Rajasthan Specific, Political Science Special, etc.) */}
                {categories.map((cat) => {
                  const isSelected =
                    activeCategoryFilter === cat._id || activeCategoryFilter === cat.slug;
                  const count = cat.subcategories?.length || 1;
                  return (
                    <button
                      key={cat._id}
                      onClick={() => setActiveCategoryFilter(cat._id)}
                      className={`w-full text-left px-4 py-3.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white dark:bg-dark-800 shadow-md text-primary-600 dark:text-primary-400 font-extrabold border-l-4 border-primary-500'
                          : 'text-dark-600 dark:text-dark-300 font-semibold hover:bg-dark-100/60 dark:hover:bg-dark-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl shrink-0">{cat.icon || '📂'}</span>
                        <span className="text-sm line-clamp-1">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-dark-100 dark:bg-dark-700 text-dark-500">
                          {count}
                        </span>
                        <HiChevronRight
                          className={`h-4 w-4 ${isSelected ? 'text-primary-500' : 'text-dark-400'}`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Pane: Exams Grid */}
              <div className="flex-1 p-6 md:p-8 max-h-[480px] overflow-y-auto bg-white dark:bg-dark-900">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-dark-400">
                    Available Exams ({displayedExams.length})
                  </span>
                </div>

                {displayedExams.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {displayedExams.map((exam) => (
                      <button
                        key={exam._id || exam.slug}
                        onClick={() => handleSelectExam(exam)}
                        className="flex items-center justify-between p-4 bg-dark-50/70 dark:bg-dark-800/60 border border-dark-200/80 dark:border-dark-700/60 rounded-2xl hover:border-primary-500 hover:bg-white dark:hover:bg-dark-800 hover:shadow-md transition-all cursor-pointer group text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-11 w-11 rounded-2xl bg-primary-100/80 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center text-lg font-black flex-shrink-0 group-hover:scale-105 transition-transform">
                            {exam.icon || exam.name?.charAt(0) || '📝'}
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-extrabold text-dark-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors block truncate">
                              {exam.name}
                            </span>
                            <span className="text-[11px] text-dark-400 dark:text-dark-500 block truncate">
                              {exam.parentCategory?.name || 'Exam'}
                            </span>
                          </div>
                        </div>
                        <HiChevronRight className="h-4 w-4 text-dark-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <span className="text-4xl mb-2 block opacity-40">📚</span>
                    <p className="text-sm font-bold text-dark-600 dark:text-dark-400">
                      No exams listed under this category.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════════ ACTIVE EXAM FILTER BAR (Once an Exam is Clicked) ════════ */}
      {selectedExam && (
        <section className="bg-white dark:bg-dark-900 border-b border-dark-100 dark:border-dark-800 sticky top-16 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold text-dark-400 uppercase tracking-wider hidden sm:inline">
                Filtered By:
              </span>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-dark-700 dark:text-dark-300 truncate">
                <span>{selectedExam.parentCategory?.name || 'Exams'}</span>
                <HiChevronRight className="h-3.5 w-3.5 text-dark-400 flex-shrink-0" />
                <span className="text-primary-600 dark:text-primary-400 truncate">
                  {selectedExam.name}
                </span>
              </div>
              <span className="text-xs font-extrabold text-primary-700 bg-primary-50 dark:bg-primary-950 px-2.5 py-0.5 rounded-full">
                {examTestSeries.length} Series
              </span>
            </div>

            <button
              onClick={clearExamFilter}
              className="text-xs font-bold text-dark-500 hover:text-red-500 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dark-200 dark:border-dark-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer flex-shrink-0"
            >
              <HiX className="h-3.5 w-3.5" /> Change Exam
            </button>
          </div>
        </section>
      )}

      {/* ════════ MAIN CONTENT ════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {error ? (
          <div className="text-center py-16 text-red-500 font-semibold">{error}</div>
        ) : selectedExam ? (
          /* ── Test Series specifically for selected exam ── */
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-dark-900 dark:text-white">
                {selectedExam.name} Test Series & Mock Tests
              </h2>
              <p className="text-xs sm:text-sm text-dark-500 mt-1">
                Select a test series package below to view topic-wise tests, full mocks & previous
                papers.
              </p>
            </div>

            {loadingExamSeries ? (
              <div className="py-20 flex justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : examTestSeries.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-dark-900 rounded-3xl border border-dashed border-dark-200 dark:border-dark-800 p-8">
                <div className="h-16 w-16 mx-auto bg-dark-100 dark:bg-dark-800 rounded-full flex items-center justify-center mb-4 text-2xl">
                  📝
                </div>
                <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-1">
                  No dedicated test series found for {selectedExam.name}
                </h3>
                <p className="text-xs text-dark-500 mb-6 max-w-sm mx-auto">
                  Our faculty is uploading new test sets for this exam. You can explore all
                  available series below.
                </p>
                <button
                  onClick={clearExamFilter}
                  className="btn-primary text-xs font-bold px-5 py-2.5"
                >
                  View All Test Series
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {examTestSeries.map(renderSeriesCard)}
              </div>
            )}
          </div>
        ) : searchQuery ? (
          /* ── Search Results ── */
          <>
            <h2 className="text-lg font-bold text-dark-900 dark:text-white mb-5">
              Results for "{searchQuery}"{' '}
              <span className="text-dark-400 font-normal text-sm">
                ({filteredDisplayList.length})
              </span>
            </h2>
            {filteredDisplayList.length === 0 ? (
              <div className="text-center py-20">
                <div className="h-20 w-20 mx-auto bg-dark-100 dark:bg-dark-800 rounded-full flex items-center justify-center mb-5">
                  <HiSearch className="h-8 w-8 text-dark-300" />
                </div>
                <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-1">No results</h3>
                <p className="text-sm text-dark-500">Try a different search term.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDisplayList.map(renderSeriesCard)}
              </div>
            )}
          </>
        ) : (
          /* ── Default Catalog Sections ── */
          <div className="space-y-12">
            {/* Popular Test Series */}
            {testSeriesList.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-md">
                    <HiFire className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-dark-900 dark:text-white">
                      Popular Online Test Series
                    </h2>
                    <p className="text-xs text-dark-500">
                      Highest enrolled test series by top aspirants
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {testSeriesList.slice(0, 8).map(renderSeriesCard)}
                </div>
              </div>
            )}

            {/* Free Test Series */}
            {freeList.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                    <HiSparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-dark-900 dark:text-white">
                      100% Free Test Series & Mock Tests
                    </h2>
                    <p className="text-xs text-dark-500">
                      Experience our proctored exam engine at zero cost
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {freeList.slice(0, 8).map(renderSeriesCard)}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
