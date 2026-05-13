import { Input } from '@/components/ui';
import { HiPlus, HiTrash } from 'react-icons/hi';
import { Button } from '@/components/ui';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createCourse, updateCourse, fetchCourseById } from '@/features/course/courseSlice';
import toast from 'react-hot-toast';

export default function TeacherCourseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentCourse, loading } = useSelector(state => state.courses);
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: '', description: '', price: '', originalPrice: '', category: '',
    level: 'beginner', thumbnail: '', duration: '', lessons: [],
  });

  useEffect(() => {
    if (isEdit) dispatch(fetchCourseById(id));
  }, [dispatch, id, isEdit]);

  useEffect(() => {
    if (isEdit && currentCourse) {
      setFormData({
        title: currentCourse.title || '',
        description: currentCourse.description || '',
        price: currentCourse.price || '',
        originalPrice: currentCourse.originalPrice || '',
        category: currentCourse.category?.name || currentCourse.category || '',
        level: currentCourse.level || 'beginner',
        thumbnail: currentCourse.thumbnail || '',
        duration: currentCourse.duration || '',
        lessons: currentCourse.lessons || [],
      });
    }
  }, [isEdit, currentCourse]);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addLesson = () => {
    setFormData({
      ...formData,
      lessons: [...formData.lessons, { title: '', type: 'video', videoUrl: '', content: '', duration: '' }],
    });
  };

  const updateLesson = (index, field, value) => {
    const updated = [...formData.lessons];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, lessons: updated });
  };

  const removeLesson = index => {
    setFormData({ ...formData, lessons: formData.lessons.filter((_, i) => i !== index) });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.title) { toast.error('Title is required'); return; }

    try {
      if (isEdit) {
        await dispatch(updateCourse({ id, ...formData })).unwrap();
        toast.success('Course updated!');
      } else {
        await dispatch(createCourse(formData)).unwrap();
        toast.success('Course created!');
      }
      navigate('/teacher/courses');
    } catch (err) {
      toast.error(err || 'Failed');
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-6">
        {isEdit ? 'Edit Course' : 'Create New Course'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h3 className="font-medium text-dark-900 dark:text-white">Basic Info</h3>
          <Input label="Course Title" name="title" value={formData.title} onChange={handleChange} required />
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="input-field min-h-[120px] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (₹)" name="price" type="number" value={formData.price} onChange={handleChange} />
            <Input label="Original Price (₹)" name="originalPrice" type="number" value={formData.originalPrice} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Category" name="category" value={formData.category} onChange={handleChange} />
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Level</label>
              <select name="level" value={formData.level} onChange={handleChange} className="input-field">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <Input label="Thumbnail URL" name="thumbnail" value={formData.thumbnail} onChange={handleChange} />
          <Input label="Duration" name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g., 10 hours" />
        </div>

        {/* Lessons */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-dark-900 dark:text-white">Lessons ({formData.lessons.length})</h3>
            <button type="button" onClick={addLesson} className="btn-outline text-sm flex items-center gap-1">
              <HiPlus className="h-3.5 w-3.5" /> Add Lesson
            </button>
          </div>
          <div className="space-y-4">
            {formData.lessons.map((lesson, i) => (
              <div key={i} className="p-4 bg-dark-50 dark:bg-dark-800/50 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-dark-500">Lesson {i + 1}</span>
                  <button type="button" onClick={() => removeLesson(i)} className="text-red-500 hover:text-red-600">
                    <HiTrash className="h-4 w-4" />
                  </button>
                </div>
                <Input placeholder="Lesson Title" value={lesson.title} onChange={e => updateLesson(i, 'title', e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <select value={lesson.type} onChange={e => updateLesson(i, 'type', e.target.value)} className="input-field text-sm">
                    <option value="video">Video</option>
                    <option value="text">Text</option>
                  </select>
                  <Input placeholder="Duration" value={lesson.duration} onChange={e => updateLesson(i, 'duration', e.target.value)} />
                </div>
                {lesson.type === 'video' && (
                  <Input placeholder="Video URL" value={lesson.videoUrl} onChange={e => updateLesson(i, 'videoUrl', e.target.value)} />
                )}
                {lesson.type === 'text' && (
                  <textarea placeholder="Lesson Content" value={lesson.content} onChange={e => updateLesson(i, 'content', e.target.value)} className="input-field min-h-[80px] resize-none text-sm" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>{isEdit ? 'Update Course' : 'Create Course'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/teacher/courses')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
