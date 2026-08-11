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
} from 'react-icons/hi';
import api, { blogAPI, examCategoryAPI, courseAPI, testAPI } from '@/services/api';

export default function EduPortalHome() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const [alerts, setAlerts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topCourses, setTopCourses] = useState([]);
  const [freeResources, setFreeResources] = useState([]);
  const [testSeries, setTestSeries] = useState([]);
  const [articles, setArticles] = useState([]);
  const [demoLectures, setDemoLectures] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [alertsRes, categoriesRes, coursesRes, libraryRes, testsRes, articlesRes] =
          await Promise.all([
            api
              .get('/blogs', { params: { type: 'job_alert', status: 'published', limit: 5 } })
              .catch(() => ({ data: { data: [] } })),
            examCategoryAPI.getAll().catch(() => ({ data: { data: [] } })),
            courseAPI.getAll({ limit: 6, sort: 'popular' }).catch(() => ({ data: { data: [] } })),
            api
              .get('/library', { params: { accessLevel: 'all', limit: 6 } })
              .catch(() => ({ data: { data: [] } })),
            api
              .get('/tests', { params: { isPublished: true, limit: 4 } })
              .catch(() => ({ data: { data: [] } })),
            api
              .get('/blogs', { params: { type: 'article', status: 'published', limit: 3 } })
              .catch(() => ({ data: { data: [] } })),
          ]);

        setAlerts(alertsRes.data?.data?.blogs || alertsRes.data?.data || []);
        setCategories(categoriesRes.data?.data || []);
        setTopCourses(coursesRes.data?.data?.courses || coursesRes.data?.data || []);
        setFreeResources(libraryRes.data?.data?.resources || libraryRes.data?.data || []);
        setTestSeries(testsRes.data?.data?.tests || testsRes.data?.data || []);
        setArticles(articlesRes.data?.data?.blogs || articlesRes.data?.data || []);

        const fetchedCourses = coursesRes.data?.data?.courses || coursesRes.data?.data || [];
        setDemoLectures(fetchedCourses.slice(0, 3));
      } catch (err) {
        console.error('Failed to fetch home data:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const catsList = Array.isArray(categories)
    ? categories
    : Array.isArray(categories?.categories)
      ? categories.categories
      : [];

  const rajasthanExams = catsList.filter((cat) => {
    const slug = cat.slug || '';
    return [
      'ras',
      'rpsc-eo-ro',
      'rpsc-si',
      'rpsc-1st-2nd-grade',
      'rajasthan-cet',
      'patwari',
      'vdo',
    ].some((s) => slug.includes(s));
  });

  const polSciExams = catsList.filter((cat) => {
    const slug = cat.slug || '';
    return (
      ['political-science', 'uphesc', 'mppsc', 'pgt'].some((s) => slug.includes(s)) ||
      !rajasthanExams.includes(cat)
    );
  });

  const renderExamCard = (exam) => (
    <div
      key={exam._id || exam.id}
      className="group bg-white dark:bg-dark-900 rounded-3xl p-6 border border-slate-200/80 dark:border-dark-800 hover:border-amber-500 dark:hover:border-amber-400 hover:shadow-xl transition-all flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl font-bold group-hover:scale-110 transition-transform">
            {exam.icon || '📝'}
          </div>
          {exam.latestStatus && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
              {exam.latestStatus}
            </span>
          )}
        </div>
        <h4 className="text-lg font-bold text-dark-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          {exam.name}
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {exam.description}
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-dark-700 flex items-center justify-between text-xs font-semibold">
        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <HiClipboardList className="h-4 w-4 text-amber-500" />{' '}
          {exam.testCount || exam.totalTests || '0'} Tests
        </span>
        <Link
          to={`/exams/${exam.slug || exam._id}`}
          className="text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold cursor-pointer"
        >
          Exam Hub <HiChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="bg-dark-50 dark:bg-dark-950 min-h-screen text-dark-900 dark:text-dark-100">
      {/* ========================================================================= */}
      {/* 📢 1. TRENDING ALERTS TICKER */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 text-white py-2 px-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2 shrink-0 bg-black/20 px-2.5 py-1 rounded-full text-amber-200 font-bold uppercase tracking-wider text-[11px]">
            <HiBell className="h-4 w-4 animate-bounce text-amber-300" />
            Job & Exam Alerts
          </div>
          <div className="overflow-hidden whitespace-nowrap relative flex-1">
            <div className="inline-flex gap-8 animate-marquee">
              {(alerts.length > 0 ? alerts : []).map((alert) => (
                <span
                  key={alert._id || alert.id || Math.random()}
                  className="inline-flex items-center gap-2 cursor-pointer hover:underline"
                >
                  {alert.isNew && (
                    <span className="bg-white text-red-600 text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
                      New
                    </span>
                  )}
                  <span>{alert.title}</span>
                  <span className="opacity-75 text-[11px]">
                    ({new Date(alert.createdAt || alert.date || Date.now()).toLocaleDateString()})
                  </span>
                </span>
              ))}
            </div>
          </div>
          <Link
            to="/blog"
            className="hidden sm:inline-flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-all"
          >
            All Alerts <HiChevronRight />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🏠 2. HERO SECTION WITH SEARCH BAR */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-amber-950 text-white py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        {/* Glowing Orbs */}
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
              <span>Rajasthan's #1 Dedicated Portal for RPSC & Political Science</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-tight mb-4 tracking-tight">
              RPSC <span className="text-amber-400">&</span> Political Science Specialist
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-amber-100">
                Academy & Exam Portal
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto mb-8 font-normal leading-relaxed">
              Targeted Preparation for{' '}
              <strong className="text-amber-300 font-semibold">
                RAS, EO/RO, Assistant Professor, 1st & 2nd Grade Teachers
              </strong>{' '}
              with Specialized Live Classes, Watermarked Handwritten Notes & Smart Mock Tests.
            </p>

            {/* 🔍 Search Bar */}
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
                  placeholder="Search courses, exams (e.g. RAS, EO/RO, Political Science, Patwari)..."
                  className="w-full bg-transparent text-white placeholder-slate-400 focus:outline-none text-sm sm:text-base font-medium"
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg text-sm sm:text-base shrink-0 flex items-center gap-2"
              >
                <span>Search</span>
                <HiArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Quick Popular Searches */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Popular Searches:</span>
              {[
                'RPSC RAS',
                'EO/RO Part-B',
                'Political Science Asst. Professor',
                '1st Grade Teacher',
                'Patwari',
              ].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSearchQuery(tag);
                    navigate(`/courses?search=${encodeURIComponent(tag)}`);
                  }}
                  className="bg-white/5 hover:bg-white/15 text-slate-200 px-3 py-1 rounded-full border border-white/10 transition-all cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Stats Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto mt-12 pt-8 border-t border-white/10 text-center">
              {[
                { label: 'Selected Candidates', value: '1,250+', icon: '🏆' },
                { label: 'Practice Questions', value: '50,000+', icon: '📝' },
                { label: 'Free Study Materials', value: '500+ PDFs', icon: '🎁' },
                { label: 'Active Aspirants', value: '25,000+', icon: '👨‍🎓' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-xl sm:text-2xl font-black text-amber-300">{item.value}</div>
                  <div className="text-xs text-slate-300 font-medium">{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. EXAMS SECTION (RAJASTHAN & POLITICAL SCIENCE SPECIAL) */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wider text-xs bg-primary-50 dark:bg-primary-950 px-3 py-1 rounded-full mb-3">
            <HiAcademicCap className="h-4 w-4" /> Targeted Exam Categories
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-dark-900 dark:text-white">
            Specialized Courses & Test Series for Your Goal
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2">
            Structured syllabus coverage, targeted practice tests, and handwritten notes tailored
            specifically for RPSC & Higher Education Exams.
          </p>
        </div>

        <div className="space-y-12">
          {/* Rajasthan Specific */}
          {rajasthanExams.length > 0 && (
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-dark-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-green-500 inline-block" />
                Rajasthan Specific Exams
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {rajasthanExams.map(renderExamCard)}
              </div>
            </div>
          )}

          {/* Political Science Specific */}
          {polSciExams.length > 0 && (
            <div className="pt-6">
              <h3 className="text-xl sm:text-2xl font-black text-dark-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-blue-500 inline-block" />
                Political Science Special
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {polSciExams.map(renderExamCard)}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 🎁 4. FREE STUDY MATERIAL (FREE ZONE) */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-b from-slate-100 to-white dark:from-dark-900 dark:to-dark-950 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200 dark:border-dark-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 font-bold uppercase tracking-wider text-xs bg-green-50 dark:bg-green-950 px-3 py-1 rounded-full mb-3">
                <HiGift className="h-4 w-4" /> 100% Free Resources
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-dark-900 dark:text-white">
                🎁 Free Study Material Zone
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1">
                Download Official Syllabus, PYQ Papers with Solutions, Daily Current Affairs & Mind
                Maps without paying anything.
              </p>
            </div>
            <Link
              to="/library"
              className="bg-green-600 hover:bg-green-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <HiLibrary className="h-4 w-4" /> Open Full Free Library
            </Link>
          </div>

          {/* Free Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(freeResources.length > 0 ? freeResources : []).map((res) => (
              <div
                key={res._id || res.id || Math.random()}
                className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-md hover:shadow-xl border border-slate-200 dark:border-dark-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-3xl p-2.5 bg-green-50 dark:bg-green-950/50 rounded-2xl">
                      {res.icon || '📚'}
                    </span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                      {res.tag || 'Free'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-2">
                    {res.title || res.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {res.description || res.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-dark-700 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {res.count || 'Available'}
                  </span>
                  <Link
                    to="/library"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400 hover:underline"
                  >
                    <HiDownload className="h-4 w-4" /> Download PDF
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 💎 5. PAID COURSES & DEMO CLASSES (PREMIUM ZONE) */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-xs bg-amber-50 dark:bg-amber-950 px-3 py-1 rounded-full mb-3">
            <HiStar className="h-4 w-4" /> Top Selling Premium Batches
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-dark-900 dark:text-white">
            💎 Paid Target Batches & Handwritten Notes
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2">
            Includes HD Live/Recorded Classes, Watermarked Premium Notes, Topicwise Practice Tests &
            Personal Doubt Support.
          </p>
        </div>

        {/* Paid Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {(topCourses.length > 0 ? topCourses : []).map((course) => (
            <div
              key={course._id || course.id || Math.random()}
              className="bg-white dark:bg-dark-900 rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-dark-800 flex flex-col justify-between hover:shadow-2xl transition-all"
            >
              <div className="p-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-500 text-white shadow-sm">
                    {course.badge || 'Premium'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    ⭐ {course.rating || '4.5'} ({course.enrolledCount || course.studentsCount || 0}{' '}
                    Students)
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-dark-900 dark:text-white mb-2 leading-snug">
                  {course.title}
                </h3>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-4 uppercase tracking-wider">
                  {course.category?.name || course.category || 'Course'}
                </div>

                <ul className="space-y-2 mb-6">
                  {(course.features || ['Live Classes', 'Notes', 'Mock Tests']).map((feat, idx) => (
                    <li
                      key={idx}
                      className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2"
                    >
                      <HiCheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-dark-800/50 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 line-through">₹{course.price || 999}</div>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    ₹{course.salePrice || course.price || 499}
                  </div>
                </div>
                <Link
                  to={`/courses/${course._id}`}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Enroll Now <HiArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* 🆓 DEMO CLASSES SECTION */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <span className="bg-amber-500 text-dark-900 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                🆓 Demo Classes (Trust Building)
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold mt-2">
                Watch Sample Lectures Before Enrolling
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm mt-1">
                Experience our high-level concept clarity and Teaching Methodology for Free.
              </p>
            </div>
            <Link
              to="/courses"
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all"
            >
              View All Free Demos
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(demoLectures.length > 0 ? demoLectures : []).map((demo) => (
              <div
                key={demo._id || demo.id || Math.random()}
                className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-amber-400/50 transition-all group"
              >
                <div className="relative aspect-video bg-black/50 overflow-hidden">
                  <img
                    src={demo.thumbnail || 'https://via.placeholder.com/300x170?text=Demo+Class'}
                    alt={demo.title || 'Demo Class'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-12 w-12 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                      <HiPlay className="h-6 w-6 ml-1" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {demo.duration || '45:00'}
                  </span>
                </div>
                <div className="p-4">
                  <h4 className="text-sm font-bold line-clamp-2 mb-2 group-hover:text-amber-300 transition-colors">
                    {demo.title || 'Demo Lecture'}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{demo.teacher?.name || demo.teacher || 'Expert Faculty'}</span>
                    <span className="text-amber-400 font-semibold">
                      {demo.views || '1K+'} Views
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 📝 6. TEST SERIES & MOCK TESTS PORTAL */}
      {/* ========================================================================= */}
      <section className="bg-slate-100 dark:bg-dark-900 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-dark-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider text-xs bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full mb-3">
              <HiClipboardList className="h-4 w-4" /> Proctored Online Test Series
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-dark-900 dark:text-white">
              📝 Real Exam Like Online Test Series
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2">
              Practice Subject-Wise Tests & Full-Length Mock Exams with Instant Percentile, State
              Rank & Detailed Explanations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(testSeries.length > 0 ? testSeries : []).map((feature, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-dark-700 flex flex-col justify-between hover:scale-105 transition-all"
              >
                <div>
                  <span className="text-3xl mb-3 block">{feature.icon || '📝'}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full mb-2 inline-block">
                    {feature.category?.name || feature.category || 'Test'}
                  </span>
                  <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-2">
                    {feature.title || feature.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description || feature.desc}
                  </p>
                </div>
                <Link
                  to="/tests"
                  className="mt-6 inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md"
                >
                  Start Practice Test <HiArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 📰 7. BLOG & JOB ALERTS */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-red-600 dark:text-red-400 font-bold uppercase tracking-wider text-xs bg-red-50 dark:bg-red-950 px-3 py-1 rounded-full mb-3">
              <HiBell className="h-4 w-4" /> Latest Updates & Articles
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-dark-900 dark:text-white">
              📰 Job Alerts & Subject Discussions
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1">
              Read Topper Strategies, Latest Recruitment News, and Deep Dives into Difficult
              Political Science Concepts.
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
          {(articles.length > 0 ? articles : []).map((blog) => (
            <div
              key={blog._id || blog.id || Math.random()}
              className="bg-white dark:bg-dark-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-dark-800 hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                  <span className="font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2.5 py-0.5 rounded-full">
                    {blog.category?.name || blog.category || 'Article'}
                  </span>
                  <span>{blog.readTime || '5 min read'}</span>
                </div>
                <h3 className="text-base font-extrabold text-dark-900 dark:text-white mb-2 leading-snug hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer">
                  {blog.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 mb-4">
                  {blog.snippet ||
                    blog.excerpt ||
                    (blog.content
                      ? blog.content.substring(0, 100)
                      : 'Read more about this article...')}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>
                  📅 {new Date(blog.createdAt || blog.date || Date.now()).toLocaleDateString()}
                </span>
                <Link to="/blog" className="text-red-600 dark:text-red-400 hover:underline">
                  Read Full Post →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 👤 8. STUDENT DASHBOARD CALL TO ACTION */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-2xl">
        <div className="max-w-5xl mx-auto text-center">
          <span className="bg-white/20 text-white font-extrabold text-xs px-3.5 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
            Ready to Begin Your Preparation?
          </span>
          <h2 className="text-3xl sm:text-5xl font-black font-display mb-4">
            Join 25,000+ RPSC & Political Science Aspirants Today
          </h2>
          <p className="text-base sm:text-lg text-amber-100 max-w-2xl mx-auto mb-8">
            Access My Courses, Instant Test Analysis, Watermarked PDFs & Free Daily Quizzes inside
            your Student Dashboard.
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
              to="/login"
              className="bg-black/20 hover:bg-black/30 border border-white/30 text-white font-bold px-8 py-3.5 rounded-2xl transition-all text-base"
            >
              Student Login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function HiGift(props) {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={props.className}
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M5 5a3 3 0 015-2.236A3 3 0 0115 5h2a1 1 0 011 1v3a1 1 0 01-1 1h-1v7a2 2 0 01-2 2H5a2 2 0 01-2-2V10H2a1 1 0 01-1-1V6a1 1 0 011-1h3zm3-2a1 1 0 00-.894.553L7.382 4H9.618l-.276-.447A1 1 0 008.447 3zM11.553 3a1 1 0 00-.894.553L10.382 4h2.236l-.276-.447A1 1 0 0011.553 3zM3 7v2h6V7H3zm8 0v2h6V7h-6zm-8 4v6h6v-6H3zm8 0v6h6v-6h-6z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
}
