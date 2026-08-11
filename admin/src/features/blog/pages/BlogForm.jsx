import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { HiArrowLeft, HiSave, HiGlobe } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { blogsAPI, examCategoriesAPI } from '@/services/api';
import LoadingSpinner from '@/components/loadingSpinner';

export default function BlogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      status: 'draft',
      tags: '',
      type: 'article',
      examCategory: '',
      'jobAlert.organization': '',
      'jobAlert.totalVacancies': '',
      'jobAlert.applicationStart': '',
      'jobAlert.applicationEnd': '',
      'jobAlert.examDate': '',
      'jobAlert.officialNotificationUrl': '',
    },
  });

  const selectedType = watch('type');

  useEffect(() => {
    examCategoriesAPI
      .getAll()
      .then((res) => setCategories(res.data?.categories || res.data?.data?.categories || []))
      .catch(console.error);

    if (isEdit) {
      blogsAPI
        .getById(id)
        .then((res) => {
          const b = res.data.data.blog || res.data.blog;
          reset({
            ...b,
            tags: b.tags?.join(', ') || '',
            examCategory: b.examCategory?._id || b.examCategory || '',
            'jobAlert.organization': b.jobAlert?.organization || '',
            'jobAlert.totalVacancies': b.jobAlert?.totalVacancies || '',
            'jobAlert.applicationStart': b.jobAlert?.applicationStart
              ? new Date(b.jobAlert.applicationStart).toISOString().split('T')[0]
              : '',
            'jobAlert.applicationEnd': b.jobAlert?.applicationEnd
              ? new Date(b.jobAlert.applicationEnd).toISOString().split('T')[0]
              : '',
            'jobAlert.examDate': b.jobAlert?.examDate
              ? new Date(b.jobAlert.examDate).toISOString().split('T')[0]
              : '',
            'jobAlert.officialNotificationUrl': b.jobAlert?.officialNotificationUrl || '',
          });
        })
        .catch(() => toast.error('Failed to load blog'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        tags: data.tags
          ? data.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };

      if (isEdit) {
        await blogsAPI.update(id, payload);
        toast.success('Post updated');
      } else {
        await blogsAPI.create(payload);
        toast.success('Post created');
      }
      navigate('/blogs');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save post');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/blogs"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
        >
          <HiArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Edit Post' : 'Create New Post'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  {...register('title', { required: 'Title is required' })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="E.g., RPSC Grade 1 Vacancy Out"
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  {...register('slug', { required: 'Slug is required' })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="rpsc-grade-1-vacancy"
                />
                {errors.slug && <p className="text-sm text-red-500 mt-1">{errors.slug.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Excerpt
              </label>
              <textarea
                {...register('excerpt')}
                rows={2}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Brief summary of the post..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content * (Markdown / HTML)
              </label>
              <textarea
                {...register('content', { required: 'Content is required' })}
                rows={12}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                placeholder="Write your content here..."
              />
              {errors.content && (
                <p className="text-sm text-red-500 mt-1">{errors.content.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  {...register('tags')}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="rpsc, job alert, update"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content Type
                </label>
                <select
                  {...register('type')}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="article">Article</option>
                  <option value="job_alert">Job Alert</option>
                  <option value="current_affairs">Current Affairs</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Related Exam (Optional)
                </label>
                <select
                  {...register('examCategory')}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">None / General</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Job Alert Fields — shown only when type is 'job_alert' */}
            {selectedType === 'job_alert' && (
              <div className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                  Job Alert Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Organization
                    </label>
                    <input
                      type="text"
                      {...register('jobAlert.organization')}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., RSMSSB"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Total Vacancies
                    </label>
                    <input
                      type="number"
                      {...register('jobAlert.totalVacancies')}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., 5546"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Application Start
                    </label>
                    <input
                      type="date"
                      {...register('jobAlert.applicationStart')}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Application End
                    </label>
                    <input
                      type="date"
                      {...register('jobAlert.applicationEnd')}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Exam Date
                    </label>
                    <input
                      type="date"
                      {...register('jobAlert.examDate')}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Official Notification URL
                    </label>
                    <input
                      type="url"
                      {...register('jobAlert.officialNotificationUrl')}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/blogs" className="btn-outline">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex items-center gap-2"
          >
            <HiSave className="w-5 h-5" />
            {submitting ? 'Saving...' : 'Save Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
