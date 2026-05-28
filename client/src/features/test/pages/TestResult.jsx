import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import Tabs from '@/components/common/Tabs';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import TestResultSummary from '../components/TestResultSummary';
import QuestionReview from '../components/QuestionReview';
import { fetchLatestTestResult } from '../testSlice';

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
          } else if (curr.textAnswer) {
            acc[curr.questionId] = curr.textAnswer;
          }
          return acc;
        }, {});

  const tabs = [
    { key: 'summary', label: 'Summary' },
    { key: 'review', label: 'Question Review', count: questions.length },
  ];

  if (loading && !result) {
    return <LoadingSpinner fullScreen />;
  }

  if (error && !result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center bg-slate-950/20 rounded-2xl border border-dark-100 dark:border-dark-800">
        <div className="text-red-500 text-xl font-bold mb-3">Error loading test result</div>
        <p className="text-dark-500 mb-6 text-sm">{error}</p>
        <button onClick={() => dispatch(fetchLatestTestResult(id))} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6 sm:mb-8" />

      {activeTab === 'summary' && <TestResultSummary result={result} />}

      {activeTab === 'review' && (
        <div className="space-y-4">
          {questions.length === 0 ? (
            <div className="text-center py-12 text-dark-400">
              <p>Question review not available</p>
            </div>
          ) : (
            questions.map((q, i) => (
              <QuestionReview
                key={q._id || i}
                question={q}
                index={i}
                userAnswer={resolvedAnswers[q._id || q.id || i]}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
