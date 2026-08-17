import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { HiArrowRight, HiOutlineCalendar, HiOutlineClock } from 'react-icons/hi';
import { blogAPI } from '@/services/api';

const TYPE_COLORS = {
  article: 'bg-blue-100 text-blue-700',
  job_alert: 'bg-red-100 text-red-700',
  current_affairs: 'bg-purple-100 text-purple-700',
};
const TYPE_LABELS = {
  article: 'Article',
  job_alert: 'Job Alert',
  current_affairs: 'Current Affairs',
};

export default function EditorialArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blogAPI
      .getAll({ limit: 3, status: 'published', sort: '-publishedAt' })
      .then((res) => {
        const data = res.data?.data?.blogs || res.data?.blogs || res.data?.data || [];
        setArticles(Array.isArray(data) ? data.slice(0, 3) : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!loading && articles.length === 0) return null;

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

        {loading ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-64 bg-white rounded-xl animate-pulse border border-navy-100"
              />
            ))}
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {articles.map((article) => {
              const colorClass = TYPE_COLORS[article.type] || 'bg-gray-100 text-gray-700';
              const typeLabel = TYPE_LABELS[article.type] || article.type || 'Article';
              const date = article.publishedAt
                ? new Date(article.publishedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '';

              return (
                <article
                  key={article._id}
                  className="bg-white rounded-xl overflow-hidden border border-navy-100 shadow-sm hover:shadow-lg transition-all group flex flex-col h-full"
                >
                  <div className="p-6 md:p-8 flex flex-col h-full">
                    <div className="mb-4">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm ${colorClass}`}
                      >
                        {typeLabel}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-navy-900 mb-3 group-hover:text-accent-600 transition-colors leading-tight">
                      <Link to={`/blog/${article.slug || article._id}`}>{article.title}</Link>
                    </h3>

                    {article.excerpt && (
                      <p className="text-navy-600 mb-6 flex-grow line-clamp-3 leading-relaxed">
                        {article.excerpt}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs font-medium text-navy-400 pt-4 border-t border-navy-50 mt-auto">
                      {date && (
                        <div className="flex items-center gap-1">
                          <HiOutlineCalendar className="h-4 w-4" /> {date}
                        </div>
                      )}
                      {article.readTime && (
                        <div className="flex items-center gap-1">
                          <HiOutlineClock className="h-4 w-4" /> {article.readTime}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
