import { HiLibrary, HiClipboardList, HiGift, HiUserGroup } from 'react-icons/hi';

export default function TrustStrip() {
  const stats = [
    { icon: HiLibrary, value: '11+', label: 'Exam Portals' },
    { icon: HiClipboardList, value: '6+', label: 'Mock Test Series' },
    { icon: HiGift, value: '5+', label: 'Free Resource Categories' },
    { icon: HiUserGroup, value: '25,000+', label: 'Active Learners' },
  ];

  return (
    <section className="py-12 bg-white border-b border-navy-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-8">
          <p className="text-sm font-semibold text-navy-400 uppercase tracking-widest mb-2">
            Built for serious aspirants
          </p>
          <h3 className="text-lg font-medium text-navy-900">Designed around the actual exam.</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center text-center p-4">
              <div className="h-12 w-12 rounded-full bg-navy-50 flex items-center justify-center mb-4 text-navy-600">
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-3xl font-display font-bold text-navy-900 mb-1">{stat.value}</p>
              <p className="text-sm font-medium text-navy-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
