import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HiPlus } from 'react-icons/hi';
import { fetchTeacherTests } from '@/features/test/testSlice';

export default function TeacherTests() {
  const dispatch = useDispatch();
  const { teacherTests, loading } = useSelector(state => state.tests);

  useEffect(() => {
    dispatch(fetchTeacherTests());
  }, [dispatch]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-dark-900 dark:text-white">My Tests</h2>
        <Link to="/teacher/tests/new"><Button icon={HiPlus} size="sm">Create Test</Button></Link>
      </div>

      {teacherTests.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">No tests yet</h3>
          <p className="text-dark-500 mb-4">Create your first test</p>
          <Link to="/teacher/tests/new" className="btn-primary inline-flex items-center gap-2"><HiPlus className="h-4 w-4" /> Create Test</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {teacherTests.map(test => (
            <div key={test._id} className="card p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center flex-shrink-0 text-xl">📝</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-dark-900 dark:text-white truncate">{test.title}</h3>
                <div className="flex items-center gap-3 text-xs text-dark-400 mt-1">
                  <span>{test.questions?.length || 0} questions</span>
                  <span>{test.duration || 60} min</span>
                  <span>{test.attemptCount || 0} attempts</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link to={`/teacher/tests/${test._id}/analytics`} className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-400"><HiChartBar className="h-4 w-4" /></Link>
                <Link to={`/teacher/tests/${test._id}/edit`} className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-400"><HiPencil className="h-4 w-4" /></Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
