import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiExternalLink,
  HiDownload,
  HiPlay,
  HiCheckCircle,
  HiDocumentText,
  HiArrowRight,
  HiCheck,
  HiAcademicCap,
} from 'react-icons/hi';
import VideoPlayer from './VideoPlayer';

function TextContent({ content }) {
  if (!content) return <p className="text-dark-400 italic">No content available.</p>;
  return (
    <div className="prose dark:prose-invert max-w-none text-dark-700 dark:text-dark-300 leading-relaxed whitespace-pre-wrap">
      {content}
    </div>
  );
}

function ResourceItem({ resource }) {
  const icons = { pdf: '📄', doc: '📝', link: '🔗' };

  const handleDownload = () => {
    if (resource.type === 'link') {
      window.open(resource.url, '_blank', 'noopener');
      return;
    }
    const a = document.createElement('a');
    a.href = resource.url;
    a.download = resource.title || 'resource';
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <button
      onClick={handleDownload}
      className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-dark-700 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-all group text-left cursor-pointer"
    >
      <span className="text-2xl">{icons[resource.type] || '📎'}</span>
      <span className="flex-1 text-sm font-bold text-dark-700 dark:text-dark-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate">
        {resource.title}
      </span>
      {resource.type === 'link' ? (
        <HiExternalLink className="h-4 w-4 text-slate-400 group-hover:text-amber-500 flex-shrink-0" />
      ) : (
        <HiDownload className="h-4 w-4 text-slate-400 group-hover:text-amber-500 flex-shrink-0" />
      )}
    </button>
  );
}

export default function LessonContent({
  lesson,
  sectionTitle,
  onComplete,
  isCompleted,
  playerRef,
  onProgress,
  onVideoComplete,
  onNext,
  isLastLesson,
}) {
  const [completing, setCompleting] = useState(false);

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-96 bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-800 p-8">
        <div className="text-center text-slate-400">
          <HiPlay className="h-16 w-16 mx-auto mb-4 opacity-30 text-amber-500" />
          <p className="text-lg font-bold text-dark-900 dark:text-white">
            Select a lesson to begin
          </p>
          <p className="text-xs mt-1 text-slate-500">
            Choose any lesson from the course outline on the right to start learning.
          </p>
        </div>
      </div>
    );
  }

  const handleComplete = async () => {
    if (isCompleted || completing) return;
    setCompleting(true);
    await onComplete?.();
    setCompleting(false);
  };

  const handleCompleteAndNext = async () => {
    if (!isCompleted) {
      setCompleting(true);
      await onComplete?.();
      setCompleting(false);
    }
    if (onNext) {
      onNext();
    }
  };

  const formatDuration = (secs) => {
    if (!secs) return null;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s > 0 ? `${s}s` : ''}`.trim() : `${s}s`;
  };

  return (
    <div className="space-y-6">
      {/* Main content by type */}
      {lesson.dripLocked ? (
        <div className="bg-amber-50 dark:bg-amber-900/10 rounded-3xl p-8 text-center border border-amber-200 dark:border-amber-800 flex flex-col items-center justify-center min-h-[400px]">
          <span className="text-4xl mb-4">⏳</span>
          <h3 className="text-xl font-bold text-amber-800 dark:text-amber-500 mb-2">
            Lesson Scheduled (Drip Content)
          </h3>
          <p className="text-amber-700 dark:text-amber-400 max-w-md text-sm">
            This lesson is scheduled to unlock as you progress through the syllabus. Check back
            soon!
          </p>
        </div>
      ) : !lesson.isFree && !lesson.videoUrl && !lesson.content && lesson.type !== 'quiz' ? (
        <div className="bg-rose-50 dark:bg-rose-950/20 rounded-3xl p-8 text-center border border-rose-200 dark:border-rose-900/40 flex flex-col items-center justify-center min-h-[400px]">
          <span className="text-4xl mb-4">🔒</span>
          <h3 className="text-xl font-bold text-rose-800 dark:text-rose-400 mb-2">
            Premium Course Material
          </h3>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mb-6 text-sm">
            You do not have access to this full lesson. Please enroll in the course to unlock
            unlimited access to all videos and notes.
          </p>
          <a href={`/courses/${lesson.courseSlug || ''}`} className="btn-primary">
            Enroll to Unlock
          </a>
        </div>
      ) : lesson.type === 'video' ? (
        <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-900/10 dark:border-white/10 bg-black aspect-video relative flex items-center justify-center group ring-1 ring-black/5 dark:ring-white/5">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-10"></div>
          <VideoPlayer
            ref={playerRef}
            url={lesson.videoUrl}
            onProgress={onProgress}
            onComplete={onVideoComplete}
          />
        </div>
      ) : null}

      {lesson.type === 'text' && (
        <div className="bg-white dark:bg-dark-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-dark-800 shadow-sm">
          <TextContent content={lesson.content} />
        </div>
      )}

      {lesson.type === 'quiz' && (
        <div className="bg-white dark:bg-dark-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-dark-800 shadow-sm">
          <div className="text-5xl mb-3">📝</div>
          <h3 className="text-xl font-extrabold text-dark-900 dark:text-white mb-2 font-display">
            Lesson Assessment Quiz
          </h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            {lesson.content ||
              'Test your knowledge on this module before continuing to the next chapter.'}
          </p>
          {lesson.quizId && (
            <Link
              to={`/quiz/${lesson.quizId}`}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all inline-flex items-center gap-2 text-sm"
            >
              Start Lesson Quiz <HiArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      {/* Lesson Header & Action Bar */}
      <div className="bg-white dark:bg-dark-900 rounded-3xl p-6 border border-slate-200 dark:border-dark-800 shadow-sm">
        {sectionTitle && (
          <p className="text-xs text-amber-600 dark:text-amber-500 font-bold uppercase tracking-wider mb-1">
            {sectionTitle}
          </p>
        )}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-dark-900 dark:text-white font-display">
              {lesson.title}
            </h2>
            <div className="flex items-center gap-3 mt-1.5 text-xs font-bold text-slate-400">
              <span className="capitalize px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300">
                {lesson.type}
              </span>
              {lesson.duration > 0 && <span>⏱️ {formatDuration(lesson.duration)}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Mark Complete Button */}
            <button
              onClick={handleComplete}
              disabled={isCompleted || completing}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
              }`}
            >
              <HiCheckCircle className="h-4 w-4" />
              {isCompleted ? 'Completed ✓' : completing ? 'Saving...' : 'Mark as Complete'}
            </button>

            {/* Next Lesson / Course Completed Action */}
            {onNext ? (
              <button
                onClick={handleCompleteAndNext}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer active:scale-95"
              >
                Next Lesson <HiArrowRight className="h-4 w-4" />
              </button>
            ) : isCompleted ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
                <HiAcademicCap className="h-4 w-4" /> Course Completed!
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Resources Attachment Section */}
      {lesson.resources?.length > 0 && (
        <div className="bg-white dark:bg-dark-900 rounded-3xl p-6 border border-slate-200 dark:border-dark-800 shadow-sm">
          <h4 className="text-sm font-extrabold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
            <HiDownload className="h-4 w-4 text-amber-500" /> Lesson Attachments & Notes (
            {lesson.resources.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lesson.resources.map((r, i) => (
              <ResourceItem key={r._id || i} resource={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
