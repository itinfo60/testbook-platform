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
      { label: 'Courses', path: '/courses' },
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
    'Political Science': [
      {
        label: 'Assistant Professor RPSC',
        path: '/exams/rpsc-assistant-professor-political-science',
      },
      {
        label: 'Assistant Professor UPHESC',
        path: '/exams/uphesc-assistant-professor-political-science',
      },
      {
        label: 'Assistant Professor MPPSC',
        path: '/exams/mppsc-assistant-professor-political-science',
      },
      { label: 'PGT Political Science', path: '/exams/pgt-political-science' },
    ],
    Support: [
      { label: 'Help Center & FAQs', path: '/help' },
      { label: 'Faculty Members', path: '/faculty' },
      { label: 'About EduHub', path: '/about' },
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
    <footer className="bg-dark-950 text-dark-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="h-10 w-10 bg-navy-950 dark:bg-navy-800 rounded flex items-center justify-center border-l-2 border-accent-500 shadow-sm">
                <HiAcademicCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold font-display tracking-tight text-white uppercase">
                Edu<span className="text-accent-500">Hub</span>
              </span>
            </Link>
            <p className="text-sm text-dark-500 mb-5 max-w-xs leading-relaxed">
              Rajasthan's dedicated learning & test-series platform for serious competitive exam
              aspirants.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <HiMail className="h-4 w-4 text-primary-400" />
                <span>support@eduhub.com</span>
              </div>
              <div className="flex items-center gap-2">
                <HiPhone className="h-4 w-4 text-primary-400" />
                <span>+91 98765 43210</span>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-white font-semibold mb-4 text-xs uppercase tracking-widest font-display">
                {title}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      className="text-xs text-dark-400 hover:text-primary-400 transition-colors"
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
        <div className="py-6 border-t border-dark-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-dark-500">
            © {new Date().getFullYear()} EduHub. All rights reserved. Specialized Coaching for RPSC
            & Political Science.
          </p>
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="h-8 w-8 bg-dark-800 hover:bg-primary-600 hover:text-white rounded-lg flex items-center justify-center transition-colors text-dark-400 text-xs"
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
