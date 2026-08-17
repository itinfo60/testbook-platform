import {
  HiOutlineSearchCircle,
  HiOutlineBookOpen,
  HiOutlineClipboardList,
  HiOutlineChartBar,
  HiOutlineTrendingUp,
} from 'react-icons/hi';

export default function PreparationPath() {
  const steps = [
    {
      num: '01',
      title: 'Choose Exam',
      desc: 'Select your target examination.',
      icon: HiOutlineSearchCircle,
    },
    {
      num: '02',
      title: 'Build Foundation',
      desc: 'Watch structured classes and use handwritten notes.',
      icon: HiOutlineBookOpen,
    },
    {
      num: '03',
      title: 'Train',
      desc: 'Complete topic tests and PYQs.',
      icon: HiOutlineClipboardList,
    },
    {
      num: '04',
      title: 'Simulate',
      desc: 'Take full-length mocks and track percentile/rank.',
      icon: HiOutlineChartBar,
    },
    {
      num: '05',
      title: 'Improve',
      desc: 'Identify weak topics and repeat.',
      icon: HiOutlineTrendingUp,
    },
  ];

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-1/2 left-0 right-0 h-px bg-navy-100 hidden lg:block -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-navy-900 tracking-tight">
            Your Preparation, Mapped.
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row justify-between relative">
          {steps.map((step, idx) => (
            <div
              key={step.num}
              className="flex-1 flex flex-row lg:flex-col items-center lg:text-center gap-6 lg:gap-4 relative mb-12 lg:mb-0 group"
            >
              {/* Connector line for mobile */}
              {idx !== steps.length - 1 && (
                <div className="absolute left-8 top-16 bottom-[-3rem] w-px bg-navy-100 lg:hidden" />
              )}

              <div className="h-16 w-16 bg-white border-[3px] border-navy-100 rounded-full flex items-center justify-center text-navy-400 group-hover:border-accent-500 group-hover:text-accent-500 group-hover:shadow-lg group-hover:shadow-accent-500/20 transition-all relative z-10 shrink-0">
                <step.icon className="h-7 w-7" />
              </div>

              <div>
                <span className="text-xs font-bold text-accent-500 mb-1 block">
                  Step {step.num}
                </span>
                <h3 className="text-lg font-bold text-navy-900 mb-2">{step.title}</h3>
                <p className="text-sm text-navy-600 max-w-[200px] mx-auto">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
