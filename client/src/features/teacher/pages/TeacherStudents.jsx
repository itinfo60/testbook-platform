import { useEffect, useState } from 'react';
import { enrollmentAPI } from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { HiUser, HiAcademicCap, HiClock } from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';

export default function TeacherStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [expandedStudentId, setExpandedStudentId] = useState(null);

  useEffect(() => {
    enrollmentAPI.getTeacherStudents()
      .then(res => setStudents(res.data?.data?.students || []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  // Group enrollments by student
  const groupedStudents = Object.values(students.reduce((acc, enrollment) => {
    const userId = enrollment.user?._id;
    if (!userId) return acc;
    if (!acc[userId]) {
      acc[userId] = {
        user: enrollment.user,
        enrollments: []
      };
    }
    acc[userId].enrollments.push(enrollment);
    return acc;
  }, {}));

  const filtered = groupedStudents.filter(s =>
    !search ||
    s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.enrollments.some(e => e.course?.title?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-dark-700">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">My Students</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and track your enrolled students</p>
        </div>
        <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 font-semibold text-xs sm:text-sm shadow-sm whitespace-nowrap">
          {groupedStudents.length} student{groupedStudents.length !== 1 ? 's' : ''} ({students.length} enrollments)
        </div>
      </div>

      <div className="mb-8 bg-white dark:bg-dark-800 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-dark-700 flex items-center transition-shadow focus-within:shadow-md">
        <div className="pl-4 pr-2 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <input
          type="text"
          placeholder="Search by student name, email or course..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-transparent border-none focus:ring-0 text-slate-800 dark:text-white py-2"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-dark-800 rounded-3xl border border-slate-100 dark:border-dark-700 shadow-sm">
          <div className="h-24 w-24 rounded-full bg-slate-50 dark:bg-dark-700 flex items-center justify-center mb-6">
            <span className="text-6xl">👨‍🎓</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {students.length === 0 ? 'No students yet' : 'No matches found'}
          </h3>
          <p className="text-slate-500 max-w-md">
            {students.length === 0 ? 'Once students enroll in your courses, they\'ll show up here.' : 'Try adjusting your search to find what you are looking for.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((studentGroup, idx) => {
            const isExpanded = expandedStudentId === studentGroup.user._id;
            
            return (
              <div 
                key={studentGroup.user._id || idx} 
                className="group relative bg-white dark:bg-dark-800 rounded-2xl p-6 border border-slate-100 dark:border-dark-700 shadow-sm hover:shadow-xl transition-all duration-300"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 p-0.5">
                      <div className="h-full w-full rounded-full bg-white dark:bg-dark-800 flex items-center justify-center overflow-hidden">
                        {(() => {
                        const avatarUrl = studentGroup.user?.avatar?.url || (typeof studentGroup.user?.avatar === 'string' ? studentGroup.user?.avatar : null);
                        return avatarUrl ? (
                          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <HiUser className="h-6 w-6 text-primary-500" />
                        );
                      })()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {studentGroup.user?.name || 'Unknown Student'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{studentGroup.user?.email}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-lg">
                        {studentGroup.enrollments.length} Course{studentGroup.enrollments.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 dark:border-dark-700/50">
                  <button 
                    onClick={() => setExpandedStudentId(isExpanded ? null : studentGroup.user._id)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-xl hover:bg-slate-50 dark:hover:bg-dark-700/50"
                  >
                    {isExpanded ? 'Hide Details' : 'View Details'}
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
                
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-dark-700 space-y-4 animate-fade-in">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enrolled Courses</h4>
                    {studentGroup.enrollments.map(enrollment => (
                      <div key={enrollment._id} className="bg-slate-50 dark:bg-dark-900/50 p-3 rounded-xl">
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 font-medium">
                          <HiAcademicCap className="h-4 w-4 text-primary-500" />
                          <span className="truncate">{enrollment.course?.title || 'Unknown Course'}</span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <HiClock className="h-3.5 w-3.5" />
                            <span>{enrollment.enrolledAt ? formatDistanceToNow(new Date(enrollment.enrolledAt)) : 'recently'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {enrollment.progressPercentage !== undefined && (
                              <div className="flex items-center gap-2">
                                <div className="w-12 h-1.5 bg-slate-200 dark:bg-dark-700 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${enrollment.status === 'completed' ? 'bg-emerald-500' : 'bg-primary-500'}`}
                                    style={{ width: `${Math.round(enrollment.progressPercentage)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                  {Math.round(enrollment.progressPercentage)}%
                                </span>
                              </div>
                            )}
                            <div className={`h-2 w-2 rounded-full ${enrollment.status === 'completed' ? 'bg-emerald-500' : 'bg-primary-500'}`} title={enrollment.status}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
