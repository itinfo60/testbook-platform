import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { HiArrowLeft, HiSave, HiGlobe, HiDocumentText, HiCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api, { blogsAPI } from '@/services/api';
import { getUnifiedCategories, getUnifiedExams } from '@/services/categories';
import LoadingSpinner from '@/components/loadingSpinner';
import FileUploadInput from '@/components/FileUploadInput';

export default function BlogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'undefined');
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedParentCategory, setSelectedParentCategory] = useState('');

  // Library resources for attachment
  const [libraryResources, setLibraryResources] = useState([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      slug: '',
      coverImageUrl: '',
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
  const currentExamCategory = watch('examCategory');

  // Filter exams based on selected parent category
  const filteredExams = (exams || []).filter(
    (e) => !selectedParentCategory || e.parentId === selectedParentCategory
  );

  useEffect(() => {
    // Load categories, exams, and library resources
    Promise.all([
      getUnifiedCategories(),
      getUnifiedExams(),
      api.get('/library?limit=100').catch(() => ({ data: { data: { resources: [] } } })),
    ])
      .then(([cats, examList, libRes]) => {
        setCategories(Array.isArray(cats) ? cats : []);
        setExams(Array.isArray(examList) ? examList : []);
        const rawLib = libRes.data?.data?.resources || libRes.data?.resources || [];
        setLibraryResources(Array.isArray(rawLib) ? rawLib : []);
      })
      .catch(console.error);

    if (isEdit) {
      blogsAPI
        .getById(id)
        .then((res) => {
          const b = res.data.data.blog || res.data.blog;
          const rawExamId = b.examCategory?._id || b.examCategory?.id || b.examCategory || '';

          if (rawExamId) {
            setValue('examCategory', rawExamId);
          }

          const existingResIds =
            b.resourceIds ||
            (Array.isArray(b.resources) ? b.resources.map((r) => r.id || r._id || r) : []);
          setSelectedResourceIds(existingResIds);

          const coverUrl =
            b.coverImage?.url ||
            (typeof b.coverImage === 'string' ? b.coverImage : '') ||
            b.thumbnail?.url ||
            '';

          reset({
            ...b,
            coverImageUrl: coverUrl,
            tags: b.tags?.join(', ') || '',
            examCategory: rawExamId,
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
  }, [id, isEdit, reset, setValue]);

  // Sync parent category dropdown when exams load or on edit
  useEffect(() => {
    if (currentExamCategory && exams.length > 0) {
      const match = exams.find((e) => (e.id || e._id) === currentExamCategory);
      if (match && match.parentId) {
        setSelectedParentCategory(match.parentId);
      }
    }
  }, [currentExamCategory, exams]);

  const toggleResourceSelection = (resId) => {
    setSelectedResourceIds((prev) =>
      prev.includes(resId) ? prev.filter((id) => id !== resId) : [...prev, resId]
    );
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const { coverImageUrl, ...rest } = data;

      // Clean out flattened jobAlert.* properties that react-hook-form produces alongside jobAlert object
      const cleanedData = {};
      Object.keys(rest).forEach((key) => {
        if (!key.startsWith('jobAlert.')) {
          cleanedData[key] = rest[key];
        }
      });

      const payload = {
        ...cleanedData,
        coverImage: coverImageUrl ? { url: coverImageUrl } : undefined,
        thumbnail: coverImageUrl ? { url: coverImageUrl } : undefined,
        tags: data.tags
          ? data.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        resourceIds: selectedResourceIds,
        examCategory: cleanedData.examCategory || undefined,
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

            <FileUploadInput
              label="Article Banner / Cover Image"
              value={watch('coverImageUrl') || ''}
              onChange={(url) => setValue('coverImageUrl', url)}
              type="image"
              folder="blog-covers"
              placeholder="https://..."
              hint="Upload cover image to Supabase or provide external image URL"
            />

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  Exam Category
                </label>
                <select
                  value={selectedParentCategory}
                  onChange={(e) => {
                    setSelectedParentCategory(e.target.value);
                    setValue('examCategory', '');
                  }}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Categories / General</option>
                  {categories.map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.icon ? `${c.icon} ` : ''}
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Exam (Optional)
                </label>
                <select
                  {...register('examCategory')}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">None / General</option>
                  {filteredExams.map((ex) => (
                    <option key={ex.id || ex._id} value={ex.id || ex._id}>
                      {ex.icon ? `${ex.icon} ` : ''}
                      {ex.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Attach Free Resources from Library */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gray-50/50 dark:bg-gray-900/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <HiDocumentText className="text-primary-500 text-lg" />
                    Attach Free Resources / Study Material
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Select study material and notes from the library to show for free under this
                    article
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full">
                  {selectedResourceIds.length} Selected
                </span>
              </div>

              {libraryResources.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">
                  No resources found in Library. Add resources from the Digital Library page to
                  attach them here.
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {libraryResources.map((res) => {
                    const isChecked = selectedResourceIds.includes(res.id || res._id);
                    return (
                      <div
                        key={res.id || res._id}
                        onClick={() => toggleResourceSelection(res.id || res._id)}
                        className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 shadow-xs'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {res.title}
                            </p>
                            <span className="text-[10px] text-gray-500 uppercase font-semibold">
                              {res.resourceType || res.type || 'Resource'} •{' '}
                              {res.accessLevel || 'Free'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                  <div className="col-span-2">
                    <FileUploadInput
                      label="Official Notification Document / PDF"
                      value={watch('jobAlert.officialNotificationUrl') || ''}
                      onChange={(url) => setValue('jobAlert.officialNotificationUrl', url)}
                      type="document"
                      folder="job-notifications"
                      placeholder="Upload official notification PDF or paste link"
                      hint="Upload official notification PDF to Supabase or provide direct PDF link"
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
