import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import axios from '@/services/api';

export default function BrandingSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    tagline: '',
    primaryColor: '#4F46E5',
    secondaryColor: '#7C3AED',
    logo: '',
    banner: '',
    supportEmail: '',
    supportPhone: '',
    website: '',
    socialLinks: { twitter: '', instagram: '', youtube: '', telegram: '' },
  });

  useEffect(() => {
    axios
      .get('/institutes/branding')
      .then(({ data }) => {
        const b = data.data?.institute;
        if (b) setForm((f) => ({ ...f, ...b }));
      })
      .catch(() => toast.error('Failed to load branding settings'))
      .finally(() => setLoading(false));
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setSocial = (key) => (e) =>
    setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, [key]: e.target.value } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post('/institutes/branding', form);
      toast.success('Branding updated successfully');
    } catch {
      toast.error('Failed to save branding');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Institute Branding</h1>
        <p className="text-sm text-gray-500 mt-1">
          Customize how your institute appears to students
        </p>
      </div>

      {/* Preview bar */}
      <div
        className="rounded-xl p-4 flex items-center gap-4 text-white"
        style={{ background: form.primaryColor }}
      >
        {form.logo && (
          <img src={form.logo} alt="logo" className="h-10 w-10 rounded-lg object-cover" />
        )}
        <div>
          <div className="font-bold text-lg">{form.name || 'Your Institute'}</div>
          {form.tagline && <div className="text-sm opacity-80">{form.tagline}</div>}
        </div>
      </div>

      {/* Basic Info */}
      <section className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-dark-700 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">Basic Information</h2>
        {[
          { label: 'Institute Name', key: 'name', placeholder: 'Allen Career Institute' },
          { label: 'Tagline', key: 'tagline', placeholder: 'Learning. Innovation. Excellence.' },
          { label: 'Logo URL', key: 'logo', placeholder: 'https://...' },
          { label: 'Banner URL', key: 'banner', placeholder: 'https://...' },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {label}
            </label>
            <input
              type="text"
              value={form[key]}
              onChange={set(key)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        ))}
      </section>

      {/* Colors */}
      <section className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-dark-700 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">Brand Colors</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Primary Color', key: 'primaryColor' },
            { label: 'Secondary Color', key: 'secondaryColor' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {label}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form[key]}
                  onChange={set(key)}
                  className="h-10 w-14 rounded cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={form[key]}
                  onChange={set(key)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-dark-700 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">Contact Information</h2>
        {[
          { label: 'Support Email', key: 'supportEmail', placeholder: 'support@yourinstitute.com' },
          { label: 'Support Phone', key: 'supportPhone', placeholder: '+91 9876543210' },
          { label: 'Website', key: 'website', placeholder: 'https://yourinstitute.com' },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {label}
            </label>
            <input
              type="text"
              value={form[key]}
              onChange={set(key)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        ))}
      </section>

      {/* Social Links */}
      <section className="bg-white dark:bg-dark-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-dark-700 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">Social Links</h2>
        {[
          { label: 'Twitter / X', key: 'twitter' },
          { label: 'Instagram', key: 'instagram' },
          { label: 'YouTube', key: 'youtube' },
          { label: 'Telegram', key: 'telegram' },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {label}
            </label>
            <input
              type="url"
              value={form.socialLinks[key]}
              onChange={setSocial(key)}
              placeholder={`https://${key}.com/yourinstitute`}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        ))}
      </section>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save Branding'}
      </button>
    </div>
  );
}
