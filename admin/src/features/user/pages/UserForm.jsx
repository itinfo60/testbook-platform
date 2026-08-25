import LoadingSpinner from '@/components/loadingSpinner';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { createUser, updateUser, fetchUserById, clearSelected } from '@/features/user/userSlice';

export default function UserForm() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selected, loading } = useSelector((s) => s.users);
  const isEdit = Boolean(id && id !== 'undefined');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    status: 'active',
  });

  useEffect(() => {
    if (isEdit) dispatch(fetchUserById(id));
    return () => dispatch(clearSelected());
  }, [dispatch, id, isEdit]);

  useEffect(() => {
    if (isEdit && selected) {
      setForm({
        name: selected.name || '',
        email: selected.email || '',
        password: '',
        role: selected.role || 'student',
        status: selected.status || 'active',
      });
    }
  }, [selected, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form };
    if (isEdit && !data.password) delete data.password;

    const action = isEdit ? updateUser({ id, data }) : createUser(data);
    const result = await dispatch(action);
    if (!result.error) navigate('/users');
  };

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  if (isEdit && loading && !selected)
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/users')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit User' : 'Create User'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {isEdit ? 'Update user details' : 'Add a new platform user'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={handleChange('name')}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password {isEdit ? '(leave blank to keep current)' : '*'}
          </label>
          <input
            type="password"
            value={form.password}
            onChange={handleChange('password')}
            className="input-field"
            {...(!isEdit && { required: true })}
            minLength={6}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select value={form.role} onChange={handleChange('role')} className="input-field">
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select value={form.status} onChange={handleChange('status')} className="input-field">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary gap-2">
            <Save className="w-4 h-4" /> {isEdit ? 'Update User' : 'Create User'}
          </button>
          <button type="button" onClick={() => navigate('/users')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
