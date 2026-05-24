import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { courseAPI, discussionAPI } from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { HiCheckCircle, HiThumbUp, HiTrash, HiReply, HiChevronDown, HiChevronUp } from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

function Avatar({ user, size = 'h-8 w-8' }) {
  return (
    <div className={`${size} rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 overflow-hidden`}>
      {user?.avatar ? (
        <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
      ) : (
        <span className="text-xs font-medium text-primary-600">{user?.name?.[0]?.toUpperCase() || '?'}</span>
      )}
    </div>
  );
}

function ReplyItem({ reply, discussionId, onDeleted, onUpdated, currentUserId }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Delete this reply?')) return;
    try {
      await discussionAPI.deleteReply(discussionId, reply._id);
      onDeleted(reply._id);
      toast.success('Reply deleted');
    } catch {
      toast.error('Failed to delete reply');
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === reply.content) {
      setIsEditing(false);
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await discussionAPI.updateReply(discussionId, reply._id, { content: editContent });
      onUpdated(res.data?.data?.reply || res.data?.reply);
      toast.success('Reply updated');
      setIsEditing(false);
    } catch {
      toast.error('Failed to update reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-start gap-2 pl-4 border-l-2 border-dark-100 dark:border-dark-700">
      <Avatar user={reply.user} size="h-6 w-6" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-dark-700 dark:text-dark-300">{reply.user?.name || 'User'}</span>
          {reply.user?.role === 'teacher' && (
            <span className="badge badge-primary text-xs py-0">Teacher</span>
          )}
          <span className="text-xs text-dark-400">
            {reply.createdAt ? formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true }) : ''}
            {reply.createdAt !== reply.updatedAt && <span className="ml-1 text-[10px]">(edited)</span>}
          </span>
        </div>
        
        {isEditing ? (
          <div className="mt-1">
            <textarea
              className="input-field text-sm p-2 mb-1 w-full"
              rows={2}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={isSubmitting}
            />
            <div className="flex gap-2">
              <button onClick={handleEdit} disabled={isSubmitting} className="btn-primary py-1 px-3 text-xs">Save</button>
              <button onClick={() => { setIsEditing(false); setEditContent(reply.content); }} disabled={isSubmitting} className="btn-secondary py-1 px-3 text-xs">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-dark-600 dark:text-dark-400 mt-0.5 whitespace-pre-wrap">{reply.content}</p>
        )}
      </div>
      
      {!isEditing && (
        <div className="flex gap-1">
          {currentUserId === reply.user?._id && (
            <button onClick={() => setIsEditing(true)} className="text-dark-300 hover:text-blue-500 transition-colors flex-shrink-0 mt-0.5" title="Edit Reply">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
          )}
          <button onClick={handleDelete} className="text-dark-300 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5" title="Delete Reply">
            <HiTrash className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function DiscussionItem({ disc, onDelete, onUpdate, courseId, currentUserId }) {
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState(disc.replies || []);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isResolved, setIsResolved] = useState(disc.isResolved);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(disc.title);
  const [editContent, setEditContent] = useState(disc.content);
  
  const textareaRef = useRef(null);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const res = await discussionAPI.reply(disc._id, { content: replyText });
      const newReply = res.data?.data?.reply || res.data?.reply;
      if (newReply) setReplies(prev => [...prev, newReply]);
      setReplyText('');
      toast.success('Reply sent');
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditDiscussion = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error('Title and content cannot be empty');
      return;
    }
    setSubmitting(true);
    try {
      const res = await discussionAPI.update(disc._id, { title: editTitle, content: editContent });
      toast.success('Discussion updated');
      setIsEditing(false);
      if (onUpdate) onUpdate(res.data?.data?.discussion || res.data?.discussion);
    } catch {
      toast.error('Failed to update discussion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this discussion?')) return;
    try {
      await discussionAPI.delete(disc._id);
      onDelete(disc._id);
      toast.success('Discussion deleted');
    } catch {
      toast.error('Failed to delete discussion');
    }
  };

  const handleResolve = async () => {
    try {
      await discussionAPI.resolve(disc._id);
      setIsResolved(v => !v);
    } catch {
      toast.error('Failed');
    }
  };

  const handleReplyDeleted = (replyId) => {
    setReplies(prev => prev.filter(r => r._id !== replyId));
  };

  const handleReplyUpdated = (updatedReply) => {
    setReplies(prev => prev.map(r => r._id === updatedReply._id ? updatedReply : r));
  };

  return (
    <div className={`card p-4 ${isResolved ? 'opacity-75' : ''}`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar user={disc.user} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-medium text-dark-900 dark:text-white">{disc.user?.name || 'Student'}</span>
            <span className="text-xs text-dark-400">
              {disc.createdAt ? formatDistanceToNow(new Date(disc.createdAt), { addSuffix: true }) : ''}
              {disc.createdAt !== disc.updatedAt && <span className="ml-1 text-[10px]">(edited)</span>}
            </span>
            {isResolved && (
              <span className="badge badge-success text-xs flex items-center gap-1 py-0">
                <HiCheckCircle className="h-3 w-3" /> Resolved
              </span>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-2 mt-2">
              <input 
                type="text" 
                className="input-field font-medium w-full" 
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Discussion title"
                disabled={submitting}
              />
              <textarea 
                className="input-field text-sm w-full" 
                rows={3}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Discussion details"
                disabled={submitting}
              />
              <div className="flex gap-2 pt-1">
                <button onClick={handleEditDiscussion} disabled={submitting} className="btn-primary py-1 px-4 text-sm">Save</button>
                <button onClick={() => { setIsEditing(false); setEditTitle(disc.title); setEditContent(disc.content); }} disabled={submitting} className="btn-secondary py-1 px-4 text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <h4 className="font-medium text-dark-800 dark:text-dark-200">{disc.title}</h4>
              <p className="text-sm text-dark-500 mt-1 whitespace-pre-wrap">{disc.content}</p>
            </>
          )}
        </div>
        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {currentUserId === disc.user?._id && (
              <button
                onClick={() => setIsEditing(true)}
                title="Edit discussion"
                className="p-1.5 rounded-lg text-dark-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
            )}
            <button
              onClick={handleResolve}
              title={isResolved ? 'Mark unresolved' : 'Mark resolved'}
              className={`p-1.5 rounded-lg transition-colors ${isResolved ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-dark-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
            >
              <HiCheckCircle className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              title="Delete discussion"
              className="p-1.5 rounded-lg text-dark-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <HiTrash className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Stats + expand */}
      <div className="flex items-center gap-4 mt-3 ml-11">
        <span className="flex items-center gap-1 text-xs text-dark-400">
          <HiThumbUp className="h-3.5 w-3.5" /> {disc.likes?.length || 0}
        </span>
        <button
          onClick={() => { setExpanded(v => !v); setTimeout(() => textareaRef.current?.focus(), 50); }}
          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
        >
          <HiReply className="h-3.5 w-3.5" />
          {replies.length > 0 ? `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}` : 'Reply'}
          {replies.length > 0 && (expanded ? <HiChevronUp className="h-3.5 w-3.5" /> : <HiChevronDown className="h-3.5 w-3.5" />)}
        </button>
      </div>

      {/* Replies + reply box */}
      {expanded && (
        <div className="mt-3 ml-11 space-y-3">
          {replies.map(reply => (
            <ReplyItem
              key={reply._id}
              reply={reply}
              discussionId={disc._id}
              onDeleted={handleReplyDeleted}
              onUpdated={handleReplyUpdated}
              currentUserId={currentUserId}
            />
          ))}

          {/* Reply input */}
          <div className="flex gap-2 pt-1">
            <textarea
              ref={textareaRef}
              rows={2}
              placeholder="Write a reply..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              className="input-field text-sm resize-none flex-1"
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReply(); }}
            />
            <button
              onClick={handleReply}
              disabled={submitting || !replyText.trim()}
              className="btn-primary text-sm px-3 self-end disabled:opacity-50"
            >
              {submitting ? '...' : 'Send'}
            </button>
          </div>
          <p className="text-xs text-dark-400">Ctrl+Enter to send</p>
        </div>
      )}
    </div>
  );
}

export default function TeacherDiscussions() {
  const { user } = useSelector(state => state.auth);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDisc, setLoadingDisc] = useState(false);

  useEffect(() => {
    courseAPI.getTeacherCourses()
      .then(res => {
        const data = res.data?.data;
        const list = Array.isArray(data) ? data : data?.courses || [];
        setCourses(list);
        if (list.length > 0) setSelectedCourse(list[0]._id);
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    setLoadingDisc(true);
    discussionAPI.getCourseDiscussions(selectedCourse, { limit: 50 })
      .then(res => {
        const data = res.data?.data;
        setDiscussions(Array.isArray(data) ? data : data?.docs || []);
      })
      .catch(() => setDiscussions([]))
      .finally(() => setLoadingDisc(false));
  }, [selectedCourse]);

  const handleDelete = (id) => setDiscussions(prev => prev.filter(d => d._id !== id));

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-dark-900 dark:text-white">Course Discussions</h2>
        <span className="text-sm text-dark-400">{discussions.length} discussion{discussions.length !== 1 ? 's' : ''}</span>
      </div>

      {courses.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="text-lg font-semibold dark:text-white mb-2">No courses yet</h3>
          <p className="text-dark-500">Create a course to see student discussions here.</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="input-field"
            >
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          </div>

          {loadingDisc ? (
            <LoadingSpinner />
          ) : discussions.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-lg font-semibold dark:text-white mb-2">No discussions yet</h3>
              <p className="text-dark-500">Students haven't started any discussions in this course.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {discussions.map(disc => (
                <DiscussionItem
                  key={disc._id}
                  disc={disc}
                  courseId={selectedCourse}
                  onDelete={handleDelete}
                  onUpdate={(updatedDisc) => {
                    setDiscussions(prev => prev.map(d => d._id === updatedDisc._id ? updatedDisc : d));
                  }}
                  currentUserId={user?._id}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
