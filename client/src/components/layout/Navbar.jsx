import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HiUser, HiAcademicCap, HiBookOpen, HiClipboardList, HiHeart, HiCog, HiChartBar, HiSearch, HiBell, HiLogout, HiMenu, HiX } from 'react-icons/hi';
import { logoutUser } from '@/features/auth/authSlice';
import { fetchUnreadCount } from '@/features/notification/notificationSlice';
import DarkModeToggle from '@/components/DarkModeToggle';
import NotificationDropdown from '@/features/notification/components/NotificationDropdown';
export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { unreadCount } = useSelector(state => state.notifications);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUnreadCount());
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClick = e => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = e => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/');
  };

  const navLinks = [
    { label: 'Courses', path: '/courses' },
    { label: 'Tests', path: '/tests' },
    { label: 'Blog', path: '/blog' },
    { label: 'Leaderboard', path: '/leaderboard' },
  ];


  const userLinks = [
    { icon: HiUser, label: 'Dashboard', path: '/dashboard' },
    { icon: HiBookOpen, label: 'My Courses', path: '/my-courses' },
    { icon: HiClipboardList, label: 'My Tests', path: '/my-test-attempts' },
    { icon: HiHeart, label: 'Wishlist', path: '/wishlist' },
    { icon: HiAcademicCap, label: 'Achievements', path: '/achievements' },
    { icon: HiCog, label: 'Settings', path: '/settings' },
  ];

  if (user?.role === 'teacher') {
    userLinks.splice(1, 0, { icon: HiChartBar, label: 'Teacher Dashboard', path: '/teacher' });
  }

  return (
    <nav className="sticky top-0 z-40 glass border-b border-dark-100 dark:border-dark-800 shadow-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-primary-600 rounded-xl flex items-center justify-center">
                <HiAcademicCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold font-display text-dark-900 dark:text-white">
                Learn<span className="text-primary-600">Hub</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.path || location.pathname.startsWith(link.path + '/')
                      ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-950'
                      : 'text-dark-600 hover:text-dark-900 hover:bg-dark-50 dark:text-dark-400 dark:hover:text-white dark:hover:bg-dark-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search courses, tests..."
                className="w-full pl-9 pr-4 py-2 bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </form>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            <DarkModeToggle />

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <div ref={notifRef} className="relative">
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative p-2 rounded-xl text-dark-500 hover:text-dark-700 hover:bg-dark-100 dark:text-dark-400 dark:hover:text-white dark:hover:bg-dark-800 transition-colors"
                  >
                    <HiBell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
                </div>

                {/* User Menu */}
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-dark-700 dark:text-dark-300 max-w-[100px] truncate">
                      {user?.name?.split(' ')[0]}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-800 rounded-2xl shadow-modal border border-dark-100 dark:border-dark-700 py-2 animate-slide-down">
                      <div className="px-4 py-3 border-b border-dark-100 dark:border-dark-700">
                        <p className="text-sm font-semibold text-dark-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-xs text-dark-500 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 badge-primary capitalize">{user?.role}</span>
                      </div>
                      <div className="py-1">
                        {userLinks.map(link => (
                          <Link
                            key={link.path}
                            to={link.path}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-600 dark:text-dark-400 hover:bg-dark-50 dark:hover:bg-dark-700/50 hover:text-dark-900 dark:hover:text-white transition-colors"
                          >
                            <link.icon className="h-4 w-4" />
                            {link.label}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-dark-100 dark:border-dark-700 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                        >
                          <HiLogout className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm">Get Started</Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-dark-500 hover:bg-dark-100 dark:hover:bg-dark-800"
            >
              {mobileMenuOpen ? <HiX className="h-5 w-5" /> : <HiMenu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-dark-100 dark:border-dark-800 bg-white dark:bg-dark-900 animate-slide-down">
          <div className="px-4 py-3">
            <form onSubmit={handleSearch} className="relative mb-3">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="input-field pl-9 text-sm"
              />
            </form>
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-dark-600 dark:text-dark-400 hover:bg-dark-50 dark:hover:bg-dark-800"
              >
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <div className="flex gap-2 mt-3 pt-3 border-t dark:border-dark-700">
                <Link to="/login" className="btn-outline flex-1 text-sm justify-center">Sign In</Link>
                <Link to="/register" className="btn-primary flex-1 text-sm justify-center">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
