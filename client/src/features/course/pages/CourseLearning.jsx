import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
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

function getCompletedLessonIds(currentProgress) {
  const ids = new Set();
  const strList =
    currentProgress?.completedLessons || currentProgress?.enrollment?.completedLessons || [];
  if (Array.isArray(strList)) {
    strList.forEach((id) => {
      if (id) ids.add(String(id).trim());
    });
  }

  const objList = currentProgress?.progress || currentProgress?.enrollment?.progress || [];
  if (Array.isArray(objList)) {
    objList.forEach((p) => {
      if (p && p.completed) {
        const lid = p.lessonId || p.lesson || p.id;
        if (lid) ids.add(String(lid).trim());
      }
    });
  }

  return Array.from(ids);
}

export default function CourseLearning() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const requestedLessonId = searchParams.get('lesson');
  const dispatch = useDispatch();
  const {
    currentCourse: course,
    currentCourseIsEnrolled: isEnrolled,
    loading,
  } = useSelector((state) => state.courses);
  const { currentProgress } = useSelector((state) => state.enrollments);
  const { notes } = useSelector((state) => state.notes);
  const { discussions } = useSelector((state) => state.discussions);

  const courseId = course?.id || course?._id?.toString() || id;
  const completedLessonIds = getCompletedLessonIds(currentProgress);

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
  }, [dispatch, id]);

  // Once course loads, fetch enrollment-dependent data
  useEffect(() => {
    const courseLookupId = course?.id || course?._id?.toString() || id;
    if (!courseLookupId) return;
    if (isEnrolled) dispatch(fetchProgress(courseLookupId));
    dispatch(fetchNotes(courseLookupId));
    dispatch(fetchDiscussions({ courseId: courseLookupId }));
  }, [dispatch, course?.id, course?._id, isEnrolled, id]);

  // Auto-select the opening lesson once the course loads.
  // For a visitor who has not purchased, land on the first demo (free) lesson
  // so they get something playable instead of a paywall.
  useEffect(() => {
    if (!course || currentLesson) return;

    const sections = course.sections || [];
    const pick = (predicate) => {
      for (const section of sections) {
        const lesson = (section.lessons || []).find(predicate);
        if (lesson) return { lesson, section };
      }
      return null;
    };

    const target =
      // A ?lesson=<id> deep link wins (used by the curriculum's demo links)
      (requestedLessonId &&
        pick((l) => String(l.id || l._id || '') === String(requestedLessonId))) ||
      (isEnrolled ? pick(() => true) : pick((l) => l.isFree) || pick(() => true));

    if (target) {
      setCurrentLesson(target.lesson);
      setCurrentSection(target.section);
    }
  }, [course, currentLesson, isEnrolled, requestedLessonId]);

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
        const activeLessonId = currentLesson?._id || currentLesson?.id;
        const progressRecord = currentProgress?.progress?.find(
          (p) => String(p.lessonId || p.lesson) === String(activeLessonId)
        );
        const initialWatchTime = progressRecord?.watchTime || 0;

        enrollmentAPI
          .updateProgress(courseId, {
            sectionId: currentSection?._id || currentSection?.id,
            lessonId: activeLessonId,
            watchTime: initialWatchTime + sessionWatchTime.current,
            lastPosition: Math.floor(state.playedSeconds),
            completed: false,
          })
          .catch((err) => console.error('Heartbeat progress save failed:', err));

        lastHeartbeatTime.current = sessionWatchTime.current;
      }
    },
    [courseId, currentSection, currentLesson, currentProgress]
  );

  const handleLessonComplete = useCallback(
    async (targetCompletedState = true) => {
      if (!currentLesson || completing) return;
      const targetLessonId = String(currentLesson.id || currentLesson._id || '').trim();
      const courseLookupId = course?.id || course?._id?.toString() || id;
      setCompleting(true);
      try {
        await dispatch(
          completeLesson({
            courseId: courseLookupId,
            lessonId: targetLessonId,
            sectionId: currentSection?.id || currentSection?._id,
            completed: targetCompletedState,
          })
        ).unwrap();
        // Optimistically mark done in local progress
        dispatch(markLessonDone({ lessonId: targetLessonId, completed: targetCompletedState }));
        toast.success(targetCompletedState ? 'Lesson marked as complete!' : 'Lesson unmarked');
      } catch (err) {
        toast.error(err || 'Failed to update progress');
      } finally {
        setCompleting(false);
      }
    },
    [dispatch, course?.id, course?._id, id, currentLesson, currentSection, completing]
  );

  const handleVideoComplete = useCallback(async () => {
    const activeLessonId = String(currentLesson?.id || currentLesson?._id || '').trim();
    if (!currentLesson || !activeLessonId) return;
    const isCompleted =
      completedLessonIds.includes(activeLessonId) ||
      (currentProgress?.progress || [])
        .filter((p) => p.completed)
        .map((p) => String(p.lessonId || p.lesson))
        .includes(activeLessonId);
    if (isCompleted) return;
    await handleLessonComplete(true);
  }, [currentLesson, completedLessonIds, currentProgress, handleLessonComplete]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    const activeLessonId = currentLesson?._id || currentLesson?.id;
    const noteData = {
      course: courseId,
      content: noteText,
      lessonId: activeLessonId,
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
    try {
      await dispatch(
        createDiscussion({
          course: courseId,
          title: '',
          content: discussionText.trim(),
          lessonId: currentLesson?.id || currentLesson?._id,
        })
      ).unwrap();
      setDiscussionText('');
      toast.success('Discussion posted');
      dispatch(fetchDiscussions({ courseId }));
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to post discussion');
    }
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

  const currentLessonKey = currentLesson
    ? String(currentLesson.id || currentLesson._id).trim()
    : '';
  const totalCompleted = completedLessonIds.length;
  const isCurrentCompleted = Boolean(
    currentLessonKey && completedLessonIds.includes(currentLessonKey)
  );
  const isAllCompleted = totalLessons > 0 && totalCompleted >= totalLessons;

  const [completingCourse, setCompletingCourse] = useState(false);

  const handleMarkCourseComplete = async () => {
    if (completingCourse) return;
    const courseLookupId = course?.id || course?._id?.toString() || id;
    setCompletingCourse(true);
    try {
      await dispatch(
        completeLesson({
          courseId: courseLookupId,
          completedCourse: true,
          markAllComplete: true,
        })
      ).unwrap();

      allLessons.forEach((l) => {
        const lid = String(l.id || l._id || '').trim();
        if (lid) dispatch(markLessonDone({ lessonId: lid, completed: true }));
      });

      toast.success('Congratulations! Course marked as fully completed! 🎉');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to complete course');
    } finally {
      setCompletingCourse(false);
    }
  };

  // Navigate to next lesson
  const goToNext = () => {
    if (!currentLesson) return;
    const currId = String(currentLesson.id || currentLesson._id || '').trim();
    const flatLessons = sections.flatMap((s) =>
      s.lessons.filter((l) => l.type !== 'quiz').map((l) => ({ lesson: l, section: s }))
    );
    const idx = flatLessons.findIndex(
      ({ lesson }) => String(lesson.id || lesson._id || '').trim() === currId
    );
    if (idx >= 0 && idx < flatLessons.length - 1) {
      const next = flatLessons[idx + 1];
      handleLessonSelect(next.lesson, next.section);
    }
  };

  const hasNext = () => {
    if (!currentLesson) return false;
    const currId = String(currentLesson.id || currentLesson._id || '').trim();
    const flatLessons = sections.flatMap((s) =>
      s.lessons.filter((l) => l.type !== 'quiz').map((l) => ({ lesson: l, section: s }))
    );
    const idx = flatLessons.findIndex(
      ({ lesson }) => String(lesson.id || lesson._id || '').trim() === currId
    );
    return idx >= 0 && idx < flatLessons.length - 1;
  };

  // Navigate to previous lesson
  const goToPrev = () => {
    if (!currentLesson) return;
    const currId = String(currentLesson.id || currentLesson._id || '').trim();
    const flatLessons = sections.flatMap((s) =>
      s.lessons.filter((l) => l.type !== 'quiz').map((l) => ({ lesson: l, section: s }))
    );
    const idx = flatLessons.findIndex(
      ({ lesson }) => String(lesson.id || lesson._id || '').trim() === currId
    );
    if (idx > 0) {
      const prev = flatLessons[idx - 1];
      handleLessonSelect(prev.lesson, prev.section);
    }
  };

  const hasPrev = () => {
    if (!currentLesson) return false;
    const currId = String(currentLesson.id || currentLesson._id || '').trim();
    const flatLessons = sections.flatMap((s) =>
      s.lessons.filter((l) => l.type !== 'quiz').map((l) => ({ lesson: l, section: s }))
    );
    const idx = flatLessons.findIndex(
      ({ lesson }) => String(lesson.id || lesson._id || '').trim() === currId
    );
    return idx > 0;
  };

  // Mirrors the lock rule in LessonContent: free lessons are the open demos.
  const currentLessonLocked =
    !!currentLesson && ((!isEnrolled && !currentLesson.isFree) || !!currentLesson.dripLocked);

  // Only count attachments the viewer can actually open — the API strips
  // resource urls for locked lessons.
  const availableResources = currentLessonLocked
    ? []
    : (currentLesson?.resources || []).filter((r) => r.url);

  // Only show tabs that make sense for the viewer's access level.
  // A non-enrolled user seeing the "Premium Course Material" paywall has no
  // description, resources, quizzes or discussions to interact with — hiding
  // those tabs removes both the confusion and the risk of serving protected
  // content through the Description/Discussion panels.
  const tabs = [];

  if (!currentLessonLocked) {
    tabs.push({ key: 'content', label: 'Description' });
  }

  if (!currentLessonLocked && availableResources.length > 0) {
    tabs.push({
      key: 'resources',
      label: 'Attachments & Notes',
      count: availableResources.length,
    });
  }

  // Quizzes are section-level — only show when the viewer has full access
  // (enrolled, or the current lesson happens to be a free demo that's in a
  // section that also contains quizzes).
  if (
    isEnrolled &&
    !currentLessonLocked &&
    currentSection?.lessons?.filter((l) => l.type === 'quiz')?.length > 0
  ) {
    tabs.push({
      key: 'quizzes',
      label: 'Tests & Quizzes',
      count: currentSection.lessons.filter((l) => l.type === 'quiz').length,
    });
  }

  // Discussions require an enrollment — questions only make sense for people
  // who are actually taking the course.
  if (isEnrolled) {
    tabs.push({ key: 'discussions', label: 'Doubt & Discussion', count: discussions.length });
  }

  // After building the tab list, make sure the active tab is still in it.
  // This matters when a user switches from a demo lesson (which has tabs) to a
  // locked lesson (which does not) without the active tab being reset.
  const validTabKeys = new Set(tabs.map((t) => t.key));
  const safeActiveTab = validTabKeys.has(activeTab) ? activeTab : (tabs[0]?.key ?? 'content');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white dark:bg-dark-900 border-b border-slate-200 dark:border-dark-800 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4 shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-4 flex-1 min-w-0">
          <Link
            to="/my-courses"
            className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-100 dark:bg-dark-800 hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-900/30 dark:hover:text-amber-500 text-slate-500 transition-colors shrink-0"
            title="Back to My Courses"
          >
            <HiArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
          <div className="hidden sm:block w-px h-6 sm:h-8 bg-slate-200 dark:bg-dark-800"></div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-bold text-dark-900 dark:text-white truncate leading-snug">
              {course.title}
            </p>
            {currentLesson && (
              <p className="text-[10px] sm:text-[11px] font-bold text-amber-600 dark:text-amber-500 truncate uppercase tracking-wider mt-0.5">
                {currentSection?.title} <span className="text-slate-400 mx-1">•</span>{' '}
                {currentLesson.title}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Header Action Buttons */}
          {!isEnrolled ? (
            <Link
              to={`/courses/${course?.slug || id}`}
              className="bg-amber-800 hover:bg-amber-900 text-white font-bold py-1.5 px-3 sm:px-4 rounded-lg shadow-xs transition-all text-[11px] sm:text-xs shrink-0"
            >
              <span className="hidden sm:inline">Enroll to Unlock</span>
              <span className="sm:hidden">Enroll</span>
            </Link>
          ) : currentLesson ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => handleLessonComplete(!isCurrentCompleted)}
                disabled={completing}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none active:scale-95 shrink-0 ${
                  isCurrentCompleted
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
                title={isCurrentCompleted ? 'Click to unmark' : 'Mark this lesson complete'}
              >
                <HiCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {completing ? 'Saving...' : isCurrentCompleted ? 'Completed' : 'Mark as Complete'}
                </span>
                <span className="sm:hidden">
                  {completing ? '...' : isCurrentCompleted ? 'Done' : 'Complete'}
                </span>
              </button>

              {hasNext() ? (
                <button
                  onClick={goToNext}
                  className="bg-amber-800 hover:bg-amber-900 text-white font-bold py-1.5 px-2.5 sm:px-3.5 rounded-lg shadow-xs transition-all flex items-center gap-1 text-xs cursor-pointer active:scale-95 shrink-0"
                  title="Next Lesson"
                >
                  <span className="hidden sm:inline">Next</span>
                  <HiArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleMarkCourseComplete}
                  disabled={completingCourse}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-1.5 px-2.5 sm:px-3 rounded-lg shadow-xs text-xs cursor-pointer active:scale-95 shrink-0"
                  title="Mark Entire Course as Completed"
                >
                  <span>🎉 {isAllCompleted ? 'Finished' : 'Finish'}</span>
                </button>
              )}
            </div>
          ) : null}

          {/* Desktop Progress Counter */}
          <div className="hidden md:flex flex-col items-end pl-2 border-l border-slate-200 dark:border-dark-800">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Progress
            </span>
            <span className="text-xs font-extrabold text-emerald-600">
              {totalCompleted}/{totalLessons} (
              {Math.round(totalLessons > 0 ? (totalCompleted / totalLessons) * 100 : 0)}%)
            </span>
          </div>

          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 hover:bg-amber-100 transition-colors shrink-0"
            title="Course Contents"
          >
            <HiMenu className="h-4 w-4 sm:h-5 sm:w-5" />
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
                currentLesson={currentLesson}
                currentLessonId={currentLesson?._id || currentLesson?.id}
                completedLessonIds={completedLessonIds}
                onSelectLesson={handleLessonSelect}
                totalCompleted={totalCompleted}
                totalLessons={totalLessons}
                isEnrolled={isEnrolled}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row">
        {/* Main content */}
        <div className="flex-1 p-3 sm:p-4 lg:p-6 min-w-0">
          <LessonContent
            key={currentLesson?._id || currentLesson?.id}
            lesson={currentLesson}
            sectionTitle={currentSection?.title}
            onComplete={handleLessonComplete}
            isCompleted={isCurrentCompleted}
            playerRef={playerRef}
            onProgress={handleVideoProgress}
            onVideoComplete={handleVideoComplete}
            onNext={hasNext() ? goToNext : null}
            isEnrolled={isEnrolled}
            courseSlug={course?.slug || id}
          />

          {/* Responsive Control Bar for Mobile and Desktop */}
          {isEnrolled && currentLesson && (
            <div className="mt-4 bg-white dark:bg-dark-900 rounded-2xl border border-slate-200 dark:border-dark-800 p-3.5 sm:p-4 shadow-xs">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Left: Navigation and Lesson completion toggle */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={goToPrev}
                    disabled={!hasPrev()}
                    className="btn-secondary !text-xs !py-2 !px-3 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  >
                    <HiArrowLeft className="w-3.5 h-3.5" /> Previous
                  </button>

                  <button
                    onClick={() => handleLessonComplete(!isCurrentCompleted)}
                    disabled={completing}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 shrink-0 ${
                      isCurrentCompleted
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    }`}
                  >
                    <HiCheck
                      className={`w-4 h-4 ${isCurrentCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-white'}`}
                    />
                    <span>
                      {completing
                        ? 'Updating...'
                        : isCurrentCompleted
                          ? 'Lesson Completed'
                          : 'Mark Lesson Complete'}
                    </span>
                  </button>
                </div>

                {/* Right: Next button & Mark Course Complete */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5">
                  <div className="text-xs text-slate-500 font-medium sm:hidden">
                    <span className="font-bold text-emerald-600">{totalCompleted}</span> /{' '}
                    {totalLessons} completed
                  </div>

                  {hasNext() ? (
                    <button
                      onClick={goToNext}
                      className="bg-amber-800 hover:bg-amber-900 text-white font-bold py-2 px-4 rounded-xl shadow-xs transition-all flex items-center gap-1.5 text-xs cursor-pointer active:scale-95 ml-auto sm:ml-0 shrink-0"
                    >
                      <span>Next Lesson</span>
                      <HiArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleMarkCourseComplete}
                      disabled={completingCourse}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold py-2 px-4 rounded-xl shadow-sm transition-all flex items-center gap-1.5 text-xs cursor-pointer active:scale-95 ml-auto sm:ml-0 shrink-0"
                    >
                      <span>
                        🎉 {isAllCompleted ? 'Course 100% Completed!' : 'Mark Course Complete'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar under action bar */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-dark-800 flex items-center gap-3">
                <div className="flex-1 bg-slate-100 dark:bg-dark-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.round(totalLessons > 0 ? (totalCompleted / totalLessons) * 100 : 0))}%`,
                    }}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-500 shrink-0">
                  {Math.min(
                    100,
                    Math.round(totalLessons > 0 ? (totalCompleted / totalLessons) * 100 : 0)
                  )}
                  % Completed
                </span>
              </div>
            </div>
          )}

          {/* Tabs below — only shown when the viewer has access to content */}
          {tabs.length > 0 && (
            <div className="mt-6 sm:mt-8">
              <Tabs
                tabs={tabs}
                activeTab={safeActiveTab}
                onChange={(key) => validTabKeys.has(key) && setActiveTab(key)}
                className="mb-4"
              />

              {safeActiveTab === 'content' && currentLesson && (
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

              {safeActiveTab === 'resources' && (
                <div className="card p-4 sm:p-6">
                  <h3 className="font-semibold text-dark-900 dark:text-white mb-4 text-sm sm:text-base flex items-center gap-2">
                    <span className="text-lg">📎</span> Lesson Attachments & Notes
                  </h3>
                  {availableResources.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {availableResources.map((r, i) => (
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

              {safeActiveTab === 'quizzes' && (
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
                            key={quizLesson.id || quizLesson._id}
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

              {safeActiveTab === 'discussions' && (
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
                      <div key={d.id || d._id} className="card p-4">
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
                            {/* Only show title as a bold heading when it's not just the
                              first line of content (the form auto-derives title from the
                              same textarea, so they're identical for short messages). */}
                            {d.title &&
                              d.title.trim() !== d.content?.trim()?.slice(0, d.title.length) && (
                                <p className="text-sm font-semibold text-dark-800 dark:text-dark-200 mt-1">
                                  {d.title}
                                </p>
                              )}
                            <p className="text-sm text-dark-600 dark:text-dark-400 mt-1 break-words">
                              {d.content}
                            </p>
                            {d.replies?.length > 0 && (
                              <div className="mt-3 pl-3 sm:pl-4 border-l-2 border-dark-100 dark:border-dark-700 space-y-2">
                                {d.replies.map((r, ri) => (
                                  <div key={ri} className="text-sm">
                                    <span className="font-medium text-dark-700 dark:text-dark-300">
                                      {r.userName || r.user?.name || 'User'}:{' '}
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
          )}
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 xl:w-96 flex-shrink-0 p-4 lg:p-6 lg:pl-0">
          <LessonSidebar
            sections={sections}
            currentLesson={currentLesson}
            currentLessonId={currentLesson?._id || currentLesson?.id}
            completedLessonIds={completedLessonIds}
            onSelectLesson={handleLessonSelect}
            totalCompleted={totalCompleted}
            totalLessons={totalLessons}
            isEnrolled={isEnrolled}
          />
        </div>
      </div>
    </div>
  );
}
