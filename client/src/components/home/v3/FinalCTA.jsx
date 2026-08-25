import { Link } from 'react-router-dom';
import { HiArrowRight, HiLightningBolt } from 'react-icons/hi';
import { useExamCategories } from '@/services/categories';
import { useSelector } from 'react-redux';

export default function FinalCTA() {
  const { categories } = useExamCategories();
  // Hook already scopes to type:'exam' — count them all, nested or not
  const examCount = categories.length;

  // Pull live counts from Redux stores populated by other sections
  const { list: courses } = useSelector((s) => s.courses || { list: [] });
  const courseCount = courses?.length || 0;

  return (
    <section className="py-20 md:py-28 bg-[#faf9f6] relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[32px] sm:rounded-[44px] bg-gradient-to-br from-[#0c1527] via-[#111e38] to-[#080d1a] border border-navy-800 text-white p-8 sm:p-14 md:p-20 shadow-2xl overflow-hidden text-center">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/15 rounded-full blur-[110px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-[110px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-amber-300 text-xs font-black uppercase tracking-wider mb-8 shadow-sm">
              <HiLightningBolt className="h-4 w-4 text-amber-400" />
              <span>Zero Risk • Instant Free Access to Tests &amp; Notes</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-white tracking-tight mb-6 leading-[1.15]">
              Ready to Stop Preparing Randomly?
            </h2>

            <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto font-normal">
              Pick your target exam, track your daily syllabus mastery, and measure your real state
              ranking before exam day arrives.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mb-10">
              <Link
                to="/exams"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-navy-950 font-black px-8 py-4 rounded-2xl text-base sm:text-lg transition-all duration-300 hover:scale-[1.03] shadow-xl shadow-orange-500/25 active:scale-95"
              >
                Select Exam <HiArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/courses"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-white font-bold px-8 py-4 rounded-2xl text-base sm:text-lg transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                Start Courses
              </Link>
              <Link
                to="/tests"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-white font-bold px-8 py-4 rounded-2xl text-base sm:text-lg transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                Start Test Series
              </Link>
            </div>

            <div className="pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-3.5 text-xs sm:text-sm font-bold text-slate-300">
              <Link
                to="/exams"
                className="whitespace-nowrap flex items-center gap-2 hover:text-white transition-colors py-1 group"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-4 ring-rose-500/25 group-hover:scale-110 transition-transform"></span>
                {examCount > 0 ? `${examCount} Exams` : 'Exams'}
              </Link>
              <Link
                to="/courses"
                className="whitespace-nowrap flex items-center gap-2 hover:text-white transition-colors py-1 group"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-blue-500/25 group-hover:scale-110 transition-transform"></span>
                {courseCount > 0 ? `${courseCount} Courses` : 'Courses'}
              </Link>
              <Link
                to="/tests"
                className="whitespace-nowrap flex items-center gap-2 hover:text-white transition-colors py-1 group"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500 ring-4 ring-purple-500/25 group-hover:scale-110 transition-transform"></span>
                Test Series
              </Link>
              <Link
                to="/daily-quiz"
                className="whitespace-nowrap flex items-center gap-2 hover:text-white transition-colors py-1 group"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-amber-500/25 group-hover:scale-110 transition-transform"></span>
                Daily Quizzes
              </Link>
              <Link
                to="/blog"
                className="whitespace-nowrap flex items-center gap-2 hover:text-white transition-colors py-1 group"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/25 group-hover:scale-110 transition-transform"></span>
                Daily Updates &amp; Free Resources
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
