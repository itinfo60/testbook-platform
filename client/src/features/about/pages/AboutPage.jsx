import { Link } from 'react-router-dom';
import {
  HiAcademicCap,
  HiBadgeCheck,
  HiUserGroup,
  HiShieldCheck,
  HiLightBulb,
  HiCheckCircle,
  HiArrowRight,
} from 'react-icons/hi';

export default function AboutPage() {
  return (
    <div className="bg-dark-50 dark:bg-dark-950 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-dark-900 dark:text-dark-100">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-xs bg-amber-50 dark:bg-amber-950 px-3 py-1 rounded-full mb-3">
            <HiAcademicCap className="h-4 w-4" /> About EduHub
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display">
            Rajasthan’s Premier RPSC & Political Science Academy
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg mt-3 leading-relaxed">
            Empowering competitive exam aspirants across Rajasthan and India with high-quality,
            targeted study resources, expert faculty lectures, and proctored mock test series.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-dark-900 rounded-3xl p-8 shadow-md border border-slate-200 dark:border-dark-800">
            <div className="h-12 w-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center text-2xl mb-4 font-bold">
              🎯
            </div>
            <h2 className="text-2xl font-extrabold mb-2">Our Mission</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              To democratize top-tier competitive exam coaching for RPSC RAS, EO/RO, Teachers, and
              Political Science Higher Education exams. We strive to provide transparent,
              affordable, and result-oriented learning materials to every student regardless of
              location.
            </p>
          </div>

          <div className="bg-white dark:bg-dark-900 rounded-3xl p-8 shadow-md border border-slate-200 dark:border-dark-800">
            <div className="h-12 w-12 bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-4 font-bold">
              🔭
            </div>
            <h2 className="text-2xl font-extrabold mb-2">Our Vision</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              To be the most trusted and specialized competitive exam ecosystem in Rajasthan and
              Political Science studies, setting new benchmarks in accuracy, comprehensive PYQ
              analysis, and student success rates.
            </p>
          </div>
        </div>

        {/* Why EduHub */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-amber-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-center mb-8">
            Why Choose EduHub?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                title: 'Subject Specialists',
                desc: 'Led by experienced Assistant Professors and RPSC toppers with deep domain expertise in Political Science and Rajasthan GK.',
                icon: '👨‍🏫',
              },
              {
                title: 'Watermarked Premium Notes',
                desc: 'Clear, concise, and authentic handwritten notes crafted specifically for RPSC RAS Mains and Objective exams.',
                icon: '📑',
              },
              {
                title: 'Proctored Smart Tests',
                desc: 'Real exam-like test environment with negative marking, state rank prediction, and bilingual detailed solutions.',
                icon: '📊',
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white/10 rounded-2xl p-6 border border-white/10">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-bold mb-2 text-amber-300">{item.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
