import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { enrollmentAPI, testAPI } from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
  HiCheckCircle,
  HiClock,
  HiArrowRight,
  HiPlay,
  HiSearch,
  HiAcademicCap,
  HiClipboardList,
  HiTrendingUp,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function MyTestAttempts() {
  const [purchasedTests, setPurchasedTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeriesFilter, setSelectedSeriesFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [enrollmentsRes, attemptsRes] = await Promise.all([
          enrollmentAPI.getMyTestEnrollments(),
          testAPI.getMyAttempts(),
        ]);
        const testEnrollments = enrollmentsRes.data.data || [];
        setPurchasedTests(
          Array.isArray(testEnrollments) ? testEnrollments : testEnrollments.docs || []
        );

        const testAttempts = attemptsRes.data.data || attemptsRes.data || [];
        const rawList = Array.isArray(testAttempts) ? testAttempts : testAttempts.docs || [];
        const completedOnly = rawList.filter((a) => a.status === 'completed');
        setAttempts(completedOnly);
      } catch (error) {
        toast.error('Failed to load your tests');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute performance statistics
  const stats = useMemo(() => {
    const total = attempts.length;
    const completed = attempts.filter((a) => a.status === 'completed' || a.status === 'timed_out');
    const totalScore = completed.reduce((sum, a) => sum + (Number(a.score) || 0), 0);
    const avgScore = completed.length > 0 ? Math.round(totalScore / completed.length) : 0;
    return { total, completedCount: completed.length, avgScore };
  }, [attempts]);

  // Group attempts by Test Series
  const groupedAttempts = useMemo(() => {
    const seriesMap = new Map();
    const standalone = [];

    const filtered = attempts.filter((a) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.test?.title?.toLowerCase().includes(q) || a.testSeries?.title?.toLowerCase().includes(q)
      );
    });

    filtered.forEach((a) => {
      if (a.testSeries && a.testSeries.title) {
        const sId = a.testSeries.id || a.testSeries.title;
        if (!seriesMap.has(sId)) {
          seriesMap.set(sId, {
            series: a.testSeries,
            attempts: [],
          });
        }
        seriesMap.get(sId).attempts.push(a);
      } else {
        standalone.push(a);
      }
    });

    return {
      seriesGroups: Array.from(seriesMap.values()),
      standalone,
    };
  }, [attempts, searchQuery]);

  // Extract unique series for filter tabs
  const filterOptions = useMemo(() => {
    const map = new Map();
    attempts.forEach((a) => {
      if (a.testSeries && a.testSeries.title) {
        const sId = a.testSeries.id || a.testSeries.title;
        if (!map.has(sId)) {
          map.set(sId, { id: sId, title: a.testSeries.title, count: 0 });
        }
        map.get(sId).count += 1;
      }
    });
    return Array.from(map.values());
  }, [attempts]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-dark-900 dark:text-white font-display">
            My Tests & Performance
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your mock test results organized by Test Series and view detailed solutions.
          </p>
        </div>

        {/* Global Stats Counter */}
        <div className="flex items-center gap-3 bg-white dark:bg-dark-900 p-2.5 sm:p-3 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm shrink-0">
          <div className="px-3 py-1 border-r border-slate-100 dark:border-dark-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Tests Taken
            </div>
            <div className="text-base sm:text-lg font-black text-primary-600 dark:text-primary-400">
              {stats.total}
            </div>
          </div>
          <div className="px-3 py-1 border-r border-slate-100 dark:border-dark-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Completed
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
              {stats.completedCount}
            </div>
          </div>
          <div className="px-3 py-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Avg Score
            </div>
            <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">
              {stats.avgScore} pts
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 1: Enrolled / Purchased Test Series ── */}
      <div className="mb-12">
        <h2 className="text-lg sm:text-xl font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="h-5 w-1.5 bg-primary-500 rounded-full"></span>
          Enrolled Test Series & Packs
        </h2>
        {purchasedTests.length === 0 ? (
          <div className="bg-white dark:bg-dark-900 p-6 sm:p-10 text-center rounded-3xl border border-dashed border-slate-300 dark:border-dark-700 shadow-sm">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-dark-900 dark:text-white font-bold text-base mb-1">
              You haven't enrolled in any Test Series yet.
            </p>
            <p className="text-slate-500 text-xs sm:text-sm mb-4 font-medium max-w-md mx-auto">
              Get an exam test series pack to practice topic tests, full length papers, and track
              rank.
            </p>
            <Link
              to="/test-series"
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs sm:text-sm py-2.5 px-5 rounded-xl transition-colors inline-block"
            >
              Explore Test Series
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {purchasedTests.map((enrollment) => {
              const test = enrollment.test;
              if (!test) return null;
              return (
                <div
                  key={enrollment.id || enrollment._id}
                  className="bg-white dark:bg-dark-900 p-5 rounded-3xl border border-slate-200 dark:border-dark-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <h3 className="font-extrabold text-base text-dark-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                    {test.title}
                  </h3>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-5 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 bg-slate-50 dark:bg-dark-800 px-2 py-1 rounded-md">
                      <HiClock className="h-3.5 w-3.5 text-amber-600" /> {test.duration || 60} mins
                    </span>
                    <span className="flex items-center gap-1 bg-slate-50 dark:bg-dark-800 px-2 py-1 rounded-md">
                      <HiCheckCircle className="h-3.5 w-3.5 text-emerald-500" />{' '}
                      {test.questionsCount || test.totalQuestions || 20} Qs
                    </span>
                  </div>
                  <div className="mt-auto pt-3 border-t border-slate-100 dark:border-dark-800">
                    <Link
                      to={
                        enrollment.isSeries || test.isSeries
                          ? `/test-series/${test.id || test._id}`
                          : `/tests/${test.id || test._id}`
                      }
                      className="flex items-center justify-center gap-1.5 w-full py-2 bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/40 dark:hover:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-bold text-xs rounded-xl transition-colors"
                    >
                      <HiPlay className="h-3.5 w-3.5" />{' '}
                      {enrollment.isSeries || test.isSeries
                        ? 'Open Test Series'
                        : 'Start Practicing'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section 2: Attempt History Grouped By Test Series ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
            <span className="h-5 w-1.5 bg-secondary-500 rounded-full"></span>
            Attempt History & Analysis
          </h2>

          {/* Search bar */}
          {attempts.length > 0 && (
            <div className="relative w-full sm:w-64">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search test name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 text-dark-900 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Filter Pills */}
        {attempts.length > 0 && filterOptions.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 hide-scrollbar">
            <button
              onClick={() => setSelectedSeriesFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedSeriesFilter === 'all'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white dark:bg-dark-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-dark-800 hover:border-primary-300'
              }`}
            >
              All Tests ({attempts.length})
            </button>
            {filterOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedSeriesFilter(opt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedSeriesFilter === opt.id
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white dark:bg-dark-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-dark-800 hover:border-primary-300'
                }`}
              >
                <span>{opt.title}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                    selectedSeriesFilter === opt.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-dark-800 text-slate-500'
                  }`}
                >
                  {opt.count}
                </span>
              </button>
            ))}
            {groupedAttempts.standalone.length > 0 && (
              <button
                onClick={() => setSelectedSeriesFilter('standalone')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedSeriesFilter === 'standalone'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white dark:bg-dark-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-dark-800 hover:border-primary-300'
                }`}
              >
                Standalone / Free Tests ({groupedAttempts.standalone.length})
              </button>
            )}
          </div>
        )}

        {attempts.length === 0 ? (
          <div className="bg-white dark:bg-dark-900 p-8 sm:p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-dark-700 shadow-sm">
            <div className="text-4xl mb-3 text-slate-300">📊</div>
            <p className="text-dark-900 dark:text-white font-bold text-base mb-1">
              No attempt history found.
            </p>
            <p className="text-slate-500 text-xs sm:text-sm mb-4 font-medium">
              Your test attempts and performance analysis will appear here.
            </p>
            <Link
              to="/tests"
              className="bg-secondary-500 hover:bg-secondary-600 text-white font-bold text-xs sm:text-sm py-2.5 px-5 rounded-xl transition-colors inline-block"
            >
              Take a Free Test
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 1. Grouped Test Series sections */}
            {groupedAttempts.seriesGroups
              .filter(
                (grp) =>
                  selectedSeriesFilter === 'all' ||
                  selectedSeriesFilter === (grp.series.id || grp.series.title)
              )
              .map((grp) => {
                const grpCompleted = grp.attempts.filter(
                  (a) => a.status === 'completed' || a.status === 'timed_out'
                );
                const grpAvgScore =
                  grpCompleted.length > 0
                    ? Math.round(
                        grpCompleted.reduce((s, a) => s + (Number(a.score) || 0), 0) /
                          grpCompleted.length
                      )
                    : 0;

                return (
                  <div
                    key={grp.series.id || grp.series.title}
                    className="bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-800 p-5 sm:p-6 shadow-sm"
                  >
                    {/* Series Header Card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-dark-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            📦 Test Series
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {grp.attempts.length} Attempt(s)
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-extrabold text-dark-900 dark:text-white mt-1">
                          {grp.series.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Avg Score
                          </div>
                          <div className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400">
                            {grpAvgScore} pts
                          </div>
                        </div>
                        <Link
                          to={`/test-series/${grp.series.slug || grp.series.id}`}
                          className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-dark-800 dark:hover:bg-dark-700 border border-slate-200 dark:border-dark-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          View Full Series →
                        </Link>
                      </div>
                    </div>

                    {/* Attempt Rows */}
                    <div className="space-y-3">
                      {grp.attempts.map((attempt) => {
                        const targetTestId =
                          attempt.test?.id || attempt.test?._id || attempt.testId;
                        return (
                          <div
                            key={attempt.id || attempt._id}
                            className="bg-slate-50 dark:bg-dark-950/60 p-4 rounded-2xl border border-slate-100 dark:border-dark-800 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                          >
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm sm:text-base text-dark-900 dark:text-white truncate">
                                {attempt.test?.title || 'Practice Test'}
                              </h4>
                              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                <HiClock className="h-3.5 w-3.5 text-slate-400" />
                                <span>
                                  {new Date(attempt.startedAt).toLocaleDateString()} •{' '}
                                  {new Date(attempt.startedAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                              <div className="text-center">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">
                                  Score
                                </div>
                                <div className="font-black text-lg text-dark-900 dark:text-white">
                                  {attempt.score || 0}
                                </div>
                              </div>

                              <div className="text-center">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">
                                  Status
                                </div>
                                <span
                                  className={`font-black text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                    attempt.status === 'completed'
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                  }`}
                                >
                                  {attempt.status}
                                </span>
                              </div>

                              <Link
                                to={`/tests/${targetTestId}/result?attemptId=${attempt.id || attempt._id}`}
                                className="h-9 px-3.5 flex items-center justify-center gap-1.5 rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors text-slate-700 dark:text-slate-200 font-bold text-xs shadow-sm"
                              >
                                <span>Check Result</span>
                                <HiArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            {/* 2. Standalone / Free Tests section */}
            {groupedAttempts.standalone.length > 0 &&
              (selectedSeriesFilter === 'all' || selectedSeriesFilter === 'standalone') && (
                <div className="bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-800 p-5 sm:p-6 shadow-sm">
                  <div className="pb-4 mb-4 border-b border-slate-100 dark:border-dark-800">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      🎯 Standalone & Free Practice Tests
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-dark-900 dark:text-white mt-1">
                      Individual Tests ({groupedAttempts.standalone.length})
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {groupedAttempts.standalone.map((attempt) => {
                      const targetTestId = attempt.test?.id || attempt.test?._id || attempt.testId;
                      return (
                        <div
                          key={attempt.id || attempt._id}
                          className="bg-slate-50 dark:bg-dark-950/60 p-4 rounded-2xl border border-slate-100 dark:border-dark-800 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm sm:text-base text-dark-900 dark:text-white truncate">
                              {attempt.test?.title || 'Practice Test'}
                            </h4>
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                              <HiClock className="h-3.5 w-3.5 text-slate-400" />
                              <span>
                                {new Date(attempt.startedAt).toLocaleDateString()} •{' '}
                                {new Date(attempt.startedAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                            <div className="text-center">
                              <div className="text-[10px] font-bold text-slate-400 uppercase">
                                Score
                              </div>
                              <div className="font-black text-lg text-dark-900 dark:text-white">
                                {attempt.score || 0}
                              </div>
                            </div>

                            <div className="text-center">
                              <div className="text-[10px] font-bold text-slate-400 uppercase">
                                Status
                              </div>
                              <span
                                className={`font-black text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                  attempt.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                }`}
                              >
                                {attempt.status}
                              </span>
                            </div>

                            <Link
                              to={`/tests/${targetTestId}/result?attemptId=${attempt.id || attempt._id}`}
                              className="h-9 px-3.5 flex items-center justify-center gap-1.5 rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors text-slate-700 dark:text-slate-200 font-bold text-xs shadow-sm"
                            >
                              <span>Check Result</span>
                              <HiArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
