import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HiBell, HiCheck, HiInformationCircle, HiExclamation, HiGift } from 'react-icons/hi';
import { fetchNotifications, markAsRead } from '@/features/notification/notificationSlice';
import { formatDistanceToNow } from 'date-fns';

const typeIcons = {
  info: HiInformationCircle,
  warning: HiExclamation,
  success: HiCheck,
  reward: HiGift,
  default: HiBell,
};

const typeColors = {
  info: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  warning: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  success: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  reward: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  default: 'text-dark-500 bg-dark-50 dark:bg-dark-700',
};

export default function NotificationDropdown({ onClose }) {
  const dispatch = useDispatch();
  const { notifications, loading } = useSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkRead = (e, id) => {
    e.stopPropagation();
    dispatch(markAsRead(id));
  };

  return (
    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-dark-900 rounded-3xl shadow-xl border border-slate-200 dark:border-dark-800 overflow-hidden animate-slide-down origin-top-right z-50">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-dark-800 bg-slate-50/80 dark:bg-dark-800/50 backdrop-blur-sm">
        <h3 className="font-extrabold text-dark-900 dark:text-white font-display tracking-tight">
          Notifications
        </h3>
        <Link
          to="/notifications"
          onClick={onClose}
          className="text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors uppercase tracking-wider"
        >
          View all
        </Link>
      </div>

      <div className="max-h-[28rem] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 rounded-full border-4 border-amber-200 dark:border-amber-900/50 border-t-amber-500 animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center">
            <div className="h-16 w-16 bg-slate-50 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiBell className="h-8 w-8 text-slate-300 dark:text-dark-600" />
            </div>
            <p className="text-sm font-bold text-slate-500">You're all caught up!</p>
            <p className="text-xs text-slate-400 mt-1">No new notifications right now.</p>
          </div>
        ) : (
          notifications.slice(0, 10).map((notif) => {
            const Icon = typeIcons[notif.type] || typeIcons.default;
            const colorClass = typeColors[notif.type] || typeColors.default;
            return (
              <div
                key={notif._id}
                className={`flex gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-dark-800 transition-colors cursor-pointer border-b border-slate-100 dark:border-dark-800/50 last:border-0 group ${
                  !notif.read ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''
                }`}
              >
                <div
                  className={`flex-shrink-0 h-10 w-10 rounded-2xl flex items-center justify-center shadow-sm ${colorClass}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p
                    className={`text-sm leading-snug ${!notif.read ? 'font-extrabold text-dark-900 dark:text-white' : 'font-medium text-slate-600 dark:text-slate-300'}`}
                  >
                    {notif.title || notif.message}
                  </p>
                  {notif.message && notif.title && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                  )}
                  <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                    {notif.createdAt
                      ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })
                      : 'Just now'}
                  </p>
                </div>
                {!notif.read && (
                  <button
                    onClick={(e) => handleMarkRead(e, notif._id)}
                    className="flex-shrink-0 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-dark-900 hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-400 border border-slate-200 dark:border-dark-700 shadow-sm self-start"
                    title="Mark as read"
                  >
                    <HiCheck className="h-4 w-4 text-green-500" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
