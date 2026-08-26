import SeoHead from '@/components/SeoHead';
import { useState, useEffect, useMemo } from 'react';
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
  const [allParentCategories, setAllParentCategories] = useState([]);
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

        const allCatsRaw =
          catRes.data?.data?.allCategories ||
          catRes.data?.allCategories ||
          catRes.data?.data?.categories ||
          catRes.data?.categories ||
          catRes.data?.data ||
          catRes.data ||
          [];
        const rawList = Array.isArray(allCatsRaw) ? allCatsRaw : [];

        // Parent root categories (parentId === null or type === 'category') are for grouping/tabs
        const parentCats = rawList.filter((c) => !c.parentId && c.type !== 'resource');
        // All exams & sub-exams (items that have a parentId or type === 'exam')
        const examList = rawList.filter(
          (c) => (c.parentId || c.type === 'exam') && c.type !== 'resource'
        );

        setAllParentCategories(parentCats);
        setCategories(examList);

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

  // Filter exams by search term
  const searchedExams = useMemo(() => {
    return categories.filter((exam) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return exam.name?.toLowerCase().includes(q) || exam.description?.toLowerCase().includes(q);
    });
  }, [categories, search]);

  // Build dynamic parent groups from actual backend parent categories
  const dynamicGroups = useMemo(() => {
    // Map parent categories and their matching exams (including recursively nested sub-exams)
    const getDescendantExamIds = (parentId, list) => {
      const directSubs = list.filter(
        (e) => e.parentId === parentId || e.parent?.id === parentId || e.parent?._id === parentId
      );
      let ids = directSubs.map((e) => e.id || e._id);
      directSubs.forEach((sub) => {
        ids = ids.concat(getDescendantExamIds(sub.id || sub._id, list));
      });
      return ids;
    };

    return allParentCategories.map((parent) => {
      const parentId = parent.id || parent._id;
      const descendantIds = getDescendantExamIds(parentId, categories);

      const examsUnderParent = searchedExams.filter((exam) => {
        const examId = exam.id || exam._id;
        return (
          exam.parentId === parentId ||
          exam.parent?.id === parentId ||
          exam.parent?._id === parentId ||
          descendantIds.includes(examId)
        );
      });

      return {
        id: parent.slug || parentId,
        rawId: parentId,
        name: parent.name,
        icon: parent.icon || '🎯',
        exams: examsUnderParent,
      };
    });
  }, [allParentCategories, searchedExams, categories]);

  // Tabs for switching between groups
  const filterTabs = useMemo(() => {
    const tabs = [{ id: 'all', label: 'All Exams', count: searchedExams.length }];
    dynamicGroups.forEach((g) => {
      tabs.push({
        id: g.id,
        label: `${g.icon ? g.icon + ' ' : ''}${g.name}`,
        count: g.exams.length,
      });
    });
    return tabs;
  }, [dynamicGroups, searchedExams.length]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    if (categoryParam) {
      const norm = categoryParam.toLowerCase().replace(/_/g, '-');
      const matched = dynamicGroups.find((g) => {
        const gSlug = (g.id || '').toLowerCase();
        const gName = (g.name || '').toLowerCase();
        return (
          gSlug === norm ||
          gSlug.startsWith(norm) ||
          (norm === 'rajasthan' && (gSlug.includes('rajasthan') || gName.includes('rajasthan'))) ||
          ((norm.includes('political') || norm.includes('polity')) &&
            (gSlug.includes('political') || gName.includes('political')))
        );
      });
      if (matched) {
        setSelectedGroup(matched.id);
      } else {
        setSelectedGroup(categoryParam);
      }
    } else if (location.state?.filterGroup) {
      setSelectedGroup(location.state.filterGroup);
      window.history.replaceState({}, document.title);
    }
  }, [location.search, location.state, dynamicGroups]);

  const renderCategoryCard = (cat) => (
    <Link
      key={cat._id || cat.id}
      to={`/exams/${cat.slug || cat._id || cat.id}`}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 border border-slate-200 dark:border-slate-800 transition-all flex flex-col justify-between group cursor-pointer"
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
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-4 gap-2">
          <span className="flex items-center gap-1">
            <HiBookOpen className="h-4 w-4 text-blue-500" />{' '}
            {cat.courseCount || cat.coursesCount || 0} Courses
          </span>
          <span className="flex items-center gap-1">
            <HiClipboardList className="h-4 w-4 text-amber-500" />{' '}
            {cat.testCount || cat.testsCount || 0} Tests
          </span>
        </div>

        <span className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs sm:text-sm">
          <span>View Exam Hub</span>
          <HiArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  );

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100">
      <SeoHead
        title="Explore Exams — Competitive Exam Hubs"
        description="Browse all competitive exams. Access syllabus, PYQs, mock tests, and specialized courses for your target exam."
      />
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

        {/* Group Filter Tabs (Loaded dynamically from backend categories) */}
        {!loading && filterTabs.length > 1 && (
          <div className="flex justify-center gap-2 mb-10 overflow-x-auto pb-2 flex-wrap">
            {filterTabs.map((group) => {
              const isActive =
                selectedGroup === group.id ||
                (selectedGroup !== 'all' &&
                  dynamicGroups.some(
                    (g) =>
                      g.id === group.id &&
                      (g.id.includes(selectedGroup) ||
                        (selectedGroup.includes('rajasthan') && g.id.includes('rajasthan')) ||
                        (selectedGroup.includes('political') && g.id.includes('political')))
                  ));

              return (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(group.id)}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-800 text-white shadow-lg shadow-amber-500/30'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-amber-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {group.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Loading / Error States */}
        {loading && (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {error && <div className="text-center py-20 text-red-500 font-semibold">{error}</div>}

        {!loading && !error && searchedExams.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              No exams found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              No exam categories matching your search query.
            </p>
          </div>
        )}

        {/* Dynamic Exams Content Sections */}
        {!loading && !error && (
          <div className="space-y-16">
            {dynamicGroups.length > 0 ? (
              dynamicGroups
                .filter((group) => {
                  if (selectedGroup === 'all') return true;
                  if (selectedGroup === group.id) return true;
                  const s = selectedGroup.toLowerCase().replace(/_/g, '-');
                  const g = (group.id || '').toLowerCase();
                  return (
                    g.includes(s) ||
                    (s.includes('rajasthan') && g.includes('rajasthan')) ||
                    (s.includes('political') && g.includes('political'))
                  );
                })
                .map((group) => (
                  <section key={group.id}>
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
                      <span className="text-2xl">{group.icon}</span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                        {group.name}
                      </h2>
                      <span className="text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full">
                        {group.exams.length} {group.exams.length === 1 ? 'Exam' : 'Exams'}
                      </span>
                    </div>
                    {group.exams.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {group.exams.map(renderCategoryCard)}
                      </div>
                    ) : (
                      <div className="py-8 px-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          No specific exams listed under {group.name} yet.
                        </p>
                      </div>
                    )}
                  </section>
                ))
            ) : searchedExams.length > 0 ? (
              /* Fallback if no parent categories are configured */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchedExams.map(renderCategoryCard)}
              </div>
            ) : null}
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
                <CourseCard key={course.id || course._id} course={course} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
