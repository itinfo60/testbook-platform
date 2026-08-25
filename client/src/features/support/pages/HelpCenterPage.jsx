import { useState, useEffect } from 'react';
import {
  HiQuestionMarkCircle,
  HiSearch,
  HiChevronDown,
  HiChevronUp,
  HiMail,
  HiPhone,
  HiChat,
  HiTicket,
  HiClock,
  HiLocationMarker,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { supportAPI } from '@/services/api';
import api from '@/services/api';

export default function HelpCenterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [helpData, setHelpData] = useState({
    supportEmail: 'support@civicsedu.com',
    supportPhone: '+91 98765 43210',
    supportWhatsapp: '+91 98765 43210',
    supportHours: 'Mon – Sat: 9:00 AM – 7:00 PM IST',
    officeAddress: 'CivicsEdu Learning Centre, Jaipur, Rajasthan',
    faqs: [],
  });
  const [loading, setLoading] = useState(true);

  const [ticketForm, setTicketForm] = useState({
    category: 'Account & Login',
    subject: '',
    description: '',
  });

  useEffect(() => {
    const fetchHelpSettings = async () => {
      try {
        const res = await api.get('/settings/help');
        const data = res.data?.data || res.data || {};
        setHelpData((prev) => ({
          ...prev,
          supportEmail: data.supportEmail || prev.supportEmail,
          supportPhone: data.supportPhone || prev.supportPhone,
          supportWhatsapp: data.supportWhatsapp || prev.supportWhatsapp,
          supportHours: data.supportHours || prev.supportHours,
          officeAddress: data.officeAddress || prev.officeAddress,
          faqs: Array.isArray(data.faqs) && data.faqs.length > 0 ? data.faqs : prev.faqs,
        }));
      } catch (err) {
        console.warn('Using default help & FAQ settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHelpSettings();
  }, []);

  const defaultFaqs = [
    {
      id: 'faq-1',
      category: 'Course Access',
      question: 'How do I access my purchased courses & handwritten notes?',
      answer:
        'After successful payment via Razorpay, your course is automatically unlocked under "My Courses" in your Student Dashboard. Handwritten PDFs can be viewed or downloaded directly.',
    },
    {
      id: 'faq-2',
      category: 'Watermarked PDFs',
      question: 'Why are PDFs watermarked with my name & mobile number?',
      answer:
        'To prevent piracy and illegal redistribution of premium faculty handwritten notes, all paid PDFs feature a dynamic watermark indicating your registered student identity.',
    },
    {
      id: 'faq-3',
      category: 'Test Series',
      question: 'Can I re-attempt mock tests?',
      answer:
        'Each test series allows up to the designated attempt limit. Detailed solutions, state percentile, and performance analytics remain available indefinitely in your test analysis tab.',
    },
    {
      id: 'faq-4',
      category: 'Payments',
      question: 'What should I do if money is deducted but course is not unlocked?',
      answer:
        'Please allow 5-10 minutes for payment webhook confirmation. If access is still pending, submit a support ticket with your transaction ID or message our WhatsApp helpline.',
    },
    {
      id: 'faq-5',
      category: 'Video Classes',
      question: 'Can I watch video lectures on mobile and adjust playback speed?',
      answer:
        'Yes, video lectures support adaptive streaming, playback speed controls (0.75x to 2x), and offline video playback on supported mobile browsers.',
    },
  ];

  const activeFaqs = helpData.faqs.length > 0 ? helpData.faqs : defaultFaqs;

  const filteredFaqs = activeFaqs.filter((f) => {
    const q = (f.question || f.q || '').toLowerCase();
    const a = (f.answer || f.a || '').toLowerCase();
    return q.includes(search.toLowerCase()) || a.includes(search.toLowerCase());
  });

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketForm.subject || !ticketForm.description) {
      toast.error('Please enter subject and description');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await supportAPI.createTicket(ticketForm);
      const ticketId = res.data?.data?.ticketId || Math.floor(100000 + Math.random() * 900000);
      toast.success(`Support ticket created! Ticket ID #EDU-${ticketId}`);
      setTicketForm({ category: 'Account & Login', subject: '', description: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cleanPhone = (helpData.supportWhatsapp || helpData.supportPhone || '').replace(
    /[^0-9]/g,
    ''
  );

  return (
    <div className="bg-slate-50 dark:bg-dark-950 min-h-screen py-12 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-primary-700 dark:text-primary-300 font-semibold uppercase tracking-wider text-xs bg-primary-50 dark:bg-primary-950/60 px-3.5 py-1.5 rounded-full border border-primary-200 dark:border-primary-800 mb-4">
            <HiQuestionMarkCircle className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span>Student Support Centre</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Help Center & FAQs
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-3 leading-relaxed">
            Find answers to common questions regarding course enrollments, test series attempts,
            watermarked PDFs, and dedicated technical help.
          </p>

          <div className="relative max-w-xl mx-auto mt-6">
            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search help topics (e.g. download notes, refund, test attempt)..."
              className="input-field !pl-11 py-3 text-xs sm:text-sm shadow-xs"
            />
          </div>
        </div>

        {/* Support Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 border border-slate-200 dark:border-dark-800 text-center shadow-xs">
            <div className="h-11 w-11 bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center text-xl mx-auto mb-3">
              <HiPhone />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
              Phone Helpline
            </h3>
            <p className="text-xs text-slate-400 mb-2">
              {helpData.supportHours || 'Mon – Sat (9 AM – 7 PM)'}
            </p>
            <a
              href={`tel:${helpData.supportPhone}`}
              className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline"
            >
              {helpData.supportPhone}
            </a>
          </div>

          <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 border border-slate-200 dark:border-dark-800 text-center shadow-xs">
            <div className="h-11 w-11 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center text-xl mx-auto mb-3">
              <HiChat />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
              WhatsApp Support
            </h3>
            <p className="text-xs text-slate-400 mb-2">Fast Resolution Chat</p>
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Chat on WhatsApp →
            </a>
          </div>

          <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 border border-slate-200 dark:border-dark-800 text-center shadow-xs">
            <div className="h-11 w-11 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center text-xl mx-auto mb-3">
              <HiMail />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Email Support</h3>
            <p className="text-xs text-slate-400 mb-2">24h Response Window</p>
            <a
              href={`mailto:${helpData.supportEmail}`}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
            >
              {helpData.supportEmail}
            </a>
          </div>
        </div>

        {/* FAQs List */}
        <div className="bg-white dark:bg-dark-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 dark:border-dark-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
              Frequently Asked Questions
            </h2>
            <span className="text-xs text-slate-400">{filteredFaqs.length} questions</span>
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => {
              const qId = faq.id || idx;
              const qTitle = faq.question || faq.q;
              const aBody = faq.answer || faq.a;
              const qCat = faq.category || faq.cat;

              return (
                <div
                  key={qId}
                  className="border border-slate-200/90 dark:border-dark-800 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === qId ? null : qId)}
                    className="w-full px-5 py-4 text-left font-semibold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-dark-800/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {qCat && (
                        <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 px-2 py-0.5 rounded-md border border-primary-100 dark:border-primary-900/40">
                          {qCat}
                        </span>
                      )}
                      <span>{qTitle}</span>
                    </div>
                    {openFaq === qId ? (
                      <HiChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    ) : (
                      <HiChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    )}
                  </button>
                  {openFaq === qId && (
                    <div className="px-5 py-3.5 bg-slate-50/70 dark:bg-dark-800/40 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-dark-800">
                      {aBody}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Ticket Creation Form */}
        <div className="bg-white dark:bg-dark-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 dark:border-dark-800 max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <HiTicket className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
              Submit a Support Ticket
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Can't find what you need? Send a query to our student support team for prompt
            assistance.
          </p>

          <form onSubmit={handleTicketSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={ticketForm.category}
                onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                className="input-field text-xs"
              >
                <option>Account & Login</option>
                <option>Course Purchase & Access</option>
                <option>Video Player Issues</option>
                <option>Notes & Downloads</option>
                <option>Test Series & Scores</option>
                <option>Payment & Refund</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject *
              </label>
              <input
                type="text"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                placeholder="Brief summary of your query..."
                className="input-field text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description *
              </label>
              <textarea
                rows={4}
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                placeholder="Describe your issue in detail, including transaction ID or batch name..."
                className="input-field text-xs leading-relaxed"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full text-xs py-3 justify-center"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Support Ticket'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
