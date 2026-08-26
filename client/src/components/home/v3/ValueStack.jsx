import { Link } from 'react-router-dom';
import {
  HiOutlineBookOpen,
  HiOutlinePencilAlt,
  HiOutlineDesktopComputer,
  HiOutlineChartBar,
  HiOutlineTrendingUp,
  HiOutlineBadgeCheck,
} from 'react-icons/hi';

export default function ValueStack() {
  const pillars = [
    {
      icon: HiOutlineBookOpen,
      title: 'Learn',
      desc: 'Expert-led courses',
      color: 'text-blue-500',
      href: '/courses',
    },
    {
      icon: HiOutlinePencilAlt,
      title: 'Practice',
      desc: 'Topic tests + PYQs',
      color: 'text-orange-500',
      href: '/tests',
    },
    {
      icon: HiOutlineDesktopComputer,
      title: 'Simulate',
      desc: 'Real exam-style mocks',
      color: 'text-purple-500',
      href: '/tests',
    },
    {
      icon: HiOutlineChartBar,
      title: 'Measure',
      desc: 'Rank + percentile + analytics',
      color: 'text-green-500',
      href: '/tests',
    },
    {
      icon: HiOutlineTrendingUp,
      title: 'Improve',
      desc: 'Weak-area focused practice',
      color: 'text-red-500',
      href: '/daily-quiz',
    },
    {
      icon: HiOutlineBadgeCheck,
      title: 'Prepare',
      desc: 'Build confidence for exam day',
      color: 'text-accent-500',
      href: '/exams',
    },
  ];

  return (
    <section className="py-24 sm:py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto mb-16 sm:mb-24">
          <h2 className="text-3xl md:text-5xl font-display font-extrabold text-navy-950 tracking-tight">
            Everything Your Preparation Needs.
            <br className="hidden md:block" />
            One Place.
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-12 sm:gap-y-16 gap-x-6 sm:gap-x-8">
          {pillars.map((pillar, idx) => (
            <Link
              key={idx}
              to={pillar.href}
              className="flex flex-col items-center text-center group cursor-pointer p-4 rounded-3xl hover:bg-slate-50 transition-colors"
            >
              <div
                className={`h-16 w-16 sm:h-20 sm:w-20 rounded-3xl bg-[#faf9f6] border border-navy-50 shadow-sm flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:shadow-md transition-all ${pillar.color}`}
              >
                <pillar.icon className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-navy-950 mb-1 sm:mb-2 group-hover:text-accent-600 transition-colors">
                {pillar.title}
              </h3>
              <p className="text-xs sm:text-sm text-navy-600 font-medium">{pillar.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
