import { useState, useEffect } from 'react';
import { HiSparkles, HiSave, HiCheckCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { courseAPI } from '@/services/api';

export default function AIQuizGenerator() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ prompt: '', courseId: '', title: '' });
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    courseAPI
      .getTeacherCourses()
      .then(({ data }) => setCourses(data.data?.courses || data.courses || []))
      .catch(() => {});
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.prompt || !form.courseId) {
      toast.error('Prompt and course are required');
      return;
    }
    setLoading(true);
    setQuiz(null);
    setSaved(false);
    try {
      const { data } = await api.post('/ai-quiz/generate', {
        prompt: form.prompt,
        courseId: form.courseId,
        title: form.title || undefined,
      });
      setQuiz(data.data?.quiz || data.quiz);
      toast.success('Quiz generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!quiz) return;
    setSaving(true);
    try {
      await api.post('/ai-quiz/save', {
        title: quiz.title,
        course: form.courseId,
        questions: quiz.questions,
      });
      toast.success('Quiz saved to your quizzes!');
      setSaved(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <HiSparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-dark-900 dark:text-white">
            AI Quiz Generator
          </h1>
          <p className="text-sm text-dark-500">
            Generate a full quiz from a prompt and save it to your course
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">
              Course *
            </label>
            <select
              className="input-field w-full"
              value={form.courseId}
              onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
            >
              <option value="">Select a course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">
              Quiz Title (optional)
            </label>
            <input
              className="input-field w-full"
              placeholder="e.g. Chapter 3 Practice Quiz"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">
            Prompt *
          </label>
          <textarea
            className="input-field w-full min-h-[100px] resize-none"
            placeholder="Describe the quiz you want. e.g. 'Create 5 MCQs on Newton's three laws of motion for high school students, medium difficulty'"
            value={form.prompt}
            onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <HiSparkles className="h-4 w-4" /> Generate Quiz
            </>
          )}
        </button>
      </form>

      {quiz && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-dark-900 dark:text-white">{quiz.title}</h2>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                saved
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default'
                  : 'bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-60'
              }`}
            >
              {saved ? (
                <>
                  <HiCheckCircle className="h-4 w-4" /> Saved
                </>
              ) : (
                <>
                  <HiSave className="h-4 w-4" /> {saving ? 'Saving...' : 'Save to Course'}
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            {(quiz.questions || []).map((q, i) => (
              <div key={i} className="card p-5">
                <div className="flex items-start gap-3 mb-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {i + 1}
                  </span>
                  <p className="text-dark-900 dark:text-white font-medium text-sm">{q.question}</p>
                </div>
                {q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-9">
                    {q.options.map((opt, oi) => {
                      const isCorrect =
                        opt.charAt(0) === q.correctAnswer || opt === q.correctAnswer;
                      return (
                        <div
                          key={oi}
                          className={`px-3 py-2 rounded-lg text-xs border ${
                            isCorrect
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-semibold'
                              : 'border-dark-200 dark:border-dark-700 text-dark-600 dark:text-dark-400'
                          }`}
                        >
                          {opt}
                        </div>
                      );
                    })}
                  </div>
                )}
                {q.explanation && (
                  <p className="ml-9 mt-2 text-xs text-dark-500 dark:text-dark-400 italic">
                    {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
