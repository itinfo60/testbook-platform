import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LiveKitRoom,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks,
  VideoTrack,
  RoomAudioRenderer,
  useTrackToggle,
  useDisconnectButton,
} from '@livekit/components-react';
import { Track, Room } from 'livekit-client';
import {
  HiMicrophone,
  HiOutlineMicrophone,
  HiVideoCamera,
  HiPhone,
  HiChat,
  HiX,
  HiDesktopComputer,
  HiEyeOff,
  HiUserGroup,
  HiClock,
} from 'react-icons/hi';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '@/services/api';

// ── Controls using LiveKit hooks ─────────────────────────────────────────────
function MicButton() {
  const { buttonProps, enabled } = useTrackToggle({ source: Track.Source.Microphone });
  return (
    <button
      {...buttonProps}
      className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${enabled ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
    >
      {enabled ? <HiMicrophone className="h-5 w-5" /> : <HiOutlineMicrophone className="h-5 w-5" />}
    </button>
  );
}

function CameraButton() {
  const { buttonProps, enabled } = useTrackToggle({ source: Track.Source.Camera });
  return (
    <button
      {...buttonProps}
      className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${enabled ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
    >
      {enabled ? <HiVideoCamera className="h-5 w-5" /> : <HiEyeOff className="h-5 w-5" />}
    </button>
  );
}

function ScreenShareButton() {
  const { buttonProps, enabled } = useTrackToggle({ source: Track.Source.ScreenShare });
  return (
    <button
      {...buttonProps}
      className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${enabled ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
      title={enabled ? 'Stop sharing' : 'Share screen'}
    >
      <HiDesktopComputer className="h-5 w-5" />
    </button>
  );
}

function LeaveButton({ onLeave }) {
  const { buttonProps } = useDisconnectButton({});
  return (
    <button
      {...buttonProps}
      onClick={() => {
        buttonProps.onClick?.();
        onLeave();
      }}
      className="h-12 w-24 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 transition-colors"
    >
      <HiPhone className="h-5 w-5" /> Leave
    </button>
  );
}

// ── Participant video grid ────────────────────────────────────────────────────
function VideoGrid({ user }) {
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const cameraTracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], {
    onlySubscribed: true,
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 auto-rows-fr overflow-y-auto p-4">
      {/* Local participant */}
      <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700">
        {cameraTracks
          .filter((t) => t.participant.identity === localParticipant.localParticipant?.identity)
          .slice(0, 1)
          .map((t) => (
            <VideoTrack
              key={t.publication.trackSid}
              trackRef={t}
              className="w-full h-full object-cover"
            />
          ))}
        {!localParticipant.isCameraEnabled && (
          <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
            <HiEyeOff className="h-8 w-8 text-slate-500" />
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-slate-900/80 rounded-lg px-2 py-0.5 text-xs text-white">
          {user?.name} (You)
        </div>
      </div>

      {/* Remote participants */}
      {remoteParticipants.map((participant) => {
        const track = cameraTracks.find((t) => t.participant.identity === participant.identity);
        return (
          <div
            key={participant.identity}
            className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700"
          >
            {track ? (
              <VideoTrack trackRef={track} className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                <HiEyeOff className="h-8 w-8 text-slate-500" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-slate-900/80 rounded-lg px-2 py-0.5 text-xs text-white">
              {participant.name || participant.identity}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main inner classroom component (inside LiveKitRoom context) ───────────────
function ClassroomInner({ liveClassId, liveClass, user, token, onLeave }) {
  const remoteParticipants = useRemoteParticipants();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [handRaised, setHandRaised] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_liveclass', { liveClassId });
    });
    socket.on('liveclass_chat', (msg) => {
      setMessages((m) => [...m, msg]);
    });
    socket.on('live_class_ended', () => {
      toast.error('The class has ended.');
      onLeave();
    });

    return () => socket.disconnect();
  }, [liveClassId, token, onLeave]);

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socketRef.current?.emit('liveclass_chat', { liveClassId, message: chatInput.trim() });
    setChatInput('');
  };

  const toggleHandRaise = () => {
    const next = !handRaised;
    setHandRaised(next);
    socketRef.current?.emit(next ? 'raise_hand' : 'lower_hand', { liveClassId });
  };

  return (
    <div className="h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white font-semibold text-sm">LIVE</span>
        </div>
        <h1 className="text-white font-medium text-sm flex-1 truncate">{liveClass?.title}</h1>
        <span className="text-slate-400 text-xs flex items-center gap-1">
          <HiUserGroup className="h-4 w-4" />
          {remoteParticipants.length + 1} participants
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <VideoGrid user={user} />
        </div>

        {/* Chat panel */}
        {chatOpen && (
          <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
            <div className="h-12 flex items-center justify-between px-4 border-b border-slate-800">
              <span className="text-white font-semibold text-sm">Chat</span>
              <button
                onClick={() => setChatOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <HiX className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((m, i) => (
                <div key={i} className="bg-slate-800 rounded-xl p-2.5">
                  <p className="text-xs text-primary-400 font-medium mb-1">
                    {m.userId === user?._id ? 'You' : m.name || 'Participant'}
                  </p>
                  <p className="text-sm text-slate-200">{m.message}</p>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-center text-slate-500 text-xs mt-8">No messages yet</p>
              )}
            </div>
            <form onSubmit={sendChat} className="p-3 border-t border-slate-800">
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Type a message..."
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4">
        <MicButton />
        <CameraButton />
        <ScreenShareButton />

        <button
          onClick={toggleHandRaise}
          className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors text-lg ${handRaised ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
        >
          ✋
        </button>

        <button
          onClick={() => setChatOpen((c) => !c)}
          className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${chatOpen ? 'bg-primary-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
        >
          <HiChat className="h-5 w-5" />
        </button>

        <LeaveButton onLeave={onLeave} />
      </div>

      {/* LiveKit audio renderer — must be inside LiveKitRoom */}
      <RoomAudioRenderer />
    </div>
  );
}

function CountdownTimer({ targetDate, onArrived }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        if (onArrived) onArrived();
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate, onArrived]);

  if (timeLeft.isPast) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 font-semibold text-sm animate-pulse">
        <HiClock className="h-5 w-5" />
        Starting any moment now...
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 my-6">
      {timeLeft.days > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 min-w-[70px] text-center shadow-lg">
          <span className="text-2xl font-black text-white block">{timeLeft.days}</span>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
            Days
          </span>
        </div>
      )}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 min-w-[70px] text-center shadow-lg">
        <span className="text-2xl font-black text-white block">
          {String(timeLeft.hours).padStart(2, '0')}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
          Hours
        </span>
      </div>
      <span className="text-2xl font-bold text-slate-600">:</span>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 min-w-[70px] text-center shadow-lg">
        <span className="text-2xl font-black text-white block">
          {String(timeLeft.minutes).padStart(2, '0')}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
          Mins
        </span>
      </div>
      <span className="text-2xl font-bold text-slate-600">:</span>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 min-w-[70px] text-center shadow-lg">
        <span className="text-2xl font-black text-primary-400 block">
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
          Secs
        </span>
      </div>
    </div>
  );
}

// ── Root component — fetches token then mounts LiveKitRoom ───────────────────
export default function LiveClassRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useSelector((s) => s.auth);

  const [liveClass, setLiveClass] = useState(null);
  const [livekitToken, setLivekitToken] = useState('');
  const [livekitUrl, setLivekitUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const isTeacherOrAdmin =
    user?.role === 'admin' ||
    user?.role === 'super_admin' ||
    (liveClass && (liveClass.teacherId === user?.id || liveClass.teacherId === user?._id));

  // Pre-configure the Room to avoid livekit-client picking up browser language
  const roomRef = useRef(null);
  if (!roomRef.current) {
    roomRef.current = new Room();
  }

  const loadClassDetails = async () => {
    try {
      const classRes = await api.get(`/live-classes/${id}`);
      const cls = classRes.data.data?.liveClass;
      setLiveClass(cls);

      if (cls?.status === 'live') {
        // Fetch token now
        try {
          const tokenRes = await api.get(`/live-classes/${id}/token`);
          setLivekitToken(tokenRes.data.data?.token);
          setLivekitUrl(tokenRes.data.data?.livekitUrl);
          await api.post(`/live-classes/${id}/join`).catch(() => {});
        } catch (tokenErr) {
          // Token unavailable (e.g. LiveKit not configured, will show meetingUrl fallback)
        }
      }
      return cls;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load class');
      navigate('/live-classes', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id || id === 'undefined') {
      toast.error('Invalid class link');
      navigate('/live-classes', { replace: true });
      return;
    }

    loadClassDetails();

    // Listen for real-time start/status change via Socket
    const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('join_liveclass', { liveClassId: id });
    });

    socket.on('live_class_started', () => {
      toast.success('Live class has started!');
      loadClassDetails();
    });

    socket.on('live_class_status_changed', (data) => {
      if (data.liveClassId === id) {
        loadClassDetails();
      }
    });

    // Fallback polling every 8s while scheduled
    const pollTimer = setInterval(() => {
      api
        .get(`/live-classes/${id}`)
        .then(({ data }) => {
          const cls = data.data?.liveClass;
          if (cls && cls.status !== liveClass?.status) {
            loadClassDetails();
          }
        })
        .catch(() => {});
    }, 8000);

    return () => {
      clearInterval(pollTimer);
      socket.disconnect();
    };
  }, [id]);

  const handleStartClass = async () => {
    setStarting(true);
    try {
      await api.post(`/live-classes/${id}/start`);
      toast.success('Live class started!');
      await loadClassDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start class');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Loading classroom...</p>
      </div>
    );
  }

  // 1. Cancelled State
  if (liveClass?.status === 'cancelled') {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="text-center max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="h-16 w-16 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-4">
            <HiX className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black mb-2">{liveClass.title}</h2>
          <p className="text-slate-400 text-sm mb-6">
            This live class has been cancelled by the host.
          </p>
          <button
            onClick={() => navigate('/live-classes')}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-sm transition-all"
          >
            ← Back to Live Classes
          </button>
        </div>
      </div>
    );
  }

  // 2. Ended State
  if (liveClass?.status === 'ended') {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="text-center max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="h-16 w-16 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <HiVideoCamera className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black mb-2">{liveClass.title}</h2>
          <p className="text-slate-400 text-sm mb-6">This live class has already ended.</p>
          <button
            onClick={() => navigate('/live-classes')}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-sm transition-all"
          >
            ← Back to Live Classes
          </button>
        </div>
      </div>
    );
  }

  // 3. Scheduled State (Waiting Room)
  if (liveClass?.status === 'scheduled') {
    const scheduledDate = new Date(liveClass.scheduledAt).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'short',
    });
    const teacherName = liveClass.teacherName || liveClass.teacher?.name;

    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="max-w-lg w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden backdrop-blur-xl">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl" />

          <div className="h-14 w-14 rounded-2xl bg-primary-500/20 text-primary-400 flex items-center justify-center mx-auto mb-4 border border-primary-500/30">
            <HiVideoCamera className="h-7 w-7" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-3">
            Scheduled Live Session
          </span>

          <h1 className="text-2xl font-extrabold text-white mb-2 leading-tight">
            {liveClass.title}
          </h1>

          {teacherName && (
            <p className="text-slate-400 text-sm font-medium mb-1">
              Instructor: <span className="text-white font-semibold">{teacherName}</span>
            </p>
          )}

          <p className="text-xs text-slate-500 mb-4">
            Scheduled for <span className="text-slate-300 font-medium">{scheduledDate}</span> (
            {liveClass.duration || 60} mins)
          </p>

          {/* Live Countdown */}
          <CountdownTimer targetDate={liveClass.scheduledAt} onArrived={loadClassDetails} />

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 my-4 text-xs text-slate-400">
            <p className="flex items-center justify-center gap-2 font-medium text-slate-300 mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              You are in the waiting room
            </p>
            <p className="text-slate-500">
              The session will connect automatically the moment the host begins.
            </p>
          </div>

          {/* Host Controls */}
          {isTeacherOrAdmin && (
            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <p className="text-xs text-primary-400 font-medium mb-2">Host Options</p>
              <button
                onClick={handleStartClass}
                disabled={starting}
                className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
              >
                <HiVideoCamera className="h-5 w-5" />
                {starting ? 'Starting Session...' : 'Start Live Class Now'}
              </button>
            </div>
          )}

          <button
            onClick={() => navigate('/live-classes')}
            className="mt-5 text-slate-500 hover:text-slate-300 text-xs font-semibold block mx-auto transition-colors"
          >
            ← Back to Live Classes
          </button>
        </div>
      </div>
    );
  }

  // 4. Live State without LiveKit credentials (Fallback to Meeting Link)
  if (!livekitToken || !livekitUrl) {
    const meetingUrl = liveClass?.meetingUrl;
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center text-white max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="h-16 w-16 rounded-2xl bg-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <HiVideoCamera className="h-8 w-8 text-rose-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">{liveClass?.title || 'Live Class'}</h2>
          {meetingUrl ? (
            <>
              <p className="text-slate-400 text-sm mb-6">
                This class uses an external meeting link. Click below to join.
              </p>
              <a
                href={meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-rose-500 hover:bg-rose-600 rounded-xl font-bold text-white transition-colors"
              >
                Join Meeting →
              </a>
            </>
          ) : (
            <>
              <p className="text-slate-400 text-sm mb-2">Live video is not configured yet.</p>
              <p className="text-slate-500 text-xs mb-6">Contact your administrator.</p>
            </>
          )}
          <button
            onClick={() => navigate('/live-classes')}
            className="mt-6 block mx-auto px-4 py-2 bg-slate-800 rounded-lg text-sm hover:bg-slate-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // 5. Live Active LiveKit Room
  return (
    <LiveKitRoom
      room={roomRef.current}
      token={livekitToken}
      serverUrl={livekitUrl}
      connect
      audio
      video
      onDisconnected={() => navigate('/live-classes')}
      onError={(err) => toast.error(`Connection error: ${err.message}`)}
      style={{ height: '100vh' }}
    >
      <ClassroomInner
        liveClassId={id}
        liveClass={liveClass}
        user={user}
        token={token}
        onLeave={() => navigate('/live-classes')}
      />
    </LiveKitRoom>
  );
}
