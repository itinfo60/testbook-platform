
export default function LessonContent({ lesson, onComplete }) {
  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-96 text-dark-400">
        <div className="text-center">
          <div className="text-5xl mb-3">📖</div>
          <p className="text-lg">Select a lesson to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-4">{lesson.title}</h2>
      {lesson.type === 'video' && lesson.videoUrl ? (
        <VideoPlayer url={lesson.videoUrl} onComplete={onComplete} />
      ) : (
        <TextContent content={lesson.content} />
      )}
      {lesson.description && (
        <div className="mt-6 prose dark:prose-invert max-w-none">
          <p className="text-dark-600 dark:text-dark-400">{lesson.description}</p>
        </div>
      )}
    </div>
  );
}
