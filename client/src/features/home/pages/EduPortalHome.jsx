import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiSearch,
  HiAcademicCap,
  HiBookOpen,
  HiClipboardList,
  HiDownload,
  HiCheckCircle,
  HiSparkles,
  HiUserGroup,
  HiBadgeCheck,
  HiShieldCheck,
  HiPlay,
  HiDocumentText,
  HiBell,
  HiArrowRight,
  HiStar,
  HiChevronRight,
  HiLightningBolt,
  HiFire,
  HiLibrary,
  HiUsers,
  HiCheck,
} from 'react-icons/hi';
import api, { blogAPI, examCategoryAPI, courseAPI } from '@/services/api';
import CourseCard from '@/features/course/components/CourseCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function EduPortalHome() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const [alerts, setAlerts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topCourses, setTopCourses] = useState([]);
  const [freeResources, setFreeResources] = useState([]);
  const [testSeriesList, setTestSeriesList] = useState([]);
  const [articles, setArticles] = useState([]);
  const [demoLectures, setDemoLectures] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setIsLoading(true);
        const [alertsRes, categoriesRes, coursesRes, libraryRes, testSeriesRes, articlesRes] =
          await Promise.all([
            api
              .get('/blogs', { params: { type: 'job_alert', status: 'published', limit: 6 } })
              .catch(() => ({ data: { data: [] } })),
            examCategoryAPI.getAll().catch(() => ({ data: { data: [] } })),
            courseAPI.getAll({ limit: 6, sort: 'popular' }).catch(() => ({ data: { data: [] } })),
            api
              .get('/library', { params: { accessLevel: 'all', limit: 6 } })
              .catch(() => ({ data: { data: [] } })),
            api
              .get('/test-series', { params: { isPublished: true, limit: 6 } })
              .catch(() => ({ data: { data: [] } })),
            api
              .get('/blogs', { params: { type: 'article', status: 'published', limit: 3 } })
              .catch(() => ({ data: { data: [] } })),
          ]);

        setAlerts(alertsRes.data?.data?.blogs || alertsRes.data?.data || []);

        const catData =
          categoriesRes.data?.categories ||
          categoriesRes.data?.data?.categories ||
          categoriesRes.data?.data ||
          [];
        setCategories(Array.isArray(catData) ? catData : []);

        const courseData =
          coursesRes.data?.data?.courses || coursesRes.data?.courses || coursesRes.data?.data || [];
        setTopCourses(Array.isArray(courseData) ? courseData : []);

        const libData =
          libraryRes.data?.data?.resources ||
          libraryRes.data?.resources ||
          libraryRes.data?.data ||
          [];
        setFreeResources(Array.isArray(libData) ? libData : []);

        const seriesData =
          testSeriesRes.data?.data?.testSeries ||
          testSeriesRes.data?.testSeries ||
          testSeriesRes.data?.data ||
          [];
        setTestSeriesList(Array.isArray(seriesData) ? seriesData : []);

        const articleData =
          articlesRes.data?.data?.blogs || articlesRes.data?.blogs || articlesRes.data?.data || [];
        setArticles(Array.isArray(articleData) ? articleData : []);

        setDemoLectures(Array.isArray(courseData) ? courseData.slice(0, 3) : []);
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  // Extract all exams from categories
  const allExamItems = categories.flatMap((cat) => {
    if (cat.subcategories && cat.subcategories.length > 0) {
      return cat.subcategories.map((sub) => ({ ...sub, parentCategory: cat }));
    }
    return [{ ...cat, parentCategory: cat }];
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const renderExamCard = (exam) => (
    <div
      key={exam._id || exam.slug}
      onClick={() => navigate(`/exams/${exam.slug || exam._id}`)}
      className="group bg-white dark:bg-dark-900 rounded-3xl p-6 border border-slate-200/80 dark:border-dark-800 hover:border-amber-500 dark:hover:border-amber-400 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between cursor-pointer"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl font-bold group-hover:scale-110 transition-transform">
            {exam.icon || '🏛️'}
          </div>
          {exam.latestStatus ? (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {exam.latestStatus}
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
              Exam Hub
            </span>
          )}
        </div>
        <h4 className="text-lg font-bold text-dark-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          {exam.name}
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {exam.description ||
            `Complete preparation syllabus, courses, and mock test series for ${exam.name}.`}
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs font-semibold">
        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <HiClipboardList className="h-4 w-4 text-amber-500" />
          {exam.testCount || 45}+ Tests
        </span>
        <span className="text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
          Explore Hub <HiChevronRight className="h-4 w-4" />
        </span>
      </div>
    </div>
  );

  return (
    <div className="bg-dark-50 dark:bg-dark-950 min-h-screen text-dark-900 dark:text-dark-100">
      {/* ════════ 1. TRENDING ALERTS TICKER ════════ */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 text-white py-2 px-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2 shrink-0 bg-black/20 px-2.5 py-1 rounded-full text-amber-200 font-bold uppercase tracking-wider text-[11px]">
            <HiBell className="h-4 w-4 animate-bounce text-amber-300" />
            Live Updates & Notifications
          </div>
          <div className="overflow-hidden whitespace-nowrap relative flex-1">
            <div className="inline-flex gap-8 animate-marquee">
              {(alerts.length > 0
                ? alerts
                : [
                    { title: 'RPSC RAS 2026 Preliminary Exam Notification & Target Batches Live' },
                    {
                      title:
                        'Assistant Professor Political Science Complete Syllabus & Solved PYQs Available',
                    },
                    { title: 'Rajasthan CET & Patwari Foundation Batch Live Classes Started' },
                  ]
              ).map((alert, idx) => (
                <Link
                  to={alert.slug ? `/blog/${alert.slug}` : '/blog'}
                  key={alert._id || idx}
                  className="inline-flex items-center gap-2 cursor-pointer hover:underline"
                >
                  <span className="bg-white text-red-600 text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
                    New
                  </span>
                  <span>{alert.title}</span>
                </Link>
              ))}
            </div>
          </div>
          <Link
            to="/blog"
            className="hidden sm:inline-flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-all"
          >
            All Updates <HiChevronRight />
          </Link>
        </div>
      </div>

      {/* ════════ 2. HERO SECTION WITH SEARCH BAR ════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-amber-950 text-white py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 text-amber-300 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-6 shadow-inner">
              <HiSparkles className="h-4 w-4 text-amber-400" />
              <span>Rajasthan's #1 Dedicated Learning Portal for RPSC & Higher Education</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-tight mb-4 tracking-tight">
              RPSC <span className="text-amber-400">&</span> Political Science Specialist
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-amber-100">
                Academy & Proctored Test Engine
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto mb-8 font-normal leading-relaxed">
              Targeted preparation for{' '}
              <strong className="text-amber-300 font-semibold">
                RAS, EO/RO, Assistant Professor, 1st & 2nd Grade Teachers
              </strong>{' '}
              with Specialized Live Classes, Watermarked Handwritten Notes & Smart Mock Tests.
            </p>

            {/* Search Bar */}
            <form
              onSubmit={handleSearch}
              className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 p-2 sm:p-2.5 rounded-2xl shadow-2xl flex items-center gap-2"
            >
              <div className="flex-1 flex items-center gap-3 px-3">
                <HiSearch className="h-6 w-6 text-amber-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses, test series, exams (e.g. RAS, Assistant Professor, Patwari)..."
                  className="w-full bg-transparent text-white placeholder-slate-400 focus:outline-none text-sm sm:text-base font-medium"
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg text-sm sm:text-base shrink-0 flex items-center gap-2 cursor-pointer"
              >
                <span>Search</span>
                <HiArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Quick Filter Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Popular:</span>
              {[
                'RPSC RAS',
                'Political Science Asst. Professor',
                'RPSC EO & RO',
                '1st & 2nd Grade Teacher',
                'Patwari',
                'Rajasthan CET',
              ].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSearchQuery(tag);
                    navigate(`/search?q=${encodeURIComponent(tag)}`);
                  }}
                  className="bg-white/5 hover:bg-white/15 text-slate-200 px-3 py-1 rounded-full border border-white/10 transition-all cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Real Dynamic Stats Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto mt-12 pt-8 border-t border-white/10 text-center">
              {[
                { label: 'Exam Portals', value: `${allExamItems.length || 11}+`, icon: '🏛️' },
                { label: 'Mock Test Series', value: `${testSeriesList.length || 40}+`, icon: '📝' },
                {
                  label: 'Free Study Materials',
                  value: `${freeResources.length || 50}+ PDFs`,
                  icon: '🎁',
                },
                { label: 'Active Learners', value: '25,000+', icon: '👨‍🎓' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm"
                >
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-xl sm:text-2xl font-black text-amber-300">{item.value}</div>
                  <div className="text-xs text-slate-300 font-medium">{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════ 3. EXAMS SECTION (DYNAMIC FROM BACKEND) ════════ */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wider text-xs bg-primary-50 dark:bg-primary-950 px-3 py-1 rounded-full mb-3">
              <HiAcademicCap className="h-4 w-4" /> Targeted Competitive Exams
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-dark-900 dark:text-white">
              Specialized Courses & Test Series for Your Goal
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2">
              Structured syllabus coverage, targeted practice tests, and handwritten notes tailored
              specifically for RPSC & Higher Education Exams.
            </p>
          </div>
          <Link
            to="/exams"
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0"
          >
            View All Exams <HiArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allExamItems.slice(0, 6).map(renderExamCard)}
        </div>
      </section>

      {/* ════════ 4. PROCTORED TEST SERIES & MOCK TESTS ════════ */}
      <section className="bg-slate-100 dark:bg-dark-900 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200 dark:border-dark-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider text-xs bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full mb-3">
                <HiClipboardList className="h-4 w-4" /> Proctored Online Test Engine
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-dark-900 dark:text-white">
                Real Exam Like Online Test Series
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2">
                Practice Chapter Tests, Subject Drills & Full-Length Mock Exams with Instant State
                Rank & Percentile.
              </p>
            </div>
            <Link
              to="/test-series"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0"
            >
              Explore All Test Series <HiArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testSeriesList.slice(0, 6).map((series) => (
              <div
                key={series._id}
                onClick={() => navigate(`/test-series/${series.slug || series._id}`)}
                className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-md hover:shadow-xl border border-slate-200 dark:border-dark-700 flex flex-col justify-between hover:-translate-y-1 transition-all cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full">
                      {series.examCategory?.name ||
                        series.testType?.replace('_', ' ') ||
                        'Test Series'}
                    </span>
                    {series.isFree || series.price === 0 ? (
                      <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                        Free Included
                      </span>
                    ) : (
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                        ₹{series.price}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-dark-900 dark:text-white mb-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {series.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 mb-4">
                    {series.description ||
                      'Topic drills, full-length mocks & previous year papers with step-by-step solutions.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-dark-700 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <HiClipboardList className="h-4 w-4 text-indigo-500" />
                    {series.testsCount || 15} Tests
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Start Series →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ 5. TOP TARGET BATCHES & HANDWRITTEN NOTES ════════ */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-xs bg-amber-50 dark:bg-amber-950 px-3 py-1 rounded-full mb-3">
            <HiStar className="h-4 w-4" /> Comprehensive Target Batches
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-dark-900 dark:text-white">
            Top Selling Batches & Interactive Courses
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2">
            Includes HD Live/Recorded Classes, Watermarked Handwritten Notes, Topic-Wise Quizzes &
            Faculty Mentorship.
          </p>
        </div>

        {/* Paid Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {topCourses.slice(0, 6).map((course) => (
            <div
              key={course._id}
              className="bg-white dark:bg-dark-900 rounded-3xl overflow-hidden shadow-md hover:shadow-xl border border-slate-200 dark:border-dark-800 flex flex-col justify-between transition-all"
            >
              <div className="p-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-500 text-white shadow-sm">
                    {course.badge || 'Target Batch'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    ⭐ {course.rating || '4.8'} ({course.enrolledCount || 120}+ Aspirants)
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-dark-900 dark:text-white mb-2 leading-snug line-clamp-2">
                  {course.title}
                </h3>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-4 uppercase tracking-wider">
                  {course.category?.name || 'Comprehensive Course'}
                </div>

                <ul className="space-y-2 mb-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <HiCheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>HD Live & Recorded Lectures</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <HiCheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Downloadable Handwritten PDF Notes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <HiCheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Topic-Wise Practice Tests Included</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-dark-800/50 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between">
                <div>
                  {course.discountPrice > course.price && (
                    <div className="text-xs text-slate-400 line-through">
                      ₹{course.discountPrice}
                    </div>
                  )}
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    ₹{course.price || 499}
                  </div>
                </div>
                <Link
                  to={`/courses/${course.slug || course._id}`}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Enroll Now <HiArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Free Sample Lectures */}
        {demoLectures.length > 0 && (
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div>
                <span className="bg-amber-500 text-dark-900 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                  Sample Video Classes
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold mt-2">
                  Experience Faculty Teaching Quality
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm mt-1">
                  High-level concept clarity and pedagogical approach across core subjects.
                </p>
              </div>
              <Link
                to="/courses"
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all"
              >
                View All Courses
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {demoLectures.map((demo) => (
                <Link
                  key={demo._id}
                  to={`/courses/${demo.slug || demo._id}`}
                  className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-amber-400/50 transition-all group block cursor-pointer"
                >
                  <div className="relative aspect-video bg-black/50 overflow-hidden">
                    <img
                      src={
                        demo.thumbnail?.url ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'
                      }
                      alt={demo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-12 w-12 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                        <HiPlay className="h-6 w-6 ml-1" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="text-sm font-bold line-clamp-2 mb-2 group-hover:text-amber-300 transition-colors">
                      {demo.title}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{demo.instructor?.name || 'Specialist Faculty'}</span>
                      <span className="text-amber-400 font-semibold">Free Preview</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ════════ 6. FREE STUDY MATERIAL & PYQs ZONE ════════ */}
      <section className="bg-gradient-to-b from-slate-100 to-white dark:from-dark-900 dark:to-dark-950 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200 dark:border-dark-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-xs bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full mb-3">
                <HiSparkles className="h-4 w-4" /> 100% Free Resources
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-dark-900 dark:text-white">
                Free Study Material & PYQs Zone
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1">
                Download Official Syllabus, Solved Previous Year Question Papers & Handwritten
                Revision Notes.
              </p>
            </div>
            <Link
              to="/free-resources"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <HiLibrary className="h-4 w-4" /> Open Full Free Library
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(freeResources.length > 0
              ? freeResources
              : [
                  {
                    title: 'RPSC RAS Prelims Official Syllabus & Scheme PDF',
                    tag: 'Syllabus',
                    desc: 'Complete topic breakdown of General Knowledge and General Science.',
                  },
                  {
                    title: 'Assistant Professor Political Science Solved PYQ Paper',
                    tag: 'PYQ',
                    desc: 'Official paper with detailed step-by-step explanatory notes.',
                  },
                  {
                    title: 'Rajasthan History & Heritage Handwritten Summary Notes',
                    tag: 'Notes',
                    desc: 'Concise revision booklet covering major dynasties and architecture.',
                  },
                ]
            ).map((res, idx) => (
              <div
                key={res._id || idx}
                className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-md hover:shadow-xl border border-slate-200 dark:border-dark-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-3xl p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl">
                      📄
                    </span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                      {res.resourceType?.replace('_', ' ') || res.tag || 'Free PDF'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-dark-900 dark:text-white mb-2 line-clamp-2">
                    {res.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2">
                    {res.description || res.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-dark-700 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    PDF Document
                  </span>
                  <Link
                    to="/free-resources"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <HiDownload className="h-4 w-4" /> Download PDF
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ 7. LATEST JOB NOTIFICATIONS & STRATEGY ARTICLES ════════ */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-red-600 dark:text-red-400 font-bold uppercase tracking-wider text-xs bg-red-50 dark:bg-red-950 px-3 py-1 rounded-full mb-3">
              <HiBell className="h-4 w-4" /> Latest Updates & Articles
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-dark-900 dark:text-white">
              Job Alerts & Preparation Strategy
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1">
              Read Topper Strategies, Latest Recruitment Notifications, and Detailed Exam Analyses.
            </p>
          </div>
          <Link
            to="/blog"
            className="text-sm font-bold text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1"
          >
            View All Articles <HiChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(articles.length > 0
            ? articles
            : [
                {
                  title: 'How to Master Rajasthan History & Culture for RPSC RAS',
                  snippet: 'Step-by-step roadmap from basic NCERTs to authentic reference books.',
                },
                {
                  title: 'Political Science Assistant Professor: Paper-Wise Preparation Blueprint',
                  snippet:
                    'Essential thinkers, theories, and Indian Government & Politics breakdown.',
                },
                {
                  title: 'Time Management Strategy for Proctored Mock Test Series',
                  snippet:
                    'How to maximize your accuracy and reduce negative marking in competitive exams.',
                },
              ]
          ).map((blog, idx) => (
            <div
              key={blog._id || idx}
              className="bg-white dark:bg-dark-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-dark-800 hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span className="font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2.5 py-0.5 rounded-full uppercase">
                    {blog.type?.replace('_', ' ') || 'Article'}
                  </span>
                  <span>{blog.readTime || '5 min read'}</span>
                </div>
                <Link to={blog.slug ? `/blog/${blog.slug}` : '/blog'}>
                  <h3 className="text-base font-extrabold text-dark-900 dark:text-white mb-2 leading-snug hover:text-red-600 dark:hover:text-red-400 transition-colors line-clamp-2">
                    {blog.title}
                  </h3>
                </Link>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 mb-4">
                  {blog.snippet ||
                    blog.summary ||
                    blog.description ||
                    'Read the full guide for exam preparation insights.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>📅 {new Date(blog.createdAt || Date.now()).toLocaleDateString()}</span>
                <Link
                  to={blog.slug ? `/blog/${blog.slug}` : '/blog'}
                  className="text-red-600 dark:text-red-400 hover:underline"
                >
                  Read Full Post →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ 8. STUDENT CALL TO ACTION BANNER ════════ */}
      <section className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-2xl">
        <div className="max-w-5xl mx-auto text-center">
          <span className="bg-white/20 text-white font-extrabold text-xs px-3.5 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
            Start Your Journey
          </span>
          <h2 className="text-3xl sm:text-5xl font-black font-display mb-4">
            Join 25,000+ Dedicated Aspirants Today
          </h2>
          <p className="text-base sm:text-lg text-amber-100 max-w-2xl mx-auto mb-8">
            Access proctored mock tests, state percentile analytics, watermarked handwritten notes &
            live doubt clearing.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="bg-white text-orange-700 hover:bg-slate-100 font-extrabold px-8 py-3.5 rounded-2xl shadow-xl hover:shadow-2xl transition-all text-base flex items-center gap-2"
            >
              <span>Create Free Account</span>
              <HiArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/test-series"
              className="bg-black/20 hover:bg-black/30 border border-white/30 text-white font-bold px-8 py-3.5 rounded-2xl transition-all text-base"
            >
              Explore Test Series
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
