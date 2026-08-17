import { Link } from 'react-router-dom';
import {
  HiClipboardList,
  HiDocumentText,
  HiFire,
  HiStar,
  HiUserGroup,
  HiVideoCamera,
} from 'react-icons/hi';

export default function TargetBatches() {
  const batches = [
    {
      id: 1,
      tag: 'RAS Prelims & Mains',
      isPopular: true,
      title: 'RAS Prelims 2026 Complete GS Crash Course',
      rating: 4.8,
      students: '120+',
      features: [
        { icon: HiVideoCamera, text: 'HD Live & Recorded Lectures' },
        { icon: HiDocumentText, text: 'Downloadable Handwritten PDF Notes' },
        { icon: HiClipboardList, text: 'Topic-Wise Practice Tests' },
        { icon: HiUserGroup, text: 'Faculty Mentorship' },
      ],
      price: '₹4,999',
      oldPrice: '₹9,999',
      path: '/courses',
    },
    {
      id: 2,
      tag: 'Patwari',
      isPopular: false,
      title: 'Target Patwari Special Foundation Batch 2026',
      rating: 4.7,
      students: '450+',
      features: [
        { icon: HiVideoCamera, text: 'Bilingual Live Classes' },
        { icon: HiDocumentText, text: 'Printable Class Notes' },
        { icon: HiClipboardList, text: 'Weekly Mock Tests' },
      ],
      price: '₹2,999',
      oldPrice: '₹5,999',
      path: '/courses',
    },
    {
      id: 3,
      tag: 'RPSC EO & RO',
      isPopular: true,
      title: 'RPSC EO & RO Part-B Special Batch (Municipalities Act)',
      rating: 4.9,
      students: '800+',
      features: [
        { icon: HiVideoCamera, text: 'Bare Act Detailed Analysis' },
        { icon: HiDocumentText, text: 'Simplified Summary Notes' },
        { icon: HiClipboardList, text: 'Section-wise MCQ Practice' },
      ],
      price: '₹1,999',
      oldPrice: '₹3,999',
      path: '/courses',
    },
    {
      id: 4,
      tag: 'Assistant Professor',
      isPopular: false,
      title: 'RPSC Assistant Professor Political Science — Paper 1 & 2 Special',
      rating: 4.9,
      students: '200+',
      features: [
        { icon: HiVideoCamera, text: 'Complete UGC NET/RPSC Level Coverage' },
        { icon: HiDocumentText, text: 'Advanced Political Theory Notes' },
        { icon: HiClipboardList, text: 'PYQ Detailed Solutions' },
        { icon: HiUserGroup, text: '1-on-1 Strategy Calls' },
      ],
      price: '₹7,999',
      oldPrice: '₹14,999',
      path: '/courses',
    },
  ];

  return (
    <section className="py-24 bg-white relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-navy-200 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-navy-900 mb-4 tracking-tight">
            Don't Study Alone. Study With a System.
          </h2>
          <p className="text-lg text-navy-600">
            Live classes, structured notes, practice tests and faculty guidance — organized around
            your exam timeline.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className={`bg-white rounded-2xl border ${batch.isPopular ? 'border-accent-400 shadow-xl shadow-accent-500/10 relative' : 'border-navy-100 shadow-lg shadow-navy-900/5'} overflow-hidden flex flex-col`}
            >
              {batch.isPopular && (
                <div className="bg-accent-500 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 text-center flex items-center justify-center gap-1">
                  <HiFire className="h-4 w-4" /> High Demand
                </div>
              )}

              <div className="p-6 flex flex-col flex-grow">
                <span className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-3 block">
                  {batch.tag}
                </span>
                <h3 className="text-xl font-bold text-navy-900 leading-tight mb-3 min-h-[56px]">
                  {batch.title}
                </h3>

                <div className="flex items-center gap-1 mb-6 pb-6 border-b border-navy-50">
                  <HiStar className="text-yellow-400 h-5 w-5" />
                  <span className="text-sm font-bold text-navy-900">{batch.rating}</span>
                  <span className="text-sm text-navy-500">({batch.students} Aspirants)</span>
                </div>

                <div className="space-y-4 mb-8 flex-grow">
                  <p className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                    Includes:
                  </p>
                  {batch.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 bg-navy-50 text-navy-600 p-1.5 rounded-md">
                        <feature.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-navy-700 leading-snug">{feature.text}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto">
                  <div className="flex items-end gap-2 mb-4">
                    <span className="text-2xl font-bold text-navy-900">{batch.price}</span>
                    <span className="text-sm text-navy-400 line-through mb-1">
                      {batch.oldPrice}
                    </span>
                  </div>

                  <Link
                    to={batch.path}
                    className={`block w-full text-center py-3 rounded-xl font-semibold transition-all ${
                      batch.isPopular
                        ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20 hover:bg-accent-600'
                        : 'bg-navy-900 text-white hover:bg-navy-800'
                    }`}
                  >
                    Enroll Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
