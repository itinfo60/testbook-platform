import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiVideoCamera, HiClock, HiUsers } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';

function formatDate(d) {
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function LiveClassList() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClasses = () => {
    api
      .get('/live-classes/upcoming')
      .then(({ data }) => setClasses(data.data?.classes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClasses();
    // Poll every 15s to catch real-time status transitions
    const timer = setInterval(fetchClasses, 15000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
          <HiVideoCamera className="h-5 w-5 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Live Classes</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Upcoming and active live sessions
          </p>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-16 text-slate-600 dark:text-slate-400">
          <HiVideoCamera className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No upcoming classes scheduled</p>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => {
            const isLive = cls.status === 'live';
            const teacherName = cls.teacherName || cls.teacher?.name;
            return (
              <div
                key={cls.id || cls._id}
                className="bg-white dark:bg-dark-800 rounded-2xl border border-slate-100 dark:border-dark-700 p-5 flex items-center gap-4 transition-all hover:border-slate-300 dark:hover:border-dark-600"
              >
                <div
                  className={`flex-shrink-0 h-12 w-12 rounded-2xl flex items-center justify-center ${
                    isLive ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-50 dark:bg-blue-900/20'
                  }`}
                >
                  <HiVideoCamera
                    className={`h-6 w-6 ${isLive ? 'text-red-500 animate-pulse' : 'text-blue-500'}`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                      {cls.title}
                    </h3>
                    {isLive ? (
                      <span className="flex-shrink-0 px-2.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-red-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE
                      </span>
                    ) : (
                      <span className="flex-shrink-0 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                        Scheduled
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <HiClock className="h-3.5 w-3.5" /> {formatDate(cls.scheduledAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <HiUsers className="h-3.5 w-3.5" />{' '}
                      {cls.durationMinutes || cls.duration || 60} min
                    </span>
                    {teacherName && <span>by {teacherName}</span>}
                  </div>
                  {cls.course && (
                    <p className="text-xs text-primary-500 mt-0.5">
                      {cls.course.title || cls.course}
                    </p>
                  )}
                </div>

                <Link
                  to={`/live-classes/${cls.id || cls._id}/room`}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                    isLive
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                      : 'bg-slate-100 dark:bg-dark-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-600'
                  }`}
                >
                  {isLive ? 'Join Now →' : 'Enter Waiting Room'}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
