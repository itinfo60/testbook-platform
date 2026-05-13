import { Link } from 'react-router-dom';
import { HiBadgeCheck, HiMail, HiCalendar, HiAcademicCap } from 'react-icons/hi';
import { useAuth } from '@/hooks/useAuth';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
          <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-3xl font-bold">
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">{user.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge-primary capitalize">{user.role}</span>
              {user.isVerified && <span className="badge-success flex items-center gap-1"><HiBadgeCheck className="h-3 w-3" /> Verified</span>}
            </div>
          </div>
          <Link to="/settings" className="sm:ml-auto btn-outline text-sm">Edit Profile</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-dark-50 dark:bg-dark-800/50 rounded-xl">
            <HiMail className="h-5 w-5 text-dark-400" />
            <div>
              <p className="text-xs text-dark-400">Email</p>
              <p className="text-sm font-medium text-dark-900 dark:text-white">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-dark-50 dark:bg-dark-800/50 rounded-xl">
            <HiCalendar className="h-5 w-5 text-dark-400" />
            <div>
              <p className="text-xs text-dark-400">Joined</p>
              <p className="text-sm font-medium text-dark-900 dark:text-white">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-dark-50 dark:bg-dark-800/50 rounded-xl">
            <HiAcademicCap className="h-5 w-5 text-dark-400" />
            <div>
              <p className="text-xs text-dark-400">Role</p>
              <p className="text-sm font-medium text-dark-900 dark:text-white capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
