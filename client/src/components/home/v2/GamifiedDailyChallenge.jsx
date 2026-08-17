import { HiAcademicCap, HiArrowRight, HiClock, HiFire, HiLightningBolt } from 'react-icons/hi';
import { Link } from 'react-router-dom';
export default function GamifiedDailyChallenge() {
  const leaderboard = [
    { rank: 1, name: 'Rahul', score: '96%' },
    { rank: 2, name: 'Priya', score: '94%' },
    { rank: 3, name: 'Amit', score: '92%' },
  ];

  return (
    <section className="py-20 bg-navy-950 relative overflow-hidden">
      {/* Abstract background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[400px] bg-accent-500 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-navy-900 border border-navy-800 rounded-3xl p-8 lg:p-12 shadow-2xl flex flex-col lg:flex-row gap-10 items-center justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-accent-500/10 border border-accent-500/20 text-accent-400 text-xs font-bold uppercase tracking-wider mb-6">
              <HiLightningBolt className="h-4 w-4" /> Daily Live Challenge
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Today's Challenge
            </h2>
            <p className="text-lg text-navy-300 mb-8">
              15 minutes. 10 questions. One step closer to your target score.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-navy-950 rounded-lg p-3 border border-navy-800">
                <p className="text-xs text-navy-400 mb-1 flex items-center gap-1">
                  <HiAcademicCap /> Questions
                </p>
                <p className="text-lg font-bold text-white">10</p>
              </div>
              <div className="bg-navy-950 rounded-lg p-3 border border-navy-800">
                <p className="text-xs text-navy-400 mb-1 flex items-center gap-1">
                  <HiLightningBolt /> Difficulty
                </p>
                <p className="text-lg font-bold text-white">Medium</p>
              </div>
              <div className="bg-navy-950 rounded-lg p-3 border border-navy-800">
                <p className="text-xs text-navy-400 mb-1 flex items-center gap-1">
                  <HiClock /> Time
                </p>
                <p className="text-lg font-bold text-white">15 min</p>
              </div>
              <div className="bg-navy-950 rounded-lg p-3 border border-navy-800">
                <p className="text-xs text-navy-400 mb-1 flex items-center gap-1">
                  <HiFire className="text-orange-500" /> Streak
                </p>
                <p className="text-lg font-bold text-white">7 Days</p>
              </div>
            </div>

            <Link
              to="/daily-quiz"
              className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-accent-500/20 w-full sm:w-auto justify-center"
            >
              Start Today's Challenge <HiArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="w-full lg:w-80 bg-navy-950 border border-navy-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <HiFire className="h-24 w-24 text-white" />
            </div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-navy-800 pb-2">
              Today's Top Performers
            </h4>
            <div className="space-y-3">
              {leaderboard.map((user) => (
                <div
                  key={user.rank}
                  className="flex items-center justify-between p-2 rounded hover:bg-navy-900 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        user.rank === 1
                          ? 'bg-yellow-500/20 text-yellow-500'
                          : user.rank === 2
                            ? 'bg-gray-400/20 text-gray-300'
                            : 'bg-orange-700/20 text-orange-400'
                      }`}
                    >
                      #{user.rank}
                    </span>
                    <span className="text-sm font-medium text-navy-100">{user.name}</span>
                  </div>
                  <span className="text-sm font-bold text-accent-400">{user.score}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-navy-800 text-center">
              <span className="text-xs text-navy-400 font-medium">
                Beat the high score to feature here!
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
