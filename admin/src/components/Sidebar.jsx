import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  CreditCard,
  Users,
  GraduationCap,
  FolderOpen,
  Trophy,
  BookmarkCheck,
  BookOpen,
  ClipboardList,
  FileText,
  Brain,
  Video,
  FileCode,
  Library,
  Star,
  Briefcase,
  Tag,
  Megaphone,
  Palette,
  Activity,
  LifeBuoy,
  X,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/utils';

const navSections = [
  {
    title: '1. Dashboard',
    items: [{ label: 'Dashboard', path: '/', icon: LayoutDashboard }],
  },
  {
    title: '2. Analytics & Revenue',
    items: [
      { label: 'Revenue Analytics', path: '/revenue', icon: TrendingUp },
      { label: 'Payments', path: '/payments', icon: CreditCard },
      { label: 'Enrollments', path: '/enrollments', icon: GraduationCap },
    ],
  },
  {
    title: '3. User Management',
    items: [
      { label: 'Students', path: '/users', icon: Users },
      { label: 'Teachers', path: '/teachers', icon: GraduationCap },
    ],
  },
  {
    title: '4. Academic Management',
    items: [
      { label: 'Categories', path: '/categories', icon: FolderOpen },
      { label: 'Exams', path: '/exam-categories', icon: Trophy },
      { label: 'Resource Categories', path: '/resource-categories', icon: BookmarkCheck },
    ],
  },
  {
    title: '5. Academic Content',
    items: [
      { label: 'Courses', path: '/courses', icon: BookOpen },
      { label: 'Test Series', path: '/test-series', icon: ClipboardList },
      { label: 'Tests', path: '/tests', icon: FileText },
      { label: 'Quizzes', path: '/quizzes', icon: Brain },
      { label: 'Live Classes', path: '/live-classes', icon: Video },
      { label: 'Blogs & Articles', path: '/blogs', icon: FileCode },
      { label: 'Free Resources', path: '/library', icon: Library },
    ],
  },
  {
    title: '6. Engagement',
    items: [{ label: 'Reviews', path: '/reviews', icon: Star }],
  },
  {
    title: '7. Career',
    items: [{ label: 'Job Alerts', path: '/job-alerts', icon: Briefcase }],
  },
  {
    title: '8. Marketing & Offers',
    items: [{ label: 'Coupons', path: '/coupons', icon: Tag }],
  },
  {
    title: '9. Communication',
    items: [{ label: 'Announcements', path: '/announcements', icon: Megaphone }],
  },
  {
    title: '10. Policies & Support CMS',
    items: [
      { label: 'Support & Queries', path: '/support-tickets', icon: LifeBuoy },
      { label: 'Branding', path: '/branding', icon: Palette },
      { label: 'Legal & Policies', path: '/legal-settings', icon: FileText },
      { label: 'Help & FAQs', path: '/help-settings', icon: Star },
      { label: 'Success Stories', path: '/success-stories-settings', icon: Trophy },
    ],
  },
  {
    title: '11. System & Operations',
    items: [{ label: 'System Logs', path: '/logs', icon: Activity }],
  },
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
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold font-display text-white">
                Civics<span className="text-primary-400">Edu</span>
              </span>
            </div>
          )}
          {collapsed && (
            <div className="h-9 w-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm mx-auto">
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
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
          {navSections.map((section, sIdx) => (
            <div key={section.title || sIdx} className="space-y-1">
              {!collapsed && section.title && (
                <div className="px-3 pt-2 pb-1 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                  {section.title}
                </div>
              )}
              {collapsed && section.title && <div className="my-2 border-t border-white/10" />}
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-sidebar-active text-white shadow-md shadow-blue-900/20 font-semibold'
                        : 'text-gray-300 hover:bg-sidebar-hover hover:text-white',
                      collapsed && 'justify-center px-2'
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-3 border-t border-white/10 flex-shrink-0">
            <p className="text-xs text-gray-400 text-center">© 2026 CivicsEdu Admin</p>
          </div>
        )}
      </aside>
    </>
  );
}
