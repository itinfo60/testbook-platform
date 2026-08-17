import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  Brain,
  Tag,
  GraduationCap,
  Star,
  TrendingUp,
  FolderOpen,
  Megaphone,
  Palette,
  Video,
  ClipboardList,
  X,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/utils';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Users', path: '/users', icon: Users },
  { label: 'Courses', path: '/courses', icon: BookOpen },
  { label: 'Test Series', path: '/test-series', icon: ClipboardList },
  { label: 'Tests', path: '/tests', icon: FileText },
  { label: 'Quizzes', path: '/quizzes', icon: Brain },
  { label: 'Reviews', path: '/reviews', icon: Star },
  { label: 'Enrollments', path: '/enrollments', icon: GraduationCap },
  { label: 'Revenue', path: '/revenue', icon: TrendingUp },
  { label: 'Teachers', path: '/teachers', icon: Users },
  { label: 'Exam Categories', path: '/exam-categories', icon: FolderOpen },
  { label: 'Coupons', path: '/coupons', icon: Tag },
  { label: 'Announcements', path: '/announcements', icon: Megaphone },
  { label: 'Digital Library', path: '/library', icon: FolderOpen },
  { label: 'Blogs & Articles', path: '/blogs', icon: FileText },
  { label: 'Job Alerts', path: '/job-alerts', icon: Megaphone },
  { label: 'Live Classes', path: '/live-classes', icon: Video },
  { label: 'Branding', path: '/branding', icon: Palette },
];

export default function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full bg-sidebar text-white transition-all duration-300 flex flex-col',
          'lg:relative lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10 flex-shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-950 rounded flex items-center justify-center border-l-2 border-yellow-500 shadow-sm">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold uppercase tracking-tight">
                Civics<span className="text-blue-400">Edu</span>
              </span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-slate-950 rounded flex items-center justify-center border-l-2 border-yellow-500 shadow-sm mx-auto">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
          )}
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="hidden lg:block p-1 rounded hover:bg-white/10"
          >
            <ChevronLeft
              className={cn('w-5 h-5 transition-transform', collapsed && 'rotate-180')}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-active text-white shadow-lg shadow-blue-900/20'
                    : 'text-gray-300 hover:bg-sidebar-hover hover:text-white',
                  collapsed && 'justify-center px-2'
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-white/10 flex-shrink-0">
            <p className="text-xs text-gray-400 text-center">© 2024 CivicsEdu Admin</p>
          </div>
        )}
      </aside>
    </>
  );
}
