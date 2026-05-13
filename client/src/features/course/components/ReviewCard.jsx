import { formatDistanceToNow } from 'date-fns';

export default function ReviewCard({ review }) {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold flex-shrink-0">
          {review.user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-dark-900 dark:text-white">{review.user?.name || 'Anonymous'}</h4>
            <span className="text-xs text-dark-400 flex-shrink-0">
              {review.createdAt ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }) : ''}
            </span>
          </div>
          <RatingStars rating={review.rating} size="sm" showValue={false} />
          {review.comment && (
            <p className="text-sm text-dark-600 dark:text-dark-400 mt-2">{review.comment}</p>
          )}
        </div>
      </div>
    </div>
  );
}
