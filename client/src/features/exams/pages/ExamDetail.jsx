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
  HiOutlineCalendar,
  HiExternalLink,
} from 'react-icons/hi';
import api from '@/services/api';
import CourseCard from '@/features/course/components/CourseCard';
import TestCard from '@/features/test/components/TestCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function ExamDetail() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

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

  useEffect(() => {
    if (data?.category?.name) {
      document.title = `${data.category.name} Preparation - EduPortal`;
    }
  }, [data]);

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
    { id: 'syllabus', label: 'Syllabus', icon: HiOutlineBookOpen },
    { id: 'pattern', label: 'Exam Pattern', icon: HiOutlineViewList },
    { id: 'eligibility', label: 'Eligibility', icon: HiOutlineCheckCircle },
    { id: 'courses', label: `Courses (${courses.length})`, icon: HiOutlineAcademicCap },
    { id: 'tests', label: `Test Series (${tests.length})`, icon: HiOutlineClipboardList },
    {
      id: 'resources',
      label: `Free Resources (${freeResources.length})`,
      icon: HiOutlineDocumentText,
    },
    { id: 'pyqs', label: `PYQs (${pyqs.length})`, icon: HiOutlineDocumentText },
    { id: 'updates', label: `Updates (${blogs.length})`, icon: HiOutlineNewspaper },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-700 text-white pt-16 pb-16 relative overflow-hidden shadow-lg">
        <div className="container mx-auto px-4 relative z-10 max-w-7xl">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
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
                <h1 className="text-3xl md:text-5xl font-black font-display mb-3">
                  {category.name} Preparation
                </h1>
                <p className="text-base md:text-lg text-amber-100 max-w-3xl line-clamp-2">
                  {category.description ||
                    `Complete preparation material, courses, and mock tests for ${category.name} exam.`}
                </p>

                {category.officialWebsite && (
                  <a
                    href={category.officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 text-xs font-bold text-amber-200 hover:text-white transition-colors bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10"
                  >
                    <HiExternalLink className="h-4 w-4" /> Official Website
                  </a>
                )}
              </div>
            </div>

            {/* Important Dates Widget */}
            {category.importantDates && category.importantDates.length > 0 && (
              <div className="w-full md:w-80 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shrink-0">
                <h3 className="font-extrabold flex items-center gap-2 mb-3 border-b border-white/20 pb-2 text-sm uppercase tracking-wider">
                  <HiOutlineCalendar className="h-5 w-5" /> Key Dates
                </h3>
                <ul className="space-y-2.5">
                  {category.importantDates.slice(0, 4).map((dateItem, idx) => (
                    <li key={idx} className="flex justify-between items-start text-xs font-medium">
                      <span className="text-amber-100">{dateItem.label}</span>
                      <span className="font-bold text-white text-right ml-2">
                        {dateItem.date
                          ? new Date(dateItem.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'TBA'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        {/* Tab Navigation */}
        <div className="flex overflow-x-auto bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 p-1.5 mb-8 gap-1 hide-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8 min-h-[400px]">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fadeIn">
              <section>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-4">
                  About {category.name}
                </h2>
                <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed">
                  {category.description ? (
                    <div dangerouslySetInnerHTML={{ __html: category.description }} />
                  ) : (
                    <p>No detailed overview available yet.</p>
                  )}
                </div>
              </section>

              {category.selectionProcess && (
                <section>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-4">
                    Selection Process
                  </h2>
                  <div
                    className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700"
                    dangerouslySetInnerHTML={{ __html: category.selectionProcess }}
                  />
                </section>
              )}
            </div>
          )}

          {activeTab === 'syllabus' && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">
                Official Exam Syllabus
              </h2>
              {category.syllabus ? (
                <div
                  className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: category.syllabus }}
                />
              ) : (
                <p className="text-slate-500">
                  Syllabus details have not been uploaded for this exam yet.
                </p>
              )}
            </div>
          )}

          {activeTab === 'pattern' && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">
                Exam Pattern & Scheme
              </h2>
              {category.examPattern ? (
                <div
                  className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: category.examPattern }}
                />
              ) : (
                <p className="text-slate-500">Exam pattern information is not available yet.</p>
              )}
            </div>
          )}

          {activeTab === 'eligibility' && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">
                Eligibility & Age Limit
              </h2>
              {category.eligibility ? (
                <div
                  className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: category.eligibility }}
                />
              ) : (
                <p className="text-slate-500">
                  Eligibility criteria details have not been published yet.
                </p>
              )}
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">
                Recommended Target Batches
              </h2>
              {courses.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="text-4xl mb-3">🎓</div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                    No courses published yet for this exam
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                    Our faculty is preparing a specialized target batch for {category.name}.
                  </p>
                  <Link
                    to="/courses"
                    className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl transition-colors inline-block"
                  >
                    Explore All Courses
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {courses.map((course) => (
                    <CourseCard key={course._id} course={course} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">
                Mock Test Series
              </h2>
              {tests.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="text-4xl mb-3">📝</div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                    No test series available for this exam yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                    Mock tests according to the latest exam pattern will be added soon.
                  </p>
                  <Link
                    to="/tests"
                    className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl transition-colors inline-block"
                  >
                    Explore All Tests
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {tests.map((test) => (
                    <TestCard key={test._id} test={test} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">
                Free Study Material & Notes
              </h2>
              {freeResources.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="text-4xl mb-3">🎁</div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                    No free study PDFs uploaded yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                    Check our main Free Zone library for general study materials.
                  </p>
                  <Link
                    to="/free-resources"
                    className="text-xs font-bold bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors inline-block"
                  >
                    Go to Free Zone
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {freeResources.map((resource) => (
                    <a
                      key={resource._id}
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 transition-all bg-slate-50 dark:bg-slate-900/50"
                    >
                      <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 text-amber-600 text-xl font-bold">
                        📄
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                          {resource.title}
                        </h4>
                        {resource.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {resource.description}
                          </p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'pyqs' && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">
                Solved Previous Year Papers (PYQs)
              </h2>
              {pyqs.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="text-4xl mb-3">📝</div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                    No PYQ papers uploaded yet for {category.name}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                    Official solved question papers will be made available shortly.
                  </p>
                  <Link
                    to="/free-resources?tab=pyq"
                    className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl transition-colors inline-block"
                  >
                    View All PYQs Library
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pyqs.map((resource) => (
                    <a
                      key={resource._id}
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all bg-slate-50 dark:bg-slate-900/50"
                    >
                      <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-blue-600 text-xl font-bold">
                        📝
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                          {resource.title}
                        </h4>
                        {resource.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {resource.description}
                          </p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'updates' && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">
                Latest Job Notifications & Articles
              </h2>
              {blogs.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="text-4xl mb-3">📰</div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                    No updates posted yet for this exam
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                    Check our latest job alerts portal for active notifications.
                  </p>
                  <Link
                    to="/blog?type=job_alert"
                    className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-colors inline-block"
                  >
                    View Job Alerts
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {blogs.map((blog) => {
                    const isJob = blog.type === 'job_alert';
                    const jobAlert = blog.jobAlert || {};
                    return (
                      <Link
                        key={blog._id}
                        to={`/blog/${blog.slug}`}
                        className="group flex flex-col rounded-2xl border overflow-hidden hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-900 hover:border-amber-400 dark:hover:border-amber-600 border-slate-200 dark:border-slate-700"
                      >
                        {/* Top accent */}
                        <div
                          className={`h-1 w-full ${isJob ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
                        />
                        <div className="p-4">
                          {/* Badge + Date row */}
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span
                              className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                isJob
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                  : blog.type === 'current_affairs'
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              }`}
                            >
                              {isJob
                                ? '📢 Job Alert'
                                : blog.type === 'current_affairs'
                                  ? '📌 Current Affairs'
                                  : '📰 Article'}
                            </span>
                            {blog.publishedAt && (
                              <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                {new Date(blog.publishedAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: '2-digit',
                                })}
                              </span>
                            )}
                          </div>

                          {/* Organization (job alerts only) */}
                          {isJob && jobAlert.organization && (
                            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                              {jobAlert.organization}
                            </p>
                          )}

                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors mb-2 leading-snug">
                            {blog.title}
                          </h4>

                          {blog.excerpt && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                              {blog.excerpt}
                            </p>
                          )}

                          {/* Job Alert Key Dates */}
                          {isJob &&
                            (jobAlert.totalVacancies ||
                              jobAlert.applicationEnd ||
                              jobAlert.examDate) && (
                              <div className="flex flex-wrap gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                                {jobAlert.totalVacancies > 0 && (
                                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1 text-center">
                                    <p className="text-xs font-black text-amber-600 dark:text-amber-400">
                                      {jobAlert.totalVacancies.toLocaleString()}
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                      Posts
                                    </p>
                                  </div>
                                )}
                                {jobAlert.applicationEnd && (
                                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-2.5 py-1">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                                      Last Date
                                    </p>
                                    <p className="text-xs font-extrabold text-red-600 dark:text-red-400">
                                      {new Date(jobAlert.applicationEnd).toLocaleDateString(
                                        'en-IN',
                                        { day: 'numeric', month: 'short' }
                                      )}
                                    </p>
                                  </div>
                                )}
                                {jobAlert.examDate && (
                                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-2.5 py-1">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                                      Exam
                                    </p>
                                    <p className="text-xs font-extrabold text-green-600 dark:text-green-400">
                                      {new Date(jobAlert.examDate).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                      })}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
