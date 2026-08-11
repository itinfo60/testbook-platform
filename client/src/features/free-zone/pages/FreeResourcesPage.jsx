import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '@/services/api';
import {
  HiGift,
  HiDownload,
  HiDocumentText,
  HiClipboardList,
  HiSearch,
  HiArrowRight,
  HiExternalLink,
  HiPlay,
} from 'react-icons/hi';

const TABS = [
  { id: 'all', label: '🗂️ All Resources', type: null },
  { id: 'syllabus', label: '📄 Syllabus & Exam Pattern', type: 'syllabus' },
  { id: 'pyq', label: '📝 PYQs with Solutions', type: 'pyq' },
  { id: 'current_affairs', label: '📰 Daily Current Affairs', type: 'current_affairs' },
  { id: 'quiz', label: '⚡ Free Quizzes', type: 'quiz' },
  { id: 'mind_map', label: '🧠 Mind Maps & Short Tricks', type: 'mind_map' },
  { id: 'notes', label: '📋 Notes', type: 'notes' },
];

const RESOURCE_ICON = {
  syllabus: '📄',
  exam_pattern: '📋',
  pyq: '📝',
  solved_pyq: '📝',
  current_affairs: '📰',
  quiz: '⚡',
  mind_map: '🧠',
  short_trick: '🧠',
  notes: '📋',
  video: '▶️',
  other: '📚',
};

export default function FreeResourcesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resRes, catRes] = await Promise.all([
          api.get('/library', { params: { accessLevel: 'all', limit: 100 } }),
          api.get('/categories'),
        ]);
        const resData =
          resRes.data?.data?.resources || resRes.data?.resources || resRes.data?.data || [];
        const catData =
          catRes.data?.data?.categories || catRes.data?.data || catRes.data?.categories || [];
        setResources(Array.isArray(resData) ? resData : []);
        setCategories(Array.isArray(catData) ? catData : []);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams);
    if (tabId === 'all') params.delete('tab');
    else params.set('tab', tabId);
    setSearchParams(params);
  };

  const filteredItems = resources.filter((item) => {
    const tab = TABS.find((t) => t.id === activeTab);
    const matchesTab =
      !tab?.type ||
      item.resourceType === tab.type ||
      item.resourceType === (tab.id === 'pyq' ? 'solved_pyq' : tab.type);
    const matchesCategory =
      activeCategory === 'all' ||
      (item.category && (item.category._id === activeCategory || item.category === activeCategory));
    const str =
      `${item.title} ${item.description || ''} ${item.tags?.join(' ') || ''}`.toLowerCase();
    const matchesSearch = !search || str.includes(search.toLowerCase());
    return matchesTab && matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-dark-50 dark:bg-dark-950 min-h-screen text-dark-900 dark:text-dark-100">
      {/* ── Hero Banner ── */}
      <div className="bg-gradient-to-br from-green-700 via-emerald-700 to-teal-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white font-bold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider mb-4">
            🎁 100% Free Preparation Zone
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display mb-3">
            Free Study Material & PYQ Library
          </h1>
          <p className="text-green-100 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-8">
            Download Official Syllabus, Solved Previous Year Papers, Rajasthan Current Affairs PDFs,
            Mind Maps & Short Tricks, and take Daily Free Practice Quizzes.
          </p>
          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search RAS syllabus, Patwari PYQ, Current Affairs..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-dark-900 text-sm font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* ── Type Tabs ── */}
        <div className="overflow-x-auto -mx-4 px-4 mb-6">
          <div className="flex gap-2 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700 hover:bg-slate-50 dark:hover:bg-dark-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Exam Category Filter ── */}
        {categories.length > 0 && (
          <div className="mb-8">
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">🎯 All Exams</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.icon || ''} {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="py-20 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-b-transparent" />
          </div>
        )}

        {/* ── Error ── */}
        {error && <div className="py-16 text-center text-red-500 font-semibold">{error}</div>}

        {/* ── Free Quizzes Special Section ── */}
        {!loading && activeTab === 'quiz' && (
          <div className="mb-8">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-amber-800 dark:text-amber-300 mb-1">
                  ⚡ Take a Free Practice Quiz Now
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  10–20 topic-wise MCQs for RAS, Patwari, EO/RO, and Political Science — instant
                  results!
                </p>
              </div>
              <Link
                to="/tests"
                className="shrink-0 flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
              >
                Browse Free Tests <HiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* ── Results Grid ── */}
        {!loading && !error && (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 font-medium">
              Showing{' '}
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {filteredItems.length}
              </span>{' '}
              resource{filteredItems.length !== 1 ? 's' : ''}
            </p>

            {filteredItems.length === 0 ? (
              <div className="bg-white dark:bg-dark-900 rounded-3xl py-20 text-center border border-slate-100 dark:border-dark-800">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                  No resources found
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Try a different filter or search term.
                </p>
                <button
                  onClick={() => {
                    setActiveTab('all');
                    setSearch('');
                    setActiveCategory('all');
                  }}
                  className="bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-green-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredItems.map((resource) => (
                  <div
                    key={resource._id}
                    className="group bg-white dark:bg-dark-900 rounded-2xl p-5 border border-slate-200 dark:border-dark-800 hover:border-green-500 shadow-sm hover:shadow-lg transition-all flex flex-col"
                  >
                    {/* Icon + Type Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">
                        {RESOURCE_ICON[resource.resourceType] || '📚'}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        {resource.resourceType?.replace('_', ' ') || 'Resource'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-dark-900 dark:text-white mb-1.5 line-clamp-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      {resource.title}
                    </h3>

                    {resource.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                        {resource.description}
                      </p>
                    )}

                    {/* Exam Category Tag */}
                    {resource.category && (
                      <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-3">
                        🎯 {resource.category.name || resource.category}
                      </div>
                    )}

                    {/* Stats + Download */}
                    <div className="mt-auto pt-3 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <HiDownload className="h-3.5 w-3.5" />
                        {resource.downloadsCount || 0} downloads
                      </span>
                      <a
                        href={resource.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                        onClick={() => {
                          // Optimistic download count update
                        }}
                      >
                        {resource.fileType?.includes('video') ? (
                          <>
                            <HiPlay className="h-3.5 w-3.5" /> Watch
                          </>
                        ) : (
                          <>
                            <HiDownload className="h-3.5 w-3.5" /> Download
                          </>
                        )}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Empty DB fallback CTA ── */}
        {!loading && !error && resources.length === 0 && (
          <div className="mt-12 bg-green-50 dark:bg-green-900/20 rounded-3xl p-8 text-center border border-green-200 dark:border-green-800">
            <h3 className="text-xl font-bold text-green-800 dark:text-green-300 mb-2">
              📦 Free Resources Coming Soon
            </h3>
            <p className="text-sm text-green-700 dark:text-green-400 mb-4 max-w-md mx-auto">
              Our team is uploading exam-specific PDFs, PYQs, and study material. Follow us on
              Telegram to get notified instantly.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              <HiExternalLink className="h-4 w-4" /> Join Telegram Channel
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
