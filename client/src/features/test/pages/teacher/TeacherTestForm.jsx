import { Input } from '@/components/ui';
import { HiAcademicCap, HiArrowLeft, HiCheckCircle, HiPlus, HiTrash } from 'react-icons/hi';
import { Button } from '@/components/ui';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createTest, updateTest, fetchTestById, clearCurrentTest } from '@/features/test/testSlice';
import { examCategoryAPI, testAPI } from '@/services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Link } from 'react-router-dom';

const normalizeQuestion = (q) => {
  let options = ['', '', '', ''];
  let correctAnswer = 0;

  if (Array.isArray(q.options)) {
    if (q.options.length > 0 && typeof q.options[0] === 'object' && q.options[0] !== null) {
      options = q.options.map((o) => o.text || '');
      correctAnswer = q.options.findIndex((o) => o.isCorrect === true);
      if (correctAnswer < 0) correctAnswer = 0;
    } else {
      options = q.options.map((o) => String(o));
      correctAnswer = typeof q.correctAnswer === 'number' ? q.correctAnswer : 0;
    }
  }

  return {
    question: q.question || q.text || '',
    options: options.length >= 4 ? options : [...options, '', '', '', ''].slice(0, 4),
    correctAnswer,
    explanation: q.explanation || '',
    marks: q.marks || 2,
    negativeMark: q.negativeMark || 0.66,
  };
};

const blankQuestion = () => ({
  question: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  explanation: '',
  marks: 2,
  negativeMark: 0.66,
});

export default function TeacherTestForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentTest, loading } = useSelector((state) => state.tests);
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 18,
    category: '',
    testSeries: '',
    sectionTag: 'Chapter Tests (GS)',
    subjectTag: 'Polity of India',
    difficulty: 'medium',
    isFree: true,
    totalMarks: 20,
    questions: [blankQuestion()],
  });

  const [categories, setCategories] = useState([]);
  const [testSeriesList, setTestSeriesList] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(clearCurrentTest());
    if (isEdit) dispatch(fetchTestById(id));

    Promise.all([
      getUnifiedExamCategories(),
      testSeriesAPI.getAll({ limit: 100 }).catch(() => ({ data: { data: { testSeries: [] } } })),
    ]).then(([cList, seriesRes]) => {
      setCategories(cList);

      const sList =
        seriesRes.data?.data?.testSeries ||
        seriesRes.data?.data ||
        seriesRes.data?.testSeries ||
        [];
      setTestSeriesList(Array.isArray(sList) ? sList : []);
    });
  }, [dispatch, id, isEdit]);

  useEffect(() => {
    if (isEdit && currentTest) {
      setFormData({
        title: currentTest.title || '',
        description: currentTest.description || '',
        duration: currentTest.duration || 18,
        category: currentTest.category?._id || currentTest.category || '',
        testSeries: currentTest.testSeries?._id || currentTest.testSeries || '',
        sectionTag: currentTest.sectionTag || 'Chapter Tests (GS)',
        subjectTag: currentTest.subjectTag || 'Polity of India',
        difficulty: currentTest.difficulty || 'medium',
        isFree: currentTest.isFree !== false,
        totalMarks: currentTest.totalMarks || 20,
        questions:
          currentTest.questions?.length > 0
            ? currentTest.questions.map(normalizeQuestion)
            : [blankQuestion()],
      });
    }
  }, [isEdit, currentTest]);

  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, blankQuestion()],
    }));
  };

  const updateQuestion = (qi, field, value) => {
    const updated = [...formData.questions];
    updated[qi] = { ...updated[qi], [field]: value };
    setFormData((prev) => ({ ...prev, questions: updated }));
  };

  const updateOption = (qi, oi, value) => {
    const updated = [...formData.questions];
    const newOptions = [...updated[qi].options];
    newOptions[oi] = value;
    updated[qi] = { ...updated[qi], options: newOptions };
    setFormData((prev) => ({ ...prev, questions: updated }));
  };

  const removeQuestion = (qi) => {
    if (formData.questions.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== qi),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Test title is required');
      return;
    }
    if (!formData.category) {
      toast.error('Please select an Exam Category');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      duration: Number(formData.duration) || 18,
      category: formData.category,
      testSeries: formData.testSeries || undefined,
      sectionTag: formData.sectionTag,
      subjectTag: formData.subjectTag,
      difficulty: formData.difficulty,
      isFree: formData.isFree,
      totalMarks: Number(formData.totalMarks) || formData.questions.length * 2,
      questions: formData.questions.map((q) => ({
        question: q.question.trim(),
        options: q.options.map((opt, idx) => ({
          text: opt.trim(),
          isCorrect: idx === q.correctAnswer,
        })),
        explanation: q.explanation?.trim() || '',
        marks: Number(q.marks) || 2,
        negativeMark: Number(q.negativeMark) || 0.66,
      })),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await dispatch(updateTest({ id, ...payload })).unwrap();
        toast.success('Test updated successfully!');
      } else {
        await dispatch(createTest(payload)).unwrap();
        toast.success('Test created successfully!');
      }
      navigate('/teacher/tests');
    } catch (err) {
      toast.error(err?.message || err || 'Failed to save test');
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && loading && !currentTest) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/teacher/tests"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 text-slate-600 dark:text-dark-300 transition-colors"
          >
            <HiArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white font-display">
              {isEdit ? 'Edit Assessment Drill / Test' : 'Create New Assessment Drill / Test'}
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Configure timing, marking rules, test series linkage, and bilingual questions.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Test Meta Box */}
        <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 border border-slate-200 dark:border-dark-800 shadow-sm space-y-4">
          <h3 className="font-bold text-dark-900 dark:text-white border-b border-slate-100 dark:border-dark-800 pb-3 flex items-center gap-2">
            <HiAcademicCap className="text-primary-600" /> Test Overview
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Test Title *
            </label>
            <input
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. CT 1: Constituent Assembly & Salient Features"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Exam Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white font-medium"
              >
                <option value="">-- Select Exam Category --</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Link to Test Series Package (Optional)
              </label>
              <select
                value={formData.testSeries}
                onChange={(e) => setFormData({ ...formData, testSeries: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white font-medium"
              >
                <option value="">-- Standalone Test (No Package) --</option>
                {testSeriesList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Section Group Tag
              </label>
              <select
                value={formData.sectionTag}
                onChange={(e) => setFormData({ ...formData, sectionTag: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white"
              >
                <option value="Chapter Tests (GS)">Chapter Tests (GS)</option>
                <option value="Rajasthan GK">Rajasthan GK</option>
                <option value="Subject Tests">Subject Tests</option>
                <option value="Full Mock Tests">Full Mock Tests</option>
                <option value="Previous Year Papers">Previous Year Papers</option>
                <option value="Mental Ability">Mental Ability</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject / Topic Tag
              </label>
              <input
                value={formData.subjectTag}
                onChange={(e) => setFormData({ ...formData, subjectTag: e.target.value })}
                placeholder="e.g. Polity of India"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Duration (Mins)
              </label>
              <input
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white font-semibold"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={formData.isFree}
                onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              Free Demo Test (Open to all students)
            </label>
          </div>
        </div>

        {/* Question Builder */}
        <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 border border-slate-200 dark:border-dark-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-800 pb-3">
            <div>
              <h3 className="font-bold text-dark-900 dark:text-white text-base">
                Questions ({formData.questions.length})
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Set positive marks, negative marks penalty, and detailed solution notes.
              </p>
            </div>
            <button
              type="button"
              onClick={addQuestion}
              className="bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-950/40 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <HiPlus className="h-4 w-4" /> Add Question
            </button>
          </div>

          <div className="space-y-5">
            {formData.questions.map((q, qi) => (
              <div
                key={qi}
                className="p-4 rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50/50 dark:bg-dark-800/40 space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 px-2.5 py-1 rounded-lg">
                    Question #{qi + 1}
                  </span>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-slate-400 font-medium">+Marks:</span>
                      <input
                        type="number"
                        step="0.5"
                        value={q.marks}
                        onChange={(e) => updateQuestion(qi, 'marks', e.target.value)}
                        className="w-14 px-1.5 py-0.5 text-xs bg-white dark:bg-dark-900 border rounded-md text-center font-bold"
                      />
                    </div>

                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-slate-400 font-medium">-Negative:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={q.negativeMark}
                        onChange={(e) => updateQuestion(qi, 'negativeMark', e.target.value)}
                        className="w-14 px-1.5 py-0.5 text-xs bg-white dark:bg-dark-900 border rounded-md text-center font-bold text-rose-600"
                      />
                    </div>

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
                </div>

                {/* Question Text */}
                <textarea
                  required
                  rows={2}
                  value={q.question}
                  onChange={(e) => updateQuestion(qi, 'question', e.target.value)}
                  placeholder="Enter question text (Hindi or English supported)..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white font-medium"
                />

                {/* Options */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Options & Correct Answer Choice:
                  </span>
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={q.correctAnswer === oi}
                        onChange={() => updateQuestion(qi, 'correctAnswer', oi)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        title="Mark as correct answer"
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

                {/* Solution Explanation */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Explanation / Solution Details (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={q.explanation}
                    onChange={(e) => updateQuestion(qi, 'explanation', e.target.value)}
                    placeholder="Provide reasoning or reference article for students after submitting..."
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

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-dark-800">
          <Link
            to="/teacher/tests"
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
                {isEdit ? 'Update Assessment Test' : 'Publish Assessment Test'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
