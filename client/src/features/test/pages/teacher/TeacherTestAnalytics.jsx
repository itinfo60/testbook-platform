import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTestAnalytics } from '@/features/test/testSlice';

export default function TeacherTestAnalytics() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { analytics, loading } = useSelector(state => state.tests);

  useEffect(() => {
    dispatch(fetchTestAnalytics(id));
  }, [dispatch, id]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-6">Test Analytics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Attempts', value: analytics?.totalAttempts || 0 },
          { label: 'Avg Score', value: `${analytics?.averageScore || 0}%` },
          { label: 'Highest Score', value: `${analytics?.highestScore || 0}%` },
          { label: 'Completion Rate', value: `${analytics?.completionRate || 0}%` },
        ].map(stat => (
          <div key={stat.label} className="card p-4 text-center">
            <div className="text-2xl font-bold text-dark-900 dark:text-white">{stat.value}</div>
            <div className="text-sm text-dark-400">{stat.label}</div>
          </div>
        ))}
      </div>
      {!analytics && <p className="text-center text-dark-400">No analytics data available yet.</p>}
    </div>
  );
}
