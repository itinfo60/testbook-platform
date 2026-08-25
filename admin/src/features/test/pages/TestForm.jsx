import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { HiAcademicCap, HiArrowLeft, HiCheckCircle, HiPlus, HiTrash, HiUser } from 'react-icons/hi';
import { testsAPI, testSeriesAPI, teachersAPI } from '@/services/api';
import { getUnifiedExams, getUnifiedCategories } from '@/services/categories';
import LoadingSpinner from '@/components/loadingSpinner';
import toast from 'react-hot-toast';

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
    negativeMark: q.negativeMarks || q.negativeMark || 0.66,
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

export default function TestForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'undefined');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 18,
    teacherId: '',
    selectedParentCategory: '',
    category: '',
    testSeries: '',
    sectionTag: 'Chapter Tests (GS)',
    subjectTag: 'Polity of India',
    difficulty: 'medium',
    isFree: false,
    totalMarks: 20,
    questions: [blankQuestion()],
  });

  const [parentCategories, setParentCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [testSeriesList, setTestSeriesList] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit);

  // Filter exams to only show those under the selected parent category
  const filteredExams = useMemo(() => {
    if (!formData.selectedParentCategory) return [];
    return categories.filter((e) => e.parentId === formData.selectedParentCategory);
  }, [formData.selectedParentCategory, categories]);

  useEffect(() => {
    Promise.all([
      getUnifiedExams(),
      getUnifiedCategories(),
      testSeriesAPI.getAll({ limit: 100 }).catch(() => ({ data: { data: { testSeries: [] } } })),
      teachersAPI.getAll({ limit: 200 }).catch(() => ({ data: { data: [] } })),
    ]).then(([cList, pCatList, seriesRes, teacherRes]) => {
      setCategories(cList);
      setParentCategories(Array.isArray(pCatList) ? pCatList : []);

      const sList =
        seriesRes.data?.data?.testSeries ||
        seriesRes.data?.data ||
        seriesRes.data?.testSeries ||
        [];
      setTestSeriesList(Array.isArray(sList) ? sList : []);

      const tList =
        teacherRes.data?.data?.teachers || teacherRes.data?.data || teacherRes.data?.teachers || [];
      setTeachers(Array.isArray(tList) ? tList : []);
    });

    if (isEdit) {
      setPageLoading(true);
      testsAPI
        .getById(id)
        .then((res) => {
          const t = res.data?.data?.test || res.data?.data || res.data?.test;
          if (!t) {
            toast.error('Test not found');
            return;
          }
          setFormData({
            title: t.title || '',
            description: t.description || '',
            duration: t.duration || 18,
            teacherId: t.teacher?.id || t.teacher?._id || t.teacherId || '',
            selectedParentCategory: '',
            category: '',
            _existingCategoryId: t.category?._id || t.category?.id || t.category || '',
            testSeries: t.testSeries?._id || t.testSeries?.id || t.testSeries || '',
            sectionTag: t.sectionTag || 'Chapter Tests (GS)',
            subjectTag: t.subjectTag || 'Polity of India',
            difficulty: t.difficulty || 'medium',
            isFree: t.isFree !== false,
            totalMarks: t.totalMarks || 20,
            questions:
              t.questions?.length > 0 ? t.questions.map(normalizeQuestion) : [blankQuestion()],
          });
        })
        .catch((err) => {
          toast.error(err?.response?.data?.message || 'Failed to load test');
        })
        .finally(() => setPageLoading(false));
    }
  }, [id, isEdit]);

  // Resolve existing category into parent category + exam selections
  useEffect(() => {
    if (!formData._existingCategoryId || parentCategories.length === 0) return;

    const catId = formData._existingCategoryId;

    // Check if catId is an exam
    const matchedExam = categories.find((e) => (e.id || e._id) === catId);
    if (matchedExam) {
      const parentCat = matchedExam.parentId
        ? parentCategories.find((c) => (c.id || c._id) === matchedExam.parentId)
        : null;
      setFormData((prev) => ({
        ...prev,
        selectedParentCategory: parentCat ? parentCat.id || parentCat._id : '',
        category: catId,
        _existingCategoryId: undefined,
      }));
      return;
    }

    // Check if catId is a parent category
    const matchedCategory = parentCategories.find((c) => (c.id || c._id) === catId);
    if (matchedCategory) {
      setFormData((prev) => ({
        ...prev,
        selectedParentCategory: catId,
        category: '',
        _existingCategoryId: undefined,
      }));
      return;
    }

    // Only clear the pending ID after BOTH arrays have loaded (avoid race where exams load later)
    if (categories.length > 0) {
      setFormData((prev) => ({ ...prev, _existingCategoryId: undefined }));
    }
  }, [formData._existingCategoryId, parentCategories, categories]);

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
      ...(formData.teacherId ? { teacherId: formData.teacherId } : {}),
      category: formData.category,
      categoryId: formData.category,
      testSeries: formData.testSeries || undefined,
      testSeriesId: formData.testSeries || undefined,
      sectionTag: formData.sectionTag,
      subjectTag: formData.subjectTag,
      difficulty:
        formData.difficulty === 'easy'
          ? 'beginner'
          : formData.difficulty === 'hard'
            ? 'advanced'
            : 'intermediate',
      isFree: formData.isFree,
      totalMarks: Number(formData.totalMarks) || formData.questions.length * 2,
      passingMarks: Math.ceil((Number(formData.totalMarks) || formData.questions.length * 2) * 0.4),
      questions: formData.questions.map((q) => ({
        question: q.question.trim(),
        type: 'mcq',
        options: q.options.map((opt, idx) => ({
          text: opt.trim(),
          isCorrect: idx === q.correctAnswer,
        })),
        explanation: q.explanation?.trim() || '',
        marks: Number(q.marks) || 2,
        negativeMarks: Number(q.negativeMark) || 0.66,
      })),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await testsAPI.update(id, payload);
        toast.success('Test updated successfully!');
      } else {
        await testsAPI.create(payload);
        toast.success('Test created successfully!');
      }
      navigate('/tests');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save test');
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/tests"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 text-slate-600 dark:text-gray-300 transition-colors"
          >
            <HiArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white font-display">
              {isEdit ? 'Edit Assessment Drill / Test' : 'Create New Assessment Drill / Test'}
            </h2>
            <p className="text-xs text-gray-500 font-normal">
              Configure timing, marking rules, test series linkage, and bilingual questions.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Test Meta Box */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3 flex items-center gap-2">
            <HiAcademicCap className="text-primary-600" /> Test Overview
          </h3>

          {/* Teacher Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
              <HiUser className="text-primary-600" /> Assigned Teacher / Faculty (Optional)
            </label>
            <select
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-medium"
            >
              <option value="">-- Admin / Testbook Faculty --</option>
              {teachers.map((t) => (
                <option key={t.id || t._id} value={t.id || t._id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
            <span className="text-[11px] text-gray-400 font-normal">
              Select which teacher created or is responsible for this test.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Test Title *
            </label>
            <input
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. CT 1: Constituent Assembly & Salient Features"
              className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Category *
              </label>
              <select
                required
                value={formData.selectedParentCategory}
                onChange={(e) =>
                  setFormData({ ...formData, selectedParentCategory: e.target.value, category: '' })
                }
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
              >
                <option value="">— Select Category —</option>
                {parentCategories.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.icon ? `${c.icon} ` : ''}
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Target Exam *
                {filteredExams.length === 0 && formData.selectedParentCategory && (
                  <span className="text-gray-400 font-normal ml-1 text-[10px]">(no exams)</span>
                )}
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                disabled={!formData.selectedParentCategory || filteredExams.length === 0}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white disabled:opacity-50"
              >
                <option value="">— Select Exam —</option>
                {filteredExams.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.icon ? `${c.icon} ` : ''}
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Attach to Test Series (Optional)
              </label>
              <select
                value={formData.testSeries}
                onChange={(e) => setFormData({ ...formData, testSeries: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
              >
                <option value="">-- Standalone Test (No Series) --</option>
                {testSeriesList.map((s) => (
                  <option key={s.id || s._id} value={s.id || s._id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Section Group Tag
              </label>
              <select
                value={formData.sectionTag}
                onChange={(e) => setFormData({ ...formData, sectionTag: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
              >
                <option value="Chapter Tests (GS)">Chapter Tests (GS)</option>
                <option value="Sectional Tests">Sectional Tests</option>
                <option value="Full Length Mock Tests">Full Length Mock Tests</option>
                <option value="Previous Years Papers">Previous Years Papers</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Subject Tag
              </label>
              <input
                value={formData.subjectTag}
                onChange={(e) => setFormData({ ...formData, subjectTag: e.target.value })}
                placeholder="e.g. Polity, History, Science"
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Access Type
              </label>
              <select
                value={formData.isFree ? 'free' : 'paid'}
                onChange={(e) => setFormData({ ...formData, isFree: e.target.value === 'free' })}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-semibold"
              >
                <option value="free">Free Test (Anyone can attempt)</option>
                <option value="paid">Paid / Series Locked</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Instructions & Syllabus (Optional)
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Total 10 questions covering Article 1 to 51A. 2 marks per question, 0.66 negative marking."
              className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Questions Box */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Question Papers & Options ({formData.questions.length})
              </h3>
              <p className="text-xs text-gray-500 font-normal">
                Choose the correct option radio button for automated scoring.
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

          <div className="space-y-6">
            {formData.questions.map((q, qi) => (
              <div
                key={qi}
                className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 px-2.5 py-1 rounded-lg">
                    Question #{qi + 1}
                  </span>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span>Marks:</span>
                      <input
                        type="number"
                        step="0.5"
                        value={q.marks}
                        onChange={(e) => updateQuestion(qi, 'marks', e.target.value)}
                        className="w-12 px-1.5 py-0.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-center"
                      />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span>Negative:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={q.negativeMark}
                        onChange={(e) => updateQuestion(qi, 'negativeMark', e.target.value)}
                        className="w-14 px-1.5 py-0.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-center"
                      />
                    </div>
                    {formData.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qi)}
                        className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                      >
                        <HiTrash className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  required
                  rows={2}
                  value={q.question}
                  onChange={(e) => updateQuestion(qi, 'question', e.target.value)}
                  placeholder="Enter Question Text (Hindi / English supported)..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium"
                />

                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Answer Options:
                  </span>
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={q.correctAnswer === oi}
                        onChange={() => updateQuestion(qi, 'correctAnswer', oi)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        title="Mark as correct option"
                      />
                      <span className="text-xs font-bold text-gray-400 w-4">
                        {String.fromCharCode(65 + oi)}.
                      </span>
                      <input
                        required
                        value={opt}
                        onChange={(e) => updateOption(qi, oi, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        className={`flex-1 px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border rounded-xl text-gray-900 dark:text-white ${
                          q.correctAnswer === oi
                            ? 'border-emerald-500 ring-1 ring-emerald-400'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                    Solution Explanation (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={q.explanation}
                    onChange={(e) => updateQuestion(qi, 'explanation', e.target.value)}
                    placeholder="Detailed solution and official constitutional article references..."
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-normal"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-1.5"
          >
            <HiPlus className="h-4 w-4" /> Add Next Question
          </button>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/tests"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                {isEdit ? 'Update Assessment Test' : 'Publish Test Series Drill'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
