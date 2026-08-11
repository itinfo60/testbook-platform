import { useState } from 'react';
import {
  HiQuestionMarkCircle,
  HiSearch,
  HiChevronDown,
  HiChevronUp,
  HiMail,
  HiPhone,
  HiChat,
  HiTicket,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function HelpCenterPage() {
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [ticketForm, setTicketForm] = useState({
    category: 'Account & Login',
    subject: '',
    description: '',
  });

  const faqs = [
    {
      id: 1,
      cat: 'Course Access',
      q: 'How do I access my purchased courses & handwritten notes?',
      a: 'After successful payment via Razorpay, your course is automatically unlocked under "My Courses" in your Student Dashboard. Handwritten PDFs can be viewed or downloaded directly.',
    },
    {
      id: 2,
      cat: 'Watermarked PDFs',
      q: 'Why are PDFs watermarked with my name & mobile number?',
      a: 'To prevent piracy and illegal redistribution of premium faculty handwritten notes, all paid PDFs feature a dynamic watermark indicating "Licensed to: [Your Name]".',
    },
    {
      id: 3,
      cat: 'Test Series',
      q: 'Can I re-attempt mock tests?',
      a: 'Each test series allows up to the designated attempt limit (usually 2-3 attempts). Detailed solutions, state percentile, and performance analytics remain available indefinitely.',
    },
    {
      id: 4,
      cat: 'Payments',
      q: 'What should I do if money is deducted but course is not unlocked?',
      a: 'Please wait 5-10 minutes for webhook processing. If access is still pending, submit a support ticket below or contact WhatsApp support with your payment ID.',
    },
    {
      id: 5,
      cat: 'Video Classes',
      q: 'Can I watch video lectures offline on mobile?',
      a: 'Yes, video lectures can be streamed in adaptive HD or saved offline inside the EduPortal Mobile App.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
  );

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    if (!ticketForm.subject || !ticketForm.description) {
      toast.error('Please enter subject and description');
      return;
    }
    toast.success(
      'Support ticket created! Ticket ID #EDU-' + Math.floor(100000 + Math.random() * 900000)
    );
    setTicketForm({ category: 'Account & Login', subject: '', description: '' });
  };

  return (
    <div className="bg-dark-50 dark:bg-dark-950 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-dark-900 dark:text-dark-100">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-xs bg-amber-50 dark:bg-amber-950 px-3 py-1 rounded-full mb-3">
            <HiQuestionMarkCircle className="h-4 w-4" /> Student Support
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display">Help Center & FAQs</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2">
            Find answers to common questions regarding course purchases, test series, watermarked
            PDFs, and technical support.
          </p>

          <div className="relative max-w-xl mx-auto mt-6">
            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search help topics (e.g. download notes, refund, test attempt)..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-900 focus:outline-none text-sm font-medium shadow-sm"
            />
          </div>
        </div>

        {/* Support Contact Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 border border-slate-200 dark:border-dark-800 text-center shadow-md">
            <div className="h-12 w-12 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">
              <HiPhone />
            </div>
            <h3 className="font-bold text-base mb-1">Phone Support</h3>
            <p className="text-xs text-slate-500 mb-3">Mon - Sat (10 AM to 7 PM)</p>
            <a
              href="tel:+919876543210"
              className="text-xs font-extrabold text-amber-600 hover:underline"
            >
              +91 98765 43210
            </a>
          </div>

          <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 border border-slate-200 dark:border-dark-800 text-center shadow-md">
            <div className="h-12 w-12 bg-green-50 dark:bg-green-950 text-green-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">
              <HiChat />
            </div>
            <h3 className="font-bold text-base mb-1">WhatsApp Helpdesk</h3>
            <p className="text-xs text-slate-500 mb-3">Instant Chat Support</p>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-extrabold text-green-600 hover:underline"
            >
              Chat on WhatsApp →
            </a>
          </div>

          <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 border border-slate-200 dark:border-dark-800 text-center shadow-md">
            <div className="h-12 w-12 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">
              <HiMail />
            </div>
            <h3 className="font-bold text-base mb-1">Email Support</h3>
            <p className="text-xs text-slate-500 mb-3">24 Hours Response Time</p>
            <a
              href="mailto:support@eduportal.com"
              className="text-xs font-extrabold text-blue-600 hover:underline"
            >
              support@eduportal.com
            </a>
          </div>
        </div>

        {/* FAQs List */}
        <div className="bg-white dark:bg-dark-900 rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 dark:border-dark-800">
          <h2 className="text-2xl font-extrabold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {filteredFaqs.map((faq) => (
              <div
                key={faq.id}
                className="border border-slate-200 dark:border-dark-800 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                  className="w-full px-6 py-4 text-left font-bold text-sm sm:text-base flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-dark-800 transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaq === faq.id ? <HiChevronUp /> : <HiChevronDown />}
                </button>
                {openFaq === faq.id && (
                  <div className="px-6 py-4 bg-slate-50 dark:bg-dark-800/50 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200 dark:border-dark-800">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Ticket Creation Form */}
        <div className="bg-white dark:bg-dark-900 rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 dark:border-dark-800 max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <HiTicket className="h-6 w-6 text-amber-500" />
            <h2 className="text-2xl font-extrabold">Submit a Support Ticket</h2>
          </div>

          <form onSubmit={handleTicketSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={ticketForm.category}
                onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-xs sm:text-sm font-medium focus:outline-none"
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                placeholder="Brief summary of your query..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-xs sm:text-sm font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                rows={4}
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                placeholder="Describe your issue in detail..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-xs sm:text-sm font-medium focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 rounded-xl shadow-md transition-all text-xs sm:text-sm"
            >
              Submit Ticket
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
