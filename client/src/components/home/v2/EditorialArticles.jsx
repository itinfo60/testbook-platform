import { Link } from 'react-router-dom';
import { HiArrowRight, HiOutlineCalendar, HiOutlineClock } from 'react-icons/hi';

export default function EditorialArticles() {
  const articles = [
    {
      id: 1,
      category: 'Current Affairs',
      title: 'Rajasthan Budget 2026–27: Major Schemes for Competitive Exams',
      desc: 'A complete breakdown of the latest state budget from an exam perspective. Learn which schemes are most likely to appear in RAS and Teacher exams.',
      date: 'Aug 15, 2026',
      readTime: '6 min read',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      id: 2,
      category: 'Job Alert',
      title: 'RSMSSB Patwari 5546 Vacancy Notification 2026 Released',
      desc: 'Official notification details, age limit, syllabus changes and complete exam pattern for the upcoming Patwari recruitment.',
      date: 'Aug 12, 2026',
      readTime: '3 min read',
      color: 'bg-red-100 text-red-700',
    },
    {
      id: 3,
      category: 'Strategy',
      title: 'How to Score 120+ Marks in RPSC Assistant Professor Political Science Paper 1',
      desc: 'A definitive guide by selected candidates on tackling the vast syllabus of Political Science Paper 1 with targeted resources and PYQ analysis.',
      date: 'Aug 08, 2026',
      readTime: '8 min read',
      color: 'bg-purple-100 text-purple-700',
    },
  ];

  return (
    <section className="py-24 bg-navy-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 md:flex md:items-end md:justify-between border-b border-navy-200 pb-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-navy-900 tracking-tight">
              Know What Changed. Know What Matters.
            </h2>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              to="/blog"
              className="inline-flex items-center gap-1 font-semibold text-accent-600 hover:text-accent-700 group transition-colors"
            >
              View All Articles{' '}
              <HiArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <article
              key={article.id}
              className="bg-white rounded-xl overflow-hidden border border-navy-100 shadow-sm hover:shadow-lg transition-all group flex flex-col h-full"
            >
              <div className="p-6 md:p-8 flex flex-col h-full">
                <div className="mb-4">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm ${article.color}`}
                  >
                    {article.category}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-navy-900 mb-3 group-hover:text-accent-600 transition-colors leading-tight">
                  <Link to="/blog" className="before:absolute before:inset-0 relative">
                    {article.title}
                  </Link>
                </h3>

                <p className="text-navy-600 mb-6 flex-grow line-clamp-3 leading-relaxed">
                  {article.desc}
                </p>

                <div className="flex items-center justify-between text-xs font-medium text-navy-400 pt-4 border-t border-navy-50 mt-auto">
                  <div className="flex items-center gap-1">
                    <HiOutlineCalendar className="h-4 w-4" /> {article.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <HiOutlineClock className="h-4 w-4" /> {article.readTime}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
