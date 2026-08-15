import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HiAcademicCap,
  HiSearch,
  HiChevronRight,
  HiBookOpen,
  HiClipboardList,
  HiArrowRight,
  HiSparkles,
  HiFilter,
} from 'react-icons/hi';
import api from '@/services/api';
import CourseCard from '@/features/course/components/CourseCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function ExamsCatalog() {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catRes, courseRes] = await Promise.all([
          api.get('/categories'),
          api
            .get('/courses', { params: { limit: 8, isPublished: true } })
            .catch(() => ({ data: { data: [] } })),
        ]);

        const catData =
          catRes.data?.categories ||
          catRes.data?.data?.categories ||
          catRes.data?.data ||
          catRes.data ||
          [];
        setCategories(Array.isArray(catData) ? catData : []);

        const courseData =
          courseRes.data?.data?.courses || courseRes.data?.courses || courseRes.data?.data || [];
        setFeaturedCourses(Array.isArray(courseData) ? courseData : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load exam categories');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (location.state?.filterGroup) {
      setSelectedGroup(location.state.filterGroup);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Extract all subcategory exam items from categories
  const allExamItems = categories.flatMap((cat) => {
    if (cat.subcategories && cat.subcategories.length > 0) {
      return cat.subcategories.map((sub) => ({ ...sub, parentCategory: cat }));
    }
    return [{ ...cat, parentCategory: cat }];
  });

  const filteredExams = allExamItems.filter((exam) => {
    const matchesSearch =
      !search ||
      exam.name?.toLowerCase().includes(search.toLowerCase()) ||
      exam.description?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  // Categorize by Parent Category Slug or Subcategory Slugs
  const rajasthanExams = filteredExams.filter((exam) => {
    const pSlug = exam.parentCategory?.slug || '';
    const slug = exam.slug || '';
    return (
      pSlug === 'rajasthan-exams' ||
      [
        'ras',
        'rpsc-eo-ro',
        'rpsc-si',
        'rpsc-1st-2nd-grade',
        'rajasthan-cet',
        'patwari',
        'vdo',
      ].some((s) => slug.includes(s))
    );
  });

  const polSciExams = filteredExams.filter((exam) => !rajasthanExams.includes(exam));

  const renderCategoryCard = (cat) => (
    <div
      key={cat._id || cat.id}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md hover:shadow-xl border border-slate-200 dark:border-slate-800 transition-all flex flex-col justify-between group"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl font-bold group-hover:scale-110 transition-transform">
            {cat.icon || <HiAcademicCap className="h-8 w-8" />}
          </div>
          {cat.latestStatus && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
              {cat.latestStatus}
            </span>
          )}
        </div>

        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          {cat.name}
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4 line-clamp-3">
          {cat.description}
        </p>
      </div>

      <div>
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4 gap-2">
          <span className="flex items-center gap-1">
            <HiBookOpen className="h-4 w-4 text-blue-500" /> {cat.courseCount || 0} Courses
          </span>
          <span className="flex items-center gap-1">
            <HiClipboardList className="h-4 w-4 text-amber-500" /> {cat.testCount || 0} Tests
          </span>
        </div>

        <button
          onClick={() => navigate(`/exams/${cat.slug || cat._id}`)}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
        >
          <span>View Exam Hub</span>
          <HiArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto">
        {/* Header Banner */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display">Explore Exams</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2">
            Select your target competitive exam to access syllabus & pattern, previous year papers,
            specialized courses, mock test series & PYQs.
          </p>

          {/* Search Input */}
          <div className="relative max-w-xl mx-auto mt-6">
            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exams (e.g., Patwari, RAS, SI, Assistant Professor)..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-sm font-medium"
            />
          </div>
        </div>

        {/* Group Filter Tabs */}
        <div className="flex justify-center gap-2 mb-10 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'All Exams' },
            { id: 'rajasthan', label: '🟢 Rajasthan Specific' },
            { id: 'political_science', label: '🔵 Political Science Special' },
          ].map((group) => (
            <button
              key={group.id}
              onClick={() => setSelectedGroup(group.id)}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedGroup === group.id
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-amber-50 dark:hover:bg-slate-800'
              }`}
            >
              {group.label}
            </button>
          ))}
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {error && <div className="text-center py-20 text-red-500 font-semibold">{error}</div>}

        {!loading && !error && filteredExams.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              No exams found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              No categories matching your search query.
            </p>
          </div>
        )}

        {/* Exams Content Sections */}
        {!loading && !error && filteredExams.length > 0 && (
          <div className="space-y-16">
            {/* 🟢 Rajasthan Specific Exams */}
            {(selectedGroup === 'all' || selectedGroup === 'rajasthan') &&
              rajasthanExams.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <span className="h-4 w-4 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                      Rajasthan Specific Exams
                    </h2>
                    <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full">
                      {rajasthanExams.length} Exams
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rajasthanExams.map(renderCategoryCard)}
                  </div>
                </section>
              )}

            {/* 🔵 Political Science Special Exams */}
            {(selectedGroup === 'all' || selectedGroup === 'political_science') &&
              polSciExams.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <span className="h-4 w-4 rounded-full bg-blue-500 inline-block animate-pulse"></span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                      Political Science Special
                    </h2>
                    <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
                      {polSciExams.length} Exams
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {polSciExams.map(renderCategoryCard)}
                  </div>
                </section>
              )}
          </div>
        )}

        {/* Featured Courses Section on Exams Catalog */}
        {!loading && featuredCourses.length > 0 && (
          <section className="mt-20 pt-12 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <span className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-xs">
                  🔥 Featured Target Batches
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  Popular Courses Across All Exams
                </h2>
              </div>
              <Link
                to="/courses"
                className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 hover:underline text-sm"
              >
                View All Courses <HiArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredCourses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
