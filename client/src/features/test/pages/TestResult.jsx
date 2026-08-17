import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import Tabs from '@/components/common/Tabs';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import TestResultSummary from '../components/TestResultSummary';
import QuestionReview from '../components/QuestionReview';
import { fetchLatestTestResult } from '../testSlice';
import {
  HiAcademicCap,
  HiClipboardList,
  HiRefresh,
  HiArrowLeft,
  HiCheckCircle,
  HiXCircle,
  HiMinusCircle,
} from 'react-icons/hi';

export default function TestResult() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const {
    result,
    answers,
    questions: storedQuestions,
    loading,
    error,
  } = useSelector((state) => state.tests);
  const [activeTab, setActiveTab] = useState('summary');
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'incorrect' | 'skipped' | 'correct'

  useEffect(() => {
    if (!result) {
      dispatch(fetchLatestTestResult(id));
    }
  }, [id, result, dispatch]);

  const questions = storedQuestions.length
    ? storedQuestions
    : result?.questions || result?.test?.questions || result?.attempt?.test?.questions || [];

  const attempt = result?.attempt || result || {};
  const attemptAnswers = attempt.answers || [];

  // Reconstruct answers map if empty (e.g. on page refresh)
  const resolvedAnswers =
    Object.keys(answers || {}).length > 0
      ? answers
      : attemptAnswers.reduce((acc, curr) => {
          if (curr.selectedOptions && curr.selectedOptions.length > 0) {
            acc[curr.questionId] = curr.selectedOptions[0];
          } else if (curr.textAnswer !== undefined) {
            acc[curr.questionId] = curr.textAnswer;
          }
          return acc;
        }, {});

  // Compute question analysis
  const analyzedQuestions = questions.map((q, idx) => {
    const qId = q._id || q.id || idx;
    const userAns = resolvedAnswers[qId];
    const correctIdx = q.options?.findIndex((o) => o.isCorrect);
    const resolvedCorrect =
      correctIdx !== -1 && correctIdx !== undefined ? correctIdx : (q.correctAnswer ?? q.correct);
    const wasAnswered = userAns !== undefined && userAns !== null;
    const isCorrect = wasAnswered && userAns === resolvedCorrect;

    return {
      ...q,
      originalIndex: idx,
      userAnswer: userAns,
      isCorrect,
      wasAnswered,
      resolvedCorrect,
    };
  });

  const correctCount = analyzedQuestions.filter((q) => q.isCorrect).length;
  const incorrectCount = analyzedQuestions.filter((q) => q.wasAnswered && !q.isCorrect).length;
  const skippedCount = analyzedQuestions.filter((q) => !q.wasAnswered).length;

  const filteredQuestions = analyzedQuestions.filter((q) => {
    if (reviewFilter === 'incorrect') return q.wasAnswered && !q.isCorrect;
    if (reviewFilter === 'skipped') return !q.wasAnswered;
    if (reviewFilter === 'correct') return q.isCorrect;
    return true;
  });

  const tabs = [
    { key: 'summary', label: 'Score Summary & Analytics' },
    { key: 'review', label: 'Solutions & Explanations', count: questions.length },
  ];

  if (loading && !result) {
    return <LoadingSpinner fullScreen text="Loading test results & analysis..." />;
  }

  if (error && !result) {
    return (
      <div className="max-w-md mx-auto my-20 px-8 py-12 text-center bg-white dark:bg-dark-950 rounded-3xl border border-slate-200/50 dark:border-dark-800/50 shadow-premium transition-all duration-300">
        <div className="text-5xl mb-3">⚠️</div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          Error Loading Result
        </h2>
        <p className="text-slate-500 mb-6 text-sm">{error || 'Could not find attempt results.'}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => dispatch(fetchLatestTestResult(id))}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all text-sm"
          >
            Retry
          </button>
          <Link
            to={`/tests/${id}`}
            className="bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-6 rounded-xl transition-all text-sm"
          >
            Back to Test
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* ── Top Tabs Navigation ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex-1 min-w-[280px]">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
        <Link
          to={`/tests/${id}`}
          className="bg-white dark:bg-dark-950 border border-slate-200/50 dark:border-dark-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-900 font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 transition-all duration-300 shrink-0 shadow-premium"
        >
          <HiRefresh className="h-4 w-4 text-amber-500" /> Reattempt Test
        </Link>
      </div>

      {activeTab === 'summary' && (
        <TestResultSummary
          result={result}
          onViewSolutions={() => setActiveTab('review')}
          testId={id}
        />
      )}

      {activeTab === 'review' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-dark-950 p-6 rounded-2xl border border-slate-200/50 dark:border-dark-800/50 shadow-premium transition-all duration-300">
            <div>
              <h3 className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base">
                Question Solutions Key
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed explanations and step-by-step breakdown.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-dark-800 p-1 rounded-xl border border-slate-200 dark:border-dark-700 self-start sm:self-auto overflow-x-auto">
              <button
                onClick={() => setReviewFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  reviewFilter === 'all'
                    ? 'bg-white dark:bg-dark-950 text-slate-900 dark:text-white shadow-premium'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({questions.length})
              </button>
              <button
                onClick={() => setReviewFilter('incorrect')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  reviewFilter === 'incorrect'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-rose-600'
                }`}
              >
                <HiXCircle className="h-3.5 w-3.5" /> Mistakes ({incorrectCount})
              </button>
              <button
                onClick={() => setReviewFilter('skipped')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  reviewFilter === 'skipped'
                    ? 'bg-slate-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <HiMinusCircle className="h-3.5 w-3.5" /> Skipped ({skippedCount})
              </button>
              <button
                onClick={() => setReviewFilter('correct')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  reviewFilter === 'correct'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-emerald-600'
                }`}
              >
                <HiCheckCircle className="h-3.5 w-3.5" /> Correct ({correctCount})
              </button>
            </div>
          </div>

          {/* List of reviewed questions */}
          {filteredQuestions.length === 0 ? (
            <div className="bg-white dark:bg-dark-950 rounded-3xl p-16 text-center border border-dashed border-slate-200/50 dark:border-dark-800/50 shadow-premium transition-all duration-300">
              <span className="text-4xl mb-2 block">🎯</span>
              <h4 className="font-bold tracking-tight text-slate-900 dark:text-white text-base">
                No questions in this filter
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Try switching to another filter tab above.
              </p>
            </div>
          ) : (
            filteredQuestions.map((q) => (
              <QuestionReview
                key={q._id || q.originalIndex}
                question={q}
                index={q.originalIndex}
                userAnswer={resolvedAnswers[q._id || q.id || q.originalIndex]}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
