import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  HiAcademicCap,
  HiArrowLeft,
  HiCheckCircle,
  HiChevronDown,
  HiChevronUp,
  HiCurrencyRupee,
  HiDownload,
  HiPlus,
  HiSparkles,
  HiTrash,
  HiUser,
  HiVideoCamera,
} from 'react-icons/hi';
import { coursesAPI, teachersAPI } from '@/services/api';
import { getUnifiedCategories, getUnifiedExams } from '@/services/categories';
import LoadingSpinner from '@/components/loadingSpinner';
import toast from 'react-hot-toast';

const newLesson = () => ({
  title: '',
  type: 'video',
  videoUrl: '',
  content: '',
  duration: 0,
  isFree: false,
  resources: [],
});

const newSection = () => ({
  title: '',
  description: '',
  lessons: [newLesson()],
});

const newResource = () => ({ title: '', url: '', type: 'pdf' });

export default function CourseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'undefined');

  const [form, setForm] = useState({
    title: '',
    description: '',
    shortDescription: '',
    price: '',
    discountPrice: '',
    isFree: false,
    teacherId: '',
    categoryId: '',
    examCategoryId: '',
    level: 'all_levels',
    language: 'Bilingual (Hindi + English)',
    thumbnailUrl: '',
    demoVideoUrl: '',
    highlights: [],
    whatYouLearn: [''],
    requirements: [''],
    sections: [newSection()],
  });

  const [openSections, setOpenSections] = useState({ 0: true });
  const [saving, setSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit);
  const [categories, setCategories] = useState([]);
  const [exams, setExams] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [existingCourse, setExistingCourse] = useState(null);
  const totalSteps = 4;

  // Filter exams to only show those whose parentId matches the selected category
  const filteredExams = useMemo(() => {
    if (!form.categoryId) return [];
    return exams.filter((e) => e.parentId === form.categoryId);
  }, [form.categoryId, exams]);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  useEffect(() => {
    // Categories
    getUnifiedCategories()
      .then((list) => setCategories(list))
      .catch(() => {});

    // Exams
    getUnifiedExams()
      .then((list) => setExams(list))
      .catch(() => {});

    // Teachers list
    teachersAPI
      .getAll({ limit: 200 })
      .then((res) => {
        const tList = res.data?.data?.teachers || res.data?.data || res.data?.teachers || [];
        setTeachers(Array.isArray(tList) ? tList : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit) {
      setPageLoading(true);
      coursesAPI
        .getById(id)
        .then((res) => {
          const c = res.data?.data?.course || res.data?.data || res.data?.course;
          if (!c) {
            toast.error('Course not found');
            return;
          }
          setExistingCourse(c);
          setForm({
            title: c.title || '',
            description: c.description || '',
            shortDescription: c.shortDescription || '',
            price: c.price || 0,
            discountPrice: c.discountPrice || 0,
            isFree: c.isFree || c.price === 0,
            teacherId: c.teacher?.id || c.teacher?._id || c.teacherId || '',
            categoryId: '',
            examCategoryId: '',
            _existingCategoryId:
              c.categoryId || c.category?._id || c.category?.id || c.category || '',
            level: c.level || 'all_levels',
            language: c.language || 'Bilingual (Hindi + English)',
            thumbnailUrl: c.thumbnail?.url || c.thumbnail || '',
            demoVideoUrl: c.demoVideoUrl || '',
            highlights: c.highlights?.length ? c.highlights : [],
            whatYouLearn: c.whatYouLearn?.length ? c.whatYouLearn : [''],
            requirements: c.requirements?.length ? c.requirements : [''],
            sections: (c.sections || []).map((s) => ({
              title: s.title || '',
              description: s.description || '',
              lessons: (s.lessons || []).map((l) => ({
                title: l.title || '',
                type: l.type || 'video',
                videoUrl: l.videoUrl || '',
                content: l.content || '',
                duration: l.duration || 0,
                isFree: l.isFree || false,
                resources: (l.resources || []).map((r) => ({
                  title: r.title || '',
                  url: r.url || '',
                  type: r.type || 'pdf',
                })),
              })),
            })),
          });

          const open = {};
          (c.sections || []).forEach((_, i) => {
            open[i] = true;
          });
          setOpenSections(open);
        })
        .catch((err) => {
          toast.error(err?.response?.data?.message || 'Failed to load course');
        })
        .finally(() => setPageLoading(false));
    }
  }, [id, isEdit]);

  // Resolve existing categoryId into parent category + exam dropdown selections
  useEffect(() => {
    if (!form._existingCategoryId || categories.length === 0) return;

    const catId = form._existingCategoryId;

    // Check if catId is an exam (type='exam')
    const matchedExam = exams.find((e) => (e.id || e._id) === catId);
    if (matchedExam) {
      // Find the parent category of this exam
      const parentCat = matchedExam.parentId
        ? categories.find((c) => (c.id || c._id) === matchedExam.parentId)
        : null;
      setForm((prev) => ({
        ...prev,
        categoryId: parentCat ? parentCat.id || parentCat._id : '',
        examCategoryId: catId,
        _existingCategoryId: undefined,
      }));
      return;
    }

    // Check if catId is a parent category (type='category')
    const matchedCategory = categories.find((c) => (c.id || c._id) === catId);
    if (matchedCategory) {
      setForm((prev) => ({
        ...prev,
        categoryId: catId,
        examCategoryId: '',
        _existingCategoryId: undefined,
      }));
      return;
    }

    // Only clear once both arrays have loaded to avoid race condition
    if (exams.length > 0) {
      setForm((prev) => ({ ...prev, _existingCategoryId: undefined }));
    }
  }, [form._existingCategoryId, categories, exams]);

  // ── Form field helpers ───────────────────────────────────────────
  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const setArrayItem = (key, index, value) =>
    setField(
      key,
      form[key].map((item, i) => (i === index ? value : item))
    );

  const addArrayItem = (key, empty = '') => setField(key, [...form[key], empty]);

  const removeArrayItem = (key, index) =>
    setField(
      key,
      form[key].filter((_, i) => i !== index)
    );

  // ── Section helpers ───────────────────────────────────────────────
  const addSection = () => {
    const idx = form.sections.length;
    setField('sections', [...form.sections, newSection()]);
    setOpenSections((p) => ({ ...p, [idx]: true }));
  };

  const updateSection = (si, key, value) =>
    setField(
      'sections',
      form.sections.map((s, i) => (i === si ? { ...s, [key]: value } : s))
    );

  const removeSection = (si) =>
    setField(
      'sections',
      form.sections.filter((_, i) => i !== si)
    );

  // ── Lesson helpers ────────────────────────────────────────────────
  const addLesson = (si) =>
    updateSection(si, 'lessons', [...form.sections[si].lessons, newLesson()]);

  const updateLesson = (si, li, key, value) => {
    const lessons = form.sections[si].lessons.map((l, i) =>
      i === li ? { ...l, [key]: value } : l
    );
    updateSection(si, 'lessons', lessons);
  };

  const removeLesson = (si, li) =>
    updateSection(
      si,
      'lessons',
      form.sections[si].lessons.filter((_, i) => i !== li)
    );

  // ── Resource helpers ──────────────────────────────────────────────
  const addResource = (si, li) => {
    const resources = [...(form.sections[si].lessons[li].resources || []), newResource()];
    updateLesson(si, li, 'resources', resources);
  };

  const updateResource = (si, li, ri, key, value) => {
    const resources = form.sections[si].lessons[li].resources.map((r, i) =>
      i === ri ? { ...r, [key]: value } : r
    );
    updateLesson(si, li, 'resources', resources);
  };

  const removeResource = (si, li, ri) => {
    const resources = form.sections[si].lessons[li].resources.filter((_, i) => i !== ri);
    updateLesson(si, li, 'resources', resources);
  };

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async (e, publishAfterSave = false) => {
    if (e) e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Course title is required');
      return;
    }
    if (!form.description.trim()) {
      toast.error('Course description is required');
      return;
    }
    if (!form.categoryId) {
      toast.error('Please select a category');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      shortDescription: form.shortDescription.trim(),
      price: form.isFree ? 0 : Number(form.price) || 0,
      discountPrice: form.isFree ? 0 : Number(form.discountPrice) || 0,
      category: form.examCategoryId || form.categoryId,
      categoryId: form.examCategoryId || form.categoryId,
      ...(form.teacherId ? { teacherId: form.teacherId } : {}),
      ...(form.examCategoryId ? { examCategory: form.examCategoryId } : {}),
      level: form.level,
      language: form.language,
      thumbnail: { url: form.thumbnailUrl, publicId: '' },
      demoVideoUrl: form.demoVideoUrl?.trim() || undefined,
      highlights: form.highlights.filter((h) => h.trim()),
      whatYouLearn: form.whatYouLearn.filter((s) => s.trim()),
      requirements: form.requirements.filter((s) => s.trim()),
      sections: form.sections.map((s) => ({
        title: s.title,
        description: s.description,
        lessons: s.lessons.map((l) => ({
          title: l.title,
          type: l.type,
          videoUrl: l.videoUrl,
          content: l.content,
          duration: Number(l.duration) || 0,
          isFree: l.isFree,
          resources: l.resources.filter((r) => r.title && r.url),
        })),
      })),
    };

    setSaving(true);
    try {
      let res;
      if (isEdit) {
        res = await coursesAPI.update(id, payload);
        toast.success('Course saved!');
      } else {
        res = await coursesAPI.create(payload);
        toast.success('Course created!');
      }

      if (publishAfterSave) {
        const courseId =
          res.data?.data?.course?.id || res.data?.data?.course?._id || res.data?.data?.id || id;
        try {
          await coursesAPI.togglePublish(courseId);
          toast.success('Course published!');
        } catch {
          // ignore toggle failure
        }
      }

      navigate('/courses');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleUnpublish = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await coursesAPI.togglePublish(id);
      toast.success('Course unpublished / hidden.');
      navigate('/courses');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to unpublish');
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalLessons = form.sections.reduce((s, sec) => s + sec.lessons.length, 0);
  const effectiveFinalPrice = form.isFree
    ? 0
    : form.discountPrice > 0
      ? form.discountPrice
      : form.price;

  const discountPercent =
    form.price > effectiveFinalPrice && form.price > 0
      ? Math.round(((form.price - effectiveFinalPrice) / form.price) * 100)
      : 0;

  return (
    <div className="max-w-4xl w-full mx-auto pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/courses"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 text-slate-600 dark:text-gray-300 transition-colors"
          >
            <HiArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white font-display">
              {isEdit ? 'Edit Course Batch' : 'Create New Course Batch'}
            </h2>
            <p className="text-xs text-gray-500 font-normal">
              Publish structured video curriculum, notes, and demo preview classes.
            </p>
          </div>
        </div>
      </div>

      {/* ── Wizard Steps ───────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-8">
        <div className="flex justify-between relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-100 dark:bg-gray-700 z-0"></div>
          <div
            className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-primary-600 z-0 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          ></div>

          {[
            { step: 1, label: 'Course Info' },
            { step: 2, label: 'Pricing & Badges' },
            { step: 3, label: 'Curriculum' },
            { step: 4, label: 'Media & Demo' },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => setCurrentStep(item.step)}
              className="relative z-10 flex flex-col items-center group cursor-pointer"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep >= item.step
                    ? 'bg-primary-600 text-white shadow-sm ring-4 ring-primary-50 dark:ring-primary-950'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                }`}
              >
                {item.step}
              </div>
              <span
                className={`mt-2 text-xs font-semibold ${
                  currentStep >= item.step
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* ── Step 1: Basic Info ─────────────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="animate-fade-in space-y-5">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3 flex items-center gap-2">
                <HiAcademicCap className="text-primary-600" /> Basic Information
              </h3>

              {/* Teacher Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <HiUser className="text-primary-600" /> Assigned Teacher / Faculty (Optional)
                </label>
                <select
                  value={form.teacherId}
                  onChange={(e) => setField('teacherId', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-primary-500 text-gray-900 dark:text-white font-medium"
                >
                  <option value="">-- Admin / Testbook Faculty --</option>
                  {teachers.map((t) => (
                    <option key={t.id || t._id} value={t.id || t._id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-gray-400 font-normal">
                  Select which teacher or faculty is conducting this course batch.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Course Title *
                </label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="e.g. RPSC RAS 2026 Prelims + Mains Complete Foundation Batch"
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-primary-500 text-gray-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Category *
                    <span className="text-gray-400 font-normal ml-1">(for catalog filter)</span>
                  </label>
                  <select
                    required
                    value={form.categoryId}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, categoryId: e.target.value, examCategoryId: '' }));
                    }}
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-primary-500 text-gray-900 dark:text-white font-medium"
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => (
                      <option key={c.id || c._id} value={c.id || c._id}>
                        {c.icon ? `${c.icon} ` : ''}
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Exam
                    <span className="text-gray-400 font-normal ml-1">(shows on exam page)</span>
                    {filteredExams.length === 0 && form.categoryId && (
                      <span className="text-gray-400 font-normal ml-1 text-[10px]">
                        (no exams under this category)
                      </span>
                    )}
                  </label>
                  <select
                    value={form.examCategoryId || ''}
                    onChange={(e) => setField('examCategoryId', e.target.value)}
                    disabled={!form.categoryId || filteredExams.length === 0}
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-primary-500 text-gray-900 dark:text-white font-medium disabled:opacity-50"
                  >
                    <option value="">-- Select Exam --</option>
                    {filteredExams.map((e) => (
                      <option key={e.id || e._id} value={e.id || e._id}>
                        {e.icon ? `${e.icon} ` : ''}
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Medium / Language *
                  </label>
                  <select
                    value={form.language}
                    onChange={(e) => setField('language', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-primary-500 text-gray-900 dark:text-white font-medium"
                  >
                    <option value="Bilingual (Hindi + English)">Bilingual (Hindi + English)</option>
                    <option value="Hindi">Hindi Medium</option>
                    <option value="English">English Medium</option>
                    <option value="Rajasthani / Regional">Rajasthani / Regional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Course Level
                  </label>
                  <select
                    value={form.level}
                    onChange={(e) => setField('level', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-primary-500 text-gray-900 dark:text-white font-medium"
                  >
                    <option value="all_levels">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Detailed Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-primary-500 text-gray-900 dark:text-white leading-relaxed"
                  placeholder="Provide comprehensive details about syllabus coverage, batch timings, and faculty notes..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Short Tagline
                </label>
                <input
                  value={form.shortDescription}
                  onChange={(e) => setField('shortDescription', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-primary-500 text-gray-900 dark:text-white"
                  placeholder="Comprehensive batch covering syllabus, notes & mock test series (max 200 chars)"
                  maxLength={200}
                />
              </div>
            </div>

            {/* ── Key Highlights / Feature Badges ─────────────────── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                  <HiSparkles className="text-amber-500" /> Key Features & Badges
                </h3>
                <span className="text-[11px] text-gray-400 font-normal">
                  Shown on course cards and detail page
                </span>
              </div>

              {form.highlights.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={item}
                    onChange={(e) => setArrayItem('highlights', i, e.target.value)}
                    placeholder="e.g. Updated 2026 RPSC Syllabus"
                    className="w-full px-3.5 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                  />
                  {form.highlights.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('highlights', i)}
                      className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors"
                    >
                      <HiTrash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('highlights', '')}
                className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1 pt-1"
              >
                <HiPlus className="h-3.5 w-3.5" /> Add Highlight Badge
              </button>
            </div>

            {/* ── Requirements ─────────────────────────────────────── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                  Requirements / Prerequisites
                </h3>
                <span className="text-[11px] text-gray-400 font-normal">
                  Shown on course detail page
                </span>
              </div>

              {form.requirements.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={item}
                    onChange={(e) => setArrayItem('requirements', i, e.target.value)}
                    placeholder="e.g. Basic knowledge of Rajasthan GK"
                    className="w-full px-3.5 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                  />
                  {form.requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('requirements', i)}
                      className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors"
                    >
                      <HiTrash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('requirements', '')}
                className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1 pt-1"
              >
                <HiPlus className="h-3.5 w-3.5" /> Add Requirement
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Pricing ─────────────────────────────────────────── */}
        {currentStep === 2 && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-5">
              <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3 flex items-center gap-2">
                <HiCurrencyRupee className="text-emerald-500" /> Pricing & Enrollment
              </h3>

              {/* Free Course Toggle */}
              <label className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFree}
                  onChange={(e) => setField('isFree', e.target.checked)}
                  className="rounded h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white">
                    100% Free Course
                  </div>
                  <div className="text-[11px] text-gray-500 font-normal">
                    Students can enroll and access all video lessons without paying.
                  </div>
                </div>
              </label>

              {!form.isFree && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Original / MRP Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(e) => setField('price', e.target.value)}
                      placeholder="e.g. 1999"
                      className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Offer / Discounted Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.discountPrice}
                      onChange={(e) => setField('discountPrice', e.target.value)}
                      placeholder="e.g. 999"
                      className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Price Preview Card */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Student Enrollment Price
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {form.isFree ? 'FREE' : `₹${effectiveFinalPrice}`}
                    </span>
                    {!form.isFree && form.price > effectiveFinalPrice && (
                      <span className="text-xs text-gray-400 line-through">₹{form.price}</span>
                    )}
                  </div>
                </div>

                {!form.isFree && discountPercent > 0 && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Curriculum ──────────────────────────────────────────── */}
        {currentStep === 3 && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3 mb-5">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    Course Curriculum
                  </h3>
                  <p className="text-xs text-gray-500 font-normal">
                    {form.sections.length} sections · {totalLessons} lessons
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addSection}
                  className="bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-950/40 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <HiPlus className="h-3.5 w-3.5" /> Add New Section
                </button>
              </div>

              {form.sections.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-xs">No sections yet.</p>
                  <button
                    type="button"
                    onClick={addSection}
                    className="bg-primary-600 text-white text-xs font-semibold px-4 py-2 rounded-xl mt-3"
                  >
                    Add First Section
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {form.sections.map((section, si) => (
                    <SectionEditor
                      key={si}
                      section={section}
                      sectionIndex={si}
                      isOpen={!!openSections[si]}
                      onToggle={() => setOpenSections((p) => ({ ...p, [si]: !p[si] }))}
                      onUpdateSection={(key, val) => updateSection(si, key, val)}
                      onRemoveSection={() => removeSection(si)}
                      onAddLesson={() => addLesson(si)}
                      onUpdateLesson={(li, key, val) => updateLesson(si, li, key, val)}
                      onRemoveLesson={(li) => removeLesson(si, li)}
                      onAddResource={(li) => addResource(si, li)}
                      onUpdateResource={(li, ri, key, val) => updateResource(si, li, ri, key, val)}
                      onRemoveResource={(li, ri) => removeResource(si, li, ri)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 4: Media & Demo ──────────────────────────────────────────── */}
        {currentStep === 4 && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3 flex items-center gap-2">
                <HiVideoCamera className="text-primary-600" /> Course Media & Preview
              </h3>

              {/* Demo / Sample Class Video URL */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Sample / Demo Preview Video URL
                </label>
                <input
                  value={form.demoVideoUrl}
                  onChange={(e) => setField('demoVideoUrl', e.target.value)}
                  placeholder="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4 or YouTube link"
                  className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                />
                <span className="text-[11px] text-gray-400 font-normal">
                  Displayed in the sample player.
                </span>
              </div>

              {/* Thumbnail URL */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Course Poster / Thumbnail URL
                </label>
                <input
                  value={form.thumbnailUrl}
                  onChange={(e) => setField('thumbnailUrl', e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              {form.thumbnailUrl && /^https?:\/\//.test(form.thumbnailUrl) && (
                <img
                  src={form.thumbnailUrl}
                  alt="Thumbnail preview"
                  className="h-48 w-full object-cover rounded-xl border border-gray-200 dark:border-gray-700"
                  onError={(e) => (e.target.style.display = 'none')}
                />
              )}

              <div className="bg-primary-50/60 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/40 rounded-xl p-4 mt-6">
                <h4 className="font-semibold text-primary-800 dark:text-primary-300 text-xs mb-1">
                  Ready to Launch?
                </h4>
                <p className="text-xs text-primary-700 dark:text-primary-400 leading-relaxed font-normal">
                  Your course batch contains {form.sections.length} sections and {totalLessons}{' '}
                  lessons. Once saved, students can immediately browse and enroll.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Actions ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              >
                &larr; Previous Step
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/courses')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition-all"
              >
                Continue &rarr;
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={saving}
                  onClick={(e) => handleSubmit(e, false)}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Save as Draft'}
                </button>

                {isEdit && existingCourse?.isPublished && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleUnpublish}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 transition-all disabled:opacity-50"
                  >
                    Hide from Students
                  </button>
                )}

                {(!isEdit || !existingCourse?.isPublished) && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={(e) => handleSubmit(e, true)}
                    className="px-6 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {saving ? (
                      'Publishing...'
                    ) : (
                      <>
                        <HiCheckCircle className="h-4 w-4" />
                        {isEdit ? 'Save & Publish' : 'Publish Course'}
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

// ── Section Editor Component ──────────────────────────────────────────
function SectionEditor({
  section,
  sectionIndex,
  isOpen,
  onToggle,
  onUpdateSection,
  onRemoveSection,
  onAddLesson,
  onUpdateLesson,
  onRemoveLesson,
  onAddResource,
  onUpdateResource,
  onRemoveResource,
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-gray-800/40">
      {/* Section header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 text-left cursor-pointer"
        >
          {isOpen ? (
            <HiChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
          ) : (
            <HiChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
              Section {sectionIndex + 1}
            </span>
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {section.title || 'Untitled Section'}
            </p>
          </div>
          <span className="text-xs text-gray-400 font-normal flex-shrink-0">
            {section.lessons.length} lessons
          </span>
        </button>
        <button
          type="button"
          onClick={onRemoveSection}
          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition-colors flex-shrink-0"
        >
          <HiTrash className="h-4 w-4" />
        </button>
      </div>

      {isOpen && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 gap-2.5">
            <input
              value={section.title}
              onChange={(e) => onUpdateSection('title', e.target.value)}
              placeholder="Section title (e.g. Module 1: Rajasthan History & Culture) *"
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-medium"
            />
            <input
              value={section.description}
              onChange={(e) => onUpdateSection('description', e.target.value)}
              placeholder="Section description (optional)"
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-normal"
            />
          </div>

          <div className="space-y-3">
            {section.lessons.map((lesson, li) => (
              <LessonEditor
                key={li}
                lesson={lesson}
                lessonIndex={li}
                onUpdate={(key, val) => onUpdateLesson(li, key, val)}
                onRemove={() => onRemoveLesson(li)}
                onAddResource={() => onAddResource(li)}
                onUpdateResource={(ri, key, val) => onUpdateResource(li, ri, key, val)}
                onRemoveResource={(ri) => onRemoveResource(li, ri)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onAddLesson}
            className="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-1.5"
          >
            <HiPlus className="h-4 w-4" /> Add Lesson to Section
          </button>
        </div>
      )}
    </div>
  );
}

// ── Lesson Editor Component ───────────────────────────────────────────
function LessonEditor({
  lesson,
  lessonIndex,
  onUpdate,
  onRemove,
  onAddResource,
  onUpdateResource,
  onRemoveResource,
}) {
  const [showResources, setShowResources] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 space-y-3 shadow-xs">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-md flex items-center justify-center bg-primary-50 text-primary-600 text-xs font-bold">
          {lessonIndex + 1}
        </div>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          Lesson {lessonIndex + 1}
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-rose-600 rounded-lg transition-colors"
        >
          <HiTrash className="h-3.5 w-3.5" />
        </button>
      </div>

      <input
        value={lesson.title}
        onChange={(e) => onUpdate('title', e.target.value)}
        placeholder="Lesson title (e.g. Introduction to Rajasthan Forts) *"
        className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-medium"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <select
          value={lesson.type}
          onChange={(e) => onUpdate('type', e.target.value)}
          className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
        >
          <option value="video">Video Lecture</option>
          <option value="text">Notes / Article</option>
          <option value="quiz">Practice Quiz</option>
        </select>

        <input
          type="number"
          value={lesson.duration}
          onChange={(e) => onUpdate('duration', e.target.value)}
          placeholder="Duration (minutes)"
          className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
          min="0"
        />

        <label className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer text-xs text-gray-700 dark:text-gray-300 font-medium">
          <input
            type="checkbox"
            checked={lesson.isFree}
            onChange={(e) => onUpdate('isFree', e.target.checked)}
            className="rounded text-primary-600 focus:ring-primary-500"
          />
          Free Preview
        </label>
      </div>

      {lesson.type === 'video' && (
        <input
          value={lesson.videoUrl}
          onChange={(e) => onUpdate('videoUrl', e.target.value)}
          placeholder="Video Link / Embed URL (YouTube, Vimeo, MP4, M3U8)"
          className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
        />
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowResources((p) => !p)}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-primary-600 transition-colors"
        >
          <HiDownload className="h-3.5 w-3.5" />
          Attached Study Notes ({lesson.resources?.length || 0})
          {showResources ? (
            <HiChevronUp className="h-3 w-3" />
          ) : (
            <HiChevronDown className="h-3 w-3" />
          )}
        </button>

        {showResources && (
          <div className="mt-2 space-y-2 pl-1">
            {(lesson.resources || []).map((res, ri) => (
              <div key={ri} className="flex flex-col sm:flex-row gap-2">
                <input
                  value={res.title}
                  onChange={(e) => onUpdateResource(ri, 'title', e.target.value)}
                  placeholder="Note Title (e.g. Forts Handwritten Notes PDF)"
                  className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white sm:flex-1"
                />
                <input
                  value={res.url}
                  onChange={(e) => onUpdateResource(ri, 'url', e.target.value)}
                  placeholder="PDF Download URL"
                  className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white sm:flex-[2]"
                />
                <button
                  type="button"
                  onClick={() => onRemoveResource(ri)}
                  className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg flex-shrink-0"
                >
                  <HiTrash className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={onAddResource}
              className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1"
            >
              <HiPlus className="h-3.5 w-3.5" /> Add PDF / Note Attachment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
