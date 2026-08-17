import { HiBadgeCheck, HiOutlineUserCircle, HiTrendingUp } from 'react-icons/hi';

export default function SocialProof() {
  const testimonials = [
    {
      metric: '96.8 Percentile',
      metricColor: 'text-green-600',
      context: 'RAS Mock Test',
      name: 'Rahul S.',
      icon: HiBadgeCheck,
    },
    {
      metric: 'Top 500',
      metricColor: 'text-accent-600',
      context: 'RPSC Assistant Professor',
      name: 'Priya M.',
      icon: HiBadgeCheck,
    },
    {
      metric: '+21% Score',
      metricColor: 'text-blue-600',
      context: 'Improvement in EO & RO',
      name: 'Amit K.',
      icon: HiTrendingUp,
    },
  ];

  return (
    <section className="py-24 bg-white border-t border-navy-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full border-2 border-white bg-navy-100 flex items-center justify-center text-navy-400 text-xs"
                >
                  <HiOutlineUserCircle className="h-6 w-6" />
                </div>
              ))}
            </div>
            <span className="text-sm font-bold text-navy-900">25,000+ Aspirants</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-navy-900 tracking-tight">
            Your Competition Is Already Practicing.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-navy-50 rounded-2xl p-8 border border-navy-100 shadow-sm relative"
            >
              <t.icon className={`absolute top-6 right-6 h-8 w-8 opacity-10 ${t.metricColor}`} />
              <p className={`text-3xl font-display font-bold mb-2 ${t.metricColor}`}>{t.metric}</p>
              <p className="text-sm font-medium text-navy-500 mb-6">{t.context}</p>

              <div className="flex items-center gap-3 pt-6 border-t border-navy-100">
                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-navy-300 shadow-sm">
                  <HiOutlineUserCircle className="h-8 w-8" />
                </div>
                <p className="font-bold text-navy-900">{t.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
