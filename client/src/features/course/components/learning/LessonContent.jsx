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

export function ResourceItem({ resource }) {
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
  isEnrolled = false,
  courseSlug,
}) {
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

  // Access is decided by the server's `isEnrolled`, not by absent fields.
  // An enrolled user viewing a genuinely empty lesson should see the empty
  // state for that lesson type, never a paywall.
  // Free lessons are the demo classes — always playable, no purchase needed.
  const isLocked = !isEnrolled && !lesson.isFree;
  const isAvailable = !isLocked && !lesson.dripLocked;

  const lockedLabel = lesson.type === 'text' ? 'notes' : lesson.type === 'quiz' ? 'quiz' : 'video';

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
      ) : isLocked ? (
        <div className="bg-rose-50 dark:bg-rose-950/20 rounded-3xl p-8 text-center border border-rose-200 dark:border-rose-900/40 flex flex-col items-center justify-center min-h-[400px]">
          <span className="text-4xl mb-4">🔒</span>
          <h3 className="text-xl font-bold text-rose-800 dark:text-rose-400 mb-2">
            Premium Course Material
          </h3>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mb-6 text-sm">
            This {lockedLabel} is part of the paid course. Enroll to unlock every lesson, along with
            the notes and downloadable resources. The demo classes stay free to watch.
          </p>
          <Link to={`/courses/${courseSlug || lesson.courseSlug || ''}`} className="btn-primary">
            Enroll to Unlock
          </Link>
        </div>
      ) : lesson.type === 'video' ? (
        <div className="w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-900/10 dark:border-white/10 bg-black aspect-video relative flex items-center justify-center group ring-1 ring-black/5 dark:ring-white/5">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-10"></div>
          <VideoPlayer
            ref={playerRef}
            url={lesson.videoUrl}
            onProgress={onProgress}
            onComplete={onVideoComplete}
          />
        </div>
      ) : null}

      {isAvailable && lesson.type === 'text' && (
        <div className="bg-white dark:bg-dark-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-dark-800 shadow-sm">
          <TextContent content={lesson.content} />
        </div>
      )}

      {isAvailable && lesson.type === 'quiz' && (
        <div className="bg-white dark:bg-dark-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-dark-800 shadow-sm">
          <div className="text-5xl mb-3">📝</div>
          <h3 className="text-xl font-extrabold text-dark-900 dark:text-white mb-2 font-display">
            Lesson Assessment Quiz
          </h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            {lesson.content ||
              'Test your knowledge on this module before continuing to the next chapter.'}
          </p>
        </div>
      )}
    </div>
  );
}
