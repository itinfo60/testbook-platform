import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiPlus, HiPencilAlt, HiTrash, HiEye, HiGlobe, HiLockClosed } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { blogsAPI } from '@/services/api';
import LoadingSpinner from '@/components/loadingSpinner';

export default function JobAlertList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBlogs = async () => {
    try {
      const res = await blogsAPI.getAll({ limit: 50, type: 'job_alert' });
      const fetched = res.data?.data?.blogs || res.data?.data || [];
      setBlogs(fetched);
    } catch (err) {
      toast.error('Failed to fetch job alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job alert?')) return;
    try {
      await blogsAPI.delete(id);
      toast.success('Job alert deleted');
      fetchBlogs();
    } catch (err) {
      toast.error('Failed to delete job alert');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Alerts</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage recruitment updates and job alerts
          </p>
        </div>
        <Link to="/blogs/create" className="btn-primary">
          <HiPlus className="w-5 h-5 mr-2" />
          Create Job Alert
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Alert Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Tags
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Views
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {blogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No job alerts found. Create your first job alert.
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr
                    key={blog.id || blog._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                        {blog.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(blog.tags || []).map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-[10px] font-medium uppercase"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {blog.status === 'published' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                          <HiGlobe className="w-4 h-4" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                          <HiLockClosed className="w-4 h-4" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <HiEye className="w-4 h-4" /> {blog.views || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          to={`/blogs/${blog.id || blog._id}/edit`}
                          className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400"
                        >
                          <HiPencilAlt className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(blog.id || blog._id)}
                          className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                        >
                          <HiTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
