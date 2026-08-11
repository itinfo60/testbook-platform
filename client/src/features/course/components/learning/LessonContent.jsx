import { useState } from 'react';
import { HiExternalLink, HiDownload, HiPlay, HiCheckCircle, HiDocumentText } from 'react-icons/hi';
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
      className="w-full flex items-center gap-3 p-3 rounded-xl border border-dark-100 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all group text-left"
    >
      <span className="text-xl">{icons[resource.type] || '📎'}</span>
      <span className="flex-1 text-sm font-medium text-dark-700 dark:text-dark-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate">
        {resource.title}
      </span>
      {resource.type === 'link' ? (
        <HiExternalLink className="h-4 w-4 text-dark-400 group-hover:text-primary-500 flex-shrink-0" />
      ) : (
        <HiDownload className="h-4 w-4 text-dark-400 group-hover:text-primary-500 flex-shrink-0" />
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
}) {
  const [completing, setCompleting] = useState(false);

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-dark-400">
          <HiPlay className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Select a lesson to begin</p>
          <p className="text-sm mt-1">Choose from the course content on the right</p>
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
        <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-8 text-center border border-amber-200 dark:border-amber-800 flex flex-col items-center justify-center min-h-[400px]">
          <span className="text-4xl mb-4">⏳</span>
          <h3 className="text-xl font-bold text-amber-800 dark:text-amber-500 mb-2">
            Lesson Locked
          </h3>
          <p className="text-amber-700 dark:text-amber-400 max-w-md">
            This lesson is subject to a drip schedule and is not yet available. Please check back
            later.
          </p>
        </div>
      ) : !lesson.isFree && !lesson.videoUrl && !lesson.content && lesson.type !== 'quiz' ? (
        <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-8 text-center border border-red-200 dark:border-red-800 flex flex-col items-center justify-center min-h-[400px]">
          <span className="text-4xl mb-4">🔒</span>
          <h3 className="text-xl font-bold text-red-800 dark:text-red-500 mb-2">Premium Content</h3>
          <p className="text-red-700 dark:text-red-400 max-w-md mb-6">
            You do not have access to this lesson. Please enroll in the course to unlock full
            access.
          </p>
          <a href={`/courses/${lesson.courseSlug || ''}`} className="btn-primary">
            Enroll Now
          </a>
        </div>
      ) : lesson.type === 'video' ? (
        <VideoPlayer
          ref={playerRef}
          url={lesson.videoUrl}
          onProgress={onProgress}
          onComplete={onVideoComplete}
        />
      ) : null}

      {lesson.type === 'text' && (
        <div className="card p-6">
          <TextContent content={lesson.content} />
        </div>
      )}

      {lesson.type === 'quiz' && (
        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">Quiz Lesson</h3>
          <p className="text-dark-500 text-sm">
            {lesson.content || 'Complete the quiz to mark this lesson done.'}
          </p>
        </div>
      )}

      {/* Lesson header */}
      <div>
        {sectionTitle && (
          <p className="text-xs text-primary-500 font-semibold uppercase tracking-wider mb-1">
            {sectionTitle}
          </p>
        )}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-dark-900 dark:text-white">{lesson.title}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-dark-400">
              <span className="capitalize">{lesson.type}</span>
              {lesson.duration > 0 && <span>· {formatDuration(lesson.duration)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleComplete}
              disabled={isCompleted || completing}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${
                isCompleted
                  ? 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400 cursor-default'
                  : 'btn-success'
              }`}
            >
              <HiCheckCircle className="h-4 w-4" />
              {isCompleted ? 'Completed' : completing ? 'Saving...' : 'Mark Complete'}
            </button>
            {onNext && (
              <button onClick={onNext} className="btn-primary text-sm px-5 flex-shrink-0">
                Next Lesson →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resources */}
      {lesson.resources?.length > 0 && (
        <div className="card p-5">
          <h4 className="text-sm font-semibold text-dark-700 dark:text-dark-300 mb-3 flex items-center gap-2">
            <HiDownload className="h-4 w-4" /> Resources ({lesson.resources.length})
          </h4>
          <div className="space-y-2">
            {lesson.resources.map((r, i) => (
              <ResourceItem key={r._id || i} resource={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
