import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  HiChartBar,
  HiBookOpen,
  HiClipboardList,
  HiPuzzle,
  HiUsers,
  HiCurrencyRupee,
  HiChat,
  HiCalendar,
  HiArrowLeft,
  HiMenu,
  HiX,
} from 'react-icons/hi';

const navItems = [
  { path: '/teacher', icon: HiChartBar, label: 'Dashboard', end: true },
  { path: '/teacher/courses', icon: HiBookOpen, label: 'Courses' },
  { path: '/teacher/tests', icon: HiClipboardList, label: 'Tests' },
  { path: '/teacher/quizzes', icon: HiPuzzle, label: 'Quizzes' },
  { path: '/teacher/students', icon: HiUsers, label: 'Students' },
  { path: '/teacher/attendance', icon: HiCalendar, label: 'Attendance' },
  { path: '/teacher/revenue', icon: HiCurrencyRupee, label: 'Revenue' },
  { path: '/teacher/discussions', icon: HiChat, label: 'Discussions' },
  { path: '/messages', icon: HiChat, label: 'Parent Messages' },
];

export default function TeacherLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header row */}
      <div className="flex items-center gap-3 mb-6">
        {/* Hamburger — mobile only */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-600 dark:text-dark-300"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <HiMenu className="h-5 w-5" />
        </button>

        <Link to="/dashboard" className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800">
          <HiArrowLeft className="h-5 w-5 text-dark-400" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-dark-900 dark:text-white">Teacher Dashboard</h1>
          <p className="text-sm text-dark-500">Manage your courses, tests, and students</p>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-dark-900/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <nav className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-dark-900 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-dark-100 dark:border-dark-700">
              <span className="font-bold text-dark-900 dark:text-white">Menu</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800"
                aria-label="Close menu"
              >
                <HiX className="h-5 w-5 text-dark-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400'
                        : 'text-dark-600 dark:text-dark-400 hover:bg-dark-50 dark:hover:bg-dark-800'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar — desktop only */}
        <nav className="hidden md:block w-56 flex-shrink-0">
          <div className="sticky top-24 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400'
                      : 'text-dark-600 dark:text-dark-400 hover:bg-dark-50 dark:hover:bg-dark-800'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 min-w-0 pb-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
