import { Suspense } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { HiAcademicCap } from 'react-icons/hi';
export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="h-10 w-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <HiAcademicCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold font-display text-dark-900 dark:text-white">
              Civics<span className="text-primary-600">Hub</span>
            </span>
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
