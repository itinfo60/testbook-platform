import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { HiPlus, HiPencilAlt, HiTrash, HiEye, HiGlobe, HiLockClosed } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { blogsAPI } from '@/services/api';
import LoadingSpinner from '@/components/loadingSpinner';
import useDebounce from '@/hooks/useDebounce';

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'article', label: 'Articles' },
  { value: 'job_alert', label: 'Job Alerts' },
  { value: 'current_affairs', label: 'Current Affairs' },
];

const TYPE_BADGE = {
  article: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  job_alert: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  current_affairs: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debouncedSearch = useDebounce(search);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await blogsAPI.getAll({
        page,
        limit: 15,
        search: debouncedSearch || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      });
      const data = res.data?.data || res.data || {};
      setBlogs(data.blogs || data.docs || []);
      setTotalPages(data.pagination?.pages || data.pages || 1);
    } catch {
      toast.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, typeFilter, statusFilter]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await blogsAPI.delete(id);
      toast.success('Post deleted');
      fetchBlogs();
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const handleToggleStatus = async (blog) => {
    const newStatus = blog.status === 'published' ? 'draft' : 'published';
    try {
      await blogsAPI.update(blog._id, { status: newStatus });
      toast.success(`Post ${newStatus}`);
      fetchBlogs();
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (loading && blogs.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blogs & Articles</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage content, news, and recruitment updates
          </p>
        </div>
        <Link to="/blogs/create" className="btn-primary gap-2">
          <HiPlus className="w-5 h-5" /> Create Post
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search posts..."
          className="input-field w-56 py-2"
        />
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="input-field w-44 py-2"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="input-field w-40 py-2"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Type
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
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : blogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No posts found. Create your first post.
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                        {blog.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${TYPE_BADGE[blog.type] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {blog.type?.replace('_', ' ') || 'article'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(blog)}
                        className="inline-flex items-center gap-1 text-xs font-medium hover:opacity-75 transition-opacity"
                        title="Toggle publish status"
                      >
                        {blog.status === 'published' ? (
                          <>
                            <HiGlobe className="w-4 h-4 text-green-600" />{' '}
                            <span className="text-green-600">Published</span>
                          </>
                        ) : (
                          <>
                            <HiLockClosed className="w-4 h-4 text-gray-400" />{' '}
                            <span className="text-gray-500">Draft</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <HiEye className="w-4 h-4" /> {blog.views || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          to={`/blogs/${blog._id}/edit`}
                          className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400"
                        >
                          <HiPencilAlt className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(blog._id)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
