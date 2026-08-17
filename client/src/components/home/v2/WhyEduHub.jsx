import {
  HiOutlineAcademicCap,
  HiOutlineDesktopComputer,
  HiOutlineChartSquareBar,
  HiOutlinePencilAlt,
  HiOutlineArchive,
  HiOutlineUserGroup,
} from 'react-icons/hi';

export default function WhyEduHub() {
  const features = [
    {
      title: 'Exam-Specific Preparation',
      desc: 'No generic content. Preparation mapped to the actual syllabus.',
      icon: HiOutlineAcademicCap,
    },
    {
      title: 'Real Exam Simulation',
      desc: 'Timed full-length tests designed around actual exam patterns.',
      icon: HiOutlineDesktopComputer,
    },
    {
      title: 'State Rank & Percentile',
      desc: 'Know how your performance compares with other aspirants.',
      icon: HiOutlineChartSquareBar,
    },
    {
      title: 'Handwritten Notes',
      desc: 'Focused revision material instead of endless study PDFs.',
      icon: HiOutlinePencilAlt,
    },
    {
      title: 'Free PYQs & Resources',
      desc: 'Start preparing without paying. Access vast free library.',
      icon: HiOutlineArchive,
    },
    {
      title: 'Faculty Mentorship',
      desc: 'Guidance when concepts or strategy become difficult.',
      icon: HiOutlineUserGroup,
    },
  ];

  return (
    <section className="py-24 bg-navy-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-navy-900 tracking-tight">
            Everything You Need to Move From Preparation to Performance.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4"
            >
              <div className="h-14 w-14 bg-white border border-navy-100 shadow-sm rounded-2xl flex items-center justify-center shrink-0 text-accent-600">
                <feature.icon className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-navy-900 mb-2">{feature.title}</h3>
                <p className="text-navy-600">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
