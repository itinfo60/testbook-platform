import { Link } from 'react-router-dom';
import { HiArrowRight, HiPlay } from 'react-icons/hi';
export default function FinalCTA() {
  return (
    <section className="py-24 bg-navy-900 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent-500 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary-500 rounded-full blur-[100px] -translate-x-1/4 translate-y-1/4" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 tracking-tight leading-tight">
          Your Exam Date Won't Wait.
          <br />
          Neither Should Your Preparation.
        </h2>

        <p className="text-xl text-navy-200 mb-10 max-w-2xl mx-auto leading-relaxed">
          Join 25,000+ aspirants using EduHub to prepare smarter, practice harder and measure their
          progress.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 bg-accent-500 text-white font-semibold px-8 py-4 rounded-xl hover:bg-accent-600 transition-all shadow-xl shadow-accent-500/25"
          >
            Create Free Account <HiArrowRight className="h-5 w-5" />
          </Link>
          <Link
            to="/tests"
            className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/20 transition-all"
          >
            Take a Free Mock Test <HiPlay className="h-5 w-5" />
          </Link>
        </div>

        <p className="text-sm text-navy-400">
          No credit card required. Start with free resources and tests.
        </p>
      </div>
    </section>
  );
}
