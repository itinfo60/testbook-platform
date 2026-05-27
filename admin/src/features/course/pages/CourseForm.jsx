import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { fetchCourseById, clearSelected } from '@/features/course/courseSlice';
import { fetchCategories } from '@/features/category/categorySlice';
import { coursesAPI } from '@/services/api';
import LoadingSpinner from '@/components/loadingSpinner';
import toast from 'react-hot-toast';

export default function CourseForm() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selected, loading } = useSelector((s) => s.courses);
  const { list: categories } = useSelector((s) => s.categories);
  const isEdit = !!id;
  const [saving, setSaving] = useState(false);
  const [thumbnail, setThumbnail] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    shortDescription: '',
    price: 0,
    category: '',
    level: 'beginner',
    language: 'English',
    isFree: false,
  });

  useEffect(() => {
    dispatch(fetchCategories());
    if (isEdit) dispatch(fetchCourseById(id));
    return () => dispatch(clearSelected());
  }, [dispatch, id, isEdit]);

  useEffect(() => {
    if (isEdit && selected) {
      setForm({
        title: selected.title || '',
        description: selected.description || '',
        shortDescription: selected.shortDescription || '',
        price: selected.price || 0,
        category: selected.category?._id || selected.category || '',
        level: selected.level || 'beginner',
        language: selected.language || 'English',
        isFree: selected.isFree || selected.price === 0,
      });
    }
  }, [selected, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) fd.append(k, v);
      });
      if (thumbnail) fd.append('thumbnail', thumbnail);

      if (isEdit) {
        await coursesAPI.update(id, fd);
        toast.success('Course updated');
      } else {
        await coursesAPI.create(fd);
        toast.success('Course created');
      }
      navigate('/courses');
    } catch {
      // handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field) => (e) =>
    setForm({ ...form, [field]: field === 'price' ? Number(e.target.value) : e.target.value });

  if (isEdit && loading && !selected) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/courses')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Edit Course' : 'Create Course'}
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
            onChange={handleChange('title')}
            className="input-field"
            required
            minLength={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Short Description
          </label>
          <input
            type="text"
            value={form.shortDescription}
            onChange={handleChange('shortDescription')}
            className="input-field"
            maxLength={200}
            placeholder="One-line summary shown on course cards"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description *
          </label>
          <textarea
            value={form.description}
            onChange={handleChange('description')}
            className="input-field"
            rows={5}
            required
            minLength={10}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={form.category}
              onChange={handleChange('category')}
              className="input-field"
            >
              <option value="">-- Select --</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Level
            </label>
            <select value={form.level} onChange={handleChange('level')} className="input-field">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Price (₹)
            </label>
            <input
              type="number"
              value={form.price}
              onChange={handleChange('price')}
              className="input-field"
              min={0}
              max={100000}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Language
            </label>
            <select
              value={form.language}
              onChange={handleChange('language')}
              className="input-field"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Tamil">Tamil</option>
              <option value="Telugu">Telugu</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Thumbnail Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnail(e.target.files[0])}
            className="input-field py-2"
          />
          {selected?.thumbnail?.url && !thumbnail && (
            <img
              src={selected.thumbnail.url}
              alt="current"
              className="mt-2 w-32 h-20 object-cover rounded-lg"
            />
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary gap-2">
            <Save className="w-4 h-4" /> {isEdit ? 'Update Course' : 'Create Course'}
          </button>
          <button type="button" onClick={() => navigate('/courses')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
