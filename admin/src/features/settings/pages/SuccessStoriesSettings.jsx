import { useState, useEffect } from 'react';
import {
  Trophy,
  Plus,
  Trash2,
  Edit2,
  Save,
  Sparkles,
  ExternalLink,
  CheckCircle,
  User,
} from 'lucide-react';
import { settingsAPI } from '@/services/api';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';

export default function SuccessStoriesSettings() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const [form, setForm] = useState({
    name: '',
    exam: '',
    rank: '',
    year: '',
    quote: '',
    image: '',
    badge: '',
    isFeatured: true,
  });

  const fetchStories = async () => {
    setLoading(true);
    try {
      const res = await settingsAPI.getSuccessStories();
      const list = res.data?.data?.stories || res.data?.stories || [];
      setStories(list);
    } catch (err) {
      toast.error('Failed to load success stories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleOpenAdd = () => {
    setEditingIndex(null);
    setForm({
      name: '',
      exam: '',
      rank: '',
      year: `${new Date().getFullYear()} Batch`,
      quote: '',
      image: '',
      badge: 'Selected Candidate',
      isFeatured: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (index) => {
    setEditingIndex(index);
    setForm(stories[index]);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.exam || !form.quote) {
      toast.error('Name, Exam, and Testimonial Quote are required');
      return;
    }

    const storyObj = {
      id: form.id || `story-${Date.now()}`,
      name: form.name.trim(),
      exam: form.exam.trim(),
      rank: form.rank.trim() || 'Selected',
      year: form.year.trim() || `${new Date().getFullYear()}`,
      quote: form.quote.trim(),
      image:
        form.image.trim() ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      badge: form.badge.trim() || 'Topper',
      isFeatured: Boolean(form.isFeatured),
    };

    if (editingIndex !== null) {
      const updated = [...stories];
      updated[editingIndex] = storyObj;
      setStories(updated);
    } else {
      setStories([storyObj, ...stories]);
    }

    setIsModalOpen(false);
    toast.success('Story updated in list (click "Save Changes" to publish)');
  };

  const handleDelete = (index) => {
    setStories((prev) => prev.filter((_, i) => i !== index));
    toast.success('Story removed from list');
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await settingsAPI.updateSuccessStories({ stories });
      toast.success('Success stories & Hall of Fame updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update success stories');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">Loading success stories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Success Stories & Hall of Fame
            </h2>
            <span className="badge badge-warning text-xs">Topper Showcase</span>
          </div>
          <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">
            Manage rank holders, selected students, and testimonials on{' '}
            <a
              href="http://localhost:5173/success-stories"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline inline-flex items-center gap-0.5 font-medium"
            >
              /success-stories <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn-secondary gap-1.5 text-xs py-2"
          >
            <Plus className="w-4 h-4 text-primary-600" /> Add Topper Story
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="btn-primary gap-2 text-xs py-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Stories Grid */}
      {stories.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
            No Success Stories Added
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Add rank holders and topper reviews to inspire prospective students.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn-primary gap-1.5 text-xs mx-auto"
          >
            <Plus className="w-4 h-4" /> Add First Story
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stories.map((story, index) => (
            <div
              key={story.id || index}
              className="card p-5 space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-start gap-4">
                <img
                  src={
                    story.image ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                  }
                  alt={story.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-gray-200 dark:border-gray-700 shadow-xs flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                      {story.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(index)}
                        className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                        title="Edit story"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(index)}
                        className="p-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Delete story"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="badge badge-warning text-[10px] py-0.5">🏆 {story.rank}</span>
                    {story.isFeatured && (
                      <span className="badge badge-primary text-[10px] py-0.5 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> Top Story
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-1">
                    {story.exam} • {story.year}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic line-clamp-3 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                "{story.quote}"
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" /> Verified Candidate
                </span>
                <span>
                  Badge: <strong>{story.badge}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIndex !== null ? 'Edit Topper Story' : 'Add New Success Story'}
      >
        <form onSubmit={handleModalSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Student / Topper Full Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field text-xs"
                placeholder="e.g. Vikram Singh Shekhawat"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Examination *
              </label>
              <input
                type="text"
                required
                value={form.exam}
                onChange={(e) => setForm({ ...form, exam: e.target.value })}
                className="input-field text-xs"
                placeholder="e.g. RPSC RAS 2023"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Rank / Selection Title
              </label>
              <input
                type="text"
                value={form.rank}
                onChange={(e) => setForm({ ...form, rank: e.target.value })}
                className="input-field text-xs"
                placeholder="e.g. Rank 14 (SDM Selected)"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Year / Batch
              </label>
              <input
                type="text"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="input-field text-xs"
                placeholder="e.g. 2023 Batch"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Badge / Tag
              </label>
              <input
                type="text"
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                className="input-field text-xs"
                placeholder="e.g. State Top 20, 1st Grade Teacher"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Topper Photo URL
              </label>
              <input
                type="text"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="input-field text-xs"
                placeholder="https://.../photo.jpg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Testimonial / Success Quote *
            </label>
            <textarea
              rows={4}
              required
              value={form.quote}
              onChange={(e) => setForm({ ...form, quote: e.target.value })}
              className="input-field text-xs leading-relaxed"
              placeholder="What did the student say about CivicsEdu courses, mock tests, and faculty guidance?..."
            />
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Featured Topper Story (Shown
                prominently)
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              {editingIndex !== null ? 'Update Story' : 'Add Story'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
