import { HiArrowRight, HiCheckCircle, HiPlay, HiTrendingUp } from 'react-icons/hi';
import { Link } from 'react-router-dom';
export default function PremiumHero() {
  return (
    <section className="relative bg-navy-950 pt-20 pb-24 lg:pt-32 lg:pb-36 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent-500/10 rounded-full blur-3xl opacity-50 mix-blend-screen transform translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary-900/20 rounded-full blur-3xl opacity-50 mix-blend-screen transform -translate-x-1/4 translate-y-1/4" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('/assets/grid-pattern.svg')] opacity-[0.03]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-900 border border-navy-800 mb-6">
                <span className="h-2 w-2 rounded-full bg-accent-500 animate-pulse" />
                <span className="text-xs font-semibold text-accent-100 tracking-wider uppercase">
                  Rajasthan's Exam Preparation Command Center
                </span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-display font-bold text-white leading-[1.1] mb-6 tracking-tight">
                Don't Just Prepare.
                <br />
                Prepare to <span className="text-accent-500">Rank.</span>
              </h1>

              <p className="text-lg text-navy-200 mb-8 leading-relaxed max-w-xl">
                Premium live classes, exam-focused test series, handwritten notes and real-time
                performance analytics built specifically for Rajasthan's most competitive exams.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  to="/exams"
                  className="inline-flex items-center justify-center gap-2 bg-accent-500 text-white font-semibold px-8 py-3.5 rounded hover:bg-accent-600 transition-all shadow-lg shadow-accent-500/25"
                >
                  Explore Your Exam
                  <HiArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/tests"
                  className="inline-flex items-center justify-center gap-2 bg-navy-800 text-white border border-navy-700 font-semibold px-8 py-3.5 rounded hover:bg-navy-700 transition-all"
                >
                  Take a Free Mock Test
                  <HiPlay className="h-5 w-5" />
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 border-t border-navy-800 pt-8">
                <div>
                  <p className="text-2xl font-bold text-white font-display mb-1">25k+</p>
                  <p className="text-xs text-navy-300 uppercase tracking-wide">Active Learners</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white font-display mb-1">6+</p>
                  <p className="text-xs text-navy-300 uppercase tracking-wide">Mock Test Series</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white font-display mb-1">11+</p>
                  <p className="text-xs text-navy-300 uppercase tracking-wide">Exam Portals</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white font-display mb-1">100%</p>
                  <p className="text-xs text-navy-300 uppercase tracking-wide">Free Resources</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Content - Mock Dashboard */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:pl-8"
          >
            <div className="text-center mb-4">
              <h3 className="text-navy-200 font-display font-medium text-lg">
                Know Where You Stand Before Exam Day.
              </h3>
            </div>

            <div className="bg-navy-900 rounded-xl border border-navy-700 p-1 shadow-2xl">
              <div className="bg-navy-950 rounded-lg p-6 border border-navy-800 relative overflow-hidden">
                {/* Header of mock dashboard */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-navy-800">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-navy-800 flex items-center justify-center text-accent-500 font-bold">
                      RAS
                    </div>
                    <div>
                      <p className="text-white font-medium">RAS Prelims 2026</p>
                      <p className="text-xs text-navy-400">Full Length Mock Test 4</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-navy-400 mb-1">Current Rank</p>
                    <p className="text-2xl font-bold text-accent-500">
                      #127 <span className="text-xs text-navy-500 font-normal">/ 14.5k</span>
                    </p>
                  </div>
                </div>

                {/* Grid of stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-navy-900 p-4 rounded border border-navy-800">
                    <p className="text-xs text-navy-400 mb-1">Percentile</p>
                    <p className="text-xl font-bold text-white">96.8%</p>
                  </div>
                  <div className="bg-navy-900 p-4 rounded border border-navy-800">
                    <p className="text-xs text-navy-400 mb-1">Accuracy</p>
                    <p className="text-xl font-bold text-white">84%</p>
                  </div>
                  <div className="bg-navy-900 p-4 rounded border border-navy-800">
                    <p className="text-xs text-navy-400 mb-1">Tests Completed</p>
                    <p className="text-xl font-bold text-white">42</p>
                  </div>
                  <div className="bg-navy-900 p-4 rounded border border-accent-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-20">
                      <HiTrendingUp className="h-8 w-8 text-accent-500" />
                    </div>
                    <p className="text-xs text-navy-400 mb-1">Improvement</p>
                    <p className="text-xl font-bold text-accent-400">+18%</p>
                  </div>
                </div>

                {/* Weak Area Alert */}
                <div className="bg-red-950/30 border border-red-900/50 rounded p-4 flex items-start gap-3">
                  <div className="mt-0.5">
                    <HiCheckCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-200">Weak Area Identified</p>
                    <p className="text-xs text-red-300/70 mt-1">
                      Your accuracy in <strong className="text-red-200">Rajasthan Polity</strong> is
                      12% below the top 100 average. Recommend reviewing Notes Chapter 4.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
