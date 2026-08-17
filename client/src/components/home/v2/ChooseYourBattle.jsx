import { Link } from 'react-router-dom';
import {
  HiAcademicCap,
  HiArrowRight,
  HiIdentification,
  HiLibrary,
  HiMap,
  HiOfficeBuilding,
  HiShieldCheck,
} from 'react-icons/hi';

export default function ChooseYourBattle() {
  const exams = [
    {
      id: 'ras',
      name: 'RAS — Prelims & Mains',
      badge: 'Notification Expected Soon',
      badgeColor: 'bg-accent-100 text-accent-700 border-accent-200',
      desc: 'Complete preparation for Rajasthan Administrative Service RAS Prelims & Mains conducted by RPSC.',
      tests: '56+ Tests',
      icon: HiAcademicCap,
      path: '/exams/ras',
      cta: 'Explore RAS',
    },
    {
      id: 'eo-ro',
      name: 'RPSC EO & RO',
      badge: 'Revised Syllabus Published',
      badgeColor: 'bg-green-100 text-green-700 border-green-200',
      desc: 'Dedicated preparation for Revenue Officer Grade II and Executive Officer Grade IV.',
      tests: '55+ Tests',
      icon: HiOfficeBuilding,
      path: '/exams/rpsc-eo-ro',
      cta: 'Explore EO & RO',
    },
    {
      id: 'si',
      name: 'RPSC SI',
      badge: 'Physical Test Completed',
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
      desc: 'Complete course and test preparation for Rajasthan Police Sub Inspector examination.',
      tests: '55+ Tests',
      icon: HiShieldCheck,
      path: '/exams/rpsc-si',
      cta: 'Explore SI',
    },
    {
      id: 'teacher',
      name: '1st & 2nd Grade Teacher',
      badge: 'Application Window Announced',
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
      desc: 'Preparation for RPSC School Lecturer and Senior Teacher competitive examinations.',
      tests: '55+ Tests',
      icon: HiLibrary,
      path: '/exams/rpsc-1st-2nd-grade',
      cta: 'Explore Teacher Exams',
    },
    {
      id: 'cet',
      name: 'Rajasthan CET',
      badge: 'Scorecard Valid for 1 Year',
      badgeColor: 'bg-navy-100 text-navy-700 border-navy-200',
      desc: 'Preparation for Rajasthan CET Graduation and 10+2 levels.',
      tests: '55+ Tests',
      icon: HiIdentification,
      path: '/exams/rajasthan-cet',
      cta: 'Explore CET',
    },
    {
      id: 'patwari',
      name: 'Patwari',
      badge: 'New Vacancy Announcement Soon',
      badgeColor: 'bg-orange-100 text-orange-700 border-orange-200',
      desc: 'Targeted preparation for Rajasthan Revenue Board Patwari recruitment examination.',
      tests: '55+ Tests',
      icon: HiMap,
      path: '/exams/patwari',
      cta: 'Explore Patwari',
    },
  ];

  return (
    <section className="py-20 bg-navy-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 md:flex md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-navy-900 mb-4 tracking-tight">
              Choose Your Battle
            </h2>
            <p className="text-lg text-navy-600">
              One platform. Every major Rajasthan competitive exam.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              to="/exams"
              className="inline-flex items-center gap-1 font-semibold text-accent-600 hover:text-accent-700 group transition-colors"
            >
              View All Exams{' '}
              <HiArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-2xl p-6 border border-navy-100 shadow-sm hover:shadow-xl hover:shadow-navy-900/5 hover:-translate-y-1 transition-all flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-navy-50 flex items-center justify-center text-navy-700 border border-navy-100">
                  <exam.icon className="h-6 w-6" />
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full border ${exam.badgeColor}`}
                >
                  {exam.badge}
                </span>
              </div>

              <h3 className="text-xl font-bold text-navy-900 mb-2">{exam.name}</h3>
              <p className="text-sm text-navy-600 mb-6 flex-grow">{exam.desc}</p>

              <div className="flex items-center justify-between pt-4 border-t border-navy-50 mt-auto">
                <span className="text-sm font-medium text-navy-500 bg-navy-50 px-2.5 py-1 rounded">
                  {exam.tests}
                </span>
                <Link
                  to={exam.path}
                  className="inline-flex items-center gap-1 text-sm font-bold text-navy-900 hover:text-accent-600 group transition-colors"
                >
                  {exam.cta}{' '}
                  <HiArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
