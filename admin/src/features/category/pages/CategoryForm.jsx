import LoadingSpinner from '@/components/loadingSpinner';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { createCategory, updateCategory } from '@/features/category/categorySlice';
import { examCategoriesAPI } from '@/services/api';

export default function CategoryForm() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'undefined');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ name: '', description: '', icon: '' });

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      examCategoriesAPI
        .getById(id)
        .then((res) => {
          const cat = res.data.data.category || res.data.data;
          setForm({
            name: cat.name || '',
            description: cat.description || '',
            icon: cat.icon || '',
          });
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const action = isEdit ? updateCategory({ id, data: form }) : createCategory(form);
    const result = await dispatch(action);
    if (!result.error) navigate('/categories');
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
          onClick={() => navigate('/categories')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Edit Category' : 'Create Category'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input-field"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Icon (emoji or icon name)
          </label>
          <input
            type="text"
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            className="input-field"
            placeholder="📚"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary gap-2">
            <Save className="w-4 h-4" /> {isEdit ? 'Update' : 'Create'}
          </button>
          <button type="button" onClick={() => navigate('/categories')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
