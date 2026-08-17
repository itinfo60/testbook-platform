import SeoHead from '@/components/SeoHead';
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '@/services/api';
import {
  HiBell,
  HiTrendingUp,
  HiPencilAlt,
  HiSearch,
  HiArrowRight,
  HiCalendar,
  HiExternalLink,
  HiNewspaper,
} from 'react-icons/hi';

const TABS = [
  { id: 'all', label: '📰 All Posts', type: null },
  { id: 'job_alert', label: '🔔 Job Notifications', type: 'job_alert' },
  { id: 'article', label: '📈 Preparation Strategies', type: 'article' },
  { id: 'current_affairs', label: '🖋️ Subject Discussions', type: 'current_affairs' },
];

function BlogCard({ blog }) {
  const typeConfig = {
    job_alert: {
      bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      label: 'Job Alert',
    },
    article: {
      bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      label: 'Strategy',
    },
    current_affairs: {
      bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      label: 'Discussion',
    },
  };
  const cfg = typeConfig[blog.type] || { bg: 'bg-slate-100 text-slate-700', label: 'Article' };

  return (
    <Link
      to={`/blog/${blog.slug}`}
      className="group bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-800 hover:border-amber-500 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col"
    >
      {/* Cover Image */}
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-dark-800 dark:to-dark-700 shrink-0">
        {blog.coverImage?.url ? (
          <img
            src={blog.coverImage.url}
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : null}
        {/* Gradient overlay & type icon */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${
            blog.type === 'job_alert'
              ? 'from-red-500/80 to-rose-700/80'
              : blog.type === 'current_affairs'
                ? 'from-purple-500/80 to-violet-700/80'
                : 'from-blue-500/80 to-indigo-700/80'
          } opacity-${blog.coverImage?.url ? '0' : '90'}`}
        />
        <div className="absolute top-3 left-3">
          <span
            className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
              blog.type === 'job_alert'
                ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800'
                : blog.type === 'current_affairs'
                  ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300'
                  : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300'
            }`}
          >
            {blog.type === 'job_alert'
              ? '📢 Job Alert'
              : blog.type === 'current_affairs'
                ? '📌 Current Affairs'
                : '📰 Article'}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        {blog.examCategory?.name && (
          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full self-start mb-2">
            🎯 {blog.examCategory.name}
          </span>
        )}

        <h3 className="text-base font-extrabold text-dark-900 dark:text-white mb-2 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          {blog.title}
        </h3>

        {blog.excerpt && (
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
            {blog.excerpt}
          </p>
        )}

        {/* Job alert details */}
        {blog.type === 'job_alert' && blog.jobAlert && (
          <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
            {blog.jobAlert.totalVacancies && (
              <div className="bg-slate-50 dark:bg-dark-800 rounded-lg p-2">
                <p className="text-slate-500 mb-0.5">Vacancies</p>
                <p className="font-bold text-dark-900 dark:text-white">
                  {blog.jobAlert.totalVacancies}
                </p>
              </div>
            )}
            {blog.jobAlert.applicationEnd && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                <p className="text-red-500 mb-0.5">Last Date</p>
                <p className="font-bold text-red-700 dark:text-red-400 text-[11px]">
                  {new Date(blog.jobAlert.applicationEnd).toLocaleDateString('en-IN')}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <HiCalendar className="h-3.5 w-3.5" />
            {blog.publishedAt
              ? new Date(blog.publishedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : ''}
          </span>
          <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
            {blog.type === 'job_alert' ? 'View Details' : 'Read More'}{' '}
            <HiArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function BlogList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('type') || 'all');
  const [search, setSearch] = useState('');
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const paramType = searchParams.get('type');
    if (paramType && paramType !== activeTab) {
      setActiveTab(paramType);
    } else if (!paramType && activeTab !== 'all') {
      setActiveTab('all');
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const tab = TABS.find((t) => t.id === activeTab);
        const params = { status: 'published', limit: 50 };
        if (tab?.type) params.type = tab.type;
        const res = await api.get('/blogs', { params });
        const data = res.data?.data?.blogs || res.data?.data || res.data?.blogs || [];
        setBlogs(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, [activeTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const p = new URLSearchParams(searchParams);
    if (tabId === 'all') p.delete('type');
    else p.set('type', tabId);
    setSearchParams(p);
  };

  const filteredBlogs = blogs.filter(
    (b) =>
      (!search ||
        `${b.title} ${b.excerpt || ''} ${b.content || ''}`
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (activeTab === 'all' || b.type === activeTab)
  );

  return (
    <div className="min-h-screen bg-dark-25 dark:bg-dark-950 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SeoHead
          title="Blog, Job Alerts & Preparation Strategies"
          description="Latest RPSC job alerts, RAS preparation strategies, current affairs, and Political Science subject discussions."
          type="website"
        />
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider text-xs bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full mb-3">
            <HiNewspaper className="h-4 w-4" /> Blog & Job Alerts
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-dark-900 dark:text-white mb-3 font-display">
            Updates, Strategies & <span className="text-amber-800">Job Alerts</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            Latest RPSC recruitment notices, admit cards, topper strategies, and Political Science
            subject discussions.
          </p>
        </div>

        {/* Search + Tabs */}
        <div className="bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-800 p-4 sm:p-5 mb-8 flex flex-col sm:flex-row gap-4 items-center">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-amber-800 text-white shadow-md'
                    : 'bg-slate-50 dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 hover:text-amber-600 border border-slate-200 dark:border-dark-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative w-full sm:max-w-xs sm:ml-auto">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-b-transparent" />
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-500 font-semibold">{error}</div>
        ) : filteredBlogs.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-dark-900 rounded-3xl border border-dashed border-slate-200 dark:border-dark-800">
            <HiSearch className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-2">No posts found</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Try a different filter or search.
            </p>
            <button
              onClick={() => {
                setActiveTab('all');
                setSearch('');
              }}
              className="text-amber-600 font-bold hover:underline"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Featured Article */}
            {activeTab === 'all' &&
              filteredBlogs.length > 0 &&
              filteredBlogs[0].type !== 'job_alert' && (
                <Link
                  to={`/blog/${filteredBlogs[0].slug}`}
                  className="group block bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-800 hover:border-amber-400 shadow-sm hover:shadow-xl transition-all overflow-hidden mb-2"
                >
                  <div className="flex flex-col lg:flex-row">
                    <div className="lg:w-1/2 h-52 lg:h-auto bg-gradient-to-br from-blue-500 to-indigo-700 relative overflow-hidden flex-shrink-0">
                      {filteredBlogs[0].coverImage?.url && (
                        <img
                          src={filteredBlogs[0].coverImage.url}
                          alt={filteredBlogs[0].title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      <span className="absolute top-4 left-4 bg-amber-800 text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full">
                        ⭐ Featured
                      </span>
                    </div>
                    <div className="p-6 lg:p-8 flex flex-col justify-center lg:w-1/2">
                      {filteredBlogs[0].examCategory?.name && (
                        <span className="text-xs font-bold text-amber-600 mb-2 inline-block">
                          🎯 {filteredBlogs[0].examCategory.name}
                        </span>
                      )}
                      <h2 className="text-xl lg:text-2xl font-extrabold text-dark-900 dark:text-white mb-3 group-hover:text-amber-600 transition-colors line-clamp-3">
                        {filteredBlogs[0].title}
                      </h2>
                      {filteredBlogs[0].excerpt && (
                        <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-3">
                          {filteredBlogs[0].excerpt}
                        </p>
                      )}
                      <span className="text-amber-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read Full Article <HiArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              )}
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(activeTab === 'all' &&
              filteredBlogs.length > 0 &&
              filteredBlogs[0].type !== 'job_alert'
                ? filteredBlogs.slice(1)
                : filteredBlogs
              ).map((blog) => (
                <BlogCard key={blog._id} blog={blog} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
