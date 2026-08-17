import SeoHead from '@/components/SeoHead';
import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HiClipboardList,
  HiQuestionMarkCircle,
  HiChevronDown,
  HiChevronUp,
  HiCheckCircle,
  HiSparkles,
  HiGlobe,
  HiShare,
  HiLightningBolt,
  HiAcademicCap,
  HiLockClosed,
  HiCheck,
  HiUsers,
  HiArrowRight,
  HiShieldCheck,
  HiHeart,
  HiGift,
  HiBookOpen,
  HiPlay,
} from 'react-icons/hi';
import api from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import TestItemCard from '../components/TestItemCard';

export default function TestSeriesDetail() {
  const { seriesSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Level 1: Main Tab ('Mock Tests' vs 'PYPs')
  const [activeMainTab, setActiveMainTab] = useState('Mock Tests');

  // Level 2: Section Tab (e.g. 'Chapter Tests (GS)', 'पधारो म्हारे देस (Rajasthan GK)', etc.)
  const [activeSection, setActiveSection] = useState(null);

  // Level 3: Subject / Topic Filter within that section ('All', 'Polity of India', etc.)
  const [activeTopicFilter, setActiveTopicFilter] = useState('All');

  // Level 4: Visible Count for pagination
  const [visibleCount, setVisibleCount] = useState(10);

  const [copiedToast, setCopiedToast] = useState(false);
  const [moreSeriesList, setMoreSeriesList] = useState([]);

  useEffect(() => {
    const fetchSeriesDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const [res, moreRes] = await Promise.all([
          api.get(`/test-series/${seriesSlug}`),
          api.get('/test-series', { params: { limit: 4 } }).catch(() => ({ data: { data: [] } })),
        ]);

        const data = res.data?.data?.testSeries || res.data?.testSeries;
        if (data) {
          setSeries(data);
        } else {
          setError('Test Series package not found');
        }

        const more = moreRes.data?.data?.testSeries || moreRes.data?.testSeries || [];
        setMoreSeriesList(Array.isArray(more) ? more.filter((s) => s.slug !== seriesSlug) : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load test series details');
      } finally {
        setLoading(false);
      }
    };
    fetchSeriesDetail();
  }, [seriesSlug]);

  // Reset pagination & topic filter when main tab or section changes
  useEffect(() => {
    setActiveTopicFilter('All');
    setVisibleCount(10);
  }, [activeMainTab, activeSection]);

  const finalPrice = Number(series?.price) || 0;
  const isEnrolled = Boolean(
    series?.isPurchased || series?.isEnrolled || series?.isFree || finalPrice === 0
  );

  const handlePrimaryAction = () => {
    if (isEnrolled) {
      const el = document.getElementById('tests-main-container');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    navigate(`/checkout/${series._id}?type=test_series`);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    }
  };

  // ════════ DYNAMIC TESTS TAXONOMY & SYNTHESIS ════════
  // We structure all tests into Level 1 (Mock Tests vs PYPs), Level 2 (Sections), Level 3 (Topics), and Level 4 (Tests)
  const categorizedData = useMemo(() => {
    if (!series) return { mockSections: [], pypSections: [], allTests: [] };

    const rawTests = series.tests || [];

    const mockSections = [];
    const pypSections = [];

    rawTests.forEach((t) => {
      const sec = t.sectionName || 'Practice Tests';
      const isPyp = t.categoryTag === 'PYPs' || t.testType === 'pyq';
      const target = isPyp ? pypSections : mockSections;
      let existing = target.find((s) => s.sectionName.toLowerCase() === sec.toLowerCase());
      if (!existing) {
        existing = {
          id: `${isPyp ? 'pyp' : 'mock'}-${sec.replace(/\s+/g, '-').toLowerCase()}`,
          sectionName: sec,
          isPyp,
          count: 0,
          topics: ['All'],
          tests: [],
        };
        target.push(existing);
      }
      existing.tests.push(t);
      existing.count = existing.tests.length;
      if (t.subjectTag && !existing.topics.includes(t.subjectTag)) {
        existing.topics.push(t.subjectTag);
      }
    });

    return {
      mockSections,
      pypSections,
      allTests: rawTests,
    };
  }, [series]);

  // Active section list based on main tab
  const currentSections =
    activeMainTab === 'Mock Tests' ? categorizedData.mockSections : categorizedData.pypSections;

  // Selected section object
  const currentSectionObj =
    currentSections.find((s) => s.sectionName === activeSection) || currentSections[0] || null;

  // Set default active section once loaded
  useEffect(() => {
    if (
      currentSections.length > 0 &&
      (!activeSection || !currentSections.some((s) => s.sectionName === activeSection))
    ) {
      setActiveSection(currentSections[0].sectionName);
    }
  }, [activeMainTab, currentSections, activeSection]);

  // Filtered tests in active section
  const sectionFilteredTests = useMemo(() => {
    if (!currentSectionObj) return [];
    const tests = currentSectionObj.tests || [];
    if (activeTopicFilter === 'All') return tests;
    return tests.filter((t) => t.subjectTag === activeTopicFilter);
  }, [currentSectionObj, activeTopicFilter]);

  // Paginated tests slice
  const displayedTests = sectionFilteredTests.slice(0, visibleCount);
  const hasMoreTests = sectionFilteredTests.length > visibleCount;

  // Total counts for header
  const totalMockCount = categorizedData.mockSections.reduce((acc, s) => acc + s.count, 0);
  const totalPypCount = categorizedData.pypSections.reduce((acc, s) => acc + s.count, 0);
  const grandTotalTests = totalMockCount + totalPypCount;

  // Free tests in this series
  const freeTestsInSeries = useMemo(() => {
    const free = [];
    [...categorizedData.mockSections, ...categorizedData.pypSections].forEach((sec) => {
      sec.tests.forEach((t) => {
        if (t.isFree && !free.some((f) => f.title === t.title)) free.push(t);
      });
    });
    return free;
  }, [categorizedData]);

  if (loading) {
    return (
      <div className="min-h-screen py-20 flex justify-center items-center bg-dark-50 dark:bg-dark-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="min-h-screen bg-dark-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-slate-950 rounded-3xl shadow-premium max-w-md w-full mx-4">
          <div className="h-20 w-20 mx-auto bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-5">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">Not Found</h2>
          <p className="text-dark-500 mb-6">{error || 'Test series package not found'}</p>
          <Link
            to="/test-series"
            className="block w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all"
          >
            Browse Test Series
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-50/50 dark:bg-dark-950 pb-24 text-dark-900 dark:text-dark-100">
      <SeoHead
        title={`${series?.title || 'Test Series'} — Mock Tests & PYQs`}
        description={`Attempt ${series?.title || 'this test series'} with detailed solutions, performance analytics, and leaderboard.`}
        type="product"
      />
      {/* Toast Notification */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white text-sm font-bold px-5 py-3.5 rounded-2xl shadow-premium flex items-center gap-2 border border-slate-800 animate-slide-up">
          <HiCheckCircle className="h-5 w-5 text-emerald-400" /> Link Copied to Clipboard!
        </div>
      )}

      {/* ════════ HERO & BREADCRUMB ════════ */}
      <section className="bg-gradient-to-b from-[#0e172a] via-[#111e3b] to-[#0b1329] text-white pt-8 pb-14 lg:pt-10 lg:pb-20 relative overflow-hidden shadow-premium">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-600/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumbs */}
          <nav className="flex flex-wrap items-center gap-2 text-xs font-medium text-primary-200/80 mb-4">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link to="/test-series" className="hover:text-white transition-colors">
              Test Series
            </Link>
            <span>/</span>
            <span className="text-white truncate max-w-xs">{series.title}</span>
          </nav>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display tracking-tight text-white mb-3 leading-tight">
                {series.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3.5 text-xs font-medium text-primary-200/90 mb-5">
                <span>
                  Last updated on{' '}
                  {new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span>•</span>
                <span className="text-amber-300 font-semibold">⭐ 4.8 Rating</span>
                <span>•</span>
                <span className="text-white font-semibold">{grandTotalTests} Total Tests</span>
                <span>•</span>
                <span className="text-emerald-300 font-semibold">
                  {freeTestsInSeries.length || 1} Free Tests
                </span>
                <span>•</span>
                <span>21.2k Users</span>
                <span>•</span>
                <span>English, Hindi</span>
              </div>

              {/* Action Buttons for Mobile */}
              <div className="flex items-center gap-3 lg:hidden mt-6">
                <button
                  onClick={handlePrimaryAction}
                  className={`flex-1 ${
                    isEnrolled
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  } font-semibold py-3.5 px-6 rounded-2xl shadow-premium transition-all duration-300 text-center text-sm cursor-pointer flex items-center justify-center gap-2`}
                >
                  {isEnrolled ? (
                    <>
                      <HiCheckCircle className="h-5 w-5" /> Start Practicing
                    </>
                  ) : series.isFree || finalPrice === 0 ? (
                    'Start Free Tests'
                  ) : (
                    `Unlock Now for ₹${finalPrice}`
                  )}
                </button>
                <button
                  onClick={handleShare}
                  className="p-3.5 rounded-2xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all cursor-pointer"
                >
                  <HiShare className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ MAIN CONTENT SECTION ════════ */}
      <section
        id="tests-main-container"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 lg:-mt-10 relative z-20"
      >
        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT: Tests Explorer */}
          <div className="flex-1 min-w-0">
            {/* ── Level 1: Main Category Tabs (Mock Tests vs PYPs) ── */}
            <div className="bg-white dark:bg-slate-950 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-2 mb-5 transition-all duration-300">
              <button
                onClick={() => setActiveMainTab('Mock Tests')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeMainTab === 'Mock Tests'
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/20'
                    : 'text-slate-600 dark:text-dark-400 hover:bg-slate-50 dark:hover:bg-dark-800'
                }`}
              >
                <HiClipboardList className="h-4 w-4" />
                <span>Mock Tests</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    activeMainTab === 'Mock Tests'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-dark-800 text-slate-600'
                  }`}
                >
                  {totalMockCount}
                </span>
              </button>

              <button
                onClick={() => setActiveMainTab('PYPs')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeMainTab === 'PYPs'
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/20'
                    : 'text-slate-600 dark:text-dark-400 hover:bg-slate-50 dark:hover:bg-dark-800'
                }`}
              >
                <HiAcademicCap className="h-4 w-4" />
                <span>PYPs (Previous Papers)</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    activeMainTab === 'PYPs'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-dark-800 text-slate-600'
                  }`}
                >
                  {totalPypCount}
                </span>
              </button>
            </div>

            {/* ── Level 2: Section Tabs / Pills (Blue Highlights only - No Black) ── */}
            <div className="overflow-x-auto pb-2 mb-4 hide-scrollbar">
              <div className="flex gap-2 min-w-max">
                {currentSections.map((sec, idx) => (
                  <button
                    key={sec.id || `${sec.sectionName}-${idx}`}
                    onClick={() => setActiveSection(sec.sectionName)}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                      activeSection === sec.sectionName
                        ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/25'
                        : 'bg-white dark:bg-dark-900 text-slate-600 dark:text-dark-300 border border-slate-200 dark:border-dark-800 hover:border-primary-300 hover:text-primary-600'
                    }`}
                  >
                    <span>{sec.sectionName}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[11px] font-medium ${
                        activeSection === sec.sectionName
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-dark-800 text-slate-600'
                      }`}
                    >
                      {sec.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Level 3: Subject / Topic Filter Chips ── */}
            {currentSectionObj &&
              currentSectionObj.topics &&
              currentSectionObj.topics.length > 1 && (
                <div className="bg-white dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-5 shadow-sm transition-all duration-300">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-2">
                    Filter by Topic:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentSectionObj.topics.map((topic) => (
                      <button
                        key={topic}
                        onClick={() => setActiveTopicFilter(topic)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          activeTopicFilter === topic
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-slate-50 dark:bg-dark-800 text-slate-600 dark:text-dark-300 border border-slate-200 dark:border-dark-700/60 hover:border-primary-300 hover:text-primary-600'
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {/* ── Level 4: Tests Grid & List ── */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-dark-900 dark:text-white flex items-center gap-2">
                  <span>{currentSectionObj?.sectionName}</span>
                  <span className="text-xs font-normal text-slate-600">
                    ({sectionFilteredTests.length} Tests Available)
                  </span>
                </h3>
              </div>

              {displayedTests.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
                  <span className="text-3xl mb-2 block opacity-40">🔍</span>
                  <h4 className="text-sm font-semibold text-dark-900 dark:text-white mb-1">
                    {currentSections.length === 0
                      ? 'No tests available yet.'
                      : `No tests found for "${activeTopicFilter}"`}
                  </h4>
                  <p className="text-xs text-slate-600 mb-3">
                    {currentSections.length === 0
                      ? 'Tests will be added soon by the instructor.'
                      : 'Try selecting another topic filter above.'}
                  </p>
                  {currentSections.length > 0 && (
                    <button
                      onClick={() => setActiveTopicFilter('All')}
                      className="text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-primary-500 text-primary-600 hover:bg-primary-50 transition-colors"
                    >
                      Show All Tests
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {displayedTests.map((test, idx) => {
                    const isLocked =
                      !series.isFree && finalPrice > 0 && !test.isFree && !test.isPurchased;
                    return (
                      <TestItemCard
                        key={(test._id || test.title) + '-' + idx}
                        test={test}
                        isLocked={isLocked}
                        onShare={handleShare}
                        onUnlock={handlePrimaryAction}
                      />
                    );
                  })}
                </div>
              )}

              {/* "View More" Pagination Button */}
              {hasMoreTests && (
                <div className="text-center pt-3">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 10)}
                    className="bg-white dark:bg-dark-900 hover:bg-primary-50 dark:hover:bg-dark-800 border border-primary-500 text-primary-600 dark:text-primary-400 font-semibold px-6 py-2.5 rounded-xl shadow-sm hover:shadow transition-all text-xs cursor-pointer"
                  >
                    View More ({sectionFilteredTests.length - visibleCount} Remaining) ↓
                  </button>
                </div>
              )}
            </div>

            {/* ── More Test Series for You (Cross Sell) ── */}
            {moreSeriesList.length > 0 && (
              <div className="mt-16 pt-8 border-t border-slate-200/60 dark:border-slate-800/60 mb-12">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-dark-900 dark:text-white">
                      More Test Series for You
                    </h3>
                    <p className="text-xs text-slate-600 font-normal">
                      Popular practice packs aligned with your exam goals
                    </p>
                  </div>
                  <Link
                    to="/test-series"
                    className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                  >
                    View All <HiArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {moreSeriesList.slice(0, 4).map((mSeries) => (
                    <Link
                      key={mSeries._id}
                      to={`/test-series/${mSeries.slug || mSeries._id}`}
                      className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary-400 hover:shadow-sm transition-all duration-200 block group"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                        <span className="font-semibold text-primary-600 dark:text-primary-400">
                          {mSeries.examCategory?.name || 'Test Series'}
                        </span>
                        <span>{mSeries.testsCount || 45} Tests</span>
                      </div>
                      <h4 className="text-sm font-semibold text-dark-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-1 mb-1">
                        {mSeries.title}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-2 font-normal">
                        {mSeries.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── Why Take this Test Series ? ── */}
            <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 mb-8 shadow-sm transition-all duration-300">
              <h3 className="text-base sm:text-lg font-bold text-dark-900 dark:text-white mb-5 text-center">
                Why Take This Test Series?
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-xl flex-shrink-0">
                    🏆
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-dark-900 dark:text-white mb-0.5">
                      All India & State Rank
                    </h4>
                    <p className="text-xs text-slate-600 font-normal leading-relaxed">
                      Compete with students across Rajasthan & India with live percentile
                      calculations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-xl flex-shrink-0">
                    🎯
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-dark-900 dark:text-white mb-0.5">
                      Personal Recommendation
                    </h4>
                    <p className="text-xs text-slate-600 font-normal leading-relaxed">
                      Instant feedback and recommendations based on your strong & weak subject
                      areas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-xl flex-shrink-0">
                    💎
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-dark-900 dark:text-white mb-0.5">
                      Expert Quality
                    </h4>
                    <p className="text-xs text-slate-600 font-normal leading-relaxed">
                      Designed by subject faculties. Strictly based on the latest official exam
                      pattern.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-xl flex-shrink-0">
                    🎁
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-dark-900 dark:text-white mb-0.5">
                      Earn Referral Rewards
                    </h4>
                    <p className="text-xs text-slate-600 font-normal leading-relaxed">
                      Invite study peers and unlock special discounts and reward bonuses.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Sticky Sidebar (Desktop) */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-5">
              {/* Purchase Card */}
              <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 transition-all duration-300">
                <div className="mb-5">
                  {isEnrolled ? (
                    <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <HiCheckCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          Status
                        </div>
                        <div className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                          Enrolled • Full Access
                        </div>
                      </div>
                    </div>
                  ) : series.isFree || finalPrice === 0 ? (
                    <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <HiSparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          Access
                        </div>
                        <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                          FREE
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                        Unlock Complete Test Series
                      </div>
                      <div className="flex items-baseline gap-2 mb-1.5">
                        <span className="text-3xl font-bold text-dark-900 dark:text-white">
                          ₹{finalPrice}
                        </span>
                        {series.discountPrice > finalPrice && (
                          <span className="text-sm text-slate-600 line-through">
                            ₹{series.discountPrice}
                          </span>
                        )}
                      </div>
                      {series.discountPrice > finalPrice && (
                        <span className="inline-block px-2 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-semibold rounded-md uppercase tracking-wider">
                          {Math.round(
                            ((series.discountPrice - finalPrice) / series.discountPrice) * 100
                          )}
                          % OFF Today
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Primary Action Button */}
                <div className="space-y-2.5 mb-5">
                  <button
                    onClick={handlePrimaryAction}
                    className={`w-full py-3.5 ${
                      isEnrolled
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-primary-600 hover:bg-primary-700'
                    } text-white font-semibold rounded-xl transition-all duration-300 shadow-sm flex items-center justify-center gap-2 cursor-pointer text-sm`}
                  >
                    {isEnrolled ? (
                      <>
                        <HiPlay className="h-4 w-4" /> Start Practicing Now
                      </>
                    ) : series.isFree || finalPrice === 0 ? (
                      'Start Practicing Now'
                    ) : (
                      'Buy Test Series Now'
                    )}
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-600 dark:text-dark-200 font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-200 dark:border-dark-700 text-xs cursor-pointer"
                  >
                    <HiShare className="h-3.5 w-3.5" /> Share with Friends
                  </button>
                </div>

                {/* Package Highlights */}
                <div className="pt-4 border-t border-slate-100 dark:border-dark-800">
                  <h4 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-3">
                    This Package Includes:
                  </h4>
                  <div className="space-y-2.5 text-xs font-medium text-slate-600 dark:text-dark-300">
                    <div className="flex items-center gap-2">
                      <HiClipboardList className="h-4 w-4 text-primary-500 shrink-0" />
                      <span>{grandTotalTests} Total Tests Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HiQuestionMarkCircle className="h-4 w-4 text-primary-500 shrink-0" />
                      <span>3,500+ Questions with Solutions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HiGlobe className="h-4 w-4 text-primary-500 shrink-0" />
                      <span>Bilingual (English & Hindi Medium)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HiLightningBolt className="h-4 w-4 text-primary-500 shrink-0" />
                      <span>Instant Percentile & State Rank</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HiShieldCheck className="h-4 w-4 text-primary-500 shrink-0" />
                      <span>Unlimited Re-attempt Mode</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ MOBILE STICKY BOTTOM BAR (PURCHASE) ════════ */}
      <div className="fixed bottom-0 left-0 right-0 p-3.5 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shadow-lg lg:hidden z-40">
        <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
          <div>
            {isEnrolled ? (
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <HiCheckCircle className="h-4 w-4 shrink-0" /> Enrolled
              </span>
            ) : series.isFree || finalPrice === 0 ? (
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                100% FREE
              </span>
            ) : (
              <div className="flex flex-col">
                <span className="text-xl font-bold text-dark-900 dark:text-white leading-none">
                  ₹{finalPrice}
                </span>
                {series.discountPrice > finalPrice && (
                  <span className="text-[10px] text-slate-600 line-through mt-0.5">
                    ₹{series.discountPrice}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handlePrimaryAction}
            className={`flex-1 py-3 ${
              isEnrolled
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-primary-600 active:bg-primary-700'
            } text-white font-semibold rounded-xl transition-all duration-300 shadow-sm cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-1.5`}
          >
            {isEnrolled ? (
              <>
                <HiPlay className="h-4 w-4" /> Start Practicing
              </>
            ) : series.isFree || finalPrice === 0 ? (
              'Start Free Tests'
            ) : (
              'Unlock Now'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
