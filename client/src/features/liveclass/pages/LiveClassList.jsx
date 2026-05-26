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

  useEffect(() => {
    api
      .get('/live-classes/upcoming')
      .then(({ data }) => setClasses(data.data?.classes || []))
      .catch(() => toast.error('Failed to load classes'))
      .finally(() => setLoading(false));
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
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Upcoming and active live sessions
          </p>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400">
          <HiVideoCamera className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No upcoming classes scheduled</p>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => (
            <div
              key={cls._id}
              className="bg-white dark:bg-dark-800 rounded-2xl border border-slate-100 dark:border-dark-700 p-5 flex items-center gap-4"
            >
              <div
                className={`flex-shrink-0 h-12 w-12 rounded-2xl flex items-center justify-center ${cls.status === 'live' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-dark-700'}`}
              >
                <HiVideoCamera
                  className={`h-6 w-6 ${cls.status === 'live' ? 'text-red-500' : 'text-slate-400'}`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                    {cls.title}
                  </h3>
                  {cls.status === 'live' && (
                    <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <HiClock className="h-3.5 w-3.5" /> {formatDate(cls.scheduledAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <HiUsers className="h-3.5 w-3.5" /> {cls.durationMinutes} min
                  </span>
                  {cls.teacher && <span>by {cls.teacher.name}</span>}
                </div>
                {cls.course && (
                  <p className="text-xs text-primary-500 mt-0.5">{cls.course.title}</p>
                )}
              </div>

              <Link
                to={`/live-classes/${cls._id}/room`}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${cls.status === 'live' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-slate-100 dark:bg-dark-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-600'}`}
              >
                {cls.status === 'live' ? 'Join Now' : 'View'}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
