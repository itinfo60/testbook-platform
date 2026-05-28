import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HiArrowLeft, HiTrash, HiDownload, HiMenu, HiX } from 'react-icons/hi';
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

  const handleLessonComplete = useCallback(async () => {
    if (!currentLesson) return;
    try {
      await dispatch(
        completeLesson({
          courseId: id,
          lessonId: currentLesson._id,
          sectionId: currentSection?._id,
        })
      ).unwrap();
      // Optimistically mark done in local progress
      dispatch(markLessonDone(currentLesson._id));
      toast.success('Lesson marked as complete!');
    } catch (err) {
      toast.error(err || 'Failed to mark complete');
    }
  }, [dispatch, id, currentLesson, currentSection]);

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
      createDiscussion({ course: id, content: discussionText, lessonId: currentLesson?._id })
    );
    setDiscussionText('');
    toast.success('Discussion posted');
  };

  const handleSeekTo = (timestamp) => {
    if (playerRef.current) {
      playerRef.current.seekTo(timestamp, 'seconds');
    }
  };

  if (loading || !course) return <LoadingSpinner fullScreen />;

  const sections = course.sections || [];
  const allLessons = sections.flatMap((s) => s.lessons || []);
  const totalLessons = allLessons.length;

  // Completed lesson IDs from progress (normalize to strings for comparison)
  const completedLessonIds = (currentProgress?.progress || [])
    .filter((p) => p.completed)
    .map((p) => String(p.lessonId || p.lesson));
  const totalCompleted = completedLessonIds.length;

  const isCurrentCompleted =
    currentLesson && completedLessonIds.includes(String(currentLesson._id));

  // Navigate to next lesson
  const goToNext = () => {
    if (!currentLesson) return;
    const flatLessons = sections.flatMap((s) => s.lessons.map((l) => ({ lesson: l, section: s })));
    const idx = flatLessons.findIndex(({ lesson }) => lesson._id === currentLesson._id);
    if (idx < flatLessons.length - 1) {
      const next = flatLessons[idx + 1];
      handleLessonSelect(next.lesson, next.section);
    }
  };

  const hasNext = () => {
    if (!currentLesson) return false;
    const flatLessons = sections.flatMap((s) => s.lessons.map((l) => ({ lesson: l, section: s })));
    const idx = flatLessons.findIndex(({ lesson }) => lesson._id === currentLesson._id);
    return idx < flatLessons.length - 1;
  };

  const tabs = [
    { key: 'content', label: 'Description' },
    { key: 'notes', label: 'Notes', count: notes.length },
    { key: 'discussions', label: 'Discussions', count: discussions.length },
  ];

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-950">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white dark:bg-dark-900 border-b border-dark-100 dark:border-dark-800 px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-4">
        <Link
          to="/my-courses"
          className="flex items-center gap-2 text-dark-500 hover:text-dark-900 dark:hover:text-white text-sm transition-colors flex-shrink-0"
        >
          <HiArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">My Courses</span>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-dark-900 dark:text-white truncate">
            {course.title}
          </p>
          {currentLesson && (
            <p className="text-xs text-dark-400 truncate">
              {currentSection?.title} · {currentLesson.title}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-xs text-dark-400 hidden sm:block">
            {totalCompleted}/{totalLessons} completed
          </div>
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dark-200 dark:border-dark-700 text-xs text-dark-600 dark:text-dark-300 bg-white dark:bg-dark-800"
          >
            <HiMenu className="h-4 w-4" />
            <span>Contents</span>
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
                <p className="text-dark-600 dark:text-dark-400 text-sm leading-relaxed">
                  {currentLesson.content || 'No additional description for this lesson.'}
                </p>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                <form onSubmit={handleAddNote} className="card p-4">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder={
                      currentLesson ? `Add a note for "${currentLesson.title}"...` : 'Add a note...'
                    }
                    className="input-field mb-3 min-h-[90px] resize-none"
                  />
                  {currentLesson?.type === 'video' && (
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id="attachTimestamp"
                        checked={attachTimestamp}
                        onChange={(e) => setAttachTimestamp(e.target.checked)}
                        className="rounded border-dark-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label
                        htmlFor="attachTimestamp"
                        className="text-xs text-dark-600 dark:text-dark-400"
                      >
                        Attach video timestamp at{' '}
                        {(() => {
                          const m = Math.floor(videoTime / 60);
                          const s = Math.floor(videoTime % 60);
                          return `${m}:${s < 10 ? '0' : ''}${s}`;
                        })()}
                      </label>
                    </div>
                  )}
                  <button type="submit" className="btn-primary text-sm">
                    Save Note
                  </button>
                </form>

                {notes.length === 0 ? (
                  <div className="text-center py-8 text-dark-400">
                    <div className="text-3xl mb-2">📝</div>
                    <p className="text-sm">No notes yet. Add one above!</p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div key={note._id} className="card p-4">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          {note.timestamp !== undefined && note.timestamp > 0 && (
                            <button
                              onClick={() => handleSeekTo(note.timestamp)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 mb-2 transition-colors border border-indigo-100 dark:border-indigo-900/50"
                            >
                              ⏱️{' '}
                              {(() => {
                                const m = Math.floor(note.timestamp / 60);
                                const s = Math.floor(note.timestamp % 60);
                                return `${m}:${s < 10 ? '0' : ''}${s}`;
                              })()}
                            </button>
                          )}
                          <p className="text-dark-700 dark:text-dark-300 text-sm leading-relaxed break-words">
                            {note.content}
                          </p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleDownloadNote(note)}
                            title="Download note"
                            className="p-1.5 text-dark-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                          >
                            <HiDownload className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => dispatch(deleteNote(note._id))}
                            title="Delete note"
                            className="p-1.5 text-dark-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <HiTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-dark-400 mt-2">
                        {note.createdAt
                          ? new Date(note.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : ''}
                      </p>
                    </div>
                  ))
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
