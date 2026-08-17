import { useState } from 'react';
import { HiSparkles, HiDocumentText, HiDownload } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '@/services/api';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

export default function AIQuestionGenerator() {
  const [form, setForm] = useState({
    subject: '',
    topic: '',
    difficulty: 'medium',
    count: 5,
    language: 'English',
  });
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.topic) {
      toast.error('Subject and topic are required');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/ai/generate-questions', form);
      setQuestions(data.data?.questions || []);
      toast.success(`${data.data?.questions?.length} questions generated!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const text = questions
      .map(
        (q, i) =>
          `Q${i + 1}. ${q.question}\n${q.options?.join('\n') || ''}\nAnswer: ${q.correctAnswer}\nExplanation: ${q.explanation}\n`
      )
      .join('\n---\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions.txt';
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <HiSparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            AI Question Generator
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Generate exam-ready MCQs using GPT-4o
          </p>
        </div>
      </div>

      <form
        onSubmit={handleGenerate}
        className="bg-white dark:bg-dark-800 rounded-2xl border border-slate-100 dark:border-dark-700 p-6 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subject *
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-600 bg-slate-50 dark:bg-dark-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g. Mathematics, Physics, History"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Topic *
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-600 bg-slate-50 dark:bg-dark-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g. Quadratic Equations, Newton's Laws"
              value={form.topic}
              onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Difficulty
            </label>
            <select
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-600 bg-slate-50 dark:bg-dark-900 text-slate-900 dark:text-white text-sm"
              value={form.difficulty}
              onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Count (max 20)
            </label>
            <input
              type="number"
              min={1}
              max={20}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-600 bg-slate-50 dark:bg-dark-900 text-slate-900 dark:text-white text-sm"
              value={form.count}
              onChange={(e) => setForm((f) => ({ ...f, count: parseInt(e.target.value) || 5 }))}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Language
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-600 bg-slate-50 dark:bg-dark-900 text-slate-900 dark:text-white text-sm"
              placeholder="English"
              value={form.language}
              onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{' '}
              Generating...
            </>
          ) : (
            <>
              <HiSparkles className="h-4 w-4" /> Generate Questions
            </>
          )}
        </button>
      </form>

      {questions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {questions.length} Questions Generated
            </h2>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline"
            >
              <HiDownload className="h-4 w-4" /> Export
            </button>
          </div>

          {questions.map((q, i) => (
            <div
              key={i}
              className="bg-white dark:bg-dark-800 rounded-2xl border border-slate-100 dark:border-dark-700 p-6"
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 h-7 w-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-bold text-violet-600 dark:text-violet-400">
                  {i + 1}
                </span>
                <p className="text-slate-900 dark:text-white font-medium">{q.question}</p>
              </div>
              {q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {q.options.map((opt, oi) => {
                    const optLetter = opt.charAt(0);
                    const isCorrect = optLetter === q.correctAnswer;
                    return (
                      <div
                        key={oi}
                        className={`px-4 py-2 rounded-lg text-sm border ${isCorrect ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-semibold' : 'border-slate-200 dark:border-dark-600 text-slate-700 dark:text-slate-300'}`}
                      >
                        {opt}
                      </div>
                    );
                  })}
                </div>
              )}
              {q.explanation && (
                <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                  <HiDocumentText className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">{q.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
