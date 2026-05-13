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
  const { notifications, loading } = useSelector(state => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkRead = (e, id) => {
    e.stopPropagation();
    dispatch(markAsRead(id));
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-dark-800 rounded-2xl shadow-modal border border-dark-100 dark:border-dark-700 overflow-hidden animate-slide-down">
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-100 dark:border-dark-700">
        <h3 className="font-semibold text-dark-900 dark:text-white">Notifications</h3>
        <Link to="/notifications" onClick={onClose} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
          View all
        </Link>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-dark-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <HiBell className="h-10 w-10 text-dark-300 dark:text-dark-600 mx-auto mb-2" />
            <p className="text-sm text-dark-400">No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, 10).map(notif => {
            const Icon = typeIcons[notif.type] || typeIcons.default;
            const colorClass = typeColors[notif.type] || typeColors.default;
            return (
              <div
                key={notif._id}
                className={`flex gap-3 px-4 py-3 hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors cursor-pointer ${
                  !notif.read ? 'bg-primary-50/50 dark:bg-primary-950/20' : ''
                }`}
              >
                <div className={`flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notif.read ? 'font-semibold text-dark-900 dark:text-white' : 'text-dark-700 dark:text-dark-300'}`}>
                    {notif.title || notif.message}
                  </p>
                  {notif.message && notif.title && (
                    <p className="text-xs text-dark-400 line-clamp-2 mt-0.5">{notif.message}</p>
                  )}
                  <p className="text-xs text-dark-400 mt-1">
                    {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : 'Just now'}
                  </p>
                </div>
                {!notif.read && (
                  <button
                    onClick={e => handleMarkRead(e, notif._id)}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-600 text-dark-400"
                    title="Mark as read"
                  >
                    <HiCheck className="h-4 w-4" />
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
