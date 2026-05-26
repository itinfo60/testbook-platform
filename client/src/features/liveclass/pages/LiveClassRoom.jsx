import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  HiMicrophone,
  HiOutlineMicrophone,
  HiVideoCamera,
  HiPhone,
  HiChat,
  HiX,
  HiDesktopComputer,
  HiEyeOff,
} from 'react-icons/hi';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '@/services/api';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export default function LiveClassRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useSelector((s) => s.auth);

  const [liveClass, setLiveClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [participants, setParticipants] = useState([]);
  const [handRaised, setHandRaised] = useState(false);

  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef({}); // socketId -> RTCPeerConnection
  const remoteVideosRef = useRef({}); // socketId -> <video> element

  const createPeer = useCallback((remoteSockId, stream) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peersRef.current[remoteSockId] = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current.emit('webrtc_ice_candidate', {
          to: remoteSockId,
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (e) => {
      const [remoteStream] = e.streams;
      if (remoteVideosRef.current[remoteSockId]) {
        remoteVideosRef.current[remoteSockId].srcObject = remoteStream;
      }
    };

    return pc;
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data } = await api.get(`/live-classes/${id}`);
        if (!mounted) return;
        setLiveClass(data.data?.liveClass);

        // Join attendance
        await api.post(`/live-classes/${id}/join`);

        // Get local media
        const stream = await navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .catch(() => {
            toast.error('Camera/microphone not available — joining audio-only');
            return navigator.mediaDevices.getUserMedia({ audio: true });
          });

        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // Connect socket
        const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
          auth: { token },
          transports: ['websocket', 'polling'],
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('join_liveclass', { liveClassId: id });
        });

        // A new peer joined — we send them an offer
        socket.on('peer_joined', async ({ userId: peerId, socketId: remoteId }) => {
          if (!mounted) return;
          setParticipants((p) => [
            ...p.filter((x) => x.socketId !== remoteId),
            { userId: peerId, socketId: remoteId },
          ]);
          const pc = createPeer(remoteId, stream);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc_offer', { to: remoteId, offer, liveClassId: id });
        });

        socket.on('peer_left', ({ socketId: remoteId }) => {
          if (!mounted) return;
          setParticipants((p) => p.filter((x) => x.socketId !== remoteId));
          if (peersRef.current[remoteId]) {
            peersRef.current[remoteId].close();
            delete peersRef.current[remoteId];
          }
        });

        socket.on('webrtc_offer', async ({ from, offer }) => {
          const pc = createPeer(from, stream);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc_answer', { to: from, answer });
        });

        socket.on('webrtc_answer', async ({ from, answer }) => {
          const pc = peersRef.current[from];
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on('webrtc_ice_candidate', async ({ from, candidate }) => {
          const pc = peersRef.current[from];
          if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
        });

        socket.on('liveclass_chat', (msg) => {
          if (mounted) setMessages((m) => [...m, msg]);
        });

        socket.on('live_class_ended', () => {
          toast.error('The class has ended.');
          navigate(-1);
        });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to join class');
        navigate(-1);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      Object.values(peersRef.current).forEach((pc) => pc.close());
    };
  }, [id, token, navigate, createPeer]);

  const toggleMic = () => {
    const audioTracks = localStreamRef.current?.getAudioTracks();
    audioTracks?.forEach((t) => {
      t.enabled = !t.enabled;
    });
    setMicOn((m) => !m);
  };

  const toggleCam = () => {
    const videoTracks = localStreamRef.current?.getVideoTracks();
    videoTracks?.forEach((t) => {
      t.enabled = !t.enabled;
    });
    setCamOn((c) => !c);
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socketRef.current?.emit('liveclass_chat', { liveClassId: id, message: chatInput.trim() });
    setChatInput('');
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setScreenSharing(false);
      socketRef.current?.emit('screen_share_stop', { liveClassId: id });
      // Restore camera track in all peer connections
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (videoTrack) {
        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          sender?.replaceTrack(videoTrack);
        });
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        setScreenSharing(true);
        socketRef.current?.emit('screen_share_start', { liveClassId: id });
        // Replace video track in all peer connections
        Object.values(peersRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          sender?.replaceTrack(screenTrack);
        });
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        screenTrack.onended = () => toggleScreenShare();
      } catch {
        toast.error('Screen share cancelled or not supported');
      }
    }
  };

  const toggleHandRaise = () => {
    const newState = !handRaised;
    setHandRaised(newState);
    socketRef.current?.emit(newState ? 'raise_hand' : 'lower_hand', { liveClassId: id });
  };

  const leaveClass = () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    socketRef.current?.emit('leave_liveclass', { liveClassId: id });
    navigate(-1);
  };

  if (loading)
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white font-semibold text-sm">LIVE</span>
        </div>
        <h1 className="text-white font-medium text-sm flex-1 truncate">{liveClass?.title}</h1>
        <span className="text-slate-400 text-xs">{participants.length + 1} participants</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Video grid */}
        <div className="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 gap-3 auto-rows-fr overflow-y-auto">
          {/* Local video */}
          <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-slate-900/80 rounded-lg px-2 py-0.5 text-xs text-white">
              {user?.name} (You)
            </div>
            {!camOn && (
              <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                <HiEyeOff className="h-8 w-8 text-slate-500" />
              </div>
            )}
          </div>

          {/* Remote videos */}
          {participants.map((p) => (
            <div
              key={p.socketId}
              className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700"
            >
              <video
                ref={(el) => {
                  remoteVideosRef.current[p.socketId] = el;
                }}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-slate-900/80 rounded-lg px-2 py-0.5 text-xs text-white">
                Participant
              </div>
            </div>
          ))}
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
                    {m.userId === user?._id ? 'You' : 'Participant'}
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

      {/* Controls bar */}
      <div className="h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4">
        <button
          onClick={toggleMic}
          className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
          title={micOn ? 'Mute' : 'Unmute'}
        >
          {micOn ? (
            <HiMicrophone className="h-5 w-5" />
          ) : (
            <HiOutlineMicrophone className="h-5 w-5" />
          )}
        </button>

        <button
          onClick={toggleCam}
          className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${camOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
          title={camOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {camOn ? <HiVideoCamera className="h-5 w-5" /> : <HiEyeOff className="h-5 w-5" />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${screenSharing ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
          title={screenSharing ? 'Stop sharing' : 'Share screen'}
        >
          <HiDesktopComputer className="h-5 w-5" />
        </button>

        <button
          onClick={toggleHandRaise}
          className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors text-lg ${handRaised ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
          title={handRaised ? 'Lower hand' : 'Raise hand'}
        >
          ✋
        </button>

        <button
          onClick={() => setChatOpen((c) => !c)}
          className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${chatOpen ? 'bg-primary-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
          title="Toggle chat"
        >
          <HiChat className="h-5 w-5" />
        </button>

        <button
          onClick={leaveClass}
          className="h-12 w-24 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 transition-colors"
        >
          <HiPhone className="h-5 w-5" /> Leave
        </button>
      </div>
    </div>
  );
}
