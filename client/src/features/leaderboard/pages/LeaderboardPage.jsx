import { useEffect } from 'react';
import Tabs from '@/components/common/Tabs';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { HiTrendingUp } from 'react-icons/hi';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeaderboard, setPeriod } from '@/features/leaderboard/leaderboardSlice';

const medals = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const dispatch = useDispatch();
  const { entries, loading, period, userRank } = useSelector(state => state.leaderboard);

  useEffect(() => {
    dispatch(fetchLeaderboard({ period }));
  }, [dispatch, period]);

  const tabs = [
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'allTime', label: 'All Time' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="section-title">🏆 Leaderboard</h1>
        <p className="section-subtitle">See how you stack up against other learners</p>
      </div>

      <Tabs tabs={tabs} activeTab={period} onChange={p => dispatch(setPeriod(p))} className="mb-6 max-w-md mx-auto" />

      {userRank && (
        <div className="card p-4 mb-6 border-2 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-primary-600">#{userRank.rank}</span>
              <span className="font-medium text-dark-900 dark:text-white">Your Position</span>
            </div>
            <div className="flex items-center gap-1 text-primary-600">
              <HiTrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">{userRank.points || 0} pts</span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : entries.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🏆</div>
          <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">No data yet</h3>
          <p className="text-dark-500">Complete courses and tests to appear on the leaderboard!</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {entries.map((entry, i) => (
            <div
              key={entry._id || i}
              className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-dark-50 dark:border-dark-800 last:border-0 ${
                i < 3 ? 'bg-amber-50/50 dark:bg-amber-900/5' : ''
              }`}
            >
              <div className="w-8 sm:w-10 text-center flex-shrink-0">
                {i < 3 ? (
                  <span className="text-xl sm:text-2xl">{medals[i]}</span>
                ) : (
                  <span className="text-base sm:text-lg font-bold text-dark-400">{i + 1}</span>
                )}
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold text-sm">
                {entry.user?.name?.charAt(0) || entry.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-dark-900 dark:text-white truncate text-sm sm:text-base">{entry.user?.name || entry.name}</p>
                <p className="text-xs text-dark-400">{entry.testsCompleted || 0} tests completed</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-dark-900 dark:text-white text-sm sm:text-base">{entry.points || entry.score || 0}</p>
                <p className="text-xs text-dark-400">points</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
