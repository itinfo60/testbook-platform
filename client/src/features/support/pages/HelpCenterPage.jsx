import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
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
  const { user } = useSelector((state) => state.auth || {});
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
    name: '',
    email: '',
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
      const payload = {
        name: user?.name || ticketForm.name || 'Student',
        email: user?.email || ticketForm.email || 'support-query@civicsedu.com',
        category: ticketForm.category,
        subject: ticketForm.subject.trim(),
        message: ticketForm.description.trim(),
        description: ticketForm.description.trim(),
      };

      const res = await supportAPI.createTicket(payload);
      const ticketId =
        res.data?.data?.ticketId ||
        res.data?.ticketId ||
        `EDU-${Math.floor(100000 + Math.random() * 900000)}`;

      toast.success(`Support ticket created! Ticket ID ${ticketId}`);
      setTicketForm({
        name: '',
        email: '',
        category: 'Account & Login',
        subject: '',
        description: '',
      });
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

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 border border-slate-200/80 dark:border-dark-800 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <HiMail className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Email Support
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Send queries with screenshots or receipts. We respond within 24 hours.
              </p>
            </div>
            <a
              href={`mailto:${helpData.supportEmail}`}
              className="mt-4 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
            >
              {helpData.supportEmail} →
            </a>
          </div>

          <div className="card p-6 border border-slate-200/80 dark:border-dark-800 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <HiChat className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                WhatsApp Helpline
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Fastest resolution for urgent enrollment and test series issues.
              </p>
            </div>
            {cleanPhone ? (
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
              >
                Chat on WhatsApp →
              </a>
            ) : (
              <span className="mt-4 text-xs font-semibold text-slate-400">
                {helpData.supportWhatsapp || helpData.supportPhone}
              </span>
            )}
          </div>

          <div className="card p-6 border border-slate-200/80 dark:border-dark-800 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:bg-amber-400 flex items-center justify-center">
                <HiClock className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Helpline Hours & Office
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {helpData.supportHours}
              </p>
            </div>
            <p className="mt-4 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 truncate">
              <HiLocationMarker className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate">{helpData.officeAddress}</span>
            </p>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Click any question below to see detailed answers.
            </p>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No matching questions found for "{search}". Submit a support ticket below!
              </div>
            ) : (
              filteredFaqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={faq.id || idx}
                    className="card overflow-hidden border border-slate-200/80 dark:border-dark-800 transition-all"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 focus:outline-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 px-2 py-0.5 rounded-md shrink-0">
                          {faq.category || 'General'}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {faq.question || faq.q}
                        </span>
                      </div>
                      {isOpen ? (
                        <HiChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                      ) : (
                        <HiChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-dark-800/60 leading-relaxed">
                        {faq.answer || faq.a}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Submit Ticket Section */}
        <div className="max-w-2xl mx-auto card p-6 sm:p-8 border border-slate-200/80 dark:border-dark-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <HiTicket className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Submit a Support Ticket
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Can't find what you need? Send a query to our student support team for prompt
            assistance.
          </p>

          <form onSubmit={handleTicketSubmit} className="space-y-4">
            {!user && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={ticketForm.name}
                    onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                    placeholder="Enter your name"
                    className="input-field text-xs"
                    required={!user}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Email *
                  </label>
                  <input
                    type="email"
                    value={ticketForm.email}
                    onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                    placeholder="name@example.com"
                    className="input-field text-xs"
                    required={!user}
                  />
                </div>
              </div>
            )}

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
