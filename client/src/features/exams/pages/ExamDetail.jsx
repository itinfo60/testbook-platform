import SeoHead from '@/components/SeoHead';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  HiOutlineAcademicCap,
  HiOutlineClipboardList,
  HiOutlineDocumentText,
  HiOutlineNewspaper,
  HiOutlineInformationCircle,
  HiOutlineBookOpen,
  HiOutlineViewList,
  HiOutlineCheckCircle,
  HiExternalLink,
  HiDownload,
  HiX,
  HiInformationCircle,
  HiArrowRight,
} from 'react-icons/hi';
import api from '@/services/api';
import CourseCard from '@/features/course/components/CourseCard';
import TestCard from '@/features/test/components/TestCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Modal from '@/components/ui/Modal';

export default function ExamDetail() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedResource, setSelectedResource] = useState(null);

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/categories/${slug}`);
        const raw = response.data;
        const result = raw?.data?.category ? raw.data : raw?.category ? raw : raw?.data || raw;

        if (result && result.category) {
          setData(result);
        } else if (result && result._id) {
          setData({ category: result, courses: [], tests: [], blogs: [], resources: [] });
        } else {
          setError('Exam category not found');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load exam details');
      } finally {
        setLoading(false);
      }
    };
    if (slug) {
      fetchExamData();
    }
  }, [slug]);

  // Scrollspy to automatically highlight active tab as user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = [
        'overview',
        'courses',
        'tests',
        'syllabus',
        'pattern',
        'eligibility',
        'pyqs',
        'resources',
        'updates',
      ];
      const scrollPosition = window.scrollY + 180;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(`section-${sectionIds[i]}`);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      const navOffset = 90;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - navOffset,
        behavior: 'smooth',
      });
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (error) return <div className="text-center py-20 text-red-500 font-bold">{error}</div>;
  if (!data || !data.category)
    return <div className="text-center py-20 text-slate-500 font-bold">Exam not found</div>;

  const { category, courses = [], tests = [], blogs = [], resources = [] } = data;

  const pyqs = resources.filter((r) => r.resourceType === 'pyq' || r.resourceType === 'solved_pyq');
  const freeResources = resources.filter(
    (r) => r.resourceType !== 'pyq' && r.resourceType !== 'solved_pyq'
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: HiOutlineInformationCircle },
    { id: 'courses', label: `Courses (${courses.length})`, icon: HiOutlineAcademicCap },
    { id: 'tests', label: `Test Series (${tests.length})`, icon: HiOutlineClipboardList },
    { id: 'syllabus', label: 'Syllabus', icon: HiOutlineBookOpen },
    { id: 'pattern', label: 'Exam Pattern', icon: HiOutlineViewList },
    { id: 'eligibility', label: 'Eligibility', icon: HiOutlineCheckCircle },
    { id: 'pyqs', label: `PYQs (${pyqs.length})`, icon: HiOutlineDocumentText },
    { id: 'resources', label: `Free Notes (${freeResources.length})`, icon: HiOutlineDocumentText },
    { id: 'updates', label: `Updates (${blogs.length})`, icon: HiOutlineNewspaper },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      <SeoHead
        title={`${category?.name || 'Exam'} — Syllabus, Tests & Courses`}
        description={`Complete preparation hub for ${category?.name || 'this exam'}. Access syllabus, previous year papers, mock test series, and specialized courses.`}
        type="website"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: category?.name,
          description: category?.description || `Preparation hub for ${category?.name}`,
          provider: { '@type': 'Organization', name: 'CivicsEdu' },
        }}
      />
      {/* ════════ HERO SECTION (Without Key Dates Widget) ════════ */}
      <div className="bg-slate-950 dark:bg-slate-950 text-white pt-14 pb-14 relative overflow-hidden shadow-premium">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-600/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="container mx-auto px-4 relative z-10 max-w-7xl">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex items-start md:items-center gap-6">
              <div className="flex-shrink-0 inline-flex items-center justify-center p-5 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 text-5xl">
                {category.icon || '🏛️'}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {category.latestStatus && (
                    <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-green-500/20 text-green-200 border border-green-400/30">
                      Status: {category.latestStatus}
                    </span>
                  )}
                  {category.conductingBody && (
                    <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                      By: {category.conductingBody}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-5xl font-black font-display mb-3 tracking-tight">
                  {category.name}
                </h1>
                <p className="text-sm md:text-base text-amber-100 max-w-3xl leading-relaxed line-clamp-2">
                  {category.description ||
                    `Complete syllabus coverage, previous year question papers, specialized courses, and full-length mock tests for ${category.name}.`}
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-4">
                  {category.officialWebsite && (
                    <a
                      href={category.officialWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold text-amber-200 hover:text-white transition-colors bg-white/10 px-3.5 py-2 rounded-xl border border-white/10"
                    >
                      <HiExternalLink className="h-4 w-4" /> Official Website
                    </a>
                  )}
                  <button
                    onClick={() => scrollToSection('tests')}
                    className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-900 bg-white hover:bg-amber-50 px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    <span>View Test Series</span>
                    <HiArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => scrollToSection('courses')}
                    className="inline-flex items-center gap-2 text-xs font-extrabold text-white bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    <span>Explore Courses</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════ STICKY SECTION NAVIGATOR ════════ */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto gap-1.5 hide-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-800 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ════════ MAIN CONTENT SECTIONS (SEQUENTIAL SCROLL) ════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* ── Section 1: Overview ── */}
        <section
          id="section-overview"
          className="bg-white dark:bg-slate-950 rounded-3xl shadow-premium border border-slate-200 dark:border-slate-800 p-6 md:p-8 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-5 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-bold">
              🏛️
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                About {category.name}
              </h2>
              <p className="text-xs text-slate-500">
                Official Exam Overview & Notification Summary
              </p>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
            {category.description ? (
              <div dangerouslySetInnerHTML={{ __html: category.description }} />
            ) : (
              <p>
                {category.name} is one of the premier competitive examinations. Our platform
                provides comprehensive target courses, test series, handwritten notes, and solved
                past papers curated by top faculties.
              </p>
            )}
          </div>
        </section>

        {/* ── Section 2: Courses ── */}
        <section
          id="section-courses"
          className="bg-white dark:bg-slate-950 rounded-3xl shadow-premium border border-slate-200 dark:border-slate-800 p-6 md:p-8 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold">
                🎓
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Courses ({courses.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Live & recorded classes tailored for {category.name}
                </p>
              </div>
            </div>
            <Link
              to="/courses"
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              Browse All Courses <HiArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <div className="text-3xl mb-2">🎓</div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
                New Courses Coming Soon
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Our faculty is finalizing new course materials for {category.name}.
              </p>
              <Link to="/courses" className="btn-primary text-xs font-bold px-4 py-2">
                Explore Available Courses
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          )}
        </section>

        {/* ── Section 3: Test Series ── */}
        <section
          id="section-tests"
          className="bg-white dark:bg-slate-950 rounded-3xl shadow-premium border border-slate-200 dark:border-slate-800 p-6 md:p-8 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold">
                📝
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Mock Test Series & Chapter Practice ({tests.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Real exam pattern mocks with state rank analytics
                </p>
              </div>
            </div>
            <Link
              to="/test-series"
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              Explore All Test Series <HiArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {tests.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <div className="text-3xl mb-2">📝</div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
                Full Length Test Series Available
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Explore chapter tests, previous year papers & full-length test series in our test
                hub.
              </p>
              <Link to="/test-series" className="btn-primary text-xs font-bold px-4 py-2">
                Open Test Series Portal
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tests.map((test) => (
                <TestCard key={test._id} test={test} />
              ))}
            </div>
          )}
        </section>

        {/* ── Section 4: Official Syllabus ── */}
        <section
          id="section-syllabus"
          className="bg-white dark:bg-slate-950 rounded-3xl shadow-premium border border-slate-200 dark:border-slate-800 p-6 md:p-8 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-5 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div className="h-10 w-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl font-bold">
              📖
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Official Syllabus
              </h2>
              <p className="text-xs text-slate-500">Topic-wise detailed syllabus breakdown</p>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
            {category.syllabus ? (
              <div dangerouslySetInnerHTML={{ __html: category.syllabus }} />
            ) : (
              <div className="space-y-4">
                <p>
                  The official syllabus for <strong>{category.name}</strong> comprises:
                </p>
                <div className="grid sm:grid-cols-2 gap-4 not-prose">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2">
                      1. General Studies & Core Concepts
                    </h3>
                    <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside">
                      <li>Indian Constitution, Polity & Governance</li>
                      <li>History, Art, Culture & Heritage</li>
                      <li>Geography of India and World</li>
                      <li>Indian Economy & Key Budget Concepts</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2">
                      2. State Specific & Mental Ability
                    </h3>
                    <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside">
                      <li>Rajasthan History, Art, Fairs & Festivals</li>
                      <li>State Administrative Framework & Schemes</li>
                      <li>Logical Reasoning & Analytical Ability</li>
                      <li>Current Affairs & Recent Developments</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Section 5: Exam Pattern & Scheme ── */}
        <section
          id="section-pattern"
          className="bg-white dark:bg-slate-950 rounded-3xl shadow-premium border border-slate-200 dark:border-slate-800 p-6 md:p-8 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-5 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-bold">
              📊
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Exam Pattern & Scheme of Marks
              </h2>
              <p className="text-xs text-slate-500">
                Duration, marks, questions count & negative marking scheme
              </p>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
            {category.examPattern ? (
              <div dangerouslySetInnerHTML={{ __html: category.examPattern }} />
            ) : (
              <div className="overflow-x-auto not-prose">
                <table className="w-full text-xs sm:text-sm text-left border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[11px]">
                    <tr>
                      <th className="p-3.5">Stage / Paper</th>
                      <th className="p-3.5">Subject</th>
                      <th className="p-3.5">Total Questions</th>
                      <th className="p-3.5">Max Marks</th>
                      <th className="p-3.5">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                    <tr>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        Preliminary Examination
                      </td>
                      <td className="p-3.5">General Knowledge & General Science</td>
                      <td className="p-3.5">150 Questions</td>
                      <td className="p-3.5 font-bold text-amber-600 dark:text-amber-400">
                        200 Marks
                      </td>
                      <td className="p-3.5">3 Hours (180 Mins)</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        Negative Marking
                      </td>
                      <td className="p-3.5" colSpan={4}>
                        1/3rd (0.33) marks deducted for every incorrect response.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* ── Section 6: Eligibility Criteria & Selection Process ── */}
        <section
          id="section-eligibility"
          className="bg-white dark:bg-slate-950 rounded-3xl shadow-premium border border-slate-200 dark:border-slate-800 p-6 md:p-8 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-5 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div className="h-10 w-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xl font-bold">
              ✅
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Eligibility & Selection Process
              </h2>
              <p className="text-xs text-slate-500">
                Age requirements, educational qualifications & selection stages
              </p>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
            {category.eligibility || category.selectionProcess ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: `${category.eligibility || ''} ${category.selectionProcess || ''}`,
                }}
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 not-prose">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2">
                    Educational Qualifications & Age Limit
                  </h3>
                  <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside">
                    <li>Bachelor’s Degree in any discipline from a recognized University.</li>
                    <li>
                      Age Limit: 21 to 40 years (Relaxations applicable as per State Government
                      rules).
                    </li>
                  </ul>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2">
                    Selection Process Stages
                  </h3>
                  <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside">
                    <li>Stage 1: Preliminary Screening Examination (Objective MCQs)</li>
                    <li>Stage 2: Main Written Examination (Descriptive Papers)</li>
                    <li>Stage 3: Personality Test & Interview Round</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Section 7: Solved Previous Year Papers (PYQs) ── */}
        <section
          id="section-pyqs"
          className="bg-white dark:bg-slate-950 rounded-3xl shadow-premium border border-slate-200 dark:border-slate-800 p-6 md:p-8 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold">
                📄
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Solved Previous Year Question Papers ({pyqs.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Official authentic papers with solution keys
                </p>
              </div>
            </div>
            <Link
              to="/free-resources?tab=pyq"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View PYQs Archive <HiArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {pyqs.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <div className="text-3xl mb-2">📝</div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
                Official Solved Papers Library
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Access official previous papers across recent exam cycles in our digital library.
              </p>
              <Link
                to="/free-resources?tab=pyq"
                className="btn-primary text-xs font-bold px-4 py-2"
              >
                Browse PYQ Papers
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pyqs.map((resource) => (
                <button
                  key={resource._id}
                  onClick={() => setSelectedResource(resource)}
                  className="flex items-start gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all bg-slate-50 dark:bg-slate-900/50 text-left cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-blue-600 text-xl font-bold group-hover:scale-105 transition-transform">
                    📝
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {resource.title}
                    </h3>
                    {resource.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {resource.description}
                      </p>
                    )}
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-2 inline-flex items-center gap-1">
                      View Paper Details →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Section 8: Free Study Material & Handwritten Notes ── */}
        <section
          id="section-resources"
          className="bg-white dark:bg-slate-950 rounded-3xl shadow-premium border border-slate-200 dark:border-slate-800 p-6 md:p-8 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold">
                🎁
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Free Notes & Study PDFs ({freeResources.length})
                </h2>
                <p className="text-xs text-slate-500">Free chapter summaries & handwritten notes</p>
              </div>
            </div>
            <Link
              to="/free-resources"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              Open Free Zone <HiArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {freeResources.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <div className="text-3xl mb-2">🎁</div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
                Handwritten PDF Notes & Formula Sheets
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Download free revision notes and current affairs digests directly from our
                repository.
              </p>
              <Link to="/free-resources" className="btn-primary text-xs font-bold px-4 py-2">
                Access Free Downloads
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {freeResources.map((resource) => (
                <button
                  key={resource._id}
                  onClick={() => setSelectedResource(resource)}
                  className="flex items-start gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all bg-slate-50 dark:bg-slate-900/50 text-left cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 text-emerald-600 text-xl font-bold group-hover:scale-105 transition-transform">
                    📄
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {resource.title}
                    </h3>
                    {resource.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {resource.description}
                      </p>
                    )}
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-2 inline-flex items-center gap-1">
                      View Details & Download →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Section 9: Updates & Articles ── */}
        <section
          id="section-updates"
          className="bg-white dark:bg-slate-950 rounded-3xl shadow-premium border border-slate-200 dark:border-slate-800 p-6 md:p-8 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xl font-bold">
                📰
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Notifications & Strategy Articles ({blogs.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Official news, notifications & preparation strategy
                </p>
              </div>
            </div>
            <Link
              to="/blog?type=job_alert"
              className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
            >
              View All News <HiArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {blogs.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <div className="text-3xl mb-2">📰</div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
                Latest Job Alerts & Exam News
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Stay updated with vacancy notifications, admit card releases, and answer keys.
              </p>
              <Link to="/blog?type=job_alert" className="btn-primary text-xs font-bold px-4 py-2">
                Open Job Alerts
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {blogs.map((blog) => (
                <Link
                  key={blog._id}
                  to={`/blog/${blog.slug || blog._id}`}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-orange-500 transition-all bg-slate-50 dark:bg-slate-900/50 block group"
                >
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 px-2 py-0.5 rounded-md mb-2 inline-block">
                    {blog.type?.replace('_', ' ') || 'Notification'}
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1 group-hover:text-orange-600 transition-colors">
                    {blog.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{blog.summary}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Resource Download / Preview Modal */}
      {selectedResource && (
        <Modal
          isOpen={!!selectedResource}
          onClose={() => setSelectedResource(null)}
          title="Study Material Details"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/40">
              <div className="text-3xl">📄</div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {selectedResource.title}
                </h3>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                  {selectedResource.resourceType?.replace('_', ' ') || 'PDF Document'}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedResource.description ||
                'Official verified study resource provided for self-study and revision.'}
            </p>

            <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-2xl text-xs space-y-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              <p>
                • <strong>Format:</strong> High-Resolution PDF Document
              </p>
              <p>
                • <strong>Category:</strong> {category.name}
              </p>
              <p>
                • <strong>Access:</strong> 100% Free for Aspirants
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedResource(null)}
                className="btn-outline text-xs px-4 py-2"
              >
                Close
              </button>
              {selectedResource.fileUrl ? (
                <a
                  href={selectedResource.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                >
                  <HiDownload className="h-4 w-4" /> Download PDF
                </a>
              ) : (
                <Link
                  to="/free-resources"
                  className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                >
                  <HiDownload className="h-4 w-4" /> Access in Free Zone
                </Link>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
