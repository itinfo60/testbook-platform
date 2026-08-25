import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HiExternalLink, HiPencil, HiPlus, HiPuzzle, HiSearch, HiTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { fetchTeacherQuizzes } from '@/features/quiz/quizSlice';
import { quizAPI } from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function TeacherQuizzes() {
  const dispatch = useDispatch();
  const { teacherQuizzes, loading } = useSelector((state) => state.quizzes);
  const [activeFilter, setActiveFilter] = useState('all'); // all, daily, course
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchTeacherQuizzes());
  }, [dispatch]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete quiz "${title}"?`)) return;
    try {
      await quizAPI.delete(id);
      toast.success('Quiz deleted successfully');
      dispatch(fetchTeacherQuizzes());
    } catch (err) {
      toast.error('Failed to delete quiz');
    }
  };

  const filteredQuizzes = (teacherQuizzes || []).filter((q) => {
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'daily' && q.type === 'daily') ||
      (activeFilter === 'course' && (q.type === 'course' || (!q.type && q.course)));

    const matchesSearch =
      !searchQuery.trim() ||
      q.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-dark-900 p-6 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">
            <HiPuzzle className="h-4 w-4" /> Quiz Studio
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white font-display">
            Interactive Quizzes & Daily Challenges
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            Build 10-minute daily challenge drills and topic-wise practice quizzes with instant
            solutions.
          </p>
        </div>

        <Link
          to="/teacher/quizzes/new"
          className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all text-xs sm:text-sm shrink-0"
        >
          <HiPlus className="h-4 w-4" /> Create New Quiz
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Type Tabs */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-dark-900 p-1.5 rounded-xl border border-slate-200 dark:border-dark-800 shadow-sm w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Quizzes' },
            { id: 'daily', label: '⚡ Daily Challenges' },
            { id: 'course', label: '📚 Course Quizzes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-dark-300 hover:bg-slate-50 dark:hover:bg-dark-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search quizzes..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-xl focus:outline-none focus:border-primary-500 text-dark-900 dark:text-white placeholder-slate-400 shadow-sm"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-dark-900 rounded-2xl border border-dashed border-slate-200 dark:border-dark-800 p-8">
          <HiPuzzle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-dark-900 dark:text-white mb-1">
            No quizzes found
          </h3>
          <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
            Create 10-minute daily challenge quizzes or interactive module practice drills.
          </p>
          <Link
            to="/teacher/quizzes/new"
            className="inline-flex items-center gap-1.5 bg-primary-600 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm hover:bg-primary-700"
          >
            <HiPlus className="h-4 w-4" /> Create First Quiz
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id || quiz._id}
              className="bg-white dark:bg-dark-900 rounded-2xl p-5 border border-slate-200 dark:border-dark-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      quiz.type === 'daily'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200'
                        : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200'
                    }`}
                  >
                    {quiz.type === 'daily' ? '⚡ Daily Challenge' : '📚 Course Quiz'}
                  </span>

                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${
                      quiz.isPublished !== false
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-dark-800 dark:text-dark-300'
                    }`}
                  >
                    {quiz.isPublished !== false ? 'Published' : 'Draft'}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-dark-900 dark:text-white line-clamp-2 mb-1.5 leading-snug">
                  {quiz.title}
                </h3>

                {quiz.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed font-normal">
                    {quiz.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-dark-300 bg-slate-50 dark:bg-dark-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-dark-700 mb-4">
                  <span className="font-medium">❓ {quiz.questions?.length || 0} Questions</span>
                  <span>•</span>
                  <span className="font-medium">⏱️ {quiz.duration || 10} Mins</span>
                  <span>•</span>
                  <span className="font-medium">🎯 {quiz.passingScore || 60}% Pass</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between">
                <Link
                  to={`/quiz/${quiz._id}`}
                  target="_blank"
                  className="text-xs font-semibold text-slate-500 hover:text-primary-600 flex items-center gap-1"
                >
                  <HiExternalLink className="h-3.5 w-3.5" /> Preview Quiz
                </Link>

                <div className="flex items-center gap-1.5">
                  <Link
                    to={`/teacher/quizzes/${quiz._id}/edit`}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-primary-50 text-slate-600 hover:text-primary-600 dark:bg-dark-800 transition-colors"
                    title="Edit Quiz"
                  >
                    <HiPencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(quiz._id, quiz.title)}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-dark-800 transition-colors"
                    title="Delete Quiz"
                  >
                    <HiTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
