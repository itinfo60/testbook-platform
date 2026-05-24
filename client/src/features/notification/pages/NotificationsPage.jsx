import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HiBell, HiCheck, HiInformationCircle, HiExclamation, HiGift, HiCheckCircle } from 'react-icons/hi';
import { fetchNotifications, markAsRead } from '@/features/notification/notificationSlice';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';

const typeIcons = {
  info: HiInformationCircle,
  warning: HiExclamation,
  success: HiCheckCircle,
  reward: HiGift,
  default: HiBell,
};

const typeColors = {
  info: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  warning: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  success: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  reward: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  default: 'text-dark-500 bg-dark-100 dark:bg-dark-700',
};

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const { notifications, loading, unreadCount } = useSelector(state => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkRead = (id) => {
    dispatch(markAsRead(id));
  };

  const handleMarkAllRead = () => {
    notifications.filter(n => !n.read && !n.isRead).forEach(n => dispatch(markAsRead(n._id)));
  };

  if (loading) return <LoadingSpinner />;

  const unread = notifications.filter(n => !n.read && !n.isRead);
  const read = notifications.filter(n => n.read || n.isRead);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-dark-500 mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unread.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            <HiCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-16 text-center">
          <HiBell className="h-16 w-16 text-dark-200 dark:text-dark-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">All caught up!</h2>
          <p className="text-dark-400 text-sm">No notifications yet. We'll let you know when something happens.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Unread */}
          {unread.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2 px-1">New</p>
              <div className="space-y-1">
                {unread.map(notif => (
                  <NotificationItem
                    key={notif._id}
                    notif={notif}
                    onMarkRead={() => handleMarkRead(notif._id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Read */}
          {read.length > 0 && (
            <div className={unread.length > 0 ? 'mt-6' : ''}>
              {unread.length > 0 && (
                <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2 px-1">Earlier</p>
              )}
              <div className="space-y-1">
                {read.map(notif => (
                  <NotificationItem key={notif._id} notif={notif} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notif, onMarkRead }) {
  const isUnread = !notif.read && !notif.isRead;
  const Icon = typeIcons[notif.type] || typeIcons.default;
  const colorClass = typeColors[notif.type] || typeColors.default;

  return (
    <div className={`card flex gap-4 p-4 transition-all ${isUnread ? 'border-l-4 border-l-primary-500 bg-primary-50/30 dark:bg-primary-950/10' : ''}`}>
      <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm ${isUnread ? 'font-semibold text-dark-900 dark:text-white' : 'text-dark-700 dark:text-dark-300'}`}>
          {notif.title || notif.message}
        </p>
        {notif.message && notif.title && (
          <p className="text-sm text-dark-500 dark:text-dark-400 mt-0.5">{notif.message}</p>
        )}
        <p className="text-xs text-dark-400 mt-1.5">
          {notif.createdAt
            ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })
            : 'Just now'}
        </p>
      </div>

      {isUnread && onMarkRead && (
        <button
          onClick={onMarkRead}
          title="Mark as read"
          className="flex-shrink-0 self-start p-1.5 rounded-lg text-dark-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
        >
          <HiCheck className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
