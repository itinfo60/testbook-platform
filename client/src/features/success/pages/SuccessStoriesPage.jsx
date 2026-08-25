import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HiBadgeCheck,
  HiStar,
  HiCheckCircle,
  HiAcademicCap,
  HiSparkles,
  HiArrowRight,
  HiSearch,
} from 'react-icons/hi';
import api from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function SuccessStoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await api.get('/settings/success-stories');
        const list = res.data?.data?.stories || res.data?.stories || [];
        setStories(list);
      } catch (err) {
        console.warn('Using default success stories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  const filterOptions = [
    { id: 'all', label: 'All Achievers' },
    { id: 'ras', label: 'RPSC RAS' },
    { id: 'assistant-professor', label: 'Assistant Professor' },
    { id: '1st-grade', label: '1st & 2nd Grade' },
    { id: 'cet', label: 'CET & Other Exams' },
  ];

  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      const matchSearch =
        search.trim() === '' ||
        story.name?.toLowerCase().includes(search.toLowerCase()) ||
        story.exam?.toLowerCase().includes(search.toLowerCase()) ||
        story.rank?.toLowerCase().includes(search.toLowerCase()) ||
        story.quote?.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;
      if (selectedFilter === 'all') return true;

      const examLower = (story.exam || '').toLowerCase();
      if (selectedFilter === 'ras') return examLower.includes('ras');
      if (selectedFilter === 'assistant-professor')
        return examLower.includes('assistant professor') || examLower.includes('college');
      if (selectedFilter === '1st-grade')
        return (
          examLower.includes('1st grade') ||
          examLower.includes('2nd grade') ||
          examLower.includes('lecturer')
        );
      if (selectedFilter === 'cet')
        return (
          examLower.includes('cet') || examLower.includes('patwari') || examLower.includes('vdo')
        );

      return true;
    });
  }, [stories, search, selectedFilter]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 dark:bg-dark-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-dark-950 min-h-screen py-12 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-primary-700 dark:text-primary-300 font-semibold uppercase tracking-wider text-xs bg-primary-50 dark:bg-primary-950/60 px-3.5 py-1.5 rounded-full border border-primary-200 dark:border-primary-800 mb-4">
            <HiBadgeCheck className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span>Hall of Fame & Results</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Our Selected Toppers & Rank Holders
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-3 leading-relaxed">
            Real stories from dedicated aspirants who conquered RPSC RAS, Assistant Professor,
            School Lecturer, and competitive state exams with CivicsEdu courses and mock series.
          </p>

          {/* Highlights Banner */}
          <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mt-8 p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-xs">
            <div>
              <p className="text-xl sm:text-2xl font-bold text-amber-500 font-display">120+</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Top 50 Ranks</p>
            </div>
            <div className="border-x border-slate-100 dark:border-dark-800">
              <p className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400 font-display">
                850+
              </p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Final Selections</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-display">
                99.8%
              </p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Mock Accuracy</p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-xs">
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <HiSearch className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by topper name, rank, or exam..."
              className="input-field !pl-9.5 text-xs py-2"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {filterOptions.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFilter(f.id)}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedFilter === f.id
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stories Grid */}
        {filteredStories.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-800 p-8 shadow-xs">
            <div className="h-16 w-16 bg-amber-50 dark:bg-amber-950/60 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
              🎓
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              No Success Stories Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No topper stories match your current search or filter. Try clearing filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredStories.map((story) => (
              <div
                key={story.id}
                className="bg-white dark:bg-dark-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 dark:border-dark-800 flex flex-col justify-between hover:shadow-md transition-all duration-200 space-y-4 group"
              >
                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
                  <div className="relative shrink-0">
                    <img
                      src={
                        story.image ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                      }
                      alt={story.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-primary-500 shadow-sm"
                    />
                    {story.isFeatured && (
                      <div
                        className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 p-1 rounded-full shadow-xs"
                        title="Featured Topper"
                      >
                        <HiSparkles className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2 mb-1">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                        {story.name}
                      </h3>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        🏆 {story.rank}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1">
                      {story.exam} {story.year ? `• ${story.year}` : ''}
                    </p>

                    {story.badge && (
                      <span className="inline-block text-[10px] font-medium bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md mb-2">
                        {story.badge}
                      </span>
                    )}

                    <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                      "{story.quote}"
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                    <HiCheckCircle className="h-4 w-4" />
                    <span>Verified CivicsEdu Selection</span>
                  </div>
                  <Link
                    to="/courses"
                    className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-[11px]"
                  >
                    <span>Start Preparation</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA Banner */}
        <div className="rounded-3xl p-8 sm:p-10 bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-900 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold font-display">
              Ready to Write Your Own Success Story?
            </h2>
            <p className="text-primary-200 text-xs sm:text-sm max-w-xl leading-relaxed">
              Join thousands of aspirants preparing with authentic mock test series, detailed
              handwritten notes, and guidance from Rajasthan's top faculty.
            </p>
          </div>
          <Link
            to="/courses"
            className="btn-primary bg-white text-primary-900 hover:bg-primary-50 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap shadow-md"
          >
            Explore All Courses →
          </Link>
        </div>
      </div>
    </div>
  );
}
