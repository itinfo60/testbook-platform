import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { testSeriesAPI, examCategoriesAPI } from '@/services/api';
import LoadingSpinner from '@/components/loadingSpinner';

const INITIAL = {
  title: '',
  description: '',
  price: 0,
  examCategory: '',
  isPublished: false,
  isFeatured: false,
};

export default function TestSeriesForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState(INITIAL);
  const [examCategories, setExamCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    examCategoriesAPI
      .getAll({ limit: 200 })
      .then((res) => {
        const cats =
          res.data?.data?.allCategories || res.data?.data?.categories || res.data?.categories || [];
        setExamCategories(cats);
      })
      .catch(console.error);

    if (isEdit) {
      testSeriesAPI
        .getBySlug(id)
        .then((res) => {
          const s = res.data?.data?.testSeries || res.data?.testSeries || res.data?.data || {};
          setForm({
            title: s.title || '',
            description: s.description || '',
            price: s.price || 0,
            examCategory: s.examCategory?._id || s.examCategory || '',
            isPublished: s.isPublished || false,
            isFeatured: s.isFeatured || false,
          });
        })
        .catch(() => toast.error('Failed to load test series'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, examCategory: form.examCategory || undefined };
      if (isEdit) {
        await testSeriesAPI.update(id, payload);
        toast.success('Test series updated');
      } else {
        await testSeriesAPI.create(payload);
        toast.success('Test series created');
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

  if (isEdit && loading)
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Exam Category <span className="text-red-500">*</span>
            </label>
            <select
              value={form.examCategory}
              onChange={set('examCategory')}
              className="input-field"
              required
            >
              <option value="">— Select Exam Category —</option>
              {examCategories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.icon ? `${c.icon} ` : ''}
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Price (₹)
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
        </div>

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
            <Save className="w-4 h-4" /> {isEdit ? 'Update' : 'Create'}
          </button>
          <button type="button" onClick={() => navigate('/test-series')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>

      {isEdit && (
        <div className="card p-5 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
            Adding tests to this series
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Individual tests are added to a test series from the teacher portal at{' '}
            <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">/teacher/tests</code>.
            When creating or editing a test, select this series from the "Test Series" dropdown.
          </p>
        </div>
      )}
    </div>
  );
}
