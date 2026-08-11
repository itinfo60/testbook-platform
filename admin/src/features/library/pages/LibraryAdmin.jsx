import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '@/services/api';

export default function LibraryAdmin() {
  const [resources, setResources] = useState([]);
  const [filters, setFilters] = useState({ category: '', accessLevel: '' });
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    accessLevel: 'all',
    file: null,
  });

  const [categories, setCategories] = useState([]);

  const fetchResources = async () => {
    try {
      const res = await api.get('/library', { params: filters });
      setResources(res.data?.data?.resources || res.data?.resources || []);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data?.categories || res.data?.data?.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchCategories();
  }, [filters]);

  const handleFileChange = (e) => {
    setForm({ ...form, file: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('category', form.category);
    // Split comma-separated tags into individual entries so the server receives an array
    const tagList = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    tagList.forEach((tag) => fd.append('tags', tag));
    fd.append('accessLevel', form.accessLevel);
    if (form.file) fd.append('file', form.file);
    try {
      await api.post('/library', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Resource created');
      fetchResources();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await api.delete(`/library/${id}`);
      toast.success('Deleted');
      fetchResources();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Digital Library Admin</h1>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-4 bg-white dark:bg-gray-800 p-4 rounded shadow"
      >
        <input
          type="text"
          placeholder="Title"
          className="input-field"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <select
          className="input-field"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option value="">Select Exam Category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Tags (comma separated)"
          className="input-field"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
        />
        <select
          value={form.accessLevel}
          onChange={(e) => setForm({ ...form, accessLevel: e.target.value })}
          className="input-field"
        >
          <option value="all">All</option>
          <option value="enrolled">Enrolled</option>
          <option value="premium">Premium</option>
        </select>
        <textarea
          placeholder="Description"
          className="col-span-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input type="file" onChange={handleFileChange} className="col-span-2 dark:text-gray-300" />
        <button type="submit" className="btn-primary col-span-2 py-2">
          Create Resource
        </button>
      </form>

      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Resources</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Access
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Downloads
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {resources.map((r) => (
                <tr
                  key={r._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{r.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {r.category}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {r.accessLevel}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {r.downloadsCount}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <Link
                      to={`/library/${r._id}/download`}
                      className="btn-secondary px-3 py-1 text-xs inline-block mr-2"
                    >
                      Download
                    </Link>
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="btn-secondary text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 px-3 py-1 text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
