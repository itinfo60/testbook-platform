import {
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaTelegram,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { HiAcademicCap, HiMail, HiPhone } from 'react-icons/hi';

export default function Footer() {
  const footerLinks = {
    'Quick Links': [
      { label: 'Home', path: '/' },
      { label: 'Exams Directory', path: '/exams' },
      { label: 'Courses & Batches', path: '/courses' },
      { label: 'Test Series Portal', path: '/tests' },
      { label: 'Free Study Material', path: '/free-resources' },
      { label: 'Job Alerts', path: '/blog?type=job_alert' },
      { label: 'Blog', path: '/blog' },
    ],
    'Rajasthan Exams': [
      { label: 'RPSC RAS', path: '/exams/ras' },
      { label: 'RPSC EO & RO', path: '/exams/rpsc-eo-ro' },
      { label: 'RPSC SI', path: '/exams/rpsc-si' },
      { label: '1st & 2nd Grade Teacher', path: '/exams/rpsc-1st-2nd-grade' },
      { label: 'Rajasthan CET', path: '/exams/rajasthan-cet' },
      { label: 'Patwari', path: '/exams/patwari' },
      { label: 'VDO', path: '/exams/vdo' },
    ],
    'Pol. Science Special': [
      { label: 'Asst. Prof. (RPSC)', path: '/exams/rpsc-assistant-professor-political-science' },
      {
        label: 'Asst. Prof. (UPHESC)',
        path: '/exams/uphesc-assistant-professor-political-science',
      },
      { label: 'Asst. Prof. (MPPSC)', path: '/exams/mppsc-assistant-professor-political-science' },
      { label: 'PGT Political Science', path: '/exams/pgt-political-science' },
    ],
    Support: [
      { label: 'Help Center & FAQs', path: '/help' },
      { label: 'Faculty Members', path: '/faculty' },
      { label: 'About EduPortal', path: '/about' },
      { label: 'Privacy Policy', path: '/legal/privacy' },
      { label: 'Terms & Conditions', path: '/legal/terms' },
    ],
  };

  const socialLinks = [
    { icon: FaYoutube, href: '#', label: 'YouTube' },
    { icon: FaTelegram, href: '#', label: 'Telegram' },
    { icon: FaInstagram, href: '#', label: 'Instagram' },
    { icon: FaFacebook, href: '#', label: 'Facebook' },
    { icon: FaTwitter, href: '#', label: 'Twitter' },
  ];

  return (
    <footer className="bg-dark-900 dark:bg-dark-950 text-dark-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 bg-amber-500 rounded-xl flex items-center justify-center">
                <HiAcademicCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold font-display text-white">
                Edu<span className="text-amber-400">Portal</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-dark-400 mb-4 max-w-xs leading-relaxed">
              Rajasthan's #1 Dedicated Learning & Test Series Portal for RPSC, EO/RO, RAS, Teachers
              & Political Science Competitive Exams.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <HiMail className="h-4 w-4 text-amber-500" />
                <span>support@eduportal.com</span>
              </div>
              <div className="flex items-center gap-2">
                <HiPhone className="h-4 w-4 text-amber-500" />
                <span>+91 98765 43210</span>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider font-display">
                {title}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      className="text-xs text-dark-400 hover:text-amber-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Footer */}
        <div className="py-6 border-t border-dark-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-dark-500">
            © {new Date().getFullYear()} EduPortal. All rights reserved. Specialized Coaching for
            RPSC & Political Science.
          </p>
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="h-8 w-8 bg-dark-800 hover:bg-amber-500 hover:text-white rounded-lg flex items-center justify-center transition-colors text-dark-400 text-xs"
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
