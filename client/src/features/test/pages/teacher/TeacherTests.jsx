import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HiPlus, HiChartBar, HiPencil } from 'react-icons/hi';
import { fetchTeacherTests } from '@/features/test/testSlice';

export default function TeacherTests() {
  const dispatch = useDispatch();
  const { teacherTests, loading } = useSelector(state => state.tests);

  useEffect(() => {
    dispatch(fetchTeacherTests());
  }, [dispatch]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-dark-700">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">My Tests</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create and manage your assessments</p>
        </div>
        <Link to="/teacher/tests/new" className="group relative inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-2.5 text-sm font-semibold text-white transition-all duration-200 bg-primary-600 font-pj rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 hover:-translate-y-0.5 whitespace-nowrap">
          <HiPlus className="mr-1.5 h-4 w-4" /> Create Test
        </Link>
      </div>

      {teacherTests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-dark-800 rounded-3xl border border-slate-100 dark:border-dark-700 shadow-sm">
          <div className="h-24 w-24 rounded-full bg-slate-50 dark:bg-dark-700 flex items-center justify-center mb-6">
            <span className="text-6xl">📝</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No tests yet</h3>
          <p className="text-slate-500 max-w-md mb-6">Tests help you evaluate your students' understanding of the material.</p>
          <Link to="/teacher/tests/new" className="btn-primary inline-flex items-center gap-2">
            <HiPlus className="h-4 w-4" /> Create Your First Test
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teacherTests.map((test, idx) => (
            <div 
              key={test._id} 
              className="group relative bg-white dark:bg-dark-800 rounded-2xl p-6 border border-slate-100 dark:border-dark-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-xl shadow-lg shadow-rose-500/30 transform group-hover:scale-110 transition-transform duration-300">
                  📝
                </div>
                <div className="flex gap-1.5">
                  <Link to={`/teacher/tests/${test._id}/analytics`} className="h-8 w-8 rounded-lg flex items-center justify-center bg-slate-50 text-slate-500 hover:bg-primary-50 hover:text-primary-600 dark:bg-dark-700 dark:text-slate-400 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-colors" title="Analytics">
                    <HiChartBar className="h-4 w-4" />
                  </Link>
                  <Link to={`/teacher/tests/${test._id}/edit`} className="h-8 w-8 rounded-lg flex items-center justify-center bg-slate-50 text-slate-500 hover:bg-primary-50 hover:text-primary-600 dark:bg-dark-700 dark:text-slate-400 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-colors" title="Edit">
                    <HiPencil className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {test.title}
                </h3>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-50 dark:border-dark-700/50">
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-dark-700/50">
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{test.questionsCount || test.questions?.length || 0}</span>
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">Questions</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-dark-700/50">
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{test.duration || 60}</span>
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">Minutes</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-dark-700/50">
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{test.totalAttempts || 0}</span>
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">Attempts</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
