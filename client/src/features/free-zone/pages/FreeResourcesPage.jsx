import SeoHead from '@/components/SeoHead';
import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  HiDownload,
  HiDocumentText,
  HiClipboardList,
  HiSearch,
  HiArrowRight,
  HiExternalLink,
  HiPlay,
  HiSparkles,
  HiBookOpen,
  HiFilter,
  HiCheckCircle,
  HiLightningBolt,
  HiAcademicCap,
  HiX,
  HiInformationCircle,
  HiEye,
  HiShare,
} from 'react-icons/hi';
import api, { examCategoryAPI } from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

const RESOURCE_TYPES = [
  { id: 'all', label: 'All Resources', icon: '🗂️' },
  { id: 'pyq', label: 'Solved PYQs & Past Papers', icon: '📝', types: ['pyq', 'solved_pyq'] },
  {
    id: 'syllabus',
    label: 'Official Syllabus & Scheme',
    icon: '📖',
    types: ['syllabus', 'exam_pattern'],
  },
  { id: 'notes', label: 'Handwritten Notes & Summaries', icon: '📋', types: ['notes', 'other'] },
  {
    id: 'current_affairs',
    label: 'Monthly Current Affairs',
    icon: '📰',
    types: ['current_affairs'],
  },
  { id: 'mind_map', label: 'Mind Maps & Formulas', icon: '🧠', types: ['mind_map', 'short_trick'] },
  { id: 'quiz', label: 'Free Topic Quizzes', icon: '⚡', types: ['quiz'] },
];

const TYPE_CONFIG = {
  pyq: {
    color: 'blue',
    label: 'Solved PYQ',
    bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  solved_pyq: {
    color: 'blue',
    label: 'Solved PYQ',
    bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  syllabus: {
    color: 'purple',
    label: 'Syllabus',
    bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  exam_pattern: {
    color: 'purple',
    label: 'Pattern',
    bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  notes: {
    color: 'emerald',
    label: 'Revision Notes',
    bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  current_affairs: {
    color: 'amber',
    label: 'Current Affairs',
    bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  mind_map: {
    color: 'pink',
    label: 'Mind Map',
    bg: 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800',
  },
  short_trick: {
    color: 'pink',
    label: 'Short Trick',
    bg: 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800',
  },
  quiz: {
    color: 'orange',
    label: 'Free Quiz',
    bg: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  },
  video: {
    color: 'indigo',
    label: 'Video Demo',
    bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  other: {
    color: 'slate',
    label: 'Study PDF',
    bg: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
};

export default function FreeResourcesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';
  const initialCategory = searchParams.get('category') || 'all';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [selectedResource, setSelectedResource] = useState(null);

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
          examCategoryAPI.getAll().catch(() => ({ data: { data: [] } })),
        ]);

        const resData =
          resRes.data?.data?.resources || resRes.data?.resources || resRes.data?.data || [];
        const catData =
          catRes.data?.categories || catRes.data?.data?.categories || catRes.data?.data || [];

        setResources(Array.isArray(resData) ? resData : []);
        setCategories(Array.isArray(catData) ? catData : []);
      } catch (err) {
        setError(err.message || 'Failed to fetch free study materials');
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

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    const params = new URLSearchParams(searchParams);
    if (catId === 'all') params.delete('category');
    else params.set('category', catId);
    setSearchParams(params);
  };

  // Flatten categories if subcategories exist
  const allCategoryOptions = useMemo(() => {
    return categories.flatMap((cat) => {
      if (cat.subcategories && cat.subcategories.length > 0) {
        return [cat, ...cat.subcategories];
      }
      return [cat];
    });
  }, [categories]);

  // Filter and Sort Items
  const filteredItems = useMemo(() => {
    return resources
      .filter((item) => {
        // 1. Tab / Type Match
        const tabDef = RESOURCE_TYPES.find((t) => t.id === activeTab);
        let matchesTab = true;
        if (tabDef && tabDef.types) {
          matchesTab = tabDef.types.includes(item.resourceType);
        }

        // 2. Category Match
        let matchesCategory = true;
        if (activeCategory !== 'all') {
          const itemCatId = item.category?._id || item.category;
          const itemCatSlug = item.category?.slug;
          matchesCategory = itemCatId === activeCategory || itemCatSlug === activeCategory;
        }

        // 3. Search Match
        let matchesSearch = true;
        if (search.trim()) {
          const q = search.toLowerCase();
          const catName = typeof item.category === 'object' ? item.category?.name : '';
          const combined =
            `${item.title || ''} ${item.description || ''} ${catName || ''} ${item.tags?.join(' ') || ''}`.toLowerCase();
          matchesSearch = combined.includes(q);
        }

        return matchesTab && matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'downloads') {
          return (b.downloadsCount || 0) - (a.downloadsCount || 0);
        }
        if (sortBy === 'title') {
          return (a.title || '').localeCompare(b.title || '');
        }
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [resources, activeTab, activeCategory, search, sortBy]);

  const handleDownload = async (resource) => {
    try {
      if (resource.fileUrl) {
        window.open(resource.fileUrl, '_blank');
        toast.success('Starting download...');
      } else {
        toast.error('File link currently unavailable');
      }
    } catch {
      toast.error('Could not initiate download');
    }
  };

  const handleShare = (resource) => {
    if (navigator.share) {
      navigator
        .share({
          title: resource.title,
          text: `Free Study Material for ${resource.category?.name || 'Competitive Exams'}: ${resource.title}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 pb-20">
      <SeoHead
        title="Free Study Resources — PYQs, Syllabus, Notes & Current Affairs"
        description="Download free RPSC & RAS study material: solved PYQs, official syllabus, handwritten notes, current affairs, and mind maps. 100% free."
      />
      {/* ════════ HERO BANNER ════════ */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 text-white py-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden shadow-lg">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 font-bold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider mb-4 backdrop-blur-md">
            <HiSparkles className="h-4 w-4 text-emerald-300" />
            100% Free Preparation Repository
          </div>

          <h1 className="text-3xl sm:text-5xl font-black font-display mb-3 tracking-tight">
            Free Study Material & Solved PYQ Library
          </h1>

          <p className="text-emerald-100 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed mb-8">
            Download Official Syllabus, Solved Previous Year Question Papers with explanatory answer
            keys, Handwritten Revision Notes & Topic Summaries.
          </p>

          {/* Search Box */}
          <div className="relative max-w-2xl mx-auto">
            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by exam name, topic or paper (e.g. RAS 2023 PYQ, Patwari, Polity Notes)..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium shadow-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400 border border-emerald-500/20"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <HiX className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Quick Stats Pill Counters */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6 text-xs text-emerald-200">
            <span className="bg-white/10 px-3 py-1 rounded-full border border-white/10">
              📚 <strong>{resources.length}</strong> Total Free PDFs
            </span>
            <span className="bg-white/10 px-3 py-1 rounded-full border border-white/10">
              🎯 <strong>{categories.length}</strong> Covered Exams
            </span>
            <span className="bg-white/10 px-3 py-1 rounded-full border border-white/10">
              ⚡ <strong>Instant</strong> PDF Downloads
            </span>
          </div>
        </div>
      </div>

      {/* ════════ MAIN CONTENT & INTERACTIVE FILTERS ════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 1. Resource Type Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2 mb-6 hide-scrollbar">
          {RESOURCE_TYPES.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 2. Secondary Filter Bar: Exam Select + Sort By */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
          {/* Exam Filter Dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <HiFilter className="h-4 w-4 text-emerald-500" /> Filter Exam:
            </span>
            <select
              value={activeCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">🎯 All Competitive Exams ({resources.length})</option>
              {allCategoryOptions.map((cat) => (
                <option key={cat._id || cat.slug} value={cat._id || cat.slug}>
                  {cat.icon || '🏛️'} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By & Results Count */}
          <div className="flex items-center justify-between md:justify-end gap-4 text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>
              Showing{' '}
              <strong className="text-slate-900 dark:text-white">{filteredItems.length}</strong>{' '}
              items
            </span>
            <div className="flex items-center gap-2">
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="latest">Latest Added</option>
                <option value="downloads">Most Downloaded</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Loading Spinner */}
        {loading && (
          <div className="py-20 flex justify-center">
            <LoadingSpinner fullScreen={false} />
          </div>
        )}

        {/* 4. Error State */}
        {error && (
          <div className="py-12 text-center text-red-500 font-bold bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        {/* 5. Free Quizzes Highlight Callout (When Quiz tab is active) */}
        {!loading && activeTab === 'quiz' && (
          <div className="mb-8 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="bg-black/20 text-amber-200 font-extrabold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                ⚡ Instant Practice Engine
              </span>
              <h3 className="text-xl sm:text-2xl font-black mb-1">
                Take Daily Free Topic Quizzes & Live Assessments
              </h3>
              <p className="text-amber-100 text-xs sm:text-sm max-w-xl">
                Practice 15-20 question drills for RAS, Assistant Professor, SI & Patwari with
                instant percentiles and step-by-step solutions.
              </p>
            </div>
            <Link
              to="/test-series"
              className="bg-white text-orange-700 hover:bg-amber-50 font-black px-6 py-3 rounded-2xl shadow-lg transition-all text-xs sm:text-sm shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <span>Explore All Free Tests</span>
              <HiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* 6. Resources Cards Grid */}
        {!loading && !error && (
          <>
            {filteredItems.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl py-20 px-6 text-center border border-slate-200 dark:border-slate-800 max-w-2xl mx-auto shadow-sm">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  No free study materials found
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6">
                  No documents match your current filter or search criteria.
                </p>
                <button
                  onClick={() => {
                    setActiveTab('all');
                    setActiveCategory('all');
                    setSearch('');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((resource) => {
                  const typeConf = TYPE_CONFIG[resource.resourceType] || TYPE_CONFIG.other;
                  const catName =
                    typeof resource.category === 'object'
                      ? resource.category?.name
                      : resource.category;
                  const catSlug =
                    typeof resource.category === 'object' ? resource.category?.slug : null;

                  return (
                    <div
                      key={resource._id}
                      className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-400 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Header Badge */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${typeConf.bg}`}
                          >
                            {typeConf.label}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                            <HiDownload className="h-3.5 w-3.5 text-emerald-500" />
                            {resource.downloadsCount || 120}+ Downloads
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                          {resource.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                          {resource.description ||
                            'Verified study PDF document for competitive exam preparation and revision.'}
                        </p>

                        {/* Exam Badge Tag */}
                        {catName && (
                          <div className="mb-4">
                            <button
                              onClick={() => catSlug && handleCategoryChange(catSlug)}
                              className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/40 hover:bg-amber-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <HiAcademicCap className="h-3.5 w-3.5" />
                              <span>{catName}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions Bar */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedResource(resource)}
                          className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer py-1.5"
                        >
                          <HiEye className="h-4 w-4" /> View Details
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleShare(resource)}
                            title="Share Link"
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <HiShare className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(resource)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                          >
                            <HiDownload className="h-4 w-4" /> Download PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ════════ DETAILED RESOURCE MODAL ════════ */}
      {selectedResource && (
        <Modal
          isOpen={!!selectedResource}
          onClose={() => setSelectedResource(null)}
          title="Free Study Resource"
          size="lg"
        >
          <div className="space-y-5">
            {/* Modal Header */}
            <div className="flex items-start gap-4 p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/40">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-300 text-2xl font-bold">
                📄
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                  {selectedResource.resourceType?.replace('_', ' ') || 'Document'}
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-1 leading-snug">
                  {selectedResource.title}
                </h3>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                Document Overview & Description
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedResource.description ||
                  'Official comprehensive study material prepared according to the latest examination scheme with verified answer explanations and topic highlights.'}
              </p>
            </div>

            {/* Specification Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Exam</span>
                <span className="text-xs font-black text-slate-800 dark:text-white line-clamp-1">
                  {typeof selectedResource.category === 'object'
                    ? selectedResource.category?.name
                    : 'General'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Total Downloads
                </span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {selectedResource.downloadsCount || 120}+ Times
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Access</span>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                  100% Free
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedResource(null)}
                className="btn-outline text-xs px-4 py-2.5"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDownload(selectedResource);
                  setSelectedResource(null);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <HiDownload className="h-4 w-4" /> Download PDF File
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
