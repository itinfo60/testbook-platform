import { FaTwitter, FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { HiAcademicCap, HiMail, HiPhone } from 'react-icons/hi';

export default function Footer() {
  const footerLinks = {
    'Platform': [
      { label: 'Courses', path: '/courses' },
      { label: 'Test Series', path: '/tests' },
      { label: 'Leaderboard', path: '/leaderboard' },
      { label: 'Categories', path: '/#categories' },
    ],
    'Company': [
      { label: 'About Us', path: '#' },
      { label: 'Careers', path: '#' },
      { label: 'Blog', path: '#' },
      { label: 'Press', path: '#' },
    ],
    'Support': [
      { label: 'Help Center', path: '#' },
      { label: 'Contact Us', path: '#' },
      { label: 'Privacy Policy', path: '#' },
      { label: 'Terms of Service', path: '#' },
    ],
    'Teach': [
      { label: 'Become a Teacher', path: '/register' },
      { label: 'Teacher Dashboard', path: '/teacher' },
      { label: 'Resources', path: '#' },
      { label: 'Community', path: '#' },
    ],
  };

  const socialLinks = [
    { icon: FaTwitter, href: '#', label: 'Twitter' },
    { icon: FaFacebook, href: '#', label: 'Facebook' },
    { icon: FaInstagram, href: '#', label: 'Instagram' },
    { icon: FaLinkedin, href: '#', label: 'LinkedIn' },
    { icon: FaYoutube, href: '#', label: 'YouTube' },
  ];

  return (
    <footer className="bg-dark-900 dark:bg-dark-950 text-dark-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 bg-primary-600 rounded-xl flex items-center justify-center">
                <HiAcademicCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold font-display text-white">
                Learn<span className="text-primary-400">Hub</span>
              </span>
            </Link>
            <p className="text-sm text-dark-400 mb-4 max-w-xs">
              India's #1 online learning platform for competitive exams. Start your preparation today!
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <HiMail className="h-4 w-4 text-dark-500" />
                <span>support@learnhub.com</span>
              </div>
              <div className="flex items-center gap-2">
                <HiPhone className="h-4 w-4 text-dark-500" />
                <span>+91 98765 43210</span>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{title}</h3>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link.label}>
                    {link.path.startsWith('/#') ? (
                      <a href={link.path} className="text-sm text-dark-400 hover:text-white transition-colors">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.path} className="text-sm text-dark-400 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Footer */}
        <div className="py-6 border-t border-dark-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-dark-500">
            © {new Date().getFullYear()} LearnHub. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {socialLinks.map(social => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="p-2 rounded-lg text-dark-500 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
