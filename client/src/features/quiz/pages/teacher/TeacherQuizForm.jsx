import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import {
  HiAcademicCap,
  HiArrowLeft,
  HiCheckCircle,
  HiLightningBolt,
  HiPlus,
  HiPuzzle,
  HiTrash,
} from 'react-icons/hi';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createQuiz, updateQuiz } from '@/features/quiz/quizSlice';
import { courseAPI, quizAPI } from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const normalizeQuestion = (q) => {
  let options = ['', '', '', ''];
  let correctAnswer = 0;
  if (Array.isArray(q.options) && q.options.length > 0) {
    if (typeof q.options[0] === 'object' && q.options[0] !== null) {
      options = q.options.map((o) => o.text || '');
      const ci = q.options.findIndex((o) => o.isCorrect === true);
      correctAnswer = ci >= 0 ? ci : 0;
    } else {
      options = q.options.map((o) => String(o));
      correctAnswer = typeof q.correctAnswer === 'number' ? q.correctAnswer : 0;
    }
  }
  return {
    question: q.question || '',
    options: options.length >= 4 ? options : [...options, '', '', '', ''].slice(0, 4),
    correctAnswer,
    explanation: q.explanation || '',
  };
};

const blankQuestion = () => ({
  question: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  explanation: '',
});

export default function TeacherQuizForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isEdit = !!id;

  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pageLoading, setPageLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: 'Daily practice quiz with instant explanations and rank tracking.',
    type: 'daily', // 'daily' or 'course'
    courseId: '',
    examCategory: '',
    duration: 10,
    passingScore: 60,
    isPublished: true,
    questions: [blankQuestion()],
  });

  // Load teacher's courses & exam categories
  useEffect(() => {
    Promise.all([
      courseAPI.getTeacherCourses().catch(() => ({ data: { data: [] } })),
      getUnifiedExamCategories(),
    ]).then(([courseRes, catList]) => {
      const cData = courseRes.data?.data;
      setCourses(Array.isArray(cData) ? cData : cData?.courses || []);
      setCategories(catList);
    });
  }, []);

  // Load existing quiz for edit
  useEffect(() => {
    if (!isEdit) return;
    setPageLoading(true);
    quizAPI
      .getById(id)
      .then((res) => {
        const quiz = res.data?.data?.quiz || res.data?.data;
        if (!quiz) {
          toast.error('Quiz not found');
          return;
        }
        setFormData({
          title: quiz.title || '',
          description: quiz.description || '',
          type: quiz.type || (quiz.course ? 'course' : 'daily'),
          courseId: quiz.course?._id || (typeof quiz.course === 'string' ? quiz.course : ''),
          examCategory: quiz.examCategory?._id || quiz.examCategory || '',
          duration: quiz.duration || 10,
          passingScore: quiz.passingScore ?? 60,
          isPublished: quiz.isPublished !== false,
          questions:
            quiz.questions?.length > 0 ? quiz.questions.map(normalizeQuestion) : [blankQuestion()],
        });
      })
      .catch((err) => {
        const msg = err.response?.data?.message || err.message || 'Failed to load quiz';
        toast.error(msg);
      })
      .finally(() => setPageLoading(false));
  }, [id, isEdit]);

  const addQuestion = () =>
    setFormData((f) => ({ ...f, questions: [...f.questions, blankQuestion()] }));

  const updateQuestion = (qi, field, value) =>
    setFormData((f) => {
      const qs = [...f.questions];
      qs[qi] = { ...qs[qi], [field]: value };
      return { ...f, questions: qs };
    });

  const updateOption = (qi, oi, value) =>
    setFormData((f) => {
      const qs = [...f.questions];
      const opts = [...qs[qi].options];
      opts[oi] = value;
      qs[qi] = { ...qs[qi], options: opts };
      return { ...f, questions: qs };
    });

  const removeQuestion = (qi) => {
    if (formData.questions.length <= 1) return;
    setFormData((f) => ({
      ...f,
      questions: f.questions.filter((_, i) => i !== qi),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Quiz title is required');
      return;
    }
    if (formData.type === 'course' && !formData.courseId) {
      toast.error('Please select a course for course quizzes');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      type: formData.type,
      course: formData.type === 'course' ? formData.courseId : undefined,
      examCategory: formData.examCategory || undefined,
      duration: Number(formData.duration) || 10,
      passingScore: Number(formData.passingScore) || 60,
      isPublished: formData.isPublished,
      questions: formData.questions.map((q) => ({
        question: q.question.trim(),
        options: q.options.map((text, i) => ({
          text: text.trim(),
          isCorrect: i === q.correctAnswer,
        })),
        explanation: q.explanation?.trim() || '',
      })),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await dispatch(updateQuiz({ id, ...payload })).unwrap();
        toast.success('Quiz updated successfully!');
      } else {
        await dispatch(createQuiz(payload)).unwrap();
        toast.success('Quiz created and published!');
      }
      navigate('/teacher/quizzes');
    } catch (err) {
      toast.error(err?.message || err || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/teacher/quizzes"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 text-slate-600 dark:text-dark-300 transition-colors"
          >
            <HiArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white font-display">
              {isEdit ? 'Edit Quiz' : 'Create New Interactive Quiz'}
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Publish timed daily challenges or chapter knowledge checks.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type Switcher */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'daily' })}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              formData.type === 'daily'
                ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 shadow-xs'
                : 'border-slate-200 dark:border-dark-800 hover:bg-slate-50'
            }`}
          >
            <div className="font-bold text-sm text-dark-900 dark:text-white mb-0.5 flex items-center gap-1.5">
              <HiLightningBolt className="text-amber-500" /> Daily Challenge Quiz
            </div>
            <div className="text-[11px] text-slate-500 font-normal">
              Featured on the homepage & /daily-quiz challenge banner.
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'course' })}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              formData.type === 'course'
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-xs'
                : 'border-slate-200 dark:border-dark-800 hover:bg-slate-50'
            }`}
          >
            <div className="font-bold text-sm text-dark-900 dark:text-white mb-0.5 flex items-center gap-1.5">
              <HiAcademicCap className="text-indigo-500" /> Course Module Quiz
            </div>
            <div className="text-[11px] text-slate-500 font-normal">
              Attached to a specific course batch for enrolled students.
            </div>
          </button>
        </div>

        {/* Basic Configuration */}
        <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 border border-slate-200 dark:border-dark-800 shadow-sm space-y-4">
          <h3 className="font-bold text-dark-900 dark:text-white border-b border-slate-100 dark:border-dark-800 pb-3 flex items-center gap-2">
            <HiPuzzle className="text-primary-600" /> Quiz Details
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Quiz Title *
            </label>
            <input
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={
                formData.type === 'daily'
                  ? "Today's Daily Challenge — Rajasthan GK & Current Affairs"
                  : 'Module 1 Practice Quiz'
              }
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Short Description / Tagline
            </label>
            <input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="10 questions · 10 minutes · Instant results & solutions"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {formData.type === 'course' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Attached Course *
                </label>
                <select
                  required
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white"
                >
                  <option value="">-- Select Course --</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Exam (Optional)
                </label>
                <select
                  value={formData.examCategory}
                  onChange={(e) => setFormData({ ...formData, examCategory: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white"
                >
                  <option value="">-- All Exams / General --</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Passing Score (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.passingScore}
                onChange={(e) => setFormData({ ...formData, passingScore: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Questions Builder */}
        <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 border border-slate-200 dark:border-dark-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-800 pb-3">
            <div>
              <h3 className="font-bold text-dark-900 dark:text-white text-base">
                Quiz Questions ({formData.questions.length})
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Select the correct answer option using the radio buttons on the left.
              </p>
            </div>
            <button
              type="button"
              onClick={addQuestion}
              className="bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-950/40 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <HiPlus className="h-4 w-4" /> Add Question
            </button>
          </div>

          <div className="space-y-4">
            {formData.questions.map((q, qi) => (
              <div
                key={qi}
                className="p-4 rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50/50 dark:bg-dark-800/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg">
                    Question #{qi + 1}
                  </span>

                  {formData.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qi)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete Question"
                    >
                      <HiTrash className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <textarea
                  required
                  rows={2}
                  value={q.question}
                  onChange={(e) => updateQuestion(qi, 'question', e.target.value)}
                  placeholder="Enter question text..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white font-medium"
                />

                {/* Options with radio button */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Select Correct Answer Choice:
                  </span>
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`quiz-correct-${qi}`}
                        checked={q.correctAnswer === oi}
                        onChange={() => updateQuestion(qi, 'correctAnswer', oi)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        title="Mark as correct option"
                      />
                      <span className="text-xs font-bold text-slate-400 w-4">
                        {String.fromCharCode(65 + oi)}.
                      </span>
                      <input
                        required
                        value={opt}
                        onChange={(e) => updateOption(qi, oi, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        className={`flex-1 px-3 py-1.5 text-xs bg-white dark:bg-dark-900 border rounded-xl text-dark-900 dark:text-white ${
                          q.correctAnswer === oi
                            ? 'border-emerald-500 ring-1 ring-emerald-400'
                            : 'border-slate-200 dark:border-dark-700'
                        }`}
                      />
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Solution Explanation (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={q.explanation}
                    onChange={(e) => updateQuestion(qi, 'explanation', e.target.value)}
                    placeholder="Provide solution details or concept reference..."
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white font-normal"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-dark-700 rounded-xl text-xs font-semibold text-slate-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-1.5"
          >
            <HiPlus className="h-4 w-4" /> Add Next Question
          </button>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-dark-800">
          <Link
            to="/teacher/quizzes"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? (
              'Saving...'
            ) : (
              <>
                <HiCheckCircle className="h-4 w-4" />
                {isEdit ? 'Update Quiz' : 'Publish Quiz'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
