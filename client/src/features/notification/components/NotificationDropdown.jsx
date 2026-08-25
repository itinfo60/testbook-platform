import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiBell,
  HiCheck,
  HiInformationCircle,
  HiExclamation,
  HiGift,
  HiArrowRight,
  HiExternalLink,
} from 'react-icons/hi';
import { fetchNotifications, markAsRead } from '@/features/notification/notificationSlice';
import { getNotificationLink } from '@/utils/notificationLink';
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
  const navigate = useNavigate();
  const { notifications, loading } = useSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleItemClick = (notif) => {
    const notifId = notif.id || notif._id;
    if (!notif.read && !notif.isRead) {
      dispatch(markAsRead(notifId));
    }

    if (onClose) onClose();

    const link = getNotificationLink(notif);
    if (link) {
      if (link.startsWith('http://') || link.startsWith('https://')) {
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
        navigate(link);
      }
    }
  };

  const handleMarkRead = (e, id) => {
    e.stopPropagation();
    dispatch(markAsRead(id));
  };

  return (
    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-dark-900 rounded-3xl shadow-xl border border-slate-200 dark:border-dark-800 overflow-hidden animate-slide-down origin-top-right z-50">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-dark-800 bg-slate-50/80 dark:bg-dark-800/50 backdrop-blur-sm">
        <h3 className="font-semibold text-dark-900 dark:text-white font-display tracking-tight text-sm">
          Notifications
        </h3>
        <Link
          to="/notifications"
          onClick={onClose}
          className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors tracking-wide"
        >
          View all
        </Link>
      </div>

      <div className="max-h-[28rem] overflow-y-auto divide-y divide-slate-100 dark:divide-dark-800/60">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 rounded-full border-3 border-primary-200 dark:border-primary-900/50 border-t-primary-500 animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-medium text-slate-500">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center">
            <div className="h-14 w-14 bg-slate-50 dark:bg-dark-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <HiBell className="h-7 w-7 text-slate-300 dark:text-dark-600" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              You're all caught up!
            </p>
            <p className="text-xs text-slate-400 mt-1">No new notifications right now.</p>
          </div>
        ) : (
          notifications.slice(0, 10).map((notif) => {
            const Icon = typeIcons[notif.type] || typeIcons.default;
            const colorClass = typeColors[notif.type] || typeColors.default;
            const link = getNotificationLink(notif);
            const isExternal = link && (link.startsWith('http://') || link.startsWith('https://'));
            const isUnread = !notif.read && !notif.isRead;

            return (
              <div
                key={notif.id || notif._id}
                onClick={() => handleItemClick(notif)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(notif);
                  }
                }}
                className={`flex items-start gap-3.5 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-dark-800/80 transition-all cursor-pointer group ${
                  isUnread ? 'bg-primary-50/20 dark:bg-primary-950/20' : ''
                }`}
              >
                <div
                  className={`flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center shadow-xs mt-0.5 ${colorClass}`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p
                      className={`text-xs leading-snug line-clamp-1 ${
                        isUnread
                          ? 'font-semibold text-dark-900 dark:text-white'
                          : 'font-medium text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {notif.title || notif.message}
                    </p>
                    {link && (
                      <span className="text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        {isExternal ? (
                          <HiExternalLink className="h-3.5 w-3.5" />
                        ) : (
                          <HiArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        )}
                      </span>
                    )}
                  </div>
                  {notif.message && notif.title && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] text-slate-400">
                      {notif.createdAt
                        ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })
                        : 'Just now'}
                    </span>
                  </div>
                </div>
                {isUnread && (
                  <button
                    onClick={(e) => handleMarkRead(e, notif.id || notif._id)}
                    className="flex-shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-dark-800 hover:bg-slate-100 dark:hover:bg-dark-700 text-slate-400 hover:text-green-600 border border-slate-200 dark:border-dark-700 shadow-xs self-start"
                    title="Mark as read"
                  >
                    <HiCheck className="h-3.5 w-3.5 text-green-500" />
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
