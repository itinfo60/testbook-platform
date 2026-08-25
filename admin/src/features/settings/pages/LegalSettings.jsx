import { useState, useEffect } from 'react';
import { ShieldCheck, Save, Eye, RefreshCw, ExternalLink, FileText, Check } from 'lucide-react';
import { settingsAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function LegalSettings() {
  const [activeTab, setActiveTab] = useState('privacy');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [form, setForm] = useState({
    privacyPolicy: '',
    termsAndConditions: '',
    refundPolicy: '',
    disclaimer: '',
    lastUpdated: '',
  });

  const fetchLegal = async () => {
    setLoading(true);
    try {
      const res = await settingsAPI.getLegal();
      const data = res.data?.data || res.data || {};
      setForm({
        privacyPolicy: data.privacyPolicy || '',
        termsAndConditions: data.termsAndConditions || '',
        refundPolicy: data.refundPolicy || '',
        disclaimer: data.disclaimer || '',
        lastUpdated: data.lastUpdated || '',
      });
    } catch (err) {
      toast.error('Failed to load legal settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLegal();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.updateLegal(form);
      toast.success('Legal policies updated successfully!');
      setForm((prev) => ({ ...prev, lastUpdated: new Date().toISOString() }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update legal policies');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'privacy', label: 'Privacy Policy', field: 'privacyPolicy', icon: ShieldCheck },
    { id: 'terms', label: 'Terms & Conditions', field: 'termsAndConditions', icon: FileText },
    { id: 'refund', label: 'Refund & Cancellation', field: 'refundPolicy', icon: RefreshCw },
    { id: 'disclaimer', label: 'Disclaimer', field: 'disclaimer', icon: FileText },
  ];

  const currentTabObj = tabs.find((t) => t.id === activeTab) || tabs[0];
  const currentText = form[currentTabObj.field] || '';

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">Loading legal policies...</p>
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
              Legal & Policies CMS
            </h2>
            <span className="badge badge-info text-xs">Public Pages</span>
          </div>
          <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">
            Manage terms, privacy policy, and refund rules displayed on{' '}
            <a
              href="http://localhost:5173/legal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline inline-flex items-center gap-0.5 font-medium"
            >
              /legal <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className={`btn-secondary gap-1.5 text-xs py-2 ${previewMode ? 'bg-primary-50 text-primary-700 border-primary-300 dark:bg-primary-950/40' : ''}`}
          >
            <Eye className="w-4 h-4" />
            {previewMode ? 'Edit Mode' : 'Live Preview'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary gap-2 text-xs py-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Policies'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-gray-100 dark:bg-gray-800/60 rounded-2xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6">
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {currentTabObj.label} Content
              </h3>
              <p className="text-xs text-gray-500">
                Supports multiple paragraphs, numbered sections, and policies
              </p>
            </div>
            {form.lastUpdated && (
              <span className="text-[11px] text-gray-400">
                Last updated: {new Date(form.lastUpdated).toLocaleDateString()}
              </span>
            )}
          </div>

          {!previewMode ? (
            <div>
              <textarea
                rows={16}
                value={currentText}
                onChange={(e) => setForm({ ...form, [currentTabObj.field]: e.target.value })}
                className="input-field font-sans text-sm leading-relaxed"
                placeholder={`Enter ${currentTabObj.label} text here...`}
              />
              <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                <span>Separate sections with blank lines for automatic paragraph formatting.</span>
                <span>
                  {currentText.length} characters •{' '}
                  {currentText.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 min-h-[16rem]">
              <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-4 text-gray-700 dark:text-gray-300">
                {currentText.split('\n\n').map((para, i) => (
                  <p key={i} className="whitespace-pre-line leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
            <a
              href={`http://localhost:5173/legal/${activeTab}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary-600 hover:underline flex items-center gap-1 font-medium"
            >
              <span>View live on Client Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary gap-1.5 text-xs"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Saving...' : `Save ${currentTabObj.label}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
