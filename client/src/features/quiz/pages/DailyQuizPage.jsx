import Breadcrumb from '@/components/Breadcrumb';
import EmptyState from '@/components/EmptyState';
import SeoHead from '@/components/SeoHead';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizAPI, testAPI, testSeriesAPI } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import {
  HiAcademicCap,
  HiArrowRight,
  HiCalendar,
  HiClock,
  HiFire,
  HiLightningBolt,
  HiSearch,
} from 'react-icons/hi';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Link } from 'react-router-dom';

export default function DailyQuizPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [quizzes, setQuizzes] = useState([]);
  const [dailyTestSeries, setDailyTestSeries] = useState(null);
  const [dailyTests, setDailyTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all'); // 'all', 'daily', 'practice', 'past'
  const [searchQuery, setSearchQuery] = useState('');

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    const fetchAllQuizzesAndDailyTests = async () => {
      setLoading(true);
      try {
        const [quizzesRes, seriesRes] = await Promise.allSettled([
          quizAPI.getAll({ limit: 50 }),
          testSeriesAPI.getAll({ testType: 'daily', isPublished: true, limit: 1 }),
        ]);

        let fetchedQuizzes = [];
        if (quizzesRes.status === 'fulfilled') {
          const qData =
            quizzesRes.value.data?.data?.docs ||
            quizzesRes.value.data?.data?.quizzes ||
            quizzesRes.value.data?.data ||
            quizzesRes.value.data?.quizzes ||
            [];
          fetchedQuizzes = Array.isArray(qData) ? qData : [];
        }

        let fetchedSeries = null;
        let fetchedDailyTests = [];
        if (seriesRes.status === 'fulfilled') {
          const sData =
            seriesRes.value.data?.data?.testSeries ||
            seriesRes.value.data?.data?.docs ||
            seriesRes.value.data?.testSeries ||
            [];
          fetchedSeries = Array.isArray(sData) ? sData[0] : null;

          if (fetchedSeries) {
            try {
              const testsRes = await testAPI.getAll({ testSeries: fetchedSeries._id, limit: 10 });
              const tData =
                testsRes.data?.data?.docs ||
                testsRes.data?.data?.tests ||
                testsRes.data?.data ||
                [];
              fetchedDailyTests = Array.isArray(tData) ? tData : [];
            } catch (e) {}
          }
        }

        setQuizzes(fetchedQuizzes);
        setDailyTestSeries(fetchedSeries);
        setDailyTests(fetchedDailyTests);
      } catch (err) {
        setQuizzes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllQuizzesAndDailyTests();
  }, []);

  // Filter quizzes based on tab & search query
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      const matchSearch =
        !searchQuery ||
        q.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.description?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (selectedTab === 'daily') return q.type === 'daily';
      if (selectedTab === 'practice') return q.type === 'practice' || q.type === 'course';
      if (selectedTab === 'past') {
        const isOld = new Date(q.createdAt) < new Date(Date.now() - 24 * 60 * 60 * 1000);
        return isOld;
      }
      return true;
    });
  }, [quizzes, selectedTab, searchQuery]);

  // Featured Daily Challenge (Today's top quiz or daily test)
  const featuredDailyQuiz = useMemo(() => {
    return quizzes.find((q) => q.type === 'daily') || quizzes[0] || null;
  }, [quizzes]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 py-10">
      <SeoHead
        title="Daily Quizzes & Practice Drills — EduPortal"
        description="Attempt all daily quizzes, subject speed drills, past archives, and proctored challenges with instant rank & detailed solutions."
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumb items={[{ label: 'Daily Quiz Hub' }]} />

        {/* ══════════════════════════════════════════════════════════════
            1. HERO CHALLENGE BANNER
        ══════════════════════════════════════════════════════════════ */}
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-xl" />
          <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-black/10 rounded-full blur-xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider text-amber-100">
                <HiLightningBolt className="h-4 w-4 text-amber-200" />
                Live Daily Practice
              </div>
              <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight leading-tight">
                Daily Quiz & Speed Challenge Hub
              </h1>
              <p className="text-amber-100 text-sm sm:text-base font-medium flex items-center gap-2">
                <HiCalendar className="h-4 w-4" /> {todayFormatted} · 10 MCQs Daily · Detailed
                Solutions
              </p>
            </div>

            {featuredDailyQuiz && (
              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 max-w-xs w-full flex-shrink-0 space-y-3">
                <div className="flex items-center justify-between text-xs text-amber-100 font-bold">
                  <span>Today's Pick</span>
                  <span>⏱️ {featuredDailyQuiz.duration || 10} Mins</span>
                </div>
                <h3 className="font-black text-white text-base line-clamp-2">
                  {featuredDailyQuiz.title}
                </h3>
                <Link
                  to={`/quiz/${featuredDailyQuiz._id}`}
                  className="w-full bg-white text-orange-600 hover:bg-amber-50 font-black py-3 px-4 rounded-xl text-center text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all"
                >
                  Start Today's Quiz <HiArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            2. STATS STRIP
        ══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              icon: HiLightningBolt,
              label: 'All Quizzes',
              value: `${quizzes.length} Available`,
              color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30',
            },
            {
              icon: HiClock,
              label: 'Standard Duration',
              value: '10 Mins / 10 Qs',
              color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30',
            },
            {
              icon: HiFire,
              label: 'Active Streaks',
              value: 'Instant Score & Rank',
              color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/30',
            },
            {
              icon: HiAcademicCap,
              label: 'Subject Coverage',
              value: 'Polity, GK, History, Eco',
              color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-800 p-4 sm:p-5 text-center shadow-sm"
            >
              <div
                className={`h-10 w-10 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-2 font-black`}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <div className="font-black text-sm sm:text-base text-dark-900 dark:text-white truncate">
                {s.value}
              </div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            3. FILTER TABS & SEARCH BAR
        ══════════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-dark-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-dark-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tab Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Quizzes' },
              { id: 'daily', label: '⚡ Daily Challenges' },
              { id: 'practice', label: '📖 Topic & Subject Drills' },
              { id: 'past', label: '🗄️ Past Archives' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  selectedTab === tab.id
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search quiz topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-dark-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            4. ALL QUIZZES & PAST ARCHIVES GRID
        ══════════════════════════════════════════════════════════════ */}
        {loading ? (
          <LoadingSpinner />
        ) : filteredQuizzes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredQuizzes.map((quiz) => {
              const qCount = quiz.questions?.length || quiz.questionCount || 10;
              const duration = quiz.duration || 10;
              const typeLabel = quiz.type === 'daily' ? 'Daily Challenge' : 'Practice Drill';

              return (
                <div
                  key={quiz.id || quiz._id}
                  className="bg-white dark:bg-dark-900 p-6 rounded-3xl border border-slate-200 dark:border-dark-800 shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          quiz.type === 'daily'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        {typeLabel}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <HiClock className="h-3.5 w-3.5" /> {duration} Mins
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-dark-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 mb-2">
                      {quiz.title}
                    </h3>

                    {quiz.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                        {quiz.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-6">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-dark-800 rounded-md">
                        🎯 {qCount} Questions
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-dark-800 rounded-md">
                        📊 Negative Marking
                      </span>
                      {quiz.createdAt && (
                        <span className="text-[10px] text-slate-400 ml-auto">
                          {new Date(quiz.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/quiz/${quiz._id}`}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-3 px-4 rounded-2xl shadow-md transition-all text-xs text-center flex items-center justify-center gap-2"
                  >
                    Start Quiz Drill <HiArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="📅"
            title="No quizzes match your filter"
            description="Try changing your search term or tab filter to view available practice quizzes and past challenges."
            action={
              <button
                onClick={() => {
                  setSelectedTab('all');
                  setSearchQuery('');
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-6 rounded-xl transition-colors text-xs"
              >
                Reset Filters
              </button>
            }
          />
        )}

        {/* ══════════════════════════════════════════════════════════════
            5. PROCTORED DAILY MOCK TEST SERIES SECTION
        ══════════════════════════════════════════════════════════════ */}
        {dailyTestSeries && (
          <div className="bg-white dark:bg-dark-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-dark-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-dark-800">
              <div>
                <span className="bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                  Full-Length Daily Test Series
                </span>
                <h3 className="text-xl font-black text-dark-900 dark:text-white mt-1">
                  {dailyTestSeries.title}
                </h3>
                <p className="text-xs text-slate-400">
                  Comprehensive daily full-syllabus and section tests matching official RPSC
                  standards.
                </p>
              </div>
              <Link
                to={`/test-series/${dailyTestSeries.slug || dailyTestSeries._id}`}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-dark-900 font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 flex-shrink-0 shadow-md"
              >
                View Series Tests <HiArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {dailyTests.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dailyTests.slice(0, 4).map((t) => (
                  <div
                    key={t.id || t._id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-800/60 border border-slate-200/60 dark:border-dark-700 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-dark-900 dark:text-white truncate">
                        {t.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        ⏱️ {t.duration || 60} mins · 🎯 {t.totalMarks || 100} marks · 📝{' '}
                        {t.questionsCount || 50} Qs
                      </p>
                    </div>
                    <Link
                      to={`/tests/${t._id}`}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-black px-4 py-2 rounded-xl text-xs flex-shrink-0 shadow-sm"
                    >
                      Attempt →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
