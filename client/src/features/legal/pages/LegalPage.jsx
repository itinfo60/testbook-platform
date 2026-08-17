import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { HiShieldCheck, HiDocumentText } from 'react-icons/hi';

export default function LegalPage() {
  const { type } = useParams();
  const [activeTab, setActiveTab] = useState(type || 'privacy');

  return (
    <div className="bg-dark-50 dark:bg-dark-950 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-dark-900 dark:text-dark-100">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-xs bg-amber-50 dark:bg-amber-950 px-3 py-1 rounded-full mb-3">
            <HiShieldCheck className="h-4 w-4" /> Legal & Governance
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display">
            EduHub Terms, Policies & Disclaimers
          </h1>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { id: 'privacy', label: 'Privacy Policy' },
            { id: 'terms', label: 'Terms & Conditions' },
            { id: 'refund', label: 'Refund & Cancellation' },
            { id: 'disclaimer', label: 'Disclaimer' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Document Content */}
        <div className="bg-white dark:bg-dark-900 rounded-3xl p-6 sm:p-10 shadow-md border border-slate-200 dark:border-dark-800 text-xs sm:text-sm leading-relaxed space-y-6 text-slate-700 dark:text-slate-300">
          {activeTab === 'privacy' && (
            <div>
              <h2 className="text-2xl font-extrabold text-dark-900 dark:text-white mb-4">
                Privacy Policy
              </h2>
              <p className="mb-4">
                At EduHub, we respect your privacy and are committed to protecting student personal
                information. This Privacy Policy outlines how your data is collected, used, and
                safeguarded.
              </p>
              <h3 className="text-base font-bold text-dark-900 dark:text-white mb-2">
                1. Information We Collect
              </h3>
              <p className="mb-4">
                We collect information provided directly by you during registration, including your
                name, mobile number, email address, exam preferences, and payment transactions via
                Razorpay.
              </p>
              <h3 className="text-base font-bold text-dark-900 dark:text-white mb-2">
                2. Watermarking Security
              </h3>
              <p className="mb-4">
                To protect proprietary handwritten notes and course content, study materials
                viewable or downloadable on EduHub carry a dynamic watermark displaying your
                registered name and student ID.
              </p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div>
              <h2 className="text-2xl font-extrabold text-dark-900 dark:text-white mb-4">
                Terms & Conditions
              </h2>
              <p className="mb-4">
                By accessing or using EduHub services, courses, and test series, you agree to comply
                with the following terms:
              </p>
              <h3 className="text-base font-bold text-dark-900 dark:text-white mb-2">
                1. Account & Content License
              </h3>
              <p className="mb-4">
                Course enrollments and test series subscriptions are personal to the registered
                student and non-transferable. Account sharing or public redistribution of study
                materials is strictly prohibited and subject to immediate account termination.
              </p>
            </div>
          )}

          {activeTab === 'refund' && (
            <div>
              <h2 className="text-2xl font-extrabold text-dark-900 dark:text-white mb-4">
                Refund & Cancellation Policy
              </h2>
              <p className="mb-4">
                Digital courses, live class access, and online test series subscriptions are
                non-refundable once unlocked or accessed, as digital study materials become
                instantly viewable.
              </p>
              <p className="mb-4">
                In case of duplicate payment transactions, eligible refunds are processed back to
                the original payment source via Razorpay within 5–7 business days.
              </p>
            </div>
          )}

          {activeTab === 'disclaimer' && (
            <div>
              <h2 className="text-2xl font-extrabold text-dark-900 dark:text-white mb-4">
                Disclaimer
              </h2>
              <p className="mb-4">
                EduHub is an independent educational coaching and test preparation platform. We are
                not affiliated with, endorsed by, or an official government representative of RPSC
                (Rajasthan Public Service Commission) or any government agency. Official recruitment
                notices and syllabi are sourced from official government portals for educational
                guidance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
