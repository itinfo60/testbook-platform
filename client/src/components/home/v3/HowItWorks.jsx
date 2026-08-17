export default function HowItWorks() {
  const stages = [
    {
      num: '01',
      title: 'Choose Your Exam',
      desc: 'Find your exam and understand exactly what you need.',
    },
    {
      num: '02',
      title: 'Learn',
      desc: 'Follow structured courses with expert faculty and focused notes.',
    },
    {
      num: '03',
      title: 'Practice',
      desc: 'Strengthen every topic through quizzes, PYQs and targeted tests.',
    },
    {
      num: '04',
      title: 'Measure',
      desc: 'Take realistic mock tests and see your rank, percentile, accuracy and speed.',
    },
    { num: '05', title: 'Improve', desc: 'Identify weak areas, revise and test again.' },
  ];

  return (
    <section className="py-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-extrabold text-navy-950 tracking-tight">
            One Goal. A Clearer Way to Get There.
          </h2>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Continuous curved line for desktop */}
          <svg
            className="absolute top-0 left-[28px] md:left-1/2 md:-translate-x-1/2 w-8 md:w-full h-full -z-10 text-navy-100"
            viewBox="0 0 1000 800"
            preserveAspectRatio="none"
          >
            <path
              d="M 500,0 Q 600,100 500,200 T 500,400 T 500,600 T 500,800"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray="8 8"
              className="md:block hidden animate-draw-line"
            />
            <line
              x1="16"
              y1="0"
              x2="16"
              y2="100%"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="4 4"
              className="md:hidden"
            />
          </svg>

          <div className="space-y-12 md:space-y-0 relative">
            {stages.map((stage, idx) => (
              <div
                key={idx}
                className={`flex flex-col md:flex-row items-start md:items-center relative ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} md:mb-16`}
              >
                {/* Content Side */}
                <div
                  className={`w-full md:w-1/2 pl-16 md:pl-0 ${idx % 2 === 0 ? 'md:pr-20 md:text-right' : 'md:pl-20 md:text-left'}`}
                >
                  <span className="text-sm font-bold text-accent-500 mb-2 block tracking-widest uppercase">
                    Stage {stage.num}
                  </span>
                  <h3 className="text-2xl font-bold text-navy-900 mb-3">{stage.title}</h3>
                  <p className="text-navy-600 leading-relaxed text-lg">{stage.desc}</p>
                </div>

                {/* Center Node */}
                <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 top-0 md:top-1/2 md:-translate-y-1/2 h-14 w-14 rounded-full bg-white border-4 border-navy-100 flex items-center justify-center font-bold text-navy-400 group-hover:border-accent-500 transition-colors z-10 shadow-sm mt-1 md:mt-0">
                  {stage.num}
                </div>

                {/* Empty side for layout balance */}
                <div className="hidden md:block md:w-1/2"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-24 text-center">
          <div className="inline-block bg-navy-50 border border-navy-100 rounded-full px-6 py-3 shadow-sm">
            <p className="text-navy-800 font-semibold flex items-center gap-2 text-sm sm:text-base">
              Your preparation becomes a loop —
              <span className="text-accent-600">
                Learn &rarr; Practice &rarr; Measure &rarr; Improve.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
