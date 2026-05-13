import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllBadges, fetchMyBadges } from '@/features/achievement/achievementSlice';

export default function AchievementsPage() {
  const dispatch = useDispatch();
  const { allBadges, myBadges, loading } = useSelector(state => state.achievements);

  useEffect(() => {
    dispatch(fetchAllBadges());
    dispatch(fetchMyBadges());
  }, [dispatch]);

  const earnedIds = myBadges.map(b => b.badge?._id || b._id);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="section-title">🏅 Achievements</h1>
        <p className="section-subtitle">Collect badges by completing courses and tests</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-full text-sm font-medium">
          {myBadges.length} / {allBadges.length} earned
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {allBadges.map(badge => {
          const earned = earnedIds.includes(badge._id);
          return (
            <div
              key={badge._id}
              className={`card p-6 text-center transition-all ${
                earned ? 'ring-2 ring-primary-500 bg-primary-50/50 dark:bg-primary-950/20' : 'opacity-50 grayscale'
              }`}
            >
              <div className="text-4xl mb-3">{badge.icon || '🏅'}</div>
              <h3 className="font-semibold text-sm text-dark-900 dark:text-white mb-1">{badge.name}</h3>
              <p className="text-xs text-dark-400">{badge.description || 'Complete the requirement to earn'}</p>
              {earned && (
                <span className="badge-success mt-2 text-xs">✓ Earned</span>
              )}
            </div>
          );
        })}

        {allBadges.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-5xl mb-4">🏅</div>
            <p className="text-dark-500">No badges available yet. Keep learning!</p>
          </div>
        )}
      </div>
    </div>
  );
}
