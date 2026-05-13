
export default function LessonSidebar({ lessons, currentLesson, completedLessons = [], onSelectLesson }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-dark-100 dark:border-dark-700">
        <h3 className="font-semibold text-dark-900 dark:text-white">Course Content</h3>
        <p className="text-xs text-dark-400 mt-1">
          {completedLessons.length}/{lessons.length} completed
        </p>
      </div>

      <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
        {lessons.map((lesson, i) => {
          const isCurrent = currentLesson?._id === lesson._id || currentLesson === i;
          const isCompleted = completedLessons.includes(lesson._id || i);
          const isLocked = lesson.locked;

          return (
            <button
              key={lesson._id || i}
              onClick={() => !isLocked && onSelectLesson(lesson, i)}
              disabled={isLocked}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-dark-50 dark:border-dark-800 transition-colors ${
                isCurrent ? 'bg-primary-50 dark:bg-primary-950/30 border-l-4 border-l-primary-500' :
                isLocked ? 'opacity-50 cursor-not-allowed' :
                'hover:bg-dark-50 dark:hover:bg-dark-800/50'
              }`}
            >
              <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${
                isCompleted ? 'bg-secondary-100 dark:bg-secondary-900/30' :
                isCurrent ? 'bg-primary-100 dark:bg-primary-900/30' :
                'bg-dark-100 dark:bg-dark-700'
              }`}>
                {isLocked ? <HiLockClosed className="h-3.5 w-3.5 text-dark-400" /> :
                 isCompleted ? <HiCheck className="h-3.5 w-3.5 text-secondary-500" /> :
                 lesson.type === 'video' ? <HiPlay className="h-3.5 w-3.5 text-primary-500" /> :
                 <HiDocument className="h-3.5 w-3.5 text-dark-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${isCurrent ? 'font-medium text-primary-600 dark:text-primary-400' : 'text-dark-700 dark:text-dark-300'}`}>
                  {lesson.title}
                </p>
                {lesson.duration && <p className="text-xs text-dark-400">{lesson.duration}</p>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
