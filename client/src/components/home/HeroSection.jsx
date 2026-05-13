import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiArrowRight, HiPlay } from 'react-icons/hi';
export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-dark-900 dark:via-dark-950 dark:to-dark-900">
      {/* ✅ Moved overflow-hidden to background only */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-400 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-secondary-400 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
              <span className="h-2 w-2 bg-secondary-400 rounded-full animate-pulse" />
              <span className="text-sm text-white/90 font-medium">Trusted by 10L+ Students</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display text-white leading-tight mb-6">
              Crack Your Exam
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-300 to-accent-300">
                With Confidence
              </span>
            </h1>

            <p className="text-lg text-white/80 mb-8 max-w-lg">
              India's most comprehensive learning platform with live classes, test series, and personalized study plans for all competitive exams.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/courses" className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-all shadow-lg hover:shadow-xl">
                Explore Courses
                <HiArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/tests" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 border border-white/20 transition-all">
                <HiPlay className="h-4 w-4" />
                Free Mock Tests
              </Link>
            </div>

            {/* Stats Row */}
            <div className="flex gap-8 mt-10 pt-8 border-t border-white/10">
              {[
                { value: '10L+', label: 'Students' },
                { value: '500+', label: 'Courses' },
                { value: '50K+', label: 'Tests' },
                { value: '4.8', label: 'Rating' },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block"
          >
            {/* ✅ Added padding so floating cards have room inside the parent */}
            <div className="relative pt-16 pb-12 px-10">

              {/* ✅ Floating Card 1 — Success Rate (TOP, above exam list) */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="absolute top-0 left-0 z-20 bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <span className="text-xl">🎯</span>
                  </div>
                  <div>
                    <div className="text-base font-bold text-dark-900 dark:text-white">
                      95% Success Rate
                    </div>
                    <div className="text-xs text-dark-400">In competitive exams</div>
                  </div>
                </div>
              </motion.div>

              {/* ✅ Floating Card 2 — Smart Analytics (BOTTOM RIGHT) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="absolute bottom-0 right-0 z-20 bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <span className="text-xl">📊</span>
                  </div>
                  <div>
                    <div className="text-base font-bold text-dark-900 dark:text-white">
                      AI Powered
                    </div>
                    <div className="text-xs text-dark-400">Smart analytics & insights</div>
                  </div>
                </div>
              </motion.div>

              {/* Main Exam List Card */}
              <div className="relative z-10 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8">
                <div className="space-y-4">
                  {[
                    { name: 'Banking & Insurance', icon: '🏦' },
                    { name: 'SSC & Railways', icon: '🚂' },
                    { name: 'UPSC Civil Services', icon: '📜' },
                    { name: 'State PSC Exams', icon: '🏢' },
                  ].map((exam) => (
                    <div
                      key={exam.name}
                      className="flex items-center gap-4 bg-white/10 rounded-xl p-3 hover:bg-white/20 transition-colors cursor-pointer"
                    >
                      <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center text-white">
                        {exam.icon}
                      </div>
                      <span className="text-white font-medium">{exam.name}</span>
                      <HiArrowRight className="h-4 w-4 text-white/50 ml-auto" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}