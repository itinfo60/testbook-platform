import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { blogAPI } from '@/services/api';
import { HiArrowRight } from 'react-icons/hi';

export default function CuratedArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await blogAPI.getAll({ limit: 3 });
        if (Array.isArray(response.data?.data)) {
          const mapped = response.data.data.map((b) => ({
            id: b._id,
            slug: b.slug,
            title: b.title,
            tag: b.type === 'job_alert' ? 'Job Alert' : 'Strategy',
          }));
          setArticles(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch articles', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  return (
    <section className="py-24 bg-[#faf9f6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-extrabold text-navy-950 tracking-tight mb-4">
            Stay Ahead of the Exam
          </h2>
        </div>

        {articles.length === 0 && !loading ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-navy-100">
            <h3 className="text-xl font-bold text-navy-900">No articles available</h3>
            <p className="text-navy-600 mt-2">
              Check back later for the latest exam strategies and job alerts.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/blog/${article.slug}`}
                className="group bg-white rounded-3xl p-8 border border-navy-100 shadow-sm hover:shadow-xl hover:shadow-navy-900/5 hover:-translate-y-1 transition-all flex flex-col justify-between min-h-[200px]"
              >
                <div>
                  <span className="inline-block text-[10px] font-bold text-accent-600 uppercase tracking-wider mb-4 bg-accent-50 px-2 py-1 rounded">
                    {article.tag}
                  </span>
                  <h3 className="text-xl font-bold text-navy-950 leading-snug group-hover:text-accent-600 transition-colors">
                    {article.title}
                  </h3>
                </div>
                <div className="mt-8 text-accent-500 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all">
                  <HiArrowRight className="h-6 w-6" />
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 text-center md:text-left">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-lg font-bold text-navy-950 hover:text-accent-600 transition-colors border-b-2 border-navy-200 hover:border-accent-600 pb-1"
          >
            View All Articles <HiArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
