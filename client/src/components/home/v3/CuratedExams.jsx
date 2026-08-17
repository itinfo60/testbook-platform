import { HiArrowRight, HiBookOpen, HiClipboardList } from 'react-icons/hi';
import { Link } from 'react-router-dom';
export default function CuratedExams() {
  const exams = [
    {
      id: 'ras',
      name: 'RPSC RAS',
      subtitle: 'Prelims + Mains Complete Hub',
      badge: 'Target Batch 2026',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      desc: 'Rajasthan Administrative Service — Complete syllabus, standard PYQ papers, current affairs, and comprehensive test series.',
      coursesCount: 8,
      testsCount: 120,
      path: '/exams/rpsc-ras',
      iconText: 'RAS',
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      id: 'eo-ro',
      name: 'RPSC EO & RO',
      subtitle: 'Executive & Revenue Officers',
      badge: 'Revised Scheme',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      desc: 'Targeted preparation for Rajasthan Municipality Acts, Local Self Government rules, and general studies papers.',
      coursesCount: 5,
      testsCount: 55,
      path: '/exams/rpsc-eo-ro',
      iconText: 'EO',
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      id: 'si',
      name: 'RPSC SI',
      subtitle: 'Rajasthan Police Sub-Inspector',
      badge: 'New Vacancy',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      desc: 'Paper-I (General Hindi) & Paper-II (General Knowledge & Science) complete video classes and speed mock tests.',
      coursesCount: 6,
      testsCount: 75,
      path: '/exams/rpsc-si',
      iconText: 'SI',
      iconBg: 'bg-purple-50 text-purple-600',
    },
    {
      id: 'teacher',
      name: '1st & 2nd Grade Teacher',
      subtitle: 'School Lecturer & Sr. Teacher',
      badge: 'Dates Announced',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      desc: 'Educational Psychology, Rajasthan GK, Pedagogy, and Subject-wise (Political Science & Hindi) special modules.',
      coursesCount: 10,
      testsCount: 90,
      path: '/exams/rpsc-1st-2nd-grade',
      iconText: 'TR',
      iconBg: 'bg-rose-50 text-rose-600',
    },
    {
      id: 'cet',
      name: 'Rajasthan CET',
      subtitle: 'Graduation & 10+2 Levels',
      badge: 'Score Valid 1 Year',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      desc: 'Common Eligibility Test scheme — Rajasthan History, Art, Culture, Polity, Economy, Reasoning, and Hindi/English.',
      coursesCount: 7,
      testsCount: 65,
      path: '/exams/rajasthan-cet',
      iconText: 'CET',
      iconBg: 'bg-teal-50 text-teal-600',
    },
    {
      id: 'patwari',
      name: 'Patwari & VDO',
      subtitle: 'Revenue Board Recruitment',
      badge: 'Upcoming Exam',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      desc: 'Complete syllabus coverage for Revenue Patwari and Village Development Officer recruitment examinations.',
      coursesCount: 6,
      testsCount: 60,
      path: '/exams/patwari',
      iconText: 'PAT',
      iconBg: 'bg-indigo-50 text-indigo-600',
    },
  ];

  return (
    <section className="py-20 bg-[#faf9f6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-accent-600 mb-2">
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

        {/* 6 Compact Portal-Style Exam Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 border border-navy-100 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Card Top: Icon & Status Badge */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div
                    className={`h-12 w-12 rounded-2xl ${exam.iconBg} flex items-center justify-center text-base font-black group-hover:scale-105 transition-transform`}
                  >
                    {exam.iconText}
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${exam.badgeColor}`}
                  >
                    {exam.badge}
                  </span>
                </div>

                {/* Card Title & Subtitle */}
                <h3 className="text-xl font-bold text-navy-950 mb-1 group-hover:text-accent-600 transition-colors font-display">
                  {exam.name}
                </h3>
                <p className="text-xs font-bold text-accent-600 mb-3">{exam.subtitle}</p>

                {/* Description */}
                <p className="text-xs text-navy-600 leading-relaxed mb-6 line-clamp-2">
                  {exam.desc}
                </p>
              </div>

              <div>
                {/* Stats Strip */}
                <div className="pt-4 border-t border-navy-50 flex items-center justify-between text-xs font-semibold text-navy-500 mb-4">
                  <span className="flex items-center gap-1.5">
                    <HiBookOpen className="h-4 w-4 text-blue-500" /> Premium Courses
                  </span>
                  <span className="flex items-center gap-1.5">
                    <HiClipboardList className="h-4 w-4 text-amber-500" /> Mock Tests
                  </span>
                </div>

                {/* CTA Action Button */}
                <Link
                  to={exam.path}
                  className="w-full bg-navy-950 hover:bg-navy-900 group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-orange-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <span>Explore Exam</span>
                  <HiArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom View All Button */}
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
