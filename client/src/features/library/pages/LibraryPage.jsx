import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  HiLibrary,
  HiDownload,
  HiSearch,
  HiDocumentText,
  HiFilm,
  HiPhotograph,
  HiFolder,
  HiPlus,
  HiX,
} from 'react-icons/hi';
import api from '@/services/api';
import toast from 'react-hot-toast';

const FILE_ICONS = {
  'application/pdf': HiDocumentText,
  'video/mp4': HiFilm,
  'image/jpeg': HiPhotograph,
  'image/png': HiPhotograph,
};

const getIcon = (fileType) => FILE_ICONS[fileType] || HiFolder;

export default function LibraryPage() {
  const { user } = useSelector((s) => s.auth);
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    fileUrl: '',
    fileType: 'application/pdf',
    category: '',
    accessLevel: 'all',
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/library');
      setResources(data.data?.resources || data.resources || []);
    } catch {
      toast.error('Failed to load library resources');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.title || !form.fileUrl) {
      toast.error('Title and file URL are required');
      return;
    }
    setUploading(true);
    try {
      await api.post('/library', form);
      toast.success('Resource uploaded successfully');
      setShowUpload(false);
      setForm({
        title: '',
        description: '',
        fileUrl: '',
        fileType: 'application/pdf',
        category: '',
        accessLevel: 'all',
      });
      fetchResources();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (resource) => {
    try {
      const { data } = await api.get(`/library/${resource._id}/download`);
      const url = data.data?.fileUrl || data.fileUrl || resource.fileUrl;
      window.open(url, '_blank');
    } catch {
      // Fallback — open directly
      window.open(resource.fileUrl, '_blank');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await api.delete(`/library/${id}`);
      toast.success('Resource deleted');
      setResources((prev) => prev.filter((r) => r._id !== id));
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filtered = resources.filter(
    (r) =>
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <HiLibrary className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Digital Library</h1>
            <p className="text-sm text-dark-500">Browse and download learning resources</p>
          </div>
        </div>
        {isTeacher && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <HiPlus className="h-4 w-4" /> Add Resource
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400" />
        <input
          type="text"
          placeholder="Search resources..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-white"
        />
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="card p-6 mb-6 border border-primary-200 dark:border-primary-900/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-dark-900 dark:text-white">Add New Resource</h2>
            <button
              onClick={() => setShowUpload(false)}
              className="p-1 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800"
            >
              <HiX className="h-4 w-4 text-dark-500" />
            </button>
          </div>
          <form onSubmit={handleUpload} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="input-field"
                placeholder="Title *"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
              <input
                className="input-field"
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>
            <input
              className="input-field"
              placeholder="File URL *"
              value={form.fileUrl}
              onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
            />
            <input
              className="input-field"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                className="input-field"
                value={form.fileType}
                onChange={(e) => setForm((f) => ({ ...f, fileType: e.target.value }))}
              >
                <option value="application/pdf">PDF</option>
                <option value="video/mp4">Video</option>
                <option value="image/jpeg">Image</option>
                <option value="other">Other</option>
              </select>
              <select
                className="input-field"
                value={form.accessLevel}
                onChange={(e) => setForm((f) => ({ ...f, accessLevel: e.target.value }))}
              >
                <option value="all">All Students</option>
                <option value="enrolled">Enrolled Only</option>
                <option value="premium">Premium Only</option>
              </select>
            </div>
            <button type="submit" disabled={uploading} className="btn-primary w-full">
              {uploading ? 'Uploading...' : 'Upload Resource'}
            </button>
          </form>
        </div>
      )}

      {/* Resource Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-dark-200 dark:bg-dark-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-dark-100 dark:bg-dark-800 rounded w-full mb-1" />
              <div className="h-3 bg-dark-100 dark:bg-dark-800 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <HiLibrary className="h-16 w-16 text-dark-300 dark:text-dark-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dark-700 dark:text-dark-300">
            No resources found
          </h3>
          <p className="text-sm text-dark-500 mt-1">
            {isTeacher
              ? 'Upload the first resource using the button above.'
              : 'Check back later for learning materials.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((resource) => {
            const Icon = getIcon(resource.fileType);
            return (
              <div key={resource._id} className="card p-5 hover:shadow-md transition-all group">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-dark-900 dark:text-white text-sm truncate">
                      {resource.title}
                    </h3>
                    {resource.category && (
                      <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                        {resource.category}
                      </span>
                    )}
                  </div>
                </div>
                {resource.description && (
                  <p className="text-xs text-dark-500 dark:text-dark-400 mb-3 line-clamp-2">
                    {resource.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-dark-400">
                    {resource.downloadsCount || 0} downloads
                  </span>
                  <div className="flex items-center gap-2">
                    {isTeacher && (
                      <button
                        onClick={() => handleDelete(resource._id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <HiX className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(resource)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                    >
                      <HiDownload className="h-4 w-4" /> Download
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
