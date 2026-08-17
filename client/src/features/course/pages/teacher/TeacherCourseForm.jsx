import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiAcademicCap,
  HiArrowLeft,
  HiCheckCircle,
  HiChevronDown,
  HiChevronUp,
  HiCurrencyRupee,
  HiDocument,
  HiDownload,
  HiLink,
  HiPencilAlt,
  HiPlay,
  HiPlus,
  HiSparkles,
  HiTrash,
  HiVideoCamera,
} from 'react-icons/hi';
import { createCourse, updateCourse, fetchCourseById } from '@/features/course/courseSlice';
import { examCategoryAPI } from '@/services/api';
import { Input, Button } from '@/components/ui';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

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

export default function TeacherCourseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentCourse, loading } = useSelector((state) => state.courses);
  const isEdit = !!id;

  const [form, setForm] = useState({
    title: '',
    description: '',
    shortDescription: '',
    price: '',
    discountPrice: '',
    isFree: false,
    categoryId: '',
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
  const [categories, setCategories] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  useEffect(() => {
    getUnifiedExamCategories()
      .then((list) => {
        setCategories(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit) dispatch(fetchCourseById(id));
  }, [dispatch, id, isEdit]);

  useEffect(() => {
    if (isEdit && currentCourse && currentCourse._id === id) {
      setForm({
        title: currentCourse.title || '',
        description: currentCourse.description || '',
        shortDescription: currentCourse.shortDescription || '',
        price: currentCourse.price || 0,
        discountPrice: currentCourse.discountPrice || 0,
        isFree: currentCourse.isFree || currentCourse.price === 0,
        categoryId: currentCourse.category?._id || currentCourse.category || '',
        level: currentCourse.level || 'all_levels',
        language: currentCourse.language || 'Bilingual (Hindi + English)',
        thumbnailUrl: currentCourse.thumbnail?.url || currentCourse.thumbnail || '',
        demoVideoUrl: currentCourse.demoVideoUrl || '',
        highlights: currentCourse.highlights?.length ? currentCourse.highlights : [],
        whatYouLearn: currentCourse.whatYouLearn?.length ? currentCourse.whatYouLearn : [''],
        requirements: currentCourse.requirements?.length ? currentCourse.requirements : [''],
        sections: (currentCourse.sections || []).map((s) => ({
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
      (currentCourse.sections || []).forEach((_, i) => {
        open[i] = true;
      });
      setOpenSections(open);
    }
  }, [isEdit, currentCourse, id]);

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
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Course title is required');
      return;
    }
    if (!form.description.trim()) {
      toast.error('Course description is required');
      return;
    }
    if (!form.categoryId) {
      toast.error('Please select an Exam Category');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      shortDescription: form.shortDescription.trim(),
      price: form.isFree ? 0 : Number(form.price) || 0,
      discountPrice: form.isFree ? 0 : Number(form.discountPrice) || 0,
      isFree: form.isFree,
      category: form.categoryId,
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
      if (isEdit) {
        await dispatch(updateCourse({ id, ...payload })).unwrap();
        toast.success('Course updated successfully!');
      } else {
        await dispatch(createCourse(payload)).unwrap();
        toast.success('Course created and published!');
      }
      navigate('/teacher/courses');
    } catch (err) {
      toast.error(err?.message || err || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && loading && !currentCourse) return <LoadingSpinner />;

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
    <div className="max-w-4xl w-full mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/teacher/courses"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 text-slate-600 dark:text-dark-300 transition-colors"
          >
            <HiArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white font-display">
              {isEdit ? 'Edit Course Batch' : 'Create New Course Batch'}
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Publish structured video curriculum, notes, and demo preview classes.
            </p>
          </div>
        </div>
      </div>

      {/* ── Wizard Steps ───────────────────────────────── */}
      <div className="bg-white dark:bg-dark-900 p-4 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm mb-8">
        <div className="flex justify-between relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-100 dark:bg-dark-800 z-0"></div>
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
                    : 'bg-slate-100 dark:bg-dark-800 text-slate-400'
                }`}
              >
                {item.step}
              </div>
              <span
                className={`mt-2 text-xs font-semibold ${
                  currentStep >= item.step
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Step 1: Basic Info ─────────────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="animate-fade-in space-y-5">
            <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 border border-slate-200 dark:border-dark-800 shadow-sm space-y-4">
              <h3 className="font-bold text-dark-900 dark:text-white border-b border-slate-100 dark:border-dark-800 pb-3 flex items-center gap-2">
                <HiAcademicCap className="text-primary-600" /> Basic Information
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Course Title *
                </label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="e.g. RPSC RAS 2026 Prelims + Mains Complete Foundation Batch"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl focus:outline-none focus:border-primary-500 text-dark-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Exam Category *
                  </label>
                  <select
                    required
                    value={form.categoryId}
                    onChange={(e) => setField('categoryId', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl focus:outline-none focus:border-primary-500 text-dark-900 dark:text-white font-medium"
                  >
                    <option value="">-- Select Target Exam --</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Medium / Language *
                  </label>
                  <select
                    value={form.language}
                    onChange={(e) => setField('language', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl focus:outline-none focus:border-primary-500 text-dark-900 dark:text-white font-medium"
                  >
                    <option value="Bilingual (Hindi + English)">Bilingual (Hindi + English)</option>
                    <option value="Hindi">Hindi Medium</option>
                    <option value="English">English Medium</option>
                    <option value="Rajasthani / Regional">Rajasthani / Regional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Detailed Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl focus:outline-none focus:border-primary-500 text-dark-900 dark:text-white leading-relaxed"
                  placeholder="Provide comprehensive details about syllabus coverage, batch timings, and faculty notes..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Short Tagline
                </label>
                <input
                  value={form.shortDescription}
                  onChange={(e) => setField('shortDescription', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl focus:outline-none focus:border-primary-500 text-dark-900 dark:text-white"
                  placeholder="Comprehensive batch covering syllabus, notes & mock test series (max 200 chars)"
                  maxLength={200}
                />
              </div>
            </div>

            {/* ── Key Highlights / Feature Badges ─────────────────── */}
            <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 border border-slate-200 dark:border-dark-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-800 pb-3">
                <h3 className="font-bold text-dark-900 dark:text-white text-sm flex items-center gap-1.5">
                  <HiSparkles className="text-amber-500" /> Key Features & Badges
                </h3>
                <span className="text-[11px] text-slate-400 font-normal">
                  Shown on course cards and detail page
                </span>
              </div>

              {form.highlights.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={item}
                    onChange={(e) => setArrayItem('highlights', i, e.target.value)}
                    placeholder="e.g. Updated 2026 RPSC Syllabus"
                    className="w-full px-3.5 py-1.5 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white"
                  />
                  {form.highlights.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('highlights', i)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
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
          </div>
        )}

        {/* ── Step 2: Pricing ─────────────────────────────────────────── */}
        {currentStep === 2 && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 border border-slate-200 dark:border-dark-800 shadow-sm space-y-5">
              <h3 className="font-bold text-dark-900 dark:text-white border-b border-slate-100 dark:border-dark-800 pb-3 flex items-center gap-2">
                <HiCurrencyRupee className="text-emerald-500" /> Pricing & Enrollment
              </h3>

              {/* Free Course Toggle */}
              <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFree}
                  onChange={(e) => setField('isFree', e.target.checked)}
                  className="rounded h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <div className="text-xs font-bold text-dark-900 dark:text-white">
                    100% Free Course
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    Students can enroll and access all video lessons without paying.
                  </div>
                </div>
              </label>

              {!form.isFree && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Original / MRP Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(e) => setField('price', e.target.value)}
                      placeholder="e.g. 1999"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Offer / Discounted Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.discountPrice}
                      onChange={(e) => setField('discountPrice', e.target.value)}
                      placeholder="e.g. 999"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Price Preview Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-100 dark:border-dark-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Student Enrollment Price
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-bold text-dark-900 dark:text-white">
                      {form.isFree ? 'FREE' : `₹${effectiveFinalPrice}`}
                    </span>
                    {!form.isFree && form.price > effectiveFinalPrice && (
                      <span className="text-xs text-slate-400 line-through">₹{form.price}</span>
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
            <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 border border-slate-200 dark:border-dark-800 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-800 pb-3 mb-5">
                <div>
                  <h3 className="font-bold text-dark-900 dark:text-white text-base">
                    Course Curriculum
                  </h3>
                  <p className="text-xs text-slate-500 font-normal">
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
                <div className="text-center py-12 text-slate-400">
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
            <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 border border-slate-200 dark:border-dark-800 shadow-sm space-y-4">
              <h3 className="font-bold text-dark-900 dark:text-white border-b border-slate-100 dark:border-dark-800 pb-3 flex items-center gap-2">
                <HiVideoCamera className="text-primary-600" /> Course Media & Preview
              </h3>

              {/* Demo / Sample Class Video URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sample / Demo Preview Video URL
                </label>
                <input
                  value={form.demoVideoUrl}
                  onChange={(e) => setField('demoVideoUrl', e.target.value)}
                  placeholder="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4 or YouTube link"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white"
                />
                <span className="text-[11px] text-slate-400 font-normal">
                  Displayed in the "See the Teaching Before You Commit" sample player.
                </span>
              </div>

              {/* Thumbnail URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Course Poster / Thumbnail URL
                </label>
                <input
                  value={form.thumbnailUrl}
                  onChange={(e) => setField('thumbnailUrl', e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white"
                />
              </div>

              {form.thumbnailUrl && /^https?:\/\//.test(form.thumbnailUrl) && (
                <img
                  src={form.thumbnailUrl}
                  alt="Thumbnail preview"
                  className="h-48 w-full object-cover rounded-xl border border-slate-200 dark:border-dark-700"
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
        <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-dark-800">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 text-slate-700 dark:text-dark-300 transition-colors"
              >
                &larr; Previous Step
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/teacher/courses')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
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
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? (
                  'Saving...'
                ) : (
                  <>
                    <HiCheckCircle className="h-4 w-4" />
                    {isEdit ? 'Update Course' : 'Publish Course'}
                  </>
                )}
              </button>
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
    <div className="border border-slate-200 dark:border-dark-700 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-dark-900/40">
      {/* Section header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-dark-800/80 border-b border-slate-100 dark:border-dark-700">
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 text-left cursor-pointer"
        >
          {isOpen ? (
            <HiChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
          ) : (
            <HiChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Section {sectionIndex + 1}
            </span>
            <p className="text-sm font-semibold text-dark-900 dark:text-white truncate">
              {section.title || 'Untitled Section'}
            </p>
          </div>
          <span className="text-xs text-slate-400 font-normal flex-shrink-0">
            {section.lessons.length} lessons
          </span>
        </button>
        <button
          type="button"
          onClick={onRemoveSection}
          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors flex-shrink-0"
        >
          <HiTrash className="h-4 w-4" />
        </button>
      </div>

      {isOpen && (
        <div className="p-4 space-y-4">
          {/* Section fields */}
          <div className="grid grid-cols-1 gap-2.5">
            <input
              value={section.title}
              onChange={(e) => onUpdateSection('title', e.target.value)}
              placeholder="Section title (e.g. Module 1: Rajasthan History & Culture) *"
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white font-medium"
            />
            <input
              value={section.description}
              onChange={(e) => onUpdateSection('description', e.target.value)}
              placeholder="Section description (optional)"
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white font-normal"
            />
          </div>

          {/* Lessons */}
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
            className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-dark-700 rounded-xl text-xs font-semibold text-slate-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-1.5"
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
    <div className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl p-3.5 space-y-3 shadow-xs">
      {/* Lesson header row */}
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-md flex items-center justify-center bg-primary-50 text-primary-600 text-xs font-bold">
          {lessonIndex + 1}
        </div>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Lesson {lessonIndex + 1}
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
        >
          <HiTrash className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Lesson title */}
      <input
        value={lesson.title}
        onChange={(e) => onUpdate('title', e.target.value)}
        placeholder="Lesson title (e.g. Introduction to Rajasthan Forts) *"
        className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white font-medium"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <select
          value={lesson.type}
          onChange={(e) => onUpdate('type', e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white"
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
          className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white"
          min="0"
        />

        <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-dark-800 rounded-xl border border-slate-200 dark:border-dark-700 cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium">
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
          className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white"
        />
      )}

      {/* Resources toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowResources((p) => !p)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-primary-600 transition-colors"
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
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white sm:flex-1"
                />
                <input
                  value={res.url}
                  onChange={(e) => onUpdateResource(ri, 'url', e.target.value)}
                  placeholder="PDF Download URL"
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white sm:flex-[2]"
                />
                <button
                  type="button"
                  onClick={() => onRemoveResource(ri)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg flex-shrink-0"
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
              <HiPlus className="h-3 w-3" /> Add PDF / Note Attachment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
