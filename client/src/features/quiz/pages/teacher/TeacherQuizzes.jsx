import { Button } from '@/components/ui';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HiPlus, HiPencil } from 'react-icons/hi';
import { fetchTeacherQuizzes } from '@/features/quiz/quizSlice';

export default function TeacherQuizzes() {
  const dispatch = useDispatch();
  const { teacherQuizzes, loading } = useSelector(state => state.quizzes);

  useEffect(() => {
    dispatch(fetchTeacherQuizzes());
  }, [dispatch]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-dark-700">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">My Quizzes</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage interactive quizzes for your courses</p>
        </div>
        <Link to="/teacher/quizzes/new" className="group relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 bg-primary-600 font-pj rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 hover:-translate-y-0.5">
          <HiPlus className="mr-2 h-4 w-4" /> Create Quiz
        </Link>
      </div>

      {teacherQuizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-dark-800 rounded-3xl border border-slate-100 dark:border-dark-700 shadow-sm">
          <div className="h-24 w-24 rounded-full bg-slate-50 dark:bg-dark-700 flex items-center justify-center mb-6">
            <span className="text-6xl">🧩</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No quizzes yet</h3>
          <p className="text-slate-500 max-w-md mb-6">Interactive quizzes help keep your students engaged and test their knowledge.</p>
          <Link to="/teacher/quizzes/new" className="btn-primary inline-flex items-center gap-2">
            <HiPlus className="h-4 w-4" /> Create Your First Quiz
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teacherQuizzes.map((quiz, idx) => (
            <div 
              key={quiz._id} 
              className="group relative bg-white dark:bg-dark-800 rounded-2xl p-6 border border-slate-100 dark:border-dark-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-500/30 transform group-hover:scale-110 transition-transform duration-300">
                  🧩
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${quiz.isPublished ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                  {quiz.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {quiz.title}
                </h3>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-50 dark:border-dark-700/50 flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300 mr-1.5">{quiz.questions?.length || 0}</span> questions
                  </div>
                  <div className="flex items-center text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300 mr-1.5">{quiz.passingScore || 60}%</span> to pass
                  </div>
                </div>
                
                <Link 
                  to={`/teacher/quizzes/${quiz._id}/edit`} 
                  className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-700/50 text-slate-600 dark:text-slate-300 font-medium hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20 dark:hover:text-primary-400 transition-colors"
                >
                  <HiPencil className="h-4 w-4" /> Edit Quiz
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
