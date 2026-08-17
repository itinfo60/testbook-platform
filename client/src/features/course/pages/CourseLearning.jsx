import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiArrowLeft,
  HiArrowRight,
  HiCheck,
  HiDownload,
  HiMenu,
  HiTrash,
  HiX,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

import { fetchCourseById } from '@/features/course/courseSlice';
import {
  fetchProgress,
  completeLesson,
  markLessonDone,
} from '@/features/enrollment/enrollmentSlice';
import { fetchNotes, createNote, deleteNote } from '@/features/note/noteSlice';
import { fetchDiscussions, createDiscussion } from '@/features/discussion/discussionSlice';
import { enrollmentAPI } from '@/services/api';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import Tabs from '@/components/common/Tabs';
import LessonContent from '../components/learning/LessonContent';
import LessonSidebar from '../components/learning/LessonSidebar';

function ResourceItem({ resource }) {
  const isLink = resource?.type === 'link' || resource?.url?.startsWith('http');
  return (
    <a
      href={resource?.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-dark-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors group"
    >
      <span className="text-xl">{isLink ? '🔗' : '📄'}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-dark-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {resource?.title || 'Resource'}
        </p>
        {resource?.description && (
          <p className="text-xs text-dark-400 truncate">{resource.description}</p>
        )}
      </div>
      <HiDownload className="w-4 h-4 text-dark-400 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
    </a>
  );
}

export default function CourseLearning() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentCourse: course, loading } = useSelector((state) => state.courses);
  const { currentProgress } = useSelector((state) => state.enrollments);
  const { notes } = useSelector((state) => state.notes);
  const { discussions } = useSelector((state) => state.discussions);

  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentSection, setCurrentSection] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [noteText, setNoteText] = useState('');
  const [discussionText, setDiscussionText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const playerRef = useRef(null);
  const [videoTime, setVideoTime] = useState(0);
  const sessionWatchTime = useRef(0);
  const lastHeartbeatTime = useRef(0);
  const [attachTimestamp, setAttachTimestamp] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    dispatch(fetchCourseById(id));
    dispatch(fetchProgress(id));
    dispatch(fetchNotes(id));
    dispatch(fetchDiscussions({ courseId: id }));
  }, [dispatch, id]);

  // Auto-select first lesson once course loads
  useEffect(() => {
    if (course && !currentLesson) {
      const sections = course.sections || [];
      const firstSection = sections[0];
      const firstLesson = firstSection?.lessons?.[0];
      if (firstLesson) {
        setCurrentLesson(firstLesson);
        setCurrentSection(firstSection);
      }
    }
  }, [course, currentLesson]);

  const handleLessonSelect = useCallback((lesson, section) => {
    setCurrentLesson(lesson);
    setCurrentSection(section);
    setActiveTab('content');
    setSidebarOpen(false);
    setVideoTime(0);
    sessionWatchTime.current = 0;
    lastHeartbeatTime.current = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleVideoProgress = useCallback(
    (state) => {
      setVideoTime(state.playedSeconds);

      // Accumulate session watch time
      sessionWatchTime.current += 1;

      // Heartbeat every 30 seconds of active watching
      if (sessionWatchTime.current - lastHeartbeatTime.current >= 30) {
        const progressRecord = currentProgress?.progress?.find(
          (p) => String(p.lessonId || p.lesson) === String(currentLesson?._id)
        );
        const initialWatchTime = progressRecord?.watchTime || 0;

        enrollmentAPI
          .updateProgress(id, {
            sectionId: currentSection?._id,
            lessonId: currentLesson?._id,
            watchTime: initialWatchTime + sessionWatchTime.current,
            lastPosition: Math.floor(state.playedSeconds),
            completed: false,
          })
          .catch((err) => console.error('Heartbeat progress save failed:', err));

        lastHeartbeatTime.current = sessionWatchTime.current;
      }
    },
    [id, currentSection, currentLesson, currentProgress]
  );

  const handleLessonComplete = useCallback(
    async (targetCompletedState = true) => {
      if (!currentLesson || completing) return;
      setCompleting(true);
      try {
        await dispatch(
          completeLesson({
            courseId: id,
            lessonId: currentLesson._id,
            sectionId: currentSection?._id,
            completed: targetCompletedState,
          })
        ).unwrap();
        // Optimistically mark done in local progress
        dispatch(markLessonDone({ lessonId: currentLesson._id, completed: targetCompletedState }));
        toast.success(targetCompletedState ? 'Lesson marked as complete!' : 'Lesson unmarked');
      } catch (err) {
        toast.error(err || 'Failed to update progress');
      } finally {
        setCompleting(false);
      }
    },
    [dispatch, id, currentLesson, currentSection, completing]
  );

  const handleVideoComplete = useCallback(async () => {
    const isCompleted =
      currentLesson &&
      (currentProgress?.progress || [])
        .filter((p) => p.completed)
        .map((p) => String(p.lessonId || p.lesson))
        .includes(String(currentLesson._id));
    if (!currentLesson || isCompleted) return;
    await handleLessonComplete();
  }, [currentLesson, currentProgress, handleLessonComplete]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    const noteData = {
      course: id,
      content: noteText,
      lessonId: currentLesson?._id,
    };
    if (currentLesson?.type === 'video' && attachTimestamp) {
      noteData.timestamp = Math.floor(videoTime);
    }
    await dispatch(createNote(noteData));
    setNoteText('');
    toast.success('Note saved');
  };

  const handleDownloadNote = (note) => {
    const blob = new Blob([note.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `note-${new Date(note.createdAt).toLocaleDateString().replace(/\//g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddDiscussion = async (e) => {
    e.preventDefault();
    if (!discussionText.trim()) return;
    await dispatch(
      createDiscussion({
        course: id,
        title: discussionText.slice(0, 50) + (discussionText.length > 50 ? '...' : ''),
        content: discussionText,
        lessonId: currentLesson?._id,
      })
    );
    setDiscussionText('');
    toast.success('Discussion posted');
  };

  const handleSeekTo = (timestamp) => {
    if (playerRef.current) {
      playerRef.current.seekTo(timestamp, 'seconds');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">📚</div>
        <h2 className="text-2xl font-black text-dark-900 dark:text-white mb-2 font-display">
          Course Not Found
        </h2>
        <p className="text-slate-500 max-w-md mb-6 text-sm">
          The course you are looking for might have been updated or moved.
        </p>
        <Link
          to="/courses"
          className="bg-amber-800 hover:bg-amber-900 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all text-sm"
        >
          Explore Courses
        </Link>
      </div>
    );
  }

  const sections = course.sections || [];
  const allLessons = sections.flatMap((s) => (s.lessons || []).filter((l) => l.type !== 'quiz'));
  const totalLessons = allLessons.length;

  const validLessonIds = new Set(allLessons.map((l) => String(l._id)));

  // Completed lesson IDs from progress (normalize to strings for comparison)
  const completedLessonIds = (currentProgress?.progress || [])
    .filter((p) => p.completed && validLessonIds.has(String(p.lessonId || p.lesson)))
    .map((p) => String(p.lessonId || p.lesson));
  const totalCompleted = completedLessonIds.length;

  const isCurrentCompleted =
    currentLesson && completedLessonIds.includes(String(currentLesson._id));

  // Navigate to next lesson
  const goToNext = () => {
    if (!currentLesson) return;
    const flatLessons = sections.flatMap((s) =>
      s.lessons.filter((l) => l.type !== 'quiz').map((l) => ({ lesson: l, section: s }))
    );
    const idx = flatLessons.findIndex(({ lesson }) => lesson._id === currentLesson._id);
    if (idx < flatLessons.length - 1) {
      const next = flatLessons[idx + 1];
      handleLessonSelect(next.lesson, next.section);
    }
  };

  const hasNext = () => {
    if (!currentLesson) return false;
    const flatLessons = sections.flatMap((s) =>
      s.lessons.filter((l) => l.type !== 'quiz').map((l) => ({ lesson: l, section: s }))
    );
    const idx = flatLessons.findIndex(({ lesson }) => lesson._id === currentLesson._id);
    return idx < flatLessons.length - 1;
  };

  const tabs = [{ key: 'content', label: 'Description' }];
  if (currentLesson?.resources?.length > 0) {
    tabs.push({
      key: 'resources',
      label: 'Attachments & Notes',
      count: currentLesson.resources.length,
    });
  }
  if (currentSection?.lessons?.filter((l) => l.type === 'quiz')?.length > 0) {
    tabs.push({
      key: 'quizzes',
      label: 'Tests & Quizzes',
      count: currentSection.lessons.filter((l) => l.type === 'quiz').length,
    });
  }
  tabs.push({ key: 'discussions', label: 'Doubt & Discussion', count: discussions.length });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white dark:bg-dark-900 border-b border-slate-200 dark:border-dark-800 px-3 sm:px-6 py-3.5 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Link
            to="/my-courses"
            className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 dark:bg-dark-800 hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-900/30 dark:hover:text-amber-500 text-slate-500 transition-colors flex-shrink-0"
          >
            <HiArrowLeft className="h-5 w-5" />
          </Link>
          <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-dark-800 mx-2"></div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className="text-sm font-bold text-dark-900 dark:text-white truncate">
              {course.title}
            </p>
            {currentLesson && (
              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-500 truncate uppercase tracking-wider mt-0.5">
                {currentSection?.title} <span className="text-slate-400 mx-1">•</span>{' '}
                {currentLesson.title}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-slate-200 dark:border-dark-800">
            {currentLesson && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleLessonComplete(!isCurrentCompleted)}
                  disabled={completing}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isCurrentCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                  }`}
                >
                  {isCurrentCompleted ? (
                    <>
                      <HiCheck className="h-3.5 w-3.5" />
                      {completing ? 'Saving...' : 'Completed'}
                    </>
                  ) : (
                    <>{completing ? 'Saving...' : 'Mark as Complete'}</>
                  )}
                </button>

                {hasNext() ? (
                  <button
                    onClick={() => {
                      goToNext();
                    }}
                    className="bg-amber-800 hover:bg-amber-900 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm transition-all flex items-center gap-1.5 text-xs cursor-pointer active:scale-95"
                  >
                    Next Lesson
                  </button>
                ) : isCurrentCompleted ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
                    Course Completed!
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Course Progress
            </span>
            <span className="text-sm font-extrabold text-green-600">
              {totalCompleted} / {totalLessons}
            </span>
          </div>

          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center justify-center h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600"
          >
            <HiMenu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-white dark:bg-dark-900 overflow-y-auto shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-dark-100 dark:border-dark-700 flex-shrink-0">
              <span className="font-semibold text-dark-900 dark:text-white text-sm">
                Course Contents
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-lg text-dark-400 hover:text-dark-700 dark:hover:text-white"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <LessonSidebar
                sections={sections}
                currentLessonId={currentLesson?._id}
                completedLessonIds={completedLessonIds}
                onSelectLesson={handleLessonSelect}
                totalCompleted={totalCompleted}
                totalLessons={totalLessons}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row">
        {/* Main content */}
        <div className="flex-1 p-3 sm:p-4 lg:p-6 min-w-0">
          <LessonContent
            key={currentLesson?._id}
            lesson={currentLesson}
            sectionTitle={currentSection?.title}
            onComplete={handleLessonComplete}
            isCompleted={isCurrentCompleted}
            playerRef={playerRef}
            onProgress={handleVideoProgress}
            onVideoComplete={handleVideoComplete}
            onNext={hasNext() ? goToNext : null}
          />

          {/* Tabs below */}
          <div className="mt-6 sm:mt-8">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

            {activeTab === 'content' && currentLesson && (
              <div className="card p-4 sm:p-6">
                <h3 className="font-semibold text-dark-900 dark:text-white mb-1 text-sm sm:text-base">
                  {currentLesson.title}
                </h3>
                {currentSection && (
                  <p className="text-xs text-primary-500 mb-3">{currentSection.title}</p>
                )}
                <p className="text-dark-600 dark:text-dark-400 text-sm leading-relaxed mb-4">
                  {currentLesson.content || 'No additional description for this lesson.'}
                </p>

                {currentLesson.type === 'quiz' && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-4 border-t border-slate-200 dark:border-dark-800">
                    {currentLesson.quizId && (
                      <Link
                        to={`/quiz/${currentLesson.quizId}`}
                        className="bg-amber-800 hover:bg-amber-900 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all inline-flex items-center justify-center gap-2 text-sm"
                      >
                        Start Lesson Quiz <HiArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                    {currentLesson.testSeriesSlug && (
                      <Link
                        to={`/test-series/${currentLesson.testSeriesSlug}`}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-6 rounded-xl transition-all inline-flex items-center justify-center gap-2 text-sm"
                      >
                        View Full Test Series
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="card p-4 sm:p-6">
                <h3 className="font-semibold text-dark-900 dark:text-white mb-4 text-sm sm:text-base flex items-center gap-2">
                  <span className="text-lg">📎</span> Lesson Attachments & Notes
                </h3>
                {currentLesson?.resources?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentLesson.resources.map((r, i) => (
                      <ResourceItem key={r._id || i} resource={r} />
                    ))}
                  </div>
                ) : (
                  <p className="text-dark-400 text-sm italic">
                    No resources attached to this lesson.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'quizzes' && (
              <div className="card p-4 sm:p-6">
                <h3 className="font-semibold text-dark-900 dark:text-white mb-4 text-sm sm:text-base flex items-center gap-2">
                  <span className="text-lg">📝</span> Tests & Quizzes for {currentSection?.title}
                </h3>
                {currentSection?.lessons?.filter((l) => l.type === 'quiz').length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {currentSection.lessons
                      .filter((l) => l.type === 'quiz')
                      .map((quizLesson) => (
                        <div
                          key={quizLesson._id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-dark-800 hover:border-amber-400 dark:hover:border-amber-600 transition-colors gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-dark-800 dark:text-dark-200">
                                {quizLesson.title}
                              </h4>
                            </div>
                            <p className="text-sm text-dark-500 line-clamp-1">
                              {quizLesson.content || 'Assessment Quiz'}
                            </p>
                          </div>
                          {quizLesson.quizId ? (
                            <Link
                              to={`/quiz/${quizLesson.quizId}`}
                              className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold px-4 py-2 rounded-lg text-sm hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors whitespace-nowrap block sm:inline-block text-center"
                            >
                              Take Quiz
                            </Link>
                          ) : (
                            <button
                              onClick={() => handleLessonSelect(quizLesson, currentSection)}
                              className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold px-4 py-2 rounded-lg text-sm hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors whitespace-nowrap"
                            >
                              View Details
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-dark-400 text-sm italic">
                    No assessments available in this unit.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'discussions' && (
              <div className="space-y-4">
                <form onSubmit={handleAddDiscussion} className="card p-4">
                  <textarea
                    value={discussionText}
                    onChange={(e) => setDiscussionText(e.target.value)}
                    placeholder="Ask a question or start a discussion..."
                    className="input-field mb-3 min-h-[90px] resize-none"
                  />
                  <button type="submit" className="btn-primary text-sm">
                    Post
                  </button>
                </form>

                {discussions.length === 0 ? (
                  <div className="text-center py-8 text-dark-400">
                    <div className="text-3xl mb-2">💬</div>
                    <p className="text-sm">No discussions yet. Start one!</p>
                  </div>
                ) : (
                  discussions.map((d) => (
                    <div key={d._id} className="card p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-bold text-primary-600 dark:text-primary-400 flex-shrink-0">
                          {d.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-dark-900 dark:text-white">
                              {d.user?.name || 'User'}
                            </span>
                            <span className="text-xs text-dark-400">
                              {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <p className="text-sm text-dark-600 dark:text-dark-400 mt-1 break-words">
                            {d.content}
                          </p>
                          {d.replies?.length > 0 && (
                            <div className="mt-3 pl-3 sm:pl-4 border-l-2 border-dark-100 dark:border-dark-700 space-y-2">
                              {d.replies.map((r, ri) => (
                                <div key={ri} className="text-sm">
                                  <span className="font-medium text-dark-700 dark:text-dark-300">
                                    {r.user?.name || 'User'}:{' '}
                                  </span>
                                  <span className="text-dark-500 break-words">{r.content}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 xl:w-96 flex-shrink-0 p-4 lg:p-6 lg:pl-0">
          <LessonSidebar
            sections={sections}
            currentLessonId={currentLesson?._id}
            completedLessonIds={completedLessonIds}
            onSelectLesson={handleLessonSelect}
            totalCompleted={totalCompleted}
            totalLessons={totalLessons}
          />
        </div>
      </div>
    </div>
  );
}
