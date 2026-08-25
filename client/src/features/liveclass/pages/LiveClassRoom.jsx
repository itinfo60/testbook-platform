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

// ── Root component — fetches token then mounts LiveKitRoom ───────────────────
export default function LiveClassRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useSelector((s) => s.auth);

  const [liveClass, setLiveClass] = useState(null);
  const [livekitToken, setLivekitToken] = useState('');
  const [livekitUrl, setLivekitUrl] = useState('');
  const [loading, setLoading] = useState(true);

  // Pre-configure the Room to avoid livekit-client picking up browser language
  // (throws "language override unsupported: Hindi/etc" when locale ≠ en)
  const roomRef = useRef(null);
  if (!roomRef.current) {
    roomRef.current = new Room();
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [classRes, tokenRes] = await Promise.all([
          api.get(`/live-classes/${id}`),
          api.get(`/live-classes/${id}/token`),
        ]);
        if (!mounted) return;
        setLiveClass(classRes.data.data?.liveClass);
        setLivekitToken(tokenRes.data.data?.token);
        setLivekitUrl(tokenRes.data.data?.livekitUrl);
        await api.post(`/live-classes/${id}/join`);
      } catch (err) {
        if (!mounted) return;
        toast.error(err.response?.data?.message || 'Failed to join class');
        navigate(-1);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!livekitToken || !livekitUrl) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-lg font-semibold mb-2">Live video not configured</p>
          <p className="text-slate-400 text-sm">Contact your administrator to set up LiveKit.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-slate-700 rounded-lg text-sm hover:bg-slate-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      room={roomRef.current}
      token={livekitToken}
      serverUrl={livekitUrl}
      connect
      audio
      video
      onDisconnected={() => navigate(-1)}
      onError={(err) => toast.error(`Connection error: ${err.message}`)}
      style={{ height: '100vh' }}
    >
      <ClassroomInner
        liveClassId={id}
        liveClass={liveClass}
        user={user}
        token={token}
        onLeave={() => navigate(-1)}
      />
    </LiveKitRoom>
  );
}
