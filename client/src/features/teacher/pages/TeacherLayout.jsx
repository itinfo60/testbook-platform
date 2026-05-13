import { Link, NavLink, Outlet } from 'react-router-dom';
import { HiChartBar, HiBookOpen, HiClipboardList, HiPuzzle, HiUsers, HiCurrencyRupee, HiChat, HiArrowLeft } from 'react-icons/hi';

const navItems = [
  { path: '/teacher', icon: HiChartBar, label: 'Dashboard', end: true },
  { path: '/teacher/courses', icon: HiBookOpen, label: 'Courses' },
  { path: '/teacher/tests', icon: HiClipboardList, label: 'Tests' },
  { path: '/teacher/quizzes', icon: HiPuzzle, label: 'Quizzes' },
  { path: '/teacher/students', icon: HiUsers, label: 'Students' },
  { path: '/teacher/revenue', icon: HiCurrencyRupee, label: 'Revenue' },
  { path: '/teacher/discussions', icon: HiChat, label: 'Discussions' },
];

export default function TeacherLayout() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/dashboard" className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800">
          <HiArrowLeft className="h-5 w-5 text-dark-400" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-dark-900 dark:text-white">Teacher Dashboard</h1>
          <p className="text-sm text-dark-500">Manage your courses, tests, and students</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <nav className="hidden md:block w-56 flex-shrink-0">
          <div className="sticky top-24 space-y-1">
            {navItems.map(item => (
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

        {/* Mobile Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-dark-800 border-t border-dark-100 dark:border-dark-700 px-2 py-1.5 flex justify-around no-scrollbar overflow-x-auto">
          {navItems.slice(0, 5).map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs ${
                  isActive ? 'text-primary-600 dark:text-primary-400' : 'text-dark-400'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 pb-20 md:pb-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
