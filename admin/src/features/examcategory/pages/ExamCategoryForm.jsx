import LoadingSpinner from '@/components/loadingSpinner';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Calendar, Globe, Building } from 'lucide-react';
import {
  createExamCategory,
  updateExamCategory,
  fetchExamCategoryById,
  clearSelected,
} from '@/features/examcategory/examCategorySlice';

const INITIAL_FORM = {
  name: '',
  description: '',
  icon: '',
  isActive: true,
  conductingBody: '',
  officialWebsite: '',
  latestStatus: '',
  syllabus: '',
  examPattern: '',
  eligibility: '',
  selectionProcess: '',
  importantDates: [],
};

export default function ExamCategoryForm() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selected, loading } = useSelector((s) => s.examCategories);
  const isEdit = !!id;

  const [form, setForm] = useState(INITIAL_FORM);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (isEdit) dispatch(fetchExamCategoryById(id));
    return () => dispatch(clearSelected());
  }, [dispatch, id, isEdit]);

  useEffect(() => {
    if (isEdit && selected) {
      setForm({
        name: selected.name || '',
        description: selected.description || '',
        icon: selected.icon || '',
        isActive: selected.isActive !== false,
        conductingBody: selected.conductingBody || '',
        officialWebsite: selected.officialWebsite || '',
        latestStatus: selected.latestStatus || '',
        syllabus: selected.syllabus || '',
        examPattern: selected.examPattern || '',
        eligibility: selected.eligibility || '',
        selectionProcess: selected.selectionProcess || '',
        importantDates: selected.importantDates || [],
      });
    }
  }, [selected, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const action = isEdit ? updateExamCategory({ id, data: form }) : createExamCategory(form);
    const result = await dispatch(action);
    if (!result.error) navigate('/exam-categories');
  };

  const addDate = () => {
    setForm({
      ...form,
      importantDates: [...form.importantDates, { label: '', date: '', description: '' }],
    });
  };

  const removeDate = (index) => {
    setForm({
      ...form,
      importantDates: form.importantDates.filter((_, i) => i !== index),
    });
  };

  const updateDate = (index, field, value) => {
    const updated = [...form.importantDates];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, importantDates: updated });
  };

  if (isEdit && loading && !selected)
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'content', label: 'Exam Content' },
    { id: 'dates', label: 'Important Dates' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/exam-categories')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Edit Exam Category' : 'Create Exam Category'}
        </h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* BASIC INFO TAB */}
        {activeTab === 'basic' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
                required
                placeholder="e.g., Patwari, RAS, RPSC SI"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-field"
                rows={3}
                placeholder="Brief description of the exam..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Icon (emoji)
                </label>
                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="input-field"
                  placeholder="📝"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Building className="inline w-4 h-4 mr-1" />
                  Conducting Body
                </label>
                <input
                  type="text"
                  value={form.conductingBody}
                  onChange={(e) => setForm({ ...form, conductingBody: e.target.value })}
                  className="input-field"
                  placeholder="e.g., RPSC, RSMSSB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Active
                </label>
                <select
                  value={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
                  className="input-field"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Globe className="inline w-4 h-4 mr-1" />
                  Official Website
                </label>
                <input
                  type="url"
                  value={form.officialWebsite}
                  onChange={(e) => setForm({ ...form, officialWebsite: e.target.value })}
                  className="input-field"
                  placeholder="https://rpsc.rajasthan.gov.in"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Latest Status
                </label>
                <input
                  type="text"
                  value={form.latestStatus}
                  onChange={(e) => setForm({ ...form, latestStatus: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Notification Released, Exam Scheduled"
                />
              </div>
            </div>
          </div>
        )}

        {/* CONTENT TAB */}
        {activeTab === 'content' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Syllabus (Markdown / HTML)
              </label>
              <textarea
                value={form.syllabus}
                onChange={(e) => setForm({ ...form, syllabus: e.target.value })}
                className="input-field font-mono text-sm"
                rows={8}
                placeholder="Enter full syllabus details..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Exam Pattern (Markdown / HTML)
              </label>
              <textarea
                value={form.examPattern}
                onChange={(e) => setForm({ ...form, examPattern: e.target.value })}
                className="input-field font-mono text-sm"
                rows={6}
                placeholder="Number of papers, marks distribution, time duration..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Eligibility Criteria (Markdown / HTML)
              </label>
              <textarea
                value={form.eligibility}
                onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
                className="input-field font-mono text-sm"
                rows={5}
                placeholder="Age limit, education qualification, nationality..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Selection Process (Markdown / HTML)
              </label>
              <textarea
                value={form.selectionProcess}
                onChange={(e) => setForm({ ...form, selectionProcess: e.target.value })}
                className="input-field font-mono text-sm"
                rows={4}
                placeholder="Prelims → Mains → Interview..."
              />
            </div>
          </div>
        )}

        {/* DATES TAB */}
        {activeTab === 'dates' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Important Dates
              </h3>
              <button type="button" onClick={addDate} className="btn-secondary gap-1 text-sm">
                <Plus className="w-4 h-4" /> Add Date
              </button>
            </div>

            {form.importantDates.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No important dates added yet. Click "Add Date" to start.
              </p>
            )}

            {form.importantDates.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Label</label>
                  <input
                    type="text"
                    value={item.label || ''}
                    onChange={(e) => updateDate(index, 'label', e.target.value)}
                    className="input-field text-sm"
                    placeholder="e.g., Application Start, Exam Date"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={item.date ? new Date(item.date).toISOString().split('T')[0] : ''}
                    onChange={(e) => updateDate(index, 'date', e.target.value)}
                    className="input-field text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeDate(index)}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button type="submit" className="btn-primary gap-2">
            <Save className="w-4 h-4" /> {isEdit ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/exam-categories')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
