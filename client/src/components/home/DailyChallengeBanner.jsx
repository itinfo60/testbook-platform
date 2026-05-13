import { Link } from 'react-router-dom';
import { HiLightningBolt, HiArrowRight } from 'react-icons/hi';
export default function DailyChallengeBanner() {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden bg-gradient-to-r from-accent-500 to-accent-600 dark:from-accent-600 dark:to-accent-800 rounded-2xl p-8 md:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <HiLightningBolt className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white">Daily Challenge</h3>
                <p className="text-white/80">Complete today's challenge and earn bonus points!</p>
              </div>
            </div>
            <Link to="/tests" className="inline-flex items-center gap-2 bg-white text-accent-600 font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-all flex-shrink-0">
              Start Challenge <HiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
