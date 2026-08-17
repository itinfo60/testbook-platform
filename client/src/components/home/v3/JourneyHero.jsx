import { Link } from 'react-router-dom';
import { HiArrowRight, HiOutlineAcademicCap } from 'react-icons/hi';
import { useExamCategories } from '@/services/categories';

// Colour palette cycled per chip
const CHIP_STYLES = [
  { color: 'text-blue-600', bg: 'bg-blue-100', hoverBg: 'group-hover:bg-blue-600' },
  { color: 'text-purple-600', bg: 'bg-purple-100', hoverBg: 'group-hover:bg-purple-600' },
  { color: 'text-pink-600', bg: 'bg-pink-100', hoverBg: 'group-hover:bg-pink-600' },
  { color: 'text-orange-600', bg: 'bg-orange-100', hoverBg: 'group-hover:bg-orange-600' },
  { color: 'text-green-600', bg: 'bg-green-100', hoverBg: 'group-hover:bg-green-600' },
  { color: 'text-teal-600', bg: 'bg-teal-100', hoverBg: 'group-hover:bg-teal-600' },
  { color: 'text-rose-600', bg: 'bg-rose-100', hoverBg: 'group-hover:bg-rose-600' },
  { color: 'text-indigo-600', bg: 'bg-indigo-100', hoverBg: 'group-hover:bg-indigo-600' },
];

export default function JourneyHero() {
  const { categories, loading } = useExamCategories();

  // Only root-level categories for the marquee
  const examChips = categories.filter((c) => !c.parent);

  // Repeat enough times to fill the marquee scroll
  const repeated = examChips.length > 0 ? Array.from({ length: 5 }, () => examChips).flat() : [];

  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-[#faf9f6]">
      {/* Decorative Blobs */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] bg-accent-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
      <div className="absolute top-40 left-0 -translate-x-1/3 w-[500px] h-[500px] bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-5xl mx-auto mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-display font-bold text-navy-900 tracking-tight leading-tight mb-5">
            Your Exam Is the Goal.{' '}
            <span className="text-navy-500 font-normal">We Build the Journey.</span>
          </h1>
          <p className="text-xl md:text-2xl text-navy-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            We are providing Courses, Test Series, Quizzes, and Exam/Job Updates for{' '}
            <Link
              to="/exams?category=rajasthan"
              className="font-bold text-navy-950 border-b-2 border-accent-500 pb-0.5 hover:text-accent-600 hover:border-accent-600 transition-all cursor-pointer"
            >
              Rajasthan competitive exams
            </Link>{' '}
            and{' '}
            <Link
              to="/exams?category=political_science"
              className="font-bold text-navy-950 border-b-2 border-accent-500 pb-0.5 hover:text-accent-600 hover:border-accent-600 transition-all cursor-pointer"
            >
              Political Science exams
            </Link>
            .
          </p>

          {/* Auto-scrolling Exams Marquee */}
          <div className="my-12 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden">
            {/* Fading Edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 md:w-48 bg-gradient-to-r from-[#faf9f6] via-[#faf9f6]/90 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 md:w-48 bg-gradient-to-l from-[#faf9f6] via-[#faf9f6]/90 to-transparent z-10 pointer-events-none" />

            {loading ? (
              /* Skeleton chips while loading */
              <div className="flex gap-4 py-3 px-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[58px] w-40 rounded-full bg-gray-200 animate-pulse shrink-0"
                  />
                ))}
              </div>
            ) : examChips.length === 0 ? null : (
              <div
                className="marquee-scroll-track gap-4 py-3 pr-4"
                style={{
                  display: 'flex',
                  width: 'max-content',
                  animation: 'marqueeContinuous 45s linear infinite',
                  willChange: 'transform',
                }}
              >
                {repeated.map((exam, idx) => {
                  const style = CHIP_STYLES[idx % CHIP_STYLES.length];
                  return (
                    <Link
                      key={`${exam._id}-${idx}`}
                      to={`/exams/${exam.slug}`}
                      className="flex items-center gap-3.5 bg-white border border-navy-100 hover:border-accent-400 rounded-full px-7 py-3.5 shadow-sm hover:shadow-md transition-all shrink-0 group"
                    >
                      <div
                        className={`h-10 w-10 rounded-full ${style.bg} ${style.color} flex items-center justify-center ${style.hoverBg} group-hover:text-white transition-colors`}
                      >
                        {exam.icon && !exam.icon.startsWith('http') ? (
                          <span className="text-lg leading-none">{exam.icon}</span>
                        ) : (
                          <HiOutlineAcademicCap className="h-5 w-5" />
                        )}
                      </div>
                      <span className="font-bold text-navy-900 text-base whitespace-nowrap group-hover:text-accent-600 transition-colors">
                        {exam.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link
              to="/exams"
              className="w-full sm:w-auto px-10 py-4 bg-navy-950 hover:bg-navy-900 text-white rounded-full font-bold text-lg transition-transform hover:scale-105 flex items-center justify-center gap-2 shadow-xl shadow-navy-900/20"
            >
              Select your exam <HiArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-3.5 text-xs sm:text-sm font-bold text-navy-700">
            <Link
              to="/exams"
              className="whitespace-nowrap flex items-center gap-2 hover:text-accent-600 transition-colors py-1 group"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100/80 group-hover:scale-110 transition-transform"></span>{' '}
              Explore Exams
            </Link>
            <Link
              to="/courses"
              className="whitespace-nowrap flex items-center gap-2 hover:text-accent-600 transition-colors py-1 group"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-blue-100/80 group-hover:scale-110 transition-transform"></span>{' '}
              Premium Courses
            </Link>
            <Link
              to="/tests"
              className="whitespace-nowrap flex items-center gap-2 hover:text-accent-600 transition-colors py-1 group"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500 ring-4 ring-purple-100/80 group-hover:scale-110 transition-transform"></span>{' '}
              Mock Test Series
            </Link>
            <Link
              to="/daily-quiz"
              className="whitespace-nowrap flex items-center gap-2 hover:text-accent-600 transition-colors py-1 group"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100/80 group-hover:scale-110 transition-transform"></span>{' '}
              Daily Quizzes
            </Link>
            <Link
              to="/blog"
              className="whitespace-nowrap flex items-center gap-2 hover:text-accent-600 transition-colors py-1 group"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100/80 group-hover:scale-110 transition-transform"></span>{' '}
              Updates &amp; Free Resources
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
