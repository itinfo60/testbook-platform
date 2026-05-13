import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HiTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';

// Actions
import { fetchCourseById } from '@/features/course/courseSlice';
import { fetchProgress, completeLesson } from '@/features/enrollment/enrollmentSlice';
import { fetchNotes, createNote, deleteNote } from '@/features/note/noteSlice';
import { fetchDiscussions, createDiscussion } from '@/features/discussion/discussionSlice';

// Components
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Tabs from '@/components/common/Tabs';
import LessonContent from '../components/learning/LessonContent';
import LessonSidebar from '../components/learning/LessonSidebar';

export default function CourseLearning() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentCourse: course, loading } = useSelector(state => state.courses);
  const { currentProgress } = useSelector(state => state.enrollments);
  const { notes } = useSelector(state => state.notes);
  const { discussions } = useSelector(state => state.discussions);

  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('content');
  const [noteText, setNoteText] = useState('');
  const [discussionText, setDiscussionText] = useState('');

  useEffect(() => {
    dispatch(fetchCourseById(id));
    dispatch(fetchProgress(id));
    dispatch(fetchNotes(id));
    dispatch(fetchDiscussions({ courseId: id }));
  }, [dispatch, id]);

  if (loading || !course) return <LoadingSpinner fullScreen />;

  const lessons = course.lessons || course.curriculum || [];
  const currentLesson = lessons[currentLessonIndex];
  const completedLessons = currentProgress?.completedLessons || [];
  const enrollmentId = currentProgress?._id || currentProgress?.enrollmentId;

  const handleLessonSelect = (lesson, index) => {
    setCurrentLessonIndex(index);
  };

  const handleLessonComplete = () => {
    if (enrollmentId && currentLesson) {
      dispatch(completeLesson({ id: enrollmentId, lessonId: currentLesson._id || currentLessonIndex }));
      toast.success('Lesson completed!');
    }
  };

  const handleAddNote = e => {
    e.preventDefault();
    if (!noteText.trim()) return;
    dispatch(createNote({ course: id, content: noteText, lessonId: currentLesson?._id }));
    setNoteText('');
    toast.success('Note added');
  };

  const handleAddDiscussion = e => {
    e.preventDefault();
    if (!discussionText.trim()) return;
    dispatch(createDiscussion({ course: id, content: discussionText, lessonId: currentLesson?._id }));
    setDiscussionText('');
    toast.success('Discussion posted');
  };

  const tabs = [
    { key: 'content', label: 'Content' },
    { key: 'notes', label: 'Notes', count: notes.length },
    { key: 'discussions', label: 'Discussions', count: discussions.length },
  ];

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-950">
      <div className="flex flex-col lg:flex-row">
        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-6">
          <LessonContent lesson={currentLesson} onComplete={handleLessonComplete} />

          <div className="mt-6">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

            {activeTab === 'content' && currentLesson && (
              <div className="card p-6">
                <h3 className="font-semibold text-dark-900 dark:text-white mb-2">{currentLesson.title}</h3>
                <p className="text-dark-600 dark:text-dark-400">{currentLesson.description || 'No description available.'}</p>
                <button onClick={handleLessonComplete} className="btn-success mt-4 text-sm">
                  Mark as Complete
                </button>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                <form onSubmit={handleAddNote} className="card p-4">
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    className="input-field mb-3 min-h-[80px] resize-none"
                  />
                  <button type="submit" className="btn-primary text-sm">Add Note</button>
                </form>
                {notes.map(note => (
                  <div key={note._id} className="card p-4">
                    <div className="flex justify-between items-start">
                      <p className="text-dark-700 dark:text-dark-300 text-sm">{note.content}</p>
                      <button onClick={() => dispatch(deleteNote(note._id))} className="text-dark-400 hover:text-red-500">
                        <HiTrash className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-dark-400 mt-2">{note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ''}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'discussions' && (
              <div className="space-y-4">
                <form onSubmit={handleAddDiscussion} className="card p-4">
                  <textarea
                    value={discussionText}
                    onChange={e => setDiscussionText(e.target.value)}
                    placeholder="Ask a question or start a discussion..."
                    className="input-field mb-3 min-h-[80px] resize-none"
                  />
                  <button type="submit" className="btn-primary text-sm">Post</button>
                </form>
                {discussions.map(d => (
                  <div key={d._id} className="card p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-semibold text-primary-600">
                        {d.user?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-dark-900 dark:text-white">{d.user?.name || 'User'}</span>
                          <span className="text-xs text-dark-400">{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ''}</span>
                        </div>
                        <p className="text-sm text-dark-600 dark:text-dark-400 mt-1">{d.content}</p>
                        {d.replies && d.replies.length > 0 && (
                          <div className="mt-3 pl-4 border-l-2 border-dark-100 dark:border-dark-700 space-y-2">
                            {d.replies.map((r, ri) => (
                              <div key={ri} className="text-sm">
                                <span className="font-medium text-dark-700 dark:text-dark-300">{r.user?.name || 'User'}: </span>
                                <span className="text-dark-500">{r.content}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0 p-4 lg:p-6 lg:pl-0">
          <LessonSidebar
            lessons={lessons}
            currentLesson={currentLessonIndex}
            completedLessons={completedLessons}
            onSelectLesson={handleLessonSelect}
          />
        </div>
      </div>
    </div>
  );
}
