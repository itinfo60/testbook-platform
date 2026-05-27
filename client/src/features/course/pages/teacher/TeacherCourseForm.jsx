import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiPlus,
  HiTrash,
  HiChevronDown,
  HiChevronUp,
  HiPlay,
  HiDocument,
  HiPencilAlt,
  HiLink,
  HiDownload,
} from 'react-icons/hi';
import { createCourse, updateCourse, fetchCourseById } from '@/features/course/courseSlice';
import { examCategoryAPI } from '@/services/api';
import { Input, Button } from '@/components/ui';
import LoadingSpinner from '@/components/common/LoadingSpinner';
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
  lessons: [],
});

const newResource = () => ({ title: '', url: '', type: 'link' });

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
    price: 0,
    discountPrice: 0,
    categoryId: '',
    level: 'beginner',
    language: 'English',
    thumbnailUrl: '',
    whatYouLearn: [''],
    requirements: [''],
    sections: [],
  });

  const [openSections, setOpenSections] = useState({});
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  useEffect(() => {
    examCategoryAPI
      .getAll()
      .then((res) => {
        setCategories(res.data?.data?.categories || []);
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
        categoryId: currentCourse.category?._id || currentCourse.category || '',
        level: currentCourse.level || 'beginner',
        language: currentCourse.language || 'English',
        thumbnailUrl: currentCourse.thumbnail?.url || '',
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
              type: r.type || 'link',
            })),
          })),
        })),
      });
      // Open all sections by default in edit mode
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
      toast.error('Title is required');
      return;
    }
    if (!form.description.trim()) {
      toast.error('Description is required');
      return;
    }
    if (!form.categoryId) {
      toast.error('Please select a category');
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      shortDescription: form.shortDescription,
      price: Number(form.price) || 0,
      discountPrice: Number(form.discountPrice) || 0,
      category: form.categoryId,
      level: form.level,
      language: form.language,
      thumbnail: { url: form.thumbnailUrl, publicId: '' },
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
        toast.success('Course updated!');
      } else {
        await dispatch(createCourse(payload)).unwrap();
        toast.success('Course created!');
      }
      navigate('/teacher/courses');
    } catch (err) {
      toast.error(err || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && loading && !currentCourse) return <LoadingSpinner />;

  const totalLessons = form.sections.reduce((s, sec) => s + sec.lessons.length, 0);

  return (
    <div className="max-w-4xl w-full mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-dark-900 dark:text-white">
          {isEdit ? 'Edit Course' : 'Create New Course'}
        </h2>
      </div>

      {/* ── Wizard Progress Bar ───────────────────────────────── */}
      <div className="mb-8">
        <div className="flex justify-between relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-dark-200 dark:bg-dark-700 z-0"></div>
          <div
            className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-primary-500 z-0 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          ></div>

          {[
            { step: 1, label: 'Basic Info' },
            { step: 2, label: 'Pricing' },
            { step: 3, label: 'Curriculum' },
            { step: 4, label: 'Publish' },
          ].map((item) => (
            <div key={item.step} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  currentStep >= item.step
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-200 dark:bg-dark-700 text-dark-500'
                }`}
              >
                {item.step}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  currentStep >= item.step
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-dark-500'
                }`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Step 1: Basic Info ─────────────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="animate-fade-in space-y-6">
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-dark-900 dark:text-white border-b border-dark-100 dark:border-dark-700 pb-3">
                Basic Info
              </h3>

              <Input
                label="Course Title *"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="e.g. Complete Python Bootcamp"
              />

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                  Description *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  className="input-field min-h-[120px] resize-none"
                  placeholder="Describe what students will learn..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                  Short Description
                </label>
                <textarea
                  value={form.shortDescription}
                  onChange={(e) => setField('shortDescription', e.target.value)}
                  className="input-field min-h-[60px] resize-none"
                  placeholder="Brief tagline (max 300 chars)"
                  maxLength={300}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setField('categoryId', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                    Level
                  </label>
                  <select
                    value={form.level}
                    onChange={(e) => setField('level', e.target.value)}
                    className="input-field"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Language"
                  value={form.language}
                  onChange={(e) => setField('language', e.target.value)}
                />
              </div>
            </div>

            {/* ── What You'll Learn ───────────────────────────────────── */}
            <div className="card p-6 space-y-3">
              <h3 className="font-semibold text-dark-900 dark:text-white border-b border-dark-100 dark:border-dark-700 pb-3">
                What You'll Learn
              </h3>
              {form.whatYouLearn.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={item}
                    onChange={(e) => setArrayItem('whatYouLearn', i, e.target.value)}
                    placeholder={`Learning outcome ${i + 1}`}
                    className="input-field flex-1 text-sm"
                  />
                  {form.whatYouLearn.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('whatYouLearn', i)}
                      className="p-2 text-red-400 hover:text-red-600"
                    >
                      <HiTrash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('whatYouLearn', '')}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
              >
                <HiPlus className="h-3.5 w-3.5" /> Add outcome
              </button>
            </div>

            {/* ── Requirements ────────────────────────────────────────── */}
            <div className="card p-6 space-y-3">
              <h3 className="font-semibold text-dark-900 dark:text-white border-b border-dark-100 dark:border-dark-700 pb-3">
                Requirements
              </h3>
              {form.requirements.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={item}
                    onChange={(e) => setArrayItem('requirements', i, e.target.value)}
                    placeholder={`Requirement ${i + 1}`}
                    className="input-field flex-1 text-sm"
                  />
                  {form.requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('requirements', i)}
                      className="p-2 text-red-400 hover:text-red-600"
                    >
                      <HiTrash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('requirements', '')}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
              >
                <HiPlus className="h-3.5 w-3.5" /> Add requirement
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Pricing ─────────────────────────────────────────── */}
        {currentStep === 2 && (
          <div className="animate-fade-in space-y-6">
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-dark-900 dark:text-white border-b border-dark-100 dark:border-dark-700 pb-3">
                Pricing
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Price (₹)"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setField('price', e.target.value)}
                />
                <Input
                  label="Discount Price (₹)"
                  type="number"
                  min="0"
                  value={form.discountPrice}
                  onChange={(e) => setField('discountPrice', e.target.value)}
                  placeholder="0 = no discount"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Curriculum ──────────────────────────────────────────── */}
        {currentStep === 3 && (
          <div className="animate-fade-in space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between border-b border-dark-100 dark:border-dark-700 pb-3 mb-4">
                <div>
                  <h3 className="font-semibold text-dark-900 dark:text-white">Curriculum</h3>
                  <p className="text-xs text-dark-400 mt-0.5">
                    {form.sections.length} sections · {totalLessons} lessons
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addSection}
                  className="btn-outline text-sm flex items-center gap-1.5"
                >
                  <HiPlus className="h-3.5 w-3.5" /> Add Section
                </button>
              </div>

              {form.sections.length === 0 ? (
                <div className="text-center py-10 text-dark-400">
                  <div className="text-4xl mb-3">📂</div>
                  <p className="text-sm">
                    No sections yet. Add a section to start building your curriculum.
                  </p>
                  <button type="button" onClick={addSection} className="btn-primary mt-4 text-sm">
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

        {/* ── Step 4: Publish ──────────────────────────────────────────── */}
        {currentStep === 4 && (
          <div className="animate-fade-in space-y-6">
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-dark-900 dark:text-white border-b border-dark-100 dark:border-dark-700 pb-3">
                Course Media & Publishing
              </h3>
              <Input
                label="Thumbnail URL"
                value={form.thumbnailUrl}
                onChange={(e) => setField('thumbnailUrl', e.target.value)}
                placeholder="https://..."
              />
              {form.thumbnailUrl && /^https?:\/\//.test(form.thumbnailUrl) && (
                <img
                  src={form.thumbnailUrl}
                  alt="Thumbnail preview"
                  className="h-64 w-full object-cover rounded-xl"
                  onError={(e) => (e.target.style.display = 'none')}
                />
              )}

              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 mt-6">
                <h4 className="font-semibold text-primary-800 dark:text-primary-400 mb-2">
                  Ready to Publish?
                </h4>
                <p className="text-sm text-primary-700 dark:text-primary-500">
                  Your course has {form.sections.length} sections and {totalLessons} lessons. Once
                  you submit, it will be saved and can be published to the catalog.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Actions ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-6 border-t border-dark-200 dark:border-dark-700 pb-8">
          <div>
            {currentStep > 1 && (
              <Button type="button" variant="secondary" onClick={prevStep}>
                &larr; Previous
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/teacher/courses')}>
              Cancel
            </Button>
            {currentStep < totalSteps ? (
              <Button type="button" onClick={nextStep}>
                Next &rarr;
              </Button>
            ) : (
              <Button type="submit" loading={saving} disabled={saving}>
                {isEdit ? 'Update Course' : 'Publish Course'}
              </Button>
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
    <div className="border border-dark-200 dark:border-dark-700 rounded-xl overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-dark-50 dark:bg-dark-800/60">
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 text-left"
        >
          {isOpen ? (
            <HiChevronUp className="h-4 w-4 text-dark-400 flex-shrink-0" />
          ) : (
            <HiChevronDown className="h-4 w-4 text-dark-400 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-xs text-dark-400 font-medium">Section {sectionIndex + 1}</span>
            <p className="text-sm font-semibold text-dark-900 dark:text-white truncate">
              {section.title || 'Untitled Section'}
            </p>
          </div>
          <span className="text-xs text-dark-400 flex-shrink-0">
            {section.lessons.length} lessons
          </span>
        </button>
        <button
          type="button"
          onClick={onRemoveSection}
          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
        >
          <HiTrash className="h-4 w-4" />
        </button>
      </div>

      {isOpen && (
        <div className="p-4 space-y-4">
          {/* Section fields */}
          <div className="grid grid-cols-1 gap-3">
            <input
              value={section.title}
              onChange={(e) => onUpdateSection('title', e.target.value)}
              placeholder="Section title *"
              className="input-field text-sm"
            />
            <input
              value={section.description}
              onChange={(e) => onUpdateSection('description', e.target.value)}
              placeholder="Section description (optional)"
              className="input-field text-sm"
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
            className="w-full py-2.5 border-2 border-dashed border-dark-200 dark:border-dark-600 rounded-xl text-sm text-dark-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center justify-center gap-2"
          >
            <HiPlus className="h-4 w-4" /> Add Lesson
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

  const typeIcon = { video: HiPlay, text: HiDocument, quiz: HiPencilAlt };
  const TypeIcon = typeIcon[lesson.type] || HiDocument;

  return (
    <div className="bg-white dark:bg-dark-900 border border-dark-100 dark:border-dark-700 rounded-xl p-4 space-y-3">
      {/* Lesson header row */}
      <div className="flex items-center gap-2">
        <div
          className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
            lesson.type === 'video'
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
              : lesson.type === 'quiz'
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                : 'bg-dark-100 dark:bg-dark-700 text-dark-500'
          }`}
        >
          <TypeIcon className="h-3.5 w-3.5" />
        </div>
        <span className="text-xs text-dark-400">Lesson {lessonIndex + 1}</span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-red-400 hover:text-red-600 rounded-lg transition-colors"
        >
          <HiTrash className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Lesson fields */}
      <input
        value={lesson.title}
        onChange={(e) => onUpdate('title', e.target.value)}
        placeholder="Lesson title *"
        className="input-field text-sm w-full"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <select
          value={lesson.type}
          onChange={(e) => onUpdate('type', e.target.value)}
          className="input-field text-sm"
        >
          <option value="video">Video</option>
          <option value="text">Text</option>
          <option value="quiz">Quiz</option>
        </select>
        <input
          type="number"
          value={lesson.duration}
          onChange={(e) => onUpdate('duration', e.target.value)}
          placeholder="Duration (sec)"
          className="input-field text-sm"
          min="0"
        />
        <label className="flex items-center gap-2 px-3 py-2 bg-dark-50 dark:bg-dark-800 rounded-lg cursor-pointer text-sm text-dark-600 dark:text-dark-400">
          <input
            type="checkbox"
            checked={lesson.isFree}
            onChange={(e) => onUpdate('isFree', e.target.checked)}
            className="rounded"
          />
          Free preview
        </label>
      </div>

      {lesson.type === 'video' && (
        <input
          value={lesson.videoUrl}
          onChange={(e) => onUpdate('videoUrl', e.target.value)}
          placeholder="YouTube embed URL (https://www.youtube.com/embed/...)"
          className="input-field text-sm w-full"
        />
      )}

      {(lesson.type === 'text' || lesson.type === 'quiz') && (
        <textarea
          value={lesson.content}
          onChange={(e) => onUpdate('content', e.target.value)}
          placeholder={
            lesson.type === 'quiz'
              ? 'Quiz instructions / description'
              : 'Lesson content (markdown supported)'
          }
          className="input-field text-sm w-full min-h-[80px] resize-none"
        />
      )}

      {lesson.type === 'video' && (
        <textarea
          value={lesson.content}
          onChange={(e) => onUpdate('content', e.target.value)}
          placeholder="Lesson description / notes (optional)"
          className="input-field text-sm w-full min-h-[60px] resize-none"
        />
      )}

      {/* Resources toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowResources((p) => !p)}
          className="flex items-center gap-1.5 text-xs text-dark-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <HiDownload className="h-3.5 w-3.5" />
          Resources ({lesson.resources?.length || 0})
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
                  placeholder="Title"
                  className="input-field text-xs sm:flex-1"
                />
                <input
                  value={res.url}
                  onChange={(e) => onUpdateResource(ri, 'url', e.target.value)}
                  placeholder="URL"
                  className="input-field text-xs sm:flex-[2]"
                />
                <div className="flex gap-2">
                  <select
                    value={res.type}
                    onChange={(e) => onUpdateResource(ri, 'type', e.target.value)}
                    className="input-field text-xs flex-1 sm:w-20 sm:flex-none"
                  >
                    <option value="link">Link</option>
                    <option value="pdf">PDF</option>
                    <option value="doc">Doc</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => onRemoveResource(ri)}
                    className="p-1 text-red-400 hover:text-red-600 flex-shrink-0"
                  >
                    <HiTrash className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={onAddResource}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              <HiPlus className="h-3 w-3" /> Add resource
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
