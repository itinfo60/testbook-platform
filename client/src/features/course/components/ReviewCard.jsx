import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import RatingStars from '@/components/common/RatingStars';
import { HiPencil, HiCheck, HiX } from 'react-icons/hi';

export default function ReviewCard({ review, currentUserId, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [editRating, setEditRating] = useState(review.rating);
  const [editHover, setEditHover] = useState(0);
  const [editComment, setEditComment] = useState(review.comment || '');
  const [saving, setSaving] = useState(false);

  const isOwn =
    !!currentUserId &&
    String(review.user?.id || review.user?._id || review.user || review.userId) ===
      String(currentUserId);

  const handleSave = async () => {
    if (!editRating) return;
    if (editComment.trim().length < 5) return;
    setSaving(true);
    try {
      await onEdit(review.id || review._id, { rating: editRating, comment: editComment.trim() });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id={`review-${review.id || review._id}`}
      className="bg-white dark:bg-dark-900 rounded-2xl p-5 border border-slate-200 dark:border-dark-800 shadow-sm"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm">
          {(review.user?.name || '?').charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <span className="font-semibold text-sm text-dark-900 dark:text-white">
                {review.user?.name || 'User'}
              </span>
              {isOwn && (
                <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-1.5 py-0.5 rounded-md border border-primary-100 dark:border-primary-800/40">
                  You
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-dark-400">
                {review.createdAt
                  ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })
                  : ''}
              </span>
              {isOwn && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-semibold text-xs border border-amber-200 dark:border-amber-800/60 transition-all shadow-xs"
                  title="Edit your review"
                >
                  <HiPencil className="h-3 w-3" /> Edit
                </button>
              )}
            </div>
          </div>

          {editing ? (
            /* ── Edit mode ───────────────────────────────────────── */
            <div className="space-y-3 mt-2">
              {/* Star picker */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setEditRating(star)}
                    onMouseEnter={() => setEditHover(star)}
                    onMouseLeave={() => setEditHover(0)}
                    className="text-2xl leading-none transition-transform hover:scale-110 focus:outline-none"
                  >
                    <span
                      className={
                        star <= (editHover || editRating)
                          ? 'text-amber-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }
                    >
                      ★
                    </span>
                  </button>
                ))}
                {editRating > 0 && (
                  <span className="ml-1.5 text-xs font-semibold text-amber-600">
                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][editRating]}
                  </span>
                )}
              </div>

              {/* Comment */}
              <textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                rows={3}
                maxLength={1000}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
              <p className="text-right text-[11px] text-slate-400">{editComment.length}/1000</p>

              {/* Save / Cancel */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !editRating || editComment.trim().length < 5}
                  className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-xl transition-all"
                >
                  <HiCheck className="h-3.5 w-3.5" />
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditRating(review.rating);
                    setEditComment(review.comment || '');
                  }}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-dark-900 dark:hover:text-white px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 transition-all"
                >
                  <HiX className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* ── View mode ───────────────────────────────────────── */
            <>
              <RatingStars rating={review.rating} size="sm" showValue={false} />
              {review.comment && (
                <p className="text-sm text-dark-600 dark:text-dark-400 mt-2 leading-relaxed">
                  {review.comment}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
