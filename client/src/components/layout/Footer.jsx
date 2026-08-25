import {
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaTelegram,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { HiAcademicCap, HiMail, HiShieldCheck } from 'react-icons/hi';

export default function Footer() {
  const footerLinks = {
    'Explore & Learn': [
      { label: 'Online Courses', path: '/courses' },
      { label: 'Test Series & Mocks', path: '/tests' },
      { label: 'Daily Practice Quiz', path: '/daily-quiz' },
      { label: 'Free Study Material', path: '/free-resources' },
      { label: 'All Exams Directory', path: '/exams' },
      { label: 'Passes & Pricing', path: '/pricing' },
    ],
    'Target Exams': [
      { label: 'RPSC RAS (Pre & Mains)', path: '/exams/ras' },
      { label: '1st Grade School Lecturer', path: '/exams/1st-grade-teacher' },
      { label: '2nd Grade Senior Teacher', path: '/exams/2nd-grade-teacher' },
      { label: 'Assistant Professor (RPSC)', path: '/exams/assistant-professor-rpsc-rajasthan' },
      {
        label: 'Assistant Professor (UPHESC)',
        path: '/exams/assistant-professor-uphesc-uttar-pradesh',
      },
      { label: 'Rajasthan CET (Grad & 10+2)', path: '/exams/rajasthan-cet' },
      { label: 'Patwari & VDO', path: '/exams/patwari' },
      { label: 'RPSC SI (Sub-Inspector)', path: '/exams/rpsc-si-sub-inspector' },
      { label: 'RPSC EO & RO', path: '/exams/rpsc-eo-ro' },
    ],
    'Resources & Insights': [
      { label: 'Government Job Alerts', path: '/jobs' },
      { label: 'Preparation Blog & Notes', path: '/blog' },
      { label: 'Topper Success Stories', path: '/success-stories' },
      { label: 'State Rank Leaderboard', path: '/leaderboard' },
      { label: 'Faculty Directory', path: '/faculty' },
    ],
    'Company & Support': [
      { label: 'About CivicsEdu', path: '/about' },
      { label: 'Distinguished Faculty', path: '/faculty' },
      { label: 'Help Center & FAQs', path: '/help' },
      { label: 'Privacy Policy', path: '/legal/privacy' },
      { label: 'Terms of Service', path: '/legal/terms' },
      { label: 'Refund Policy', path: '/legal/refund' },
    ],
  };

  const socialLinks = [
    { icon: FaYoutube, href: 'https://youtube.com', label: 'YouTube' },
    { icon: FaTelegram, href: 'https://telegram.org', label: 'Telegram' },
    { icon: FaInstagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: FaFacebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: FaTwitter, href: 'https://twitter.com', label: 'Twitter' },
  ];

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="py-12 sm:py-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 sm:gap-10">
          {/* Brand Col (2 cols wide on desktop) */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <div className="h-10 w-10 bg-primary-600 group-hover:bg-primary-500 transition-colors rounded-xl flex items-center justify-center shadow-sm">
                <HiAcademicCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold font-display text-white tracking-tight">
                Civics<span className="text-primary-500">Edu</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 mb-6 max-w-sm leading-relaxed">
              India's premier digital learning and test-series platform specializing in RPSC,
              Political Science, and competitive state exams.
            </p>

            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-slate-300">
                <HiMail className="h-4 w-4 text-primary-400 flex-shrink-0" />
                <a
                  href="mailto:support@civicsedu.com"
                  className="hover:text-white transition-colors"
                >
                  support@civicsedu.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <HiShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>Govt. Exam Focused Curriculum & Validated PYQs</span>
              </div>
            </div>
          </div>

          {/* Dynamic Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="space-y-4">
              <h3 className="text-white font-semibold text-xs uppercase tracking-widest font-display">
                {title}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      className="text-xs text-slate-400 hover:text-primary-400 transition-colors inline-flex items-center gap-1 group"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Footer Bar */}
        <div className="py-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            © {new Date().getFullYear()} CivicsEdu. All rights reserved. Specialized coaching & test
            series for competitive exams.
          </p>
          <div className="flex items-center gap-2.5">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href || '#'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="h-8 w-8 bg-slate-900 hover:bg-primary-600 hover:text-white rounded-lg flex items-center justify-center transition-all text-slate-400 hover:scale-105 text-xs shadow-xs"
              >
                <social.icon />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
