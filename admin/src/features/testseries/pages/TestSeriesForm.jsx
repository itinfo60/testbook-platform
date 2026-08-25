import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { testSeriesAPI } from '@/services/api';
import { getUnifiedCategories, getUnifiedExams } from '@/services/categories';
import LoadingSpinner from '@/components/loadingSpinner';

const INITIAL = {
  title: '',
  description: '',
  price: 0,
  selectedCategory: '',
  selectedExam: '',
  tests: [],
  isPublished: false,
  isFeatured: false,
};

export default function TestSeriesForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'undefined');

  const [form, setForm] = useState(INITIAL);
  const [categories, setCategories] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // Load categories and exams
  useEffect(() => {
    getUnifiedCategories()
      .then((list) => setCategories(Array.isArray(list) ? list : []))
      .catch(() => {});

    getUnifiedExams()
      .then((list) => setExams(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, []);

  // Load existing test series data and resolve category/exam selection
  useEffect(() => {
    if (!isEdit) return;

    testSeriesAPI
      .getBySlug(id)
      .then((res) => {
        const s = res.data?.data?.testSeries || res.data?.testSeries || res.data?.data || {};
        const selectedTests = Array.isArray(s.tests)
          ? s.tests.map((t) => (typeof t === 'string' ? t : t.id || t._id))
          : [];

        const existingCategoryId =
          s.categoryId ||
          s.examCategory?._id ||
          s.examCategory?.id ||
          s.examCategory ||
          s.category?.id ||
          '';

        setForm((prev) => ({
          ...prev,
          title: s.title || '',
          description: s.description || '',
          price: s.price || 0,
          _existingCategoryId: existingCategoryId,
          tests: selectedTests,
          isPublished: s.isPublished !== undefined ? Boolean(s.isPublished) : false,
          isFeatured: s.isFeatured !== undefined ? Boolean(s.isFeatured) : false,
        }));
      })
      .catch(() => toast.error('Failed to load test series'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  // Once both categories + exams are loaded and we have an existing categoryId, resolve the dropdowns
  useEffect(() => {
    if (!form._existingCategoryId || categories.length === 0) return;

    const catId = form._existingCategoryId;

    // Check if catId is an exam
    const matchedExam = exams.find((e) => (e.id || e._id) === catId);
    if (matchedExam) {
      // Find the parent category of this exam
      const parentCat = matchedExam.parentId
        ? categories.find((c) => (c.id || c._id) === matchedExam.parentId)
        : null;
      setForm((prev) => ({
        ...prev,
        selectedCategory: parentCat ? parentCat.id || parentCat._id : '',
        selectedExam: catId,
        _existingCategoryId: undefined,
      }));
      return;
    }

    // Check if catId is a category itself
    const matchedCategory = categories.find((c) => (c.id || c._id) === catId);
    if (matchedCategory) {
      setForm((prev) => ({
        ...prev,
        selectedCategory: catId,
        selectedExam: '',
        _existingCategoryId: undefined,
      }));
      return;
    }

    // Only clear once both arrays have loaded to avoid race condition
    if (exams.length > 0) {
      setForm((prev) => ({ ...prev, _existingCategoryId: undefined }));
    }
  }, [form._existingCategoryId, categories, exams]);

  // Filter exams based on selected category
  const filteredExams = useMemo(() => {
    if (!form.selectedCategory) return [];
    return exams.filter((e) => e.parentId === form.selectedCategory);
  }, [form.selectedCategory, exams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!form.selectedCategory) {
      toast.error('Category is required');
      return;
    }

    setSaving(true);
    try {
      // Use exam ID if selected, otherwise use category ID
      const resolvedCategoryId = form.selectedExam || form.selectedCategory;
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price) || 0,
        categoryId: resolvedCategoryId,
        category: resolvedCategoryId,
        examCategory: resolvedCategoryId,
        tests: form.tests,
        isPublished: form.isPublished,
        isFeatured: form.isFeatured,
      };

      if (isEdit) {
        await testSeriesAPI.update(id, payload);
        toast.success('Test series updated successfully');
      } else {
        await testSeriesAPI.create(payload);
        toast.success('Test series created successfully');
      }
      navigate('/test-series');
    } catch {
      // handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => {
    const val =
      e.target.type === 'checkbox'
        ? e.target.checked
        : field === 'price'
          ? Number(e.target.value)
          : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
  };

  const handleCategoryChange = (e) => {
    const catId = e.target.value;
    // When category changes, reset exam selection
    setForm((f) => ({ ...f, selectedCategory: catId, selectedExam: '' }));
  };

  if (isEdit && loading)
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/test-series')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Edit Test Series' : 'Create Test Series'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={set('title')}
            className="input-field"
            required
            minLength={3}
            placeholder="e.g., RAS Prelims Full Mock Test Series 2026"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={set('description')}
            className="input-field"
            rows={4}
            placeholder="Describe what's included in this test series..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={form.selectedCategory}
              onChange={handleCategoryChange}
              className="input-field"
              required
            >
              <option value="">— Select Category —</option>
              {categories.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.icon ? `${c.icon} ` : ''}
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Exam dropdown — only shows exams under the selected category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Exam
              {filteredExams.length === 0 && form.selectedCategory && (
                <span className="text-gray-400 font-normal ml-1 text-xs">
                  (no exams under this category)
                </span>
              )}
            </label>
            <select
              value={form.selectedExam}
              onChange={set('selectedExam')}
              className="input-field"
              disabled={!form.selectedCategory || filteredExams.length === 0}
            >
              <option value="">— Select Exam —</option>
              {filteredExams.map((e) => (
                <option key={e.id || e._id} value={e.id || e._id}>
                  {e.icon ? `${e.icon} ` : ''}
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Package Price (₹)
          </label>
          <input
            type="number"
            value={form.price}
            onChange={set('price')}
            className="input-field"
            min={0}
            max={100000}
          />
          <p className="text-xs text-gray-400 mt-1">Set 0 for free access</p>
        </div>

        {/* Linked Tests Summary Banner */}
        {isEdit && (
          <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500 shrink-0" />
              <span>
                <strong>{form.tests?.length || 0}</strong> Mock Tests are currently linked to this
                package.
              </span>
            </div>
            <span className="text-gray-500 dark:text-gray-400 text-xs">
              Tests are linked directly when editing individual Mock Tests
            </span>
          </div>
        )}

        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={set('isPublished')}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Published (visible to students)
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={set('isFeatured')}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Featured</span>
          </label>
        </div>

        <div className="flex gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button type="submit" disabled={saving} className="btn-primary gap-2">
            <Save className="w-4 h-4" /> {isEdit ? 'Update Test Series' : 'Create Test Series'}
          </button>
          <button type="button" onClick={() => navigate('/test-series')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
