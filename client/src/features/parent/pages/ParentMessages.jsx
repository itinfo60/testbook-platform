import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { parentAPI } from '@/services/api';
import { Button, Input } from '@/components/ui';
import { HiChat, HiPaperAirplane, HiUser, HiArrowLeft, HiDotsVertical } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

export default function ParentMessages() {
  const { user } = useSelector((state) => state.auth);
  const isTeacher = user?.role === 'teacher';
  const isParent = user?.role === 'parent';

  const [searchParams] = useSearchParams();
  const initialStudentId = searchParams.get('studentId');
  const initialTeacherId = searchParams.get('teacherId');

  // State
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Setup Socket Connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
      socketRef.current = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      socketRef.current.on('parent_teacher_message', (msg) => {
        // Append message if it belongs to current active thread
        if (selectedThread && msg.threadId === selectedThread) {
          setMessages((prev) => [...prev, msg]);
        } else {
          // Refresh threads list to show notification/new message
          fetchThreads();
        }
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [selectedThread]);

  // Load initial data
  useEffect(() => {
    if (isParent) {
      fetchStudents();
    } else if (isTeacher) {
      fetchThreads();
    }
  }, [isParent, isTeacher]);

  // Group load logic
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data } = await parentAPI.getLinkedStudents();
      const stList = data.data?.students || data.students || [];
      setStudents(stList);
      if (stList.length > 0) {
        const defaultStudent = initialStudentId
          ? stList.find((s) => s._id === initialStudentId)
          : stList[0];
        setSelectedStudent(defaultStudent || stList[0]);
      } else {
        setLoading(false);
      }
    } catch {
      toast.error('Failed to load students');
      setLoading(false);
    }
  };

  // Load teachers when student changes (parents only)
  useEffect(() => {
    if (selectedStudent && isParent) {
      fetchTeachers(selectedStudent._id);
    }
  }, [selectedStudent]);

  const fetchTeachers = async (studentId) => {
    setLoading(true);
    try {
      const { data } = await parentAPI.getTeachers(studentId);
      const tchList = data.data?.teachers || data.teachers || [];
      setTeachers(tchList);

      // Auto-load initial chat if passed via queries
      if (initialTeacherId) {
        const found = tchList.find((t) => t._id === initialTeacherId);
        if (found) {
          handleSelectTeacher(found);
        }
      }
    } catch {
      toast.error('Failed to load course teachers');
    } finally {
      setLoading(false);
    }
  };

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const { data } = await parentAPI.getActiveThreads();
      setThreads(data.data?.threads || data.threads || []);
    } catch {
      toast.error('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTeacher = async (teacher) => {
    setSelectedTeacher(teacher);
    const parentId = user._id;
    const teacherId = teacher._id;
    const studentId = selectedStudent._id;
    const threadId = `thread_${studentId}_${parentId}_${teacherId}`;

    setSelectedThread(threadId);
    loadThreadMessages(threadId);
  };

  const handleSelectThread = async (thread) => {
    setSelectedThread(thread.threadId);
    const otherUser = thread.sender._id === user._id ? thread.recipient : thread.sender;
    setSelectedTeacher(otherUser);
    setSelectedStudent(thread.student);
    loadThreadMessages(thread.threadId);
  };

  const loadThreadMessages = async (threadId) => {
    try {
      const { data } = await parentAPI.getThreadMessages(threadId);
      setMessages(data.data?.messages || data.messages || []);
    } catch {
      toast.error('Failed to load message thread');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedTeacher || !selectedStudent) return;

    setSending(true);
    try {
      await parentAPI.sendMessage({
        recipientId: selectedTeacher._id,
        studentId: selectedStudent._id,
        content: messageInput.trim(),
      });
      setMessageInput('');
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading && students.length === 0 && threads.length === 0) {
    return <div className="p-8 text-center text-dark-500">Loading messages panel...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <Link
          to={isParent ? '/parent' : '/teacher'}
          className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-500 transition-colors"
        >
          <HiArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
            <HiChat className="text-primary-500" /> Messaging Center
          </h1>
          <p className="text-xs text-dark-400">Parent-Teacher direct communication channel</p>
        </div>
      </div>

      <div className="flex-1 flex bg-white dark:bg-dark-900 rounded-2xl border border-dark-200 dark:border-dark-800 overflow-hidden shadow-sm">
        {/* Sidebar */}
        <div className="w-80 border-r border-dark-200 dark:border-dark-800 flex flex-col bg-dark-50/50 dark:bg-dark-950/20">
          {isParent && (
            <div className="p-4 border-b border-dark-200 dark:border-dark-800">
              <label className="block text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
                Select Student
              </label>
              <select
                value={selectedStudent?._id || ''}
                onChange={(e) => {
                  const found = students.find((s) => s._id === e.target.value);
                  setSelectedStudent(found);
                  setSelectedTeacher(null);
                  setSelectedThread(null);
                  setMessages([]);
                }}
                className="input-field w-full text-sm"
              >
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isParent ? (
              <>
                <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider px-3 py-2">
                  Teachers
                </p>
                {teachers.length === 0 ? (
                  <p className="text-xs text-dark-500 px-3">
                    No active teachers found for enrolled courses.
                  </p>
                ) : (
                  teachers.map((t) => (
                    <button
                      key={t._id}
                      onClick={() => handleSelectTeacher(t)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                        selectedTeacher?._id === t._id
                          ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/30'
                          : 'hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-700 dark:text-dark-300'
                      }`}
                    >
                      <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center font-bold text-sm">
                        {t.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{t.name}</p>
                        <p className="text-xs text-dark-400 capitalize">{t.role}</p>
                      </div>
                    </button>
                  ))
                )}
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider px-3 py-2">
                  Parent Conversations
                </p>
                {threads.length === 0 ? (
                  <p className="text-xs text-dark-500 px-3">No active parent chats found.</p>
                ) : (
                  threads.map((thread) => {
                    const otherUser =
                      thread.sender._id === user._id ? thread.recipient : thread.sender;
                    const isActive = selectedThread === thread.threadId;
                    return (
                      <button
                        key={thread._id}
                        onClick={() => handleSelectThread(thread)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                          isActive
                            ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/30'
                            : 'hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-700 dark:text-dark-300'
                        }`}
                      >
                        <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center font-bold text-sm">
                          {otherUser?.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <p className="font-semibold text-sm truncate">{otherUser?.name}</p>
                            <span className="text-[10px] text-dark-400">
                              {new Date(thread.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-dark-500 truncate">{thread.content}</p>
                          <p className="text-[10px] text-primary-500 mt-1 font-medium">
                            Student: {thread.student?.name}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-dark-900">
          {selectedThread ? (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-dark-200 dark:border-dark-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center font-bold text-indigo-600">
                    {selectedTeacher?.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-900 dark:text-white text-sm">
                      {selectedTeacher?.name}
                    </h3>
                    <p className="text-xs text-dark-400">
                      Child: <span className="font-semibold">{selectedStudent?.name}</span>
                    </p>
                  </div>
                </div>
                <button className="p-2 hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-400 rounded-lg">
                  <HiDotsVertical className="h-5 w-5" />
                </button>
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => {
                  const isMe = msg.sender._id === user._id || msg.sender === user._id;
                  return (
                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] p-3.5 rounded-2xl text-sm ${
                          isMe
                            ? 'bg-primary-600 text-white rounded-tr-none'
                            : 'bg-dark-100 dark:bg-dark-800 text-dark-800 dark:text-dark-200 rounded-tl-none'
                        }`}
                      >
                        <p className="leading-relaxed break-words">{msg.content}</p>
                        <p
                          className={`text-[10px] mt-1.5 ${isMe ? 'text-white/70' : 'text-dark-400'}`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Compose Bar */}
              <form
                onSubmit={handleSend}
                className="p-4 border-t border-dark-200 dark:border-dark-800 flex gap-2"
              >
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={sending}
                  className="px-4 flex items-center justify-center"
                >
                  <HiPaperAirplane className="h-4 w-4 transform rotate-90" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-dark-400">
              <HiChat className="h-16 w-16 opacity-25 mb-4" />
              <p className="text-base font-medium">Parent-Teacher Private Chat</p>
              <p className="text-xs mt-1">Select a contact from the sidebar to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
