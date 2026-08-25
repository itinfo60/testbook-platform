import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiAcademicCap, HiStar, HiBookOpen, HiUserGroup, HiBadgeCheck } from 'react-icons/hi';
import api from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function FacultyPage() {
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const res = await api.get('/users', { params: { role: 'teacher', limit: 10 } });
        setFacultyMembers(res.data?.data?.users || res.data?.users || []);
      } catch (err) {
        console.error('Failed to fetch faculties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFaculties();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-50 dark:bg-dark-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-dark-50 dark:bg-dark-950 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-dark-900 dark:text-dark-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-xs bg-amber-50 dark:bg-amber-950 px-3 py-1 rounded-full mb-3">
            <HiAcademicCap className="h-4 w-4" /> Expert Mentors
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display">
            Meet Our Faculty Members
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2">
            Learn from top academicians, subject experts, and RPSC rank holders with decades of
            combined experience in competitive exam guidance.
          </p>
        </div>

        {facultyMembers.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold text-dark-900 dark:text-white mb-2">
              No faculties found
            </h3>
            <p className="text-slate-500">More faculty profiles will be updated soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {facultyMembers.map((fac) => (
              <div
                key={fac._id || fac.id}
                className="bg-white dark:bg-dark-900 rounded-3xl p-6 sm:p-8 shadow-md hover:shadow-xl border border-slate-200 dark:border-dark-800 transition-all flex flex-col sm:flex-row gap-6 items-center sm:items-start"
              >
                {fac.avatar || fac.image ? (
                  <img
                    src={fac.avatar?.url || fac.avatar || fac.image}
                    alt={fac.name}
                    className="w-32 h-32 rounded-2xl object-cover shrink-0 border-2 border-amber-500 shadow-md"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-amber-100 dark:bg-amber-900/30 shrink-0 border-2 border-amber-500 shadow-md flex items-center justify-center text-4xl font-bold text-amber-600">
                    {fac.name?.charAt(0)}
                  </div>
                )}

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2 mb-1">
                    <h3 className="text-xl font-extrabold text-dark-900 dark:text-white">
                      {fac.name}
                    </h3>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-full">
                      ⭐ {fac.rating || '4.9'}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
                    {fac.subject || fac.expertise || 'Subject Expert'}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 mb-3">
                    {fac.qualification || 'Highly Qualified'} •{' '}
                    {fac.experience || 'Experienced Professional'}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4 line-clamp-3">
                    {fac.bio || 'Dedicated educator committed to student success.'}
                  </p>

                  <div className="pt-3 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                      📚 {fac.coursesCount || Math.floor(Math.random() * 5) + 1} Active Batches
                    </span>
                    <Link
                      to={`/courses?teacher=${fac._id || fac.id}`}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:underline"
                    >
                      View Batches →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
