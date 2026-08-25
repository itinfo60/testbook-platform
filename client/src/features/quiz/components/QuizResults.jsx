import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiCheckCircle,
  HiXCircle,
  HiRefresh,
  HiAcademicCap,
  HiArrowLeft,
  HiSparkles,
  HiInformationCircle,
  HiCheck,
  HiX,
} from 'react-icons/hi';

export default function QuizResults({ result, quiz, userAnswers = {}, onRetry }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'incorrect' | 'correct'

  const score = result?.score ?? result?.correctAnswers ?? 0;
  const totalQuestions = result?.totalQuestions ?? quiz?.questions?.length ?? 0;
  const percentage =
    result?.percentage ?? (totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0);
  const isPassed = result?.isPassed ?? percentage >= (quiz?.passingScore || 50);
  const gradedAnswers = result?.answers || [];

  const questions = quiz?.questions || [];

  // Helper to determine question result
  const getQuestionStatus = (q, index) => {
    const qId = q._id || q.id || index;
    const graded = gradedAnswers.find((a) => String(a.questionId) === String(qId));
    if (graded) {
      return {
        isCorrect: graded.isCorrect,
        selectedOption: graded.selectedOption,
      };
    }
    const userSelected = userAnswers[qId];
    const correctIdx = q.options?.findIndex((o) => o.isCorrect);
    const resolvedCorrect = correctIdx !== -1 ? correctIdx : (q.correctAnswer ?? q.correct);
    return {
      isCorrect: userSelected !== undefined && userSelected === resolvedCorrect,
      selectedOption: userSelected,
      correctAnswer: resolvedCorrect,
    };
  };

  const analyzedQuestions = questions.map((q, idx) => {
    const status = getQuestionStatus(q, idx);
    const correctIdx = q.options?.findIndex((o) => o.isCorrect);
    const resolvedCorrect = correctIdx !== -1 ? correctIdx : (q.correctAnswer ?? q.correct);
    return {
      ...q,
      index: idx,
      userAnswer: status.selectedOption,
      isCorrect: status.isCorrect,
      correctAnswer: resolvedCorrect,
      wasAnswered: status.selectedOption !== undefined && status.selectedOption !== null,
    };
  });

  const correctCount = analyzedQuestions.filter((q) => q.isCorrect).length;
  const wrongCount = analyzedQuestions.filter((q) => q.wasAnswered && !q.isCorrect).length;
  const skippedCount = analyzedQuestions.filter((q) => !q.wasAnswered).length;

  const filteredQuestions = analyzedQuestions.filter((q) => {
    if (filter === 'incorrect') return !q.isCorrect;
    if (filter === 'correct') return q.isCorrect;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* ── Summary Card ── */}
      <div className="bg-white dark:bg-dark-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-dark-800 shadow-sm text-center mb-8 relative overflow-hidden">
        <div className="text-5xl sm:text-6xl mb-3">
          {percentage >= 80 ? '🏆' : percentage >= 50 ? '🎉' : '💪'}
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-dark-900 dark:text-white font-display mb-1">
          {percentage >= 80
            ? 'Outstanding Performance!'
            : percentage >= 50
              ? 'Quiz Passed Successfully!'
              : 'Keep Practicing & Review Mistakes!'}
        </h2>
        <p className="text-slate-500 font-medium text-sm sm:text-base max-w-md mx-auto mb-6">
          {percentage >= 50
            ? `You scored ${percentage}% on "${quiz?.title || 'Quiz'}". Great grasp of core concepts!`
            : `You scored ${percentage}%. Review the step-by-step solutions below to clear your doubts.`}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto mb-8">
          <div className="bg-slate-50 dark:bg-dark-800 p-4 rounded-2xl border border-slate-100 dark:border-dark-700">
            <div className="text-2xl sm:text-3xl font-extrabold text-primary-600 dark:text-primary-400">
              {score}/{totalQuestions}
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
              Score
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-dark-800 p-4 rounded-2xl border border-slate-100 dark:border-dark-700">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {correctCount}
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
              Correct
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-dark-800 p-4 rounded-2xl border border-slate-100 dark:border-dark-700">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {wrongCount}
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
              Incorrect
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-dark-800 p-4 rounded-2xl border border-slate-100 dark:border-dark-700">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {percentage}%
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
              Accuracy
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm cursor-pointer"
            >
              <HiRefresh className="h-4 w-4" /> Retake Quiz
            </button>
          )}
          {quiz?.course && (
            <Link
              to={`/courses/${typeof quiz.course === 'object' ? quiz.course.slug || quiz.course._id : quiz.course}/learn`}
              className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-700 font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2 text-sm"
            >
              <HiArrowLeft className="h-4 w-4" /> Continue Course
            </Link>
          )}
          <Link
            to="/dashboard"
            className="bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-700 font-bold py-3 px-5 rounded-xl transition-colors text-sm"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {/* ── Solutions & Explanations Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-extrabold text-dark-900 dark:text-white flex items-center gap-2">
            <HiAcademicCap className="h-6 w-6 text-amber-500" /> Question Solutions & Detailed
            Explanations
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Learn the concepts behind every question to master this topic.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-dark-800 p-1 rounded-xl border border-slate-200 dark:border-dark-700 self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-white dark:bg-dark-900 text-dark-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-dark-900'
            }`}
          >
            All ({analyzedQuestions.length})
          </button>
          <button
            onClick={() => setFilter('incorrect')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'incorrect'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
            }`}
          >
            Mistakes ({wrongCount + skippedCount})
          </button>
          <button
            onClick={() => setFilter('correct')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'correct'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
            }`}
          >
            Correct ({correctCount})
          </button>
        </div>
      </div>

      {/* ── Question Review List ── */}
      <div className="space-y-6">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white dark:bg-dark-900 p-8 rounded-2xl border border-dashed border-slate-300 dark:border-dark-700 text-center">
            <span className="text-3xl mb-2 block">✨</span>
            <p className="font-bold text-dark-900 dark:text-white">No questions in this filter.</p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            return (
              <div
                key={q._id || q.index}
                className={`bg-white dark:bg-dark-900 rounded-3xl p-6 border-2 transition-all shadow-sm ${
                  !q.wasAnswered
                    ? 'border-slate-200 dark:border-dark-800'
                    : q.isCorrect
                      ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/10'
                      : 'border-rose-200 dark:border-rose-900/40 bg-rose-50/10'
                }`}
              >
                {/* Header with question number and outcome */}
                <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-dark-800">
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-9 w-9 rounded-xl flex items-center justify-center font-extrabold text-sm ${
                        !q.wasAnswered
                          ? 'bg-slate-100 text-slate-600 dark:bg-dark-800 dark:text-slate-400'
                          : q.isCorrect
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                      }`}
                    >
                      {q.index + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Question {q.index + 1} of {totalQuestions}
                    </span>
                  </div>

                  <div>
                    {!q.wasAnswered ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-dark-800 dark:text-slate-400">
                        Skipped (0 Marks)
                      </span>
                    ) : q.isCorrect ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center gap-1">
                        <HiCheck className="h-3.5 w-3.5" /> Correct (+{q.marks || 1})
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 flex items-center gap-1">
                        <HiX className="h-3.5 w-3.5" /> Incorrect (0 Marks)
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Statement */}
                <h4 className="text-base sm:text-lg font-bold text-dark-900 dark:text-white leading-relaxed mb-6 font-display">
                  {q.question || q.text}
                </h4>

                {/* Options List */}
                <div className="space-y-3 mb-6">
                  {(q.options || []).map((opt, optIdx) => {
                    const optText = typeof opt === 'string' ? opt : opt.text || opt.label;
                    const isUserChoice = q.userAnswer === optIdx;
                    const isRightChoice = optIdx === q.correctAnswer;

                    let optionStyle =
                      'border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-800/40 text-slate-700 dark:text-slate-300';
                    let badgeStyle =
                      'bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 text-slate-500';

                    if (isRightChoice) {
                      optionStyle =
                        'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 font-bold';
                      badgeStyle = 'bg-emerald-500 text-white';
                    } else if (isUserChoice && !q.isCorrect) {
                      optionStyle =
                        'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-100 font-bold';
                      badgeStyle = 'bg-rose-500 text-white';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border-2 transition-all ${optionStyle}`}
                      >
                        <span
                          className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${badgeStyle}`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="text-sm flex-1 leading-snug">{optText}</span>

                        {isRightChoice && (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-emerald-600 text-white flex items-center gap-1 flex-shrink-0">
                            <HiCheckCircle className="h-3.5 w-3.5" /> Correct Answer
                          </span>
                        )}
                        {isUserChoice && !q.isCorrect && (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-rose-600 text-white flex items-center gap-1 flex-shrink-0">
                            <HiXCircle className="h-3.5 w-3.5" /> Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Detailed Explanation / Concept Solution */}
                {q.explanation && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">
                      <HiInformationCircle className="h-4 w-4" /> Explanation & Concept Breakdown
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
