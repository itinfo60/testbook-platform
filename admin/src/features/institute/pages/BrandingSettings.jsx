import { useState, useEffect } from 'react';
import { Palette, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';

const DEFAULTS = {
  primaryColor: '#3b82f6',
  secondaryColor: '#1e3a8a',
};

export default function BrandingSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    websiteTitle: '',
    primaryColor: DEFAULTS.primaryColor,
    secondaryColor: DEFAULTS.secondaryColor,
    faviconUrl: '',
    logoUrl: '',
    bannerUrl: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
  });

  useEffect(() => {
    api
      .get('/institutes/branding')
      .then(({ data }) => {
        const b = data.data || data;
        if (!b) return;
        setForm({
          name: b.name || '',
          websiteTitle: b.websiteTitle || '',
          primaryColor: b.theme?.primaryColor || DEFAULTS.primaryColor,
          secondaryColor: b.theme?.secondaryColor || DEFAULTS.secondaryColor,
          faviconUrl: b.theme?.faviconUrl || '',
          logoUrl: b.logo?.url || '',
          bannerUrl: b.theme?.bannerUrl || '',
          contactEmail: b.contactDetails?.email || '',
          contactPhone: b.contactDetails?.phone || '',
          contactAddress: b.contactDetails?.address || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/institutes/branding', {
        name: form.name || undefined,
        websiteTitle: form.websiteTitle || undefined,
        theme: {
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          faviconUrl: form.faviconUrl || undefined,
          bannerUrl: form.bannerUrl || undefined,
        },
        logo: form.logoUrl ? { url: form.logoUrl } : undefined,
        contactDetails: {
          email: form.contactEmail || undefined,
          phone: form.contactPhone || undefined,
          address: form.contactAddress || undefined,
        },
      });
      toast.success('Branding saved! Changes apply on next page load.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save branding');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Branding Settings</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Customize your institute's appearance on the student-facing website
          </p>
        </div>
        <Palette className="w-6 h-6 text-primary-500" />
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identity */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Identity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Institute Name
              </label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="e.g. Testbook Academy"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Browser Tab Title
              </label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="e.g. Testbook Academy — Learn & Grow"
                value={form.websiteTitle}
                onChange={(e) => setForm((f) => ({ ...f, websiteTitle: e.target.value }))}
              />
            </div>
          </div>
        </section>

        {/* Colors */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Brand Colors</h3>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, ...DEFAULTS }))}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
          <p className="text-xs text-gray-400">
            These colors replace the default blue throughout buttons, links, and accent elements on
            the student website.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                key: 'primaryColor',
                label: 'Primary Color',
                hint: 'Buttons, active links, progress bars',
              },
              {
                key: 'secondaryColor',
                label: 'Secondary Color',
                hint: 'Accents, hover states, badges',
              },
            ].map(({ key, label, hint }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {label}
                </label>
                <p className="text-xs text-gray-400 mb-2">{hint}</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="h-10 w-12 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="input-field flex-1 font-mono text-sm"
                    placeholder="#3b82f6"
                  />
                </div>
                <div className="mt-2 h-5 rounded-lg" style={{ backgroundColor: form[key] }} />
              </div>
            ))}
          </div>
        </section>

        {/* Logo & Favicon (URL-based) */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Logo & Favicon</h3>
          <p className="text-xs text-gray-400">
            Paste publicly accessible URLs (e.g. from Cloudinary, S3, or your CDN).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Logo URL
              </label>
              <input
                type="url"
                className="input-field w-full"
                placeholder="https://cdn.example.com/logo.png"
                value={form.logoUrl}
                onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
              />
              {form.logoUrl && (
                <img
                  src={form.logoUrl}
                  alt="Logo preview"
                  className="mt-2 h-12 object-contain rounded border border-gray-200 dark:border-gray-700 p-1.5 bg-gray-50 dark:bg-gray-900"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Favicon URL
              </label>
              <input
                type="url"
                className="input-field w-full"
                placeholder="https://cdn.example.com/favicon.ico"
                value={form.faviconUrl}
                onChange={(e) => setForm((f) => ({ ...f, faviconUrl: e.target.value }))}
              />
              {form.faviconUrl && (
                <img
                  src={form.faviconUrl}
                  alt="Favicon preview"
                  className="mt-2 h-8 w-8 object-contain rounded border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-900"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Contact Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                className="input-field w-full"
                placeholder="support@institute.com"
                value={form.contactEmail}
                onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Phone
              </label>
              <input
                type="tel"
                className="input-field w-full"
                placeholder="+91 98765 43210"
                value={form.contactPhone}
                onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Address
              </label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="123 Academy Rd, Mumbai"
                value={form.contactAddress}
                onChange={(e) => setForm((f) => ({ ...f, contactAddress: e.target.value }))}
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary gap-2 disabled:opacity-60">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Branding'}
          </button>
        </div>
      </form>
    </div>
  );
}
