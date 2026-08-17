import { Link } from 'react-router-dom';
import { HiLightningBolt, HiArrowRight } from 'react-icons/hi';
export default function DailyChallengeBanner() {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden bg-gradient-to-r from-accent-500 to-accent-600 dark:from-accent-600 dark:to-accent-800 rounded-2xl p-6 sm:p-8 md:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <div className="h-12 w-12 sm:h-14 sm:w-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0">
                <HiLightningBolt className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  Daily Challenge
                </h3>
                <p className="text-sm sm:text-base text-white/80">
                  Complete today's challenge and earn bonus points!
                </p>
              </div>
            </div>
            <Link
              to="/daily-quiz"
              className="inline-flex items-center gap-2 bg-white text-accent-600 font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-white/90 transition-all flex-shrink-0 w-full sm:w-auto justify-center"
            >
              Start Challenge <HiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
