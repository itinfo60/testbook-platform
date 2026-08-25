import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { HiShieldCheck, HiDocumentText, HiRefresh, HiClock } from 'react-icons/hi';
import api from '@/services/api';

export default function LegalPage() {
  const { type } = useParams();
  const [activeTab, setActiveTab] = useState(type || 'privacy');
  const [legalData, setLegalData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (type) {
      setActiveTab(type);
    }
  }, [type]);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await api.get('/settings/legal');
        const data = res.data?.data || res.data || {};
        setLegalData(data);
      } catch (err) {
        console.warn('Using default legal policies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, []);

  const tabs = [
    { id: 'privacy', label: 'Privacy Policy', field: 'privacyPolicy' },
    { id: 'terms', label: 'Terms & Conditions', field: 'termsAndConditions' },
    { id: 'refund', label: 'Refund & Cancellation', field: 'refundPolicy' },
    { id: 'disclaimer', label: 'Disclaimer', field: 'disclaimer' },
  ];

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];
  const contentText = legalData?.[currentTab.field] || '';

  return (
    <div className="bg-slate-50 dark:bg-dark-950 min-h-screen py-12 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-primary-700 dark:text-primary-300 font-semibold uppercase tracking-wider text-xs bg-primary-50 dark:bg-primary-950/60 px-3.5 py-1.5 rounded-full border border-primary-200 dark:border-primary-800 mb-4">
            <HiShieldCheck className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span>Legal & Platform Governance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            CivicsEdu Terms, Policies & Disclaimers
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
            Please review our operational rules, intellectual property protections, watermarking
            policies, and user agreements.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-xs max-w-2xl mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-dark-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Document Card */}
        <div className="bg-white dark:bg-dark-900 rounded-3xl p-6 sm:p-10 shadow-xs border border-slate-200 dark:border-dark-800 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-dark-800">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display">
                {currentTab.label}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                CivicsEdu Learning Technologies Platform
              </p>
            </div>
            {legalData?.lastUpdated && (
              <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 dark:bg-dark-800/80 px-3 py-1 rounded-full border border-slate-200/60 dark:border-dark-700/60">
                <HiClock className="h-3.5 w-3.5 text-primary-500" />
                <span>Updated: {new Date(legalData.lastUpdated).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-400">Loading policy content...</p>
            </div>
          ) : contentText ? (
            <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-4 text-slate-700 dark:text-slate-300">
              {contentText.split('\n\n').map((paragraph, index) => {
                const trimmed = paragraph.trim();
                if (trimmed.match(/^[0-9]+\.\s/)) {
                  const lines = trimmed.split('\n');
                  const heading = lines[0];
                  const body = lines.slice(1).join('\n');
                  return (
                    <div key={index} className="pt-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1.5">
                        {heading}
                      </h3>
                      {body && <p className="leading-relaxed whitespace-pre-line">{body}</p>}
                    </div>
                  );
                }
                return (
                  <p key={index} className="whitespace-pre-line leading-relaxed">
                    {trimmed}
                  </p>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              Policy content will be updated shortly.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
