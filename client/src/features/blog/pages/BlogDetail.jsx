import SeoHead from '@/components/SeoHead';
import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBlogBySlug, clearCurrentBlog } from '../blogSlice';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
  HiCalendar,
  HiUser,
  HiArrowLeft,
  HiShare,
  HiHashtag,
  HiOfficeBuilding,
  HiUsers,
  HiExternalLink,
  HiBriefcase,
  HiBadgeCheck,
} from 'react-icons/hi';
import { format } from 'date-fns';

export default function BlogDetail() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { currentBlog, loading, error } = useSelector((state) => state.blogs);

  useEffect(() => {
    dispatch(fetchBlogBySlug(slug));
    return () => dispatch(clearCurrentBlog());
  }, [dispatch, slug]);

  if (loading) return <LoadingSpinner fullScreen />;

  if (error || !currentBlog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-dark-950">
        <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-4">Post not found</h2>
        <Link
          to="/blog"
          className="text-primary-600 font-bold hover:underline flex items-center gap-2"
        >
          <HiArrowLeft /> Back to Blog & Job Alerts
        </Link>
      </div>
    );
  }

  const isJobAlert = currentBlog.type === 'job_alert';
  const jobAlert = currentBlog.jobAlert || {};
  const blog = currentBlog;

  return (
    <article className="min-h-screen bg-slate-50 dark:bg-dark-950 pb-20 text-dark-900 dark:text-dark-100">
      <SeoHead
        title={blog?.title || 'Article'}
        description={blog?.excerpt?.substring(0, 160) || 'Read the full article on CivicsEdu.'}
        image={blog?.coverImage?.url}
        type="article"
        jsonLd={
          blog
            ? {
                '@context': 'https://schema.org',
                '@type': blog?.type === 'job_alert' ? 'JobPosting' : 'Article',
                headline: blog.title,
                description: blog.excerpt,
                datePublished: blog.publishedAt,
                author: { '@type': 'Person', name: blog.author?.name || 'CivicsEdu Team' },
                ...(blog.type === 'job_alert' && blog.jobAlert
                  ? {
                      hiringOrganization: {
                        '@type': 'Organization',
                        name: blog.jobAlert.organization,
                      },
                      totalJobOpenings: blog.jobAlert.totalVacancies,
                      validThrough: blog.jobAlert.applicationEnd,
                    }
                  : {}),
              }
            : null
        }
      />
      {/* Hero Section */}
      <div className="relative h-[280px] sm:h-[380px] w-full bg-slate-900">
        {currentBlog.coverImage?.url ? (
          <img
            src={currentBlog.coverImage.url}
            alt={currentBlog.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-amber-600 via-orange-600 to-red-700 opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/60 to-transparent" />

        <div className="absolute bottom-0 left-0 w-full p-4 sm:p-6 md:p-12">
          <div className="max-w-6xl mx-auto">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-amber-300 font-bold mb-4 hover:text-white transition-colors text-xs sm:text-sm"
            >
              <HiArrowLeft /> Back to Job Alerts & Blog
            </Link>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full ${
                  isJobAlert ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'
                }`}
              >
                {isJobAlert ? '📢 Job Alert Notification' : '📰 Article'}
              </span>
              {currentBlog.examCategory?.name && (
                <span className="text-[10px] font-extrabold bg-white/20 text-white px-3 py-1 rounded-full border border-white/20">
                  🎯 {currentBlog.examCategory.name}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight font-display">
              {currentBlog.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-amber-800 flex items-center justify-center text-white font-bold">
                  {currentBlog.author?.name?.charAt(0) || 'A'}
                </div>
                <span className="font-semibold text-white">
                  {currentBlog.author?.name || 'CivicsEdu Team'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md">
                <HiCalendar className="h-4 w-4 text-amber-400" />
                <span>
                  {currentBlog.publishedAt
                    ? format(new Date(currentBlog.publishedAt), 'MMMM dd, yyyy')
                    : 'Recently'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12">
        <div className="bg-white dark:bg-dark-900 rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 dark:border-dark-800">
          {/* 🔔 Job Alert Notification Card (if job_alert) */}
          {isJobAlert && (
            <div className="mb-10 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-dark-800 dark:via-dark-800 dark:to-dark-800 border-2 border-amber-300 dark:border-amber-700/50 shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-amber-200 dark:border-dark-700">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-3 py-1 rounded-full inline-block mb-2">
                    Official Recruitment Summary
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-dark-900 dark:text-white flex items-center gap-2">
                    <HiOfficeBuilding className="text-amber-600" />
                    {jobAlert.organization || 'Government Organization'}
                  </h3>
                </div>
                {jobAlert.officialNotificationUrl && (
                  <a
                    href={jobAlert.officialNotificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold px-5 py-3 rounded-xl shadow-md transition-all text-xs sm:text-sm"
                  >
                    Official PDF / Link <HiExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                {jobAlert.totalVacancies && (
                  <div className="bg-white dark:bg-dark-900 p-3.5 rounded-xl border border-amber-200 dark:border-dark-700 shadow-sm">
                    <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold mb-1">
                      Total Vacancies
                    </p>
                    <p className="font-extrabold text-base text-dark-900 dark:text-white flex items-center gap-1.5">
                      <HiUsers className="text-amber-500" /> {jobAlert.totalVacancies}
                    </p>
                  </div>
                )}
                {jobAlert.applicationStart && (
                  <div className="bg-white dark:bg-dark-900 p-3.5 rounded-xl border border-amber-200 dark:border-dark-700 shadow-sm">
                    <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold mb-1">
                      Application Start
                    </p>
                    <p className="font-bold text-green-600 dark:text-green-400">
                      {format(new Date(jobAlert.applicationStart), 'dd MMM yyyy')}
                    </p>
                  </div>
                )}
                {jobAlert.applicationEnd && (
                  <div className="bg-white dark:bg-dark-900 p-3.5 rounded-xl border border-amber-200 dark:border-dark-700 shadow-sm">
                    <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold mb-1">
                      Last Date to Apply
                    </p>
                    <p className="font-bold text-red-600 dark:text-red-400">
                      {format(new Date(jobAlert.applicationEnd), 'dd MMM yyyy')}
                    </p>
                  </div>
                )}
                {jobAlert.examDate && (
                  <div className="bg-white dark:bg-dark-900 p-3.5 rounded-xl border border-amber-200 dark:border-dark-700 shadow-sm">
                    <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold mb-1">
                      Exam Date
                    </p>
                    <p className="font-bold text-amber-600 dark:text-amber-400">
                      {format(new Date(jobAlert.examDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Article HTML Content */}
          <div
            className="prose prose-lg dark:prose-invert max-w-none prose-amber
              prose-headings:font-display prose-headings:font-bold
              prose-p:text-slate-700 dark:prose-p:text-slate-300
              prose-a:text-amber-600 dark:prose-a:text-amber-400
              prose-img:rounded-3xl prose-img:shadow-2xl leading-relaxed"
            dangerouslySetInnerHTML={{ __html: currentBlog.content }}
          />

          {/* Tags & Share */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-dark-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {currentBlog.tags?.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-3.5 py-1.5 bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  <HiHashtag className="text-amber-500" />
                  {tag}
                </span>
              ))}
            </div>
            <button
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-dark-800 hover:bg-amber-800 hover:text-white text-dark-900 dark:text-white font-bold rounded-xl transition-all text-xs cursor-pointer"
            >
              <HiShare className="h-4 w-4" /> Share Link
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
