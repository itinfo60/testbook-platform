import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import {
  HiBriefcase,
  HiCalendar,
  HiOfficeBuilding,
  HiExternalLink,
  HiUsers,
  HiSearch,
  HiBell,
  HiArrowRight,
  HiFilter,
  HiClock,
  HiBadgeCheck,
  HiChevronRight,
} from 'react-icons/hi';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';

const STATUS_CONFIG = {
  active: {
    label: 'Accepting Applications',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200',
    dot: 'bg-green-500 animate-pulse',
  },
  closing: {
    label: 'Closing Soon',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200',
    dot: 'bg-amber-800 animate-pulse',
  },
  upcoming: {
    label: 'Notification Released',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200',
    dot: 'bg-blue-500',
  },
  closed: {
    label: 'Closed',
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200',
    dot: 'bg-slate-400',
  },
};

function getAlertStatus(alert) {
  if (!alert) return 'upcoming';
  const now = new Date();
  const start = alert.applicationStart ? new Date(alert.applicationStart) : null;
  const end = alert.applicationEnd ? new Date(alert.applicationEnd) : null;
  if (!start || !end) return 'upcoming';
  if (isPast(end)) return 'closed';
  if (isWithinInterval(now, { start, end })) {
    if (isWithinInterval(now, { start: addDays(end, -7), end })) return 'closing';
    return 'active';
  }
  return 'upcoming';
}

function JobCard({ job }) {
  const alert = job.jobAlert || {};
  const statusKey = getAlertStatus(alert);
  const status = STATUS_CONFIG[statusKey];

  return (
    <div className="bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-800 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Top accent bar */}
      <div
        className={`h-1 w-full ${statusKey === 'active' ? 'bg-gradient-to-r from-green-400 to-emerald-500' : statusKey === 'closing' ? 'bg-gradient-to-r from-amber-400 to-orange-500' : statusKey === 'closed' ? 'bg-slate-300' : 'bg-gradient-to-r from-blue-400 to-indigo-500'}`}
      />

      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            {/* Status Badge */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${status.color}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot} inline-block`} />
                {status.label}
              </span>
              {alert.notificationDate && (
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <HiClock className="h-3 w-3" />
                  {format(new Date(alert.notificationDate), 'dd MMM yyyy')}
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-extrabold text-dark-900 dark:text-white line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug mb-1">
              {job.title}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <HiOfficeBuilding className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="truncate">{alert.organization || 'Government Organization'}</span>
            </div>
          </div>

          {/* Vacancies Badge */}
          {alert.totalVacancies > 0 && (
            <div className="shrink-0 text-center bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-3 py-2 min-w-[64px]">
              <p className="text-xl font-black text-amber-600 dark:text-amber-400">
                {alert.totalVacancies.toLocaleString()}
              </p>
              <p className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                Posts
              </p>
            </div>
          )}
        </div>

        {/* Date Grid */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {alert.applicationStart && (
            <div className="bg-slate-50 dark:bg-dark-800 rounded-xl p-2.5 text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Apply From
              </p>
              <p className="text-xs font-extrabold text-green-600 dark:text-green-400 leading-tight">
                {format(new Date(alert.applicationStart), 'dd MMM')}
              </p>
            </div>
          )}
          {alert.applicationEnd && (
            <div className="bg-slate-50 dark:bg-dark-800 rounded-xl p-2.5 text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Last Date
              </p>
              <p className="text-xs font-extrabold text-red-600 dark:text-red-400 leading-tight">
                {format(new Date(alert.applicationEnd), 'dd MMM')}
              </p>
            </div>
          )}
          {alert.examDate && (
            <div className="bg-slate-50 dark:bg-dark-800 rounded-xl p-2.5 text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Exam Date
              </p>
              <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400 leading-tight">
                {format(new Date(alert.examDate), 'dd MMM')}
              </p>
            </div>
          )}
        </div>

        {/* Excerpt */}
        {job.excerpt && (
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-5 leading-relaxed">
            {job.excerpt}
          </p>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            to={`/blog/${job.slug}`}
            className="flex-1 bg-amber-800 hover:bg-amber-900 text-white font-extrabold py-2.5 px-4 rounded-xl text-center text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-800/20"
          >
            View Full Details <HiArrowRight className="h-3.5 w-3.5" />
          </Link>
          {alert.officialNotificationUrl && (
            <a
              href={alert.officialNotificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-4 rounded-xl text-center text-xs transition-all flex items-center justify-center gap-1.5"
            >
              Official PDF <HiExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JobAlertList() {
  const [jobs, setJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/blogs', {
          params: { type: 'job_alert', status: 'published', limit: 50 },
        });
        const list = Array.isArray(data.data) ? data.data : data.blogs || data.data?.blogs || [];
        setAllJobs(list);
        setJobs(list);
      } catch (err) {
        setError(err.message || 'Failed to fetch job alerts');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // Filter
  useEffect(() => {
    let filtered = allJobs;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.title?.toLowerCase().includes(q) || j.jobAlert?.organization?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((j) => getAlertStatus(j.jobAlert) === statusFilter);
    }
    setJobs(filtered);
  }, [search, statusFilter, allJobs]);

  const counts = {
    all: allJobs.length,
    active: allJobs.filter((j) => getAlertStatus(j.jobAlert) === 'active').length,
    closing: allJobs.filter((j) => getAlertStatus(j.jobAlert) === 'closing').length,
    upcoming: allJobs.filter((j) => getAlertStatus(j.jobAlert) === 'upcoming').length,
    closed: allJobs.filter((j) => getAlertStatus(j.jobAlert) === 'closed').length,
  };

  return (
    <div className="bg-slate-50 dark:bg-dark-950 min-h-screen text-dark-900 dark:text-white">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-700 text-white pt-16 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-5 right-20 w-60 h-60 bg-white rounded-full blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold mb-4">
            <HiBell className="h-4 w-4 animate-bounce" /> Live Government Job Notifications
          </div>
          <h1 className="text-4xl sm:text-6xl font-black font-display mb-3 leading-tight">
            Job Alerts & <span className="text-yellow-300">Notifications</span>
          </h1>
          <p className="text-red-100 text-sm sm:text-base max-w-xl mx-auto mb-8">
            Stay ahead with real-time government job announcements, application dates, exam
            schedules and official recruitment links for competitive exam aspirants.
          </p>

          {/* Stats Row */}
          <div className="flex flex-wrap justify-center gap-4 text-xs font-extrabold">
            {[
              { label: 'Active Now', value: counts.active, color: 'text-green-300' },
              { label: 'Closing Soon', value: counts.closing, color: 'text-yellow-300' },
              { label: 'Total Alerts', value: counts.all, color: 'text-white' },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-2xl text-center"
              >
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-white/70 uppercase tracking-widest mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-7 relative z-20 mb-8">
        <div className="bg-white dark:bg-dark-900 rounded-3xl shadow-xl border border-slate-200 dark:border-dark-800 p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search jobs by title, organization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
          >
            <option value="all">All Status ({counts.all})</option>
            <option value="active">Active ({counts.active})</option>
            <option value="closing">Closing Soon ({counts.closing})</option>
            <option value="upcoming">Upcoming ({counts.upcoming})</option>
            <option value="closed">Closed ({counts.closed})</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="h-14 w-14 rounded-full border-4 border-red-500 border-b-transparent animate-spin" />
            <p className="text-sm font-semibold text-slate-500">Fetching latest job alerts...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-20 bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-800">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-red-500 font-bold">{error}</p>
          </div>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-dark-900 rounded-3xl border border-dashed border-slate-300 dark:border-dark-700">
            <div className="text-5xl mb-4">🔔</div>
            <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-2">
              No job alerts found
            </h2>
            <p className="text-slate-500 text-sm">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'No active government job notifications at the moment. Check back soon!'}
            </p>
          </div>
        )}

        {!loading && !error && jobs.length > 0 && (
          <>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-5">
              Showing {jobs.length} result{jobs.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {jobs.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
