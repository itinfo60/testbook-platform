import { useState } from 'react';
import {
  HiCheck,
  HiDocument,
  HiLockClosed,
  HiPlay,
  HiChevronDown,
  HiPencilAlt,
} from 'react-icons/hi';

const typeIcon = (type, cls) => {
  if (type === 'video') return <HiPlay className={cls} />;
  if (type === 'quiz') return <HiPencilAlt className={cls} />;
  return <HiDocument className={cls} />;
};

// `text` lessons are reading material — call them Notes, not "Text"
const typeLabel = (type) => {
  if (type === 'video') return 'Video';
  if (type === 'quiz') return 'Quiz';
  return 'Notes';
};

// Lesson durations are authored in MINUTES (see the course builder form)
const formatDuration = (mins) => {
  if (!mins) return '';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}`.trim() : `${m}m`;
};

export default function LessonSidebar({
  sections = [],
  currentLesson,
  currentLessonId,
  completedLessonIds = [],
  onSelectLesson,
  totalCompleted,
  totalLessons,
  isEnrolled = false,
}) {
  const [collapsed, setCollapsed] = useState({});

  const toggle = (i) => setCollapsed((p) => ({ ...p, [i]: !p[i] }));

  const isCurrentActive = (lesson) => {
    if (!currentLesson && !currentLessonId) return false;
    const lId = lesson._id || lesson.id;
    const curId = currentLesson?._id || currentLesson?.id || currentLessonId;
    if (curId && lId && String(curId) === String(lId)) return true;
    if (currentLesson?.title && lesson.title && currentLesson.title === lesson.title) return true;
    if (currentLesson?.videoUrl && lesson.videoUrl && currentLesson.videoUrl === lesson.videoUrl)
      return true;
    return false;
  };

  return (
    <div className="card overflow-hidden lg:sticky lg:top-20">
      <div className="p-4 border-b border-dark-100 dark:border-dark-700 bg-dark-50 dark:bg-dark-800/50">
        <h3 className="font-semibold text-dark-900 dark:text-white text-sm sm:text-base">
          Course Content
        </h3>
        <p className="text-xs text-dark-400 mt-0.5">
          {totalCompleted}/{totalLessons} lessons completed
        </p>
        {totalLessons > 0 && (
          <div className="mt-2 h-1.5 bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.round((totalCompleted / totalLessons) * 100)}%` }}
            />
          </div>
        )}
      </div>

      <div className="lg:max-h-[calc(100vh-260px)] overflow-y-auto">
        {sections.map((section, si) => {
          const isOpen = !collapsed[si];
          const sectionCompleted = section.lessons.filter(
            (l) =>
              l.type !== 'quiz' &&
              completedLessonIds.some(
                (cid) =>
                  cid && (String(cid) === String(l.id || '') || String(cid) === String(l._id || ''))
              )
          ).length;
          const sectionLessons = section.lessons.filter((l) => l.type !== 'quiz');

          return (
            <div key={section._id || si}>
              {/* Section header */}
              <button
                onClick={() => toggle(si)}
                className="w-full flex items-center justify-between px-4 py-3 bg-dark-50 dark:bg-dark-800/30 border-b border-dark-100 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-700/50 transition-colors text-left cursor-pointer"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm font-semibold text-dark-800 dark:text-dark-200 truncate">
                    {section.title}
                  </p>
                  <p className="text-xs text-dark-400 mt-0.5">
                    {sectionCompleted}/{sectionLessons.length} ·{' '}
                    {sectionLessons.reduce((s, l) => s + (l.duration || 0), 0) > 0
                      ? formatDuration(sectionLessons.reduce((s, l) => s + (l.duration || 0), 0))
                      : ''}
                  </p>
                </div>
                <HiChevronDown
                  className={`h-4 w-4 text-dark-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Lessons list */}
              {isOpen &&
                sectionLessons.map((lesson, li) => {
                  const lessonId = lesson._id || lesson.id || `lesson-${si}-${li}`;
                  const isActive = isCurrentActive(lesson);
                  const isDone = completedLessonIds.some(
                    (cid) =>
                      cid &&
                      (String(cid) === String(lesson._id || '') ||
                        String(cid) === String(lesson.id || ''))
                  );
                  // Free lessons are the demo classes — open to everyone.
                  const isLocked = (!isEnrolled && !lesson.isFree) || !!lesson.dripLocked;

                  return (
                    <button
                      key={lessonId}
                      onClick={() => onSelectLesson(lesson, section)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-dark-50 dark:border-dark-800/50 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/10 dark:bg-amber-500/20 border-l-4 border-l-amber-600 dark:border-l-amber-400 shadow-sm'
                          : 'hover:bg-dark-50 dark:hover:bg-dark-800/50 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center ${
                          isActive
                            ? 'bg-amber-500 text-navy-950 font-black shadow-md shadow-amber-500/20'
                            : isDone
                              ? 'bg-secondary-100 dark:bg-secondary-900/40 text-secondary-500'
                              : 'bg-dark-100 dark:bg-dark-700 text-dark-400'
                        }`}
                      >
                        {isDone && !isActive ? (
                          <HiCheck className="h-3.5 w-3.5 text-secondary-500" />
                        ) : isLocked ? (
                          <HiLockClosed className="h-3.5 w-3.5 text-dark-400" />
                        ) : (
                          typeIcon(
                            lesson.type,
                            `h-3.5 w-3.5 ${isActive ? 'text-navy-950' : 'text-dark-400'}`
                          )
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p
                            className={`text-sm truncate leading-snug ${
                              isActive
                                ? 'font-bold text-amber-950 dark:text-amber-300'
                                : isDone
                                  ? 'text-dark-500 dark:text-dark-400 font-normal'
                                  : 'text-dark-800 dark:text-dark-200 font-medium'
                            }`}
                          >
                            {lesson.title}
                          </p>
                          {isActive && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500 text-navy-950 shrink-0">
                              Playing
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-dark-400">
                          <span>{typeLabel(lesson.type)}</span>
                          {lesson.duration > 0 && (
                            <>
                              <span>·</span>
                              <span>{formatDuration(lesson.duration)}</span>
                            </>
                          )}
                          {lesson.isFree && !isEnrolled && (
                            <span className="text-secondary-500 font-medium">Demo</span>
                          )}
                          {lesson.isFree && isEnrolled && (
                            <span className="text-secondary-500 font-medium">Free</span>
                          )}
                          {isLocked && (
                            <span className="text-dark-400 font-medium">
                              {lesson.dripLocked ? 'Scheduled' : 'Locked'}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
