import { Link } from 'react-router-dom';
import {
  HiArrowRight,
  HiLightningBolt,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineFire,
  HiOutlineSparkles,
  HiOutlineStar,
} from 'react-icons/hi';

export default function DailyChallenge() {
  return (
    <section className="py-20 md:py-24 bg-[#faf9f6] relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Elevated Modern Card */}
        <div className="relative rounded-[32px] md:rounded-[40px] bg-gradient-to-br from-[#0c1527] via-[#111e38] to-[#080d1a] text-white p-8 sm:p-12 md:p-16 shadow-2xl overflow-hidden border border-navy-800">
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            {/* Live Indicator Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-amber-300 text-xs font-black uppercase tracking-wider mb-6 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Daily Challenge Live</span>
              <span className="text-white/40">•</span>
              <span className="text-slate-300 font-bold lowercase">Join active students</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-white tracking-tight mb-4 leading-tight">
              Today's Challenge
            </h2>

            {/* Subhead */}
            <p className="text-base sm:text-lg md:text-xl text-slate-300 font-medium mb-10 leading-relaxed max-w-2xl mx-auto">
              10 questions. 15 minutes. Can you beat yesterday's score?
            </p>

            {/* Modern Interactive 3 Stats Modules */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-10 text-left">
              {/* Streak Card */}
              <div className="bg-white/[0.07] hover:bg-white/[0.1] backdrop-blur-md border border-white/10 rounded-2xl p-5 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                    <HiOutlineFire className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                    Active
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white mb-0.5 font-display">
                  Daily Track
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Maintain Streaks
                </div>
              </div>

              {/* Accuracy Card */}
              <div className="bg-white/[0.07] hover:bg-white/[0.1] backdrop-blur-md border border-white/10 rounded-2xl p-5 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <HiOutlineCheckCircle className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Target 80%
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white mb-0.5 font-display">
                  Instant
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Performance
                </div>
              </div>

              {/* XP Card */}
              <div className="bg-white/[0.07] hover:bg-white/[0.1] backdrop-blur-md border border-white/10 rounded-2xl p-5 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <HiOutlineStar className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Bonus
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white mb-0.5 font-display">
                  Rewards
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Earn XP points
                </div>
              </div>
            </div>

            {/* Quick Metadata Pill Strip */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-300 mb-10">
              <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                <HiOutlineClock className="h-4 w-4 text-amber-400" /> 15 Minutes
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                <HiLightningBolt className="h-4 w-4 text-blue-400" /> 10 Selected Questions
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                <HiOutlineSparkles className="h-4 w-4 text-emerald-400" /> Instant State Ranking
              </span>
            </div>

            {/* Fresh Glowing Action Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/daily-quiz"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-navy-950 font-black text-base sm:text-lg rounded-2xl transition-all duration-300 hover:scale-[1.03] shadow-xl shadow-orange-500/25 active:scale-95"
              >
                Take Today's Challenge <HiArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-4 text-xs font-medium text-slate-400">
              Free for all registered students • Resets daily at midnight
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
