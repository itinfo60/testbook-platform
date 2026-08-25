import { useState, useEffect } from 'react';
import {
  HelpCircle,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Save,
  ExternalLink,
  Check,
} from 'lucide-react';
import { settingsAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function HelpSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    supportEmail: '',
    supportPhone: '',
    supportWhatsapp: '',
    supportHours: '',
    officeAddress: '',
    faqs: [],
  });

  const [newFaq, setNewFaq] = useState({
    category: 'General Support',
    question: '',
    answer: '',
  });

  const fetchHelp = async () => {
    setLoading(true);
    try {
      const res = await settingsAPI.getHelp();
      const data = res.data?.data || res.data || {};
      setForm({
        supportEmail: data.supportEmail || '',
        supportPhone: data.supportPhone || '',
        supportWhatsapp: data.supportWhatsapp || '',
        supportHours: data.supportHours || '',
        officeAddress: data.officeAddress || '',
        faqs: Array.isArray(data.faqs) ? data.faqs : [],
      });
    } catch (err) {
      toast.error('Failed to load help settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHelp();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.updateHelp(form);
      toast.success('Help center & FAQs updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update help settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFaq = (e) => {
    e.preventDefault();
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      toast.error('Please enter both FAQ question and answer');
      return;
    }

    const created = {
      id: `faq-${Date.now()}`,
      category: newFaq.category.trim() || 'General',
      question: newFaq.question.trim(),
      answer: newFaq.answer.trim(),
    };

    setForm((prev) => ({
      ...prev,
      faqs: [created, ...prev.faqs],
    }));

    setNewFaq({ category: 'General Support', question: '', answer: '' });
    toast.success('FAQ item added to draft list');
  };

  const handleDeleteFaq = (id) => {
    setForm((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((f) => f.id !== id),
    }));
  };

  const handleFaqChange = (id, field, value) => {
    setForm((prev) => ({
      ...prev,
      faqs: prev.faqs.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
    }));
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">Loading help settings & FAQs...</p>
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
              Help Center & FAQ Manager
            </h2>
            <span className="badge badge-info text-xs">Student Support</span>
          </div>
          <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">
            Manage contact channels, support helpline numbers, and FAQs displayed on{' '}
            <a
              href="http://localhost:5173/help"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline inline-flex items-center gap-0.5 font-medium"
            >
              /help <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary gap-2 text-xs py-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving Changes...' : 'Save Help & FAQs'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: FAQ Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add New FAQ Card */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
              <Plus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Add New Question & Answer
              </h3>
            </div>

            <form onSubmit={handleAddFaq} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    value={newFaq.category}
                    onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
                    className="input-field text-xs"
                    placeholder="e.g. Course Access, Tests"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Question *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFaq.question}
                    onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                    className="input-field text-xs"
                    placeholder="e.g. How do I download my watermarked notes?"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Detailed Answer *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                  className="input-field text-xs leading-relaxed"
                  placeholder="Provide step-by-step resolution for students..."
                />
              </div>

              <div className="flex justify-end">
                <button type="submit" className="btn-secondary gap-1.5 text-xs py-1.5">
                  <Plus className="w-4 h-4 text-primary-600" /> Add to FAQ List
                </button>
              </div>
            </form>
          </div>

          {/* Existing FAQs List */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Active FAQs ({form.faqs.length})
                </h3>
                <p className="text-xs text-gray-500">Edit existing FAQs or remove outdated ones</p>
              </div>
            </div>

            {form.faqs.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No FAQs configured yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {form.faqs.map((faq, index) => (
                  <div
                    key={faq.id || index}
                    className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="badge badge-primary text-[10px]">
                        {faq.category || 'General'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => handleFaqChange(faq.id, 'question', e.target.value)}
                        className="input-field text-xs font-semibold text-gray-900 dark:text-white"
                        placeholder="Question title"
                      />
                    </div>

                    <div>
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => handleFaqChange(faq.id, 'answer', e.target.value)}
                        className="input-field text-xs text-gray-600 dark:text-gray-300 leading-relaxed"
                        placeholder="Detailed answer"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Support Channels & Helpline */}
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800">
              Support Channels
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary-500" /> Support Email
                </label>
                <input
                  type="email"
                  value={form.supportEmail}
                  onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
                  className="input-field text-xs"
                  placeholder="support@civicsedu.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" /> Helpline Phone Number
                </label>
                <input
                  type="text"
                  value={form.supportPhone}
                  onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
                  className="input-field text-xs"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-green-500" /> WhatsApp Support Number
                </label>
                <input
                  type="text"
                  value={form.supportWhatsapp}
                  onChange={(e) => setForm({ ...form, supportWhatsapp: e.target.value })}
                  className="input-field text-xs"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Working Support Hours
                </label>
                <input
                  type="text"
                  value={form.supportHours}
                  onChange={(e) => setForm({ ...form, supportHours: e.target.value })}
                  className="input-field text-xs"
                  placeholder="Mon – Sat: 9:00 AM – 7:00 PM IST"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" /> Centre / Office Address
                </label>
                <textarea
                  rows={2}
                  value={form.officeAddress}
                  onChange={(e) => setForm({ ...form, officeAddress: e.target.value })}
                  className="input-field text-xs"
                  placeholder="CivicsEdu Learning Centre, Jaipur, Rajasthan"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary w-full gap-2 text-xs py-2.5 justify-center"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving Changes...' : 'Save Help Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
