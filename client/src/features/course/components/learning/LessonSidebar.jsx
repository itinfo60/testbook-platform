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

const formatDuration = (secs) => {
  if (!secs) return '';
  const m = Math.floor(secs / 60);
  return m > 0 ? `${m}m` : `${secs}s`;
};

export default function LessonSidebar({
  sections = [],
  currentLessonId,
  completedLessonIds = [],
  onSelectLesson,
  totalCompleted,
  totalLessons,
}) {
  const [collapsed, setCollapsed] = useState({});

  const toggle = (i) => setCollapsed((p) => ({ ...p, [i]: !p[i] }));

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
            (l) => l.type !== 'quiz' && completedLessonIds.includes(l._id)
          ).length;
          const sectionLessons = section.lessons.filter((l) => l.type !== 'quiz');

          return (
            <div key={section._id || si}>
              {/* Section header */}
              <button
                onClick={() => toggle(si)}
                className="w-full flex items-center justify-between px-4 py-3 bg-dark-50 dark:bg-dark-800/30 border-b border-dark-100 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-700/50 transition-colors text-left"
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
                  const isActive = lesson._id === currentLessonId;
                  const isDone = completedLessonIds.includes(lesson._id);

                  return (
                    <button
                      key={lesson._id || li}
                      onClick={() => onSelectLesson(lesson, section)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-dark-50 dark:border-dark-800/50 transition-colors ${
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-950/40 border-l-4 border-l-primary-500'
                          : 'hover:bg-dark-50 dark:hover:bg-dark-800/50 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center ${
                          isDone
                            ? 'bg-secondary-100 dark:bg-secondary-900/40'
                            : isActive
                              ? 'bg-primary-100 dark:bg-primary-900/40'
                              : 'bg-dark-100 dark:bg-dark-700'
                        }`}
                      >
                        {isDone ? (
                          <HiCheck className="h-3.5 w-3.5 text-secondary-500" />
                        ) : (
                          typeIcon(
                            lesson.type,
                            `h-3.5 w-3.5 ${isActive ? 'text-primary-500' : 'text-dark-400'}`
                          )
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm truncate leading-snug ${
                            isActive
                              ? 'font-medium text-primary-600 dark:text-primary-400'
                              : isDone
                                ? 'text-dark-500 dark:text-dark-400'
                                : 'text-dark-700 dark:text-dark-300'
                          }`}
                        >
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-dark-400">
                          <span className="capitalize">{lesson.type}</span>
                          {lesson.duration > 0 && (
                            <>
                              <span>·</span>
                              <span>{formatDuration(lesson.duration)}</span>
                            </>
                          )}
                          {lesson.isFree && (
                            <span className="text-secondary-500 font-medium">Free</span>
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
