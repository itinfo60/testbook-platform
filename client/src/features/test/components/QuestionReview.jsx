import {
  HiCheckCircle,
  HiXCircle,
  HiMinusCircle,
  HiInformationCircle,
  HiCheck,
  HiX,
} from 'react-icons/hi';

export default function QuestionReview({ question, index, userAnswer }) {
  const correctOptionIndex = question.options?.findIndex((o) => o.isCorrect);
  const correctAnswer =
    correctOptionIndex !== -1 && correctOptionIndex !== undefined
      ? correctOptionIndex
      : (question.correctAnswer ?? question.correct);
  const isCorrect = userAnswer === correctAnswer;
  const wasAnswered = userAnswer !== undefined && userAnswer !== null;

  return (
    <div
      className={`bg-white dark:bg-dark-900 rounded-3xl p-6 border-2 transition-all shadow-sm ${
        !wasAnswered
          ? 'border-slate-200 dark:border-dark-800'
          : isCorrect
            ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/10'
            : 'border-rose-200 dark:border-rose-900/40 bg-rose-50/10'
      }`}
    >
      {/* ── Question Header ── */}
      <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-dark-800">
        <div className="flex items-center gap-3">
          <span
            className={`h-9 w-9 rounded-xl flex items-center justify-center font-extrabold text-sm ${
              !wasAnswered
                ? 'bg-slate-100 text-slate-600 dark:bg-dark-800 dark:text-slate-400'
                : isCorrect
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
            }`}
          >
            {index + 1}
          </span>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              Question {index + 1}
            </span>
            {(question.topic ||
              question.topicName ||
              question.subject ||
              question.subjectName ||
              question.sectionName ||
              question.subjectTag) && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mt-0.5 inline-block">
                📍{' '}
                {question.topic ||
                  question.topicName ||
                  question.subject ||
                  question.subjectName ||
                  question.sectionName ||
                  question.subjectTag}
              </span>
            )}
          </div>
        </div>

        <div>
          {!wasAnswered ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-dark-800 dark:text-slate-400 inline-flex items-center gap-1">
              <HiMinusCircle className="h-3.5 w-3.5" /> Skipped (0 Marks)
            </span>
          ) : isCorrect ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 inline-flex items-center gap-1">
              <HiCheck className="h-3.5 w-3.5" /> Correct (+{question.marks || 1} Marks)
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 inline-flex items-center gap-1">
              <HiX className="h-3.5 w-3.5" /> Incorrect (
              {question.negativeMarks ? `-${question.negativeMarks}` : '0'} Marks)
            </span>
          )}
        </div>
      </div>

      {/* ── Question Statement ── */}
      <h3 className="text-base sm:text-lg font-bold text-dark-900 dark:text-white leading-relaxed mb-6 font-display">
        {question.question || question.text}
      </h3>

      {question.image && (
        <img
          src={question.image}
          alt="Question diagram"
          className="mb-6 rounded-2xl max-h-64 object-contain border border-slate-200 dark:border-dark-700"
        />
      )}

      {/* ── Options List ── */}
      <div className="space-y-3 mb-6">
        {(question.options || []).map((option, i) => {
          const text = typeof option === 'string' ? option : option.text || option.label;
          const isCorrectOption = i === correctAnswer;
          const isUserOption = i === userAnswer;

          let optionStyle =
            'border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-800/40 text-slate-700 dark:text-slate-300';
          let badgeStyle =
            'bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 text-slate-600';

          if (isCorrectOption) {
            optionStyle =
              'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 font-bold';
            badgeStyle = 'bg-emerald-500 text-white';
          } else if (isUserOption && !isCorrect) {
            optionStyle =
              'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-100 font-bold';
            badgeStyle = 'bg-rose-500 text-white';
          }

          return (
            <div
              key={i}
              className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border-2 transition-all ${optionStyle}`}
            >
              <span
                className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${badgeStyle}`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm flex-1 leading-snug">{text}</span>

              {isCorrectOption && (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-emerald-600 text-white flex items-center gap-1 flex-shrink-0">
                  <HiCheckCircle className="h-3.5 w-3.5" /> Correct Answer
                </span>
              )}
              {isUserOption && !isCorrect && (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-rose-600 text-white flex items-center gap-1 flex-shrink-0">
                  <HiXCircle className="h-3.5 w-3.5" /> Your Answer
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Explanation & Concept Solution ── */}
      {question.explanation && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">
            <HiInformationCircle className="h-4 w-4" /> Explanation & Solution Key
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
