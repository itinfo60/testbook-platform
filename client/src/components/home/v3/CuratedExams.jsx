import { HiArrowRight, HiBookOpen, HiClipboardList } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { useExamCategories } from '@/services/categories';

const ICON_STYLES = [
  {
    iconBg: 'bg-blue-50 text-blue-600',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    iconBg: 'bg-amber-50 text-amber-600',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    iconBg: 'bg-purple-50 text-purple-600',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  { iconBg: 'bg-rose-50 text-rose-600', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
  { iconBg: 'bg-teal-50 text-teal-600', badgeColor: 'bg-teal-50 text-teal-700 border-teal-200' },
  {
    iconBg: 'bg-indigo-50 text-indigo-600',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-navy-100 animate-pulse flex flex-col gap-4">
      <div className="flex justify-between">
        <div className="h-12 w-12 rounded-2xl bg-gray-200" />
        <div className="h-6 w-24 rounded-full bg-gray-200" />
      </div>
      <div className="h-5 w-2/3 rounded bg-gray-200" />
      <div className="h-3 w-1/2 rounded bg-gray-100" />
      <div className="h-10 w-full rounded bg-gray-100" />
      <div className="h-9 w-full rounded-xl bg-gray-200 mt-auto" />
    </div>
  );
}

export default function CuratedExams() {
  const { categories, loading } = useExamCategories();
  const displayed = categories.filter((c) => !c.parent).slice(0, 6);

  return (
    <section className="py-20 bg-[#faf9f6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-amber-800 mb-2">
              Competitive Exam Hubs
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-extrabold text-navy-950 tracking-tight">
              What Are You Preparing For?
            </h2>
            <p className="text-base sm:text-lg text-navy-600 mt-2">
              Select your target exam to access dedicated video courses, mock test series, and free
              study notes.
            </p>
          </div>
          <Link
            to="/exams"
            className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-navy-950 hover:text-accent-600 transition-colors border-b-2 border-navy-200 hover:border-accent-600 pb-1 whitespace-nowrap self-start md:self-auto"
          >
            View All Exams <HiArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : displayed.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-[#faf9f6] rounded-3xl border border-navy-100">
              <h3 className="text-xl font-bold text-navy-900">No exams available</h3>
              <p className="text-navy-600 mt-2">Check back later for new exam hubs.</p>
            </div>
          ) : (
            displayed.map((exam, idx) => {
              const { iconBg, badgeColor } = ICON_STYLES[idx % ICON_STYLES.length];
              const iconText = exam.name.split(/\s+/)[0].slice(0, 3).toUpperCase();
              const badge = exam.latestStatus || 'Enroll Now';
              const courseCount = exam.courseCount || exam.coursesCount || 0;
              const testCount = exam.testCount || exam.testsCount || 0;

              return (
                <div
                  key={exam._id}
                  className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 border border-navy-100 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div
                        className={`h-12 w-12 rounded-2xl ${iconBg} flex items-center justify-center text-base font-black group-hover:scale-105 transition-transform`}
                      >
                        {exam.icon && !exam.icon.startsWith('http') ? (
                          <span className="text-xl">{exam.icon}</span>
                        ) : (
                          iconText
                        )}
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${badgeColor}`}
                      >
                        {badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-navy-950 mb-1 group-hover:text-accent-600 transition-colors font-display">
                      {exam.name}
                    </h3>
                    {exam.conductingBody && (
                      <p className="text-xs font-bold text-accent-600 mb-3">
                        {exam.conductingBody}
                      </p>
                    )}
                    {exam.description && (
                      <p className="text-xs text-navy-600 leading-relaxed mb-6 line-clamp-2">
                        {exam.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="pt-4 border-t border-navy-50 flex items-center justify-between text-xs font-semibold text-navy-500 mb-4">
                      <span className="flex items-center gap-1.5">
                        <HiBookOpen className="h-4 w-4 text-blue-500" />
                        {courseCount > 0
                          ? `${courseCount} Course${courseCount !== 1 ? 's' : ''}`
                          : 'Courses'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <HiClipboardList className="h-4 w-4 text-amber-500" />
                        {testCount > 0
                          ? `${testCount} Mock Test${testCount !== 1 ? 's' : ''}`
                          : 'Mock Tests'}
                      </span>
                    </div>
                    <Link
                      to={`/exams/${exam.slug}`}
                      className="w-full bg-navy-950 hover:bg-navy-900 group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-orange-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                    >
                      <span>Explore Exam</span>
                      <HiArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom View All */}
        <div className="mt-12 text-center">
          <Link
            to="/exams"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white hover:bg-navy-50 text-navy-950 border border-navy-200 hover:border-navy-300 rounded-full font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all"
          >
            View All Exams <HiArrowRight className="h-4 w-4 text-accent-500" />
          </Link>
        </div>
      </div>
    </section>
  );
}
