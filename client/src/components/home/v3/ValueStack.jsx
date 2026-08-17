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
    { icon: HiOutlineBookOpen, title: 'Learn', desc: 'Expert-led courses', color: 'text-blue-500' },
    {
      icon: HiOutlinePencilAlt,
      title: 'Practice',
      desc: 'Topic tests + PYQs',
      color: 'text-orange-500',
    },
    {
      icon: HiOutlineDesktopComputer,
      title: 'Simulate',
      desc: 'Real exam-style mocks',
      color: 'text-purple-500',
    },
    {
      icon: HiOutlineChartBar,
      title: 'Measure',
      desc: 'Rank + percentile + analytics',
      color: 'text-green-500',
    },
    {
      icon: HiOutlineTrendingUp,
      title: 'Improve',
      desc: 'Weak-area focused practice',
      color: 'text-red-500',
    },
    {
      icon: HiOutlineBadgeCheck,
      title: 'Prepare',
      desc: 'Build confidence for exam day',
      color: 'text-accent-500',
    },
  ];

  return (
    <section className="py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto mb-24">
          <h2 className="text-3xl md:text-5xl font-display font-extrabold text-navy-950 tracking-tight">
            Everything Your Preparation Needs.
            <br className="hidden md:block" />
            One Place.
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-16 gap-x-8">
          {pillars.map((pillar, idx) => (
            <div key={idx} className="flex flex-col items-center text-center group">
              <div
                className={`h-20 w-20 rounded-3xl bg-[#faf9f6] border border-navy-50 shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${pillar.color}`}
              >
                <pillar.icon className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold text-navy-950 mb-2">{pillar.title}</h3>
              <p className="text-navy-600 font-medium">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
