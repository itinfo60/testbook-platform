import SeoHead from '@/components/SeoHead';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  FaWhatsapp,
  FaTelegramPlane,
  FaTwitter,
  FaLinkedinIn,
  FaLink,
  FaCheck,
} from 'react-icons/fa';
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
  HiDocumentText,
  HiDownload,
  HiEye,
} from 'react-icons/hi';
import { format } from 'date-fns';

export default function BlogDetail() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { currentBlog, loading, error } = useSelector((state) => state.blogs);
  const [copied, setCopied] = useState(false);

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

  const getShareUrl = () => {
    return typeof window !== 'undefined' ? window.location.href : '';
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success('Article link copied to clipboard! 📋');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Failed to copy link. Please copy URL from browser.');
    }
  };

  const handleShare = async () => {
    const url = getShareUrl();
    const title = currentBlog?.title || 'Article';
    const text = currentBlog?.excerpt || `Read "${title}" on CivicsEdu`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    handleCopyLink();
  };

  const shareTitle = encodeURIComponent(currentBlog?.title || 'CivicsEdu Article');
  const shareUrl = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '');

  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareTitle}%20${shareUrl}`;
  const telegramUrl = `https://t.me/share/url?url=${shareUrl}&text=${shareTitle}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;

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
              {(currentBlog.categoryInfo?.name || currentBlog.examCategory?.name) && (
                <span className="text-[10px] font-extrabold bg-white/20 text-white px-3 py-1 rounded-full border border-white/20">
                  {currentBlog.categoryInfo?.icon || currentBlog.examCategory?.icon || '🎯'}{' '}
                  {currentBlog.categoryInfo?.name || currentBlog.examCategory?.name}
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
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md">
                <HiEye className="h-4 w-4 text-emerald-400" />
                <span>{currentBlog.views || 1} Views</span>
              </div>
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3.5 py-1.5 rounded-xl backdrop-blur-md transition-colors cursor-pointer font-bold select-none active:scale-95"
                title="Share this article"
              >
                <HiShare className="h-4 w-4" />
                <span>Share</span>
              </button>
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

          {/* Free Attached Resources / Study Material */}
          {Array.isArray(currentBlog.attachedResources) &&
            currentBlog.attachedResources.length > 0 && (
              <div className="mt-12 p-6 sm:p-8 bg-amber-500/5 dark:bg-dark-900 border border-amber-200 dark:border-amber-900/40 rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="p-2 rounded-xl bg-amber-500 text-white font-bold text-lg">
                    🎁
                  </span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-dark-900 dark:text-white">
                      Free Study Material & Attached Resources
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      Download notes, PYQs, and syllabus guides related to this article
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  {currentBlog.attachedResources.map((res) => {
                    const downloadUrl =
                      res.url ||
                      res.fileUrl ||
                      (res.fileData && (res.fileData.secure_url || res.fileData.url));
                    return (
                      <div
                        key={res.id || res._id}
                        className="bg-white dark:bg-dark-800 p-4 rounded-2xl border border-slate-200 dark:border-dark-700 shadow-sm flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shrink-0">
                            <HiDocumentText className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-dark-900 dark:text-white truncate">
                              {res.title}
                            </h4>
                            {res.description && (
                              <p className="text-xs text-slate-500 truncate">{res.description}</p>
                            )}
                            <span className="inline-block mt-1 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                              {res.type || 'Resource'}
                            </span>
                          </div>
                        </div>

                        {downloadUrl ? (
                          <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="px-3.5 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
                          >
                            <HiDownload className="h-4 w-4" /> Download
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">Available in Library</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* Tags & Social Share Section */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-dark-800 space-y-6">
            {/* Tags */}
            {currentBlog.tags && currentBlog.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400 mr-1">Tags:</span>
                {currentBlog.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-3.5 py-1.5 bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <HiHashtag className="text-amber-500" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Social Share Toolbar */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-dark-800/60 border border-slate-200 dark:border-dark-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <HiShare className="h-4 w-4 text-amber-500" /> Share this article:
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* WhatsApp */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  title="Share on WhatsApp"
                >
                  <FaWhatsapp className="h-4 w-4" /> WhatsApp
                </a>

                {/* Telegram */}
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  title="Share on Telegram"
                >
                  <FaTelegramPlane className="h-4 w-4" /> Telegram
                </a>

                {/* Twitter / X */}
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  title="Share on X"
                >
                  <FaTwitter className="h-4 w-4" /> X
                </a>

                {/* LinkedIn */}
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  title="Share on LinkedIn"
                >
                  <FaLinkedinIn className="h-4 w-4" /> LinkedIn
                </a>

                {/* Copy Link / Native Share */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-dark-900 hover:bg-amber-50 dark:hover:bg-dark-800 text-dark-900 dark:text-white border border-slate-300 dark:border-dark-600 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Copy link or native share"
                >
                  {copied ? (
                    <>
                      <FaCheck className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                        Copied!
                      </span>
                    </>
                  ) : (
                    <>
                      <FaLink className="h-3.5 w-3.5 text-amber-600" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
