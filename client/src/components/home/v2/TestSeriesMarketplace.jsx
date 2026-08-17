import { Link } from 'react-router-dom';
import { useState } from 'react';
import { HiArrowRight, HiClipboardList } from 'react-icons/hi';

export default function TestSeriesMarketplace() {
  const [activeTab, setActiveTab] = useState('All');

  const tabs = ['All', 'RAS', 'Teacher', 'Assistant Professor', 'Patwari', 'EO/RO', 'CET'];

  const testSeries = [
    {
      id: 1,
      category: 'PGT / 1st Grade',
      isFree: true,
      title: 'Chapter & Topic Practice Series',
      desc: 'Topic-wise practice questions covering the complete syllabus for PGT and 1st Grade Teacher exams.',
      tests: '18 Tests',
      price: 'Free Included',
      tag: 'Teacher',
    },
    {
      id: 2,
      category: 'PGT / 1st Grade',
      isFree: false,
      title: 'Subject-Wise Target Test Series',
      desc: 'Targeted tests focusing on core subjects with detailed explanations and state-level rankings.',
      tests: '12 Tests',
      price: '₹199',
      tag: 'Teacher',
    },
    {
      id: 3,
      category: 'PGT / 1st Grade',
      isFree: false,
      title: 'Official Previous Year Papers Series',
      desc: 'Authentic previous year question papers mapped to the latest exam pattern.',
      tests: '10 Tests',
      price: '₹499',
      tag: 'Teacher',
    },
    {
      id: 4,
      category: 'PGT / 1st Grade',
      isFree: false,
      title: 'Full Length Mock Test Series 2026',
      desc: 'Proctored full-length mock tests simulating the exact exam environment.',
      tests: '15 Tests',
      price: '₹499',
      tag: 'Teacher',
    },
    {
      id: 5,
      category: 'Assistant Professor — MPPSC',
      isFree: true,
      title: 'Chapter & Topic Practice Series',
      desc: 'Topic-by-topic coverage for Political Science Assistant Professor exam.',
      tests: '20 Tests',
      price: 'Free',
      tag: 'Assistant Professor',
    },
    {
      id: 6,
      category: 'Assistant Professor — MPPSC',
      isFree: false,
      title: 'Subject-Wise Target Test Series',
      desc: 'Advanced level questions designed by subject experts for MPPSC pattern.',
      tests: '15 Tests',
      price: '₹199',
      tag: 'Assistant Professor',
    },
  ];

  const filtered = activeTab === 'All' ? testSeries : testSeries.filter((t) => t.tag === activeTab);

  return (
    <section className="py-20 bg-navy-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-navy-900 mb-4 tracking-tight">
            Train Topic by Topic. Then Test Yourself at Full Strength.
          </h2>
        </div>

        {/* Filter Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-12 justify-center pb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                activeTab === tab
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'bg-white text-navy-600 border border-navy-200 hover:bg-navy-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((series) => (
            <div
              key={series.id}
              className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col h-full"
            >
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider">
                    {series.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${series.isFree ? 'bg-green-100 text-green-700' : 'bg-navy-100 text-navy-700'}`}
                  >
                    {series.isFree ? 'Free' : 'Premium'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-2 leading-tight">
                  {series.title}
                </h3>
                <p className="text-sm text-navy-600 mb-6 flex-grow">{series.desc}</p>

                <div className="flex items-center gap-2 text-sm font-medium text-navy-700 mb-6 bg-navy-50 w-fit px-3 py-1.5 rounded-md">
                  <HiClipboardList className="text-navy-400" /> {series.tests}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-navy-100 mt-auto">
                  <div>
                    <p className="text-lg font-bold text-navy-900">{series.price}</p>
                  </div>
                  <Link
                    to="/tests"
                    className="text-sm font-semibold text-white bg-accent-600 hover:bg-accent-700 px-4 py-2 rounded transition-colors flex items-center gap-1"
                  >
                    Start Series <HiArrowRight className="h-4 w-4" />
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
