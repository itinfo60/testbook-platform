import { HiArrowDown } from 'react-icons/hi';
export default function FinalJourneyVisual() {
  const steps = [
    'Choose Your Exam',
    'Learn',
    'Practice',
    'Take Tests',
    'Know Your Weakness',
    'Improve',
  ];

  return (
    <section className="py-24 bg-[#faf9f6] flex flex-col items-center justify-center text-center">
      <div className="mb-12">
        <span className="text-xs font-bold text-navy-400 tracking-widest uppercase mb-2 block">
          You Start Here
        </span>
        <h3 className="text-3xl font-display font-bold text-navy-400">Confused</h3>
      </div>

      <div className="flex flex-col items-center gap-6 mb-12">
        {steps.map((step, idx) => (
          <div key={idx} className="flex flex-col items-center gap-6">
            <HiArrowDown className="text-navy-300 h-6 w-6" />
            <div className="bg-white px-8 py-3 rounded-full border border-navy-100 shadow-sm">
              <span className="font-bold text-navy-900 text-lg">{step}</span>
            </div>
          </div>
        ))}
        <HiArrowDown className="text-accent-300 h-6 w-6 mt-6" />
      </div>

      <div>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold text-navy-950 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-navy-950 to-accent-600">
          Walk Into the Exam Ready.
        </h2>
      </div>
    </section>
  );
}
