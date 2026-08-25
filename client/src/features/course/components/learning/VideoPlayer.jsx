import { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';

export function isYouTubeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i.test(url.trim());
}

export function extractYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

const VideoPlayer = forwardRef(({ url, autoPlay = false, onProgress, onComplete }, ref) => {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const videoElRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const isPlayingRef = useRef(false);
  const isHoveredRef = useRef(false);

  const isYouTube = isYouTubeUrl(url);
  const youtubeId = isYouTube ? extractYouTubeId(url) : null;

  // Mask state (ONLY used for YouTube videos)
  const [activeMasks, setActiveMasks] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Expose imperative player methods on ref (e.g. seekTo)
  useImperativeHandle(
    ref,
    () => ({
      seekTo: (seconds) => {
        if (isYouTube && iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({
              event: 'command',
              func: 'seekTo',
              args: [seconds, true],
            }),
            '*'
          );
        } else if (videoElRef.current) {
          videoElRef.current.currentTime = seconds;
        }
      },
      play: () => {
        if (videoElRef.current) {
          videoElRef.current.play().catch(() => {});
        } else if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
            '*'
          );
        }
      },
      pause: () => {
        if (videoElRef.current) {
          videoElRef.current.pause();
        } else if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
            '*'
          );
        }
      },
    }),
    [isYouTube]
  );

  // Sync ref with state
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Turn off captions on YouTube iframe
  const enforceCaptionsOff = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'unloadModule', args: ['captions'] }),
        '*'
      );
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'setOption', args: ['captions', 'track', {}] }),
        '*'
      );
    }
  };

  /**
   * Hover & Visibility State (ONLY applies to YouTube overlays):
   */
  const handleMouseEnter = () => {
    if (!isYouTube) return;
    isHoveredRef.current = true;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setActiveMasks(true);
  };

  const handleMouseMove = () => {
    if (!isYouTube) return;
    isHoveredRef.current = true;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setActiveMasks(true);
  };

  const handleMouseLeave = () => {
    if (!isYouTube) return;
    isHoveredRef.current = false;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (isPlayingRef.current) {
      hideTimeoutRef.current = setTimeout(() => {
        if (!isHoveredRef.current && isPlayingRef.current) {
          setActiveMasks(false);
        }
      }, 5000);
    } else {
      setActiveMasks(true);
    }
  };

  // Subscribe to YouTube state & Progress telemetry
  useEffect(() => {
    if (!isYouTube) return;

    const handleMessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!data) return;

        if (data.event === 'infoDelivery' && data.info) {
          // Play state detection
          if (typeof data.info.playerState === 'number') {
            const state = data.info.playerState;
            if (state === 1) {
              // 1 = Playing
              setIsPlaying(true);
              isPlayingRef.current = true;
              enforceCaptionsOff();

              if (!isHoveredRef.current) {
                if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = setTimeout(() => {
                  if (!isHoveredRef.current && isPlayingRef.current) {
                    setActiveMasks(false);
                  }
                }, 5000);
              }
            } else {
              // 2 = Paused, 0 = Ended, -1 = Unstarted
              setIsPlaying(false);
              isPlayingRef.current = false;
              if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
              }
              setActiveMasks(true);
              if (state === 0) onComplete?.();
            }
          }

          // Progress tracking callback
          if (typeof data.info.currentTime === 'number' && typeof data.info.duration === 'number') {
            const duration = data.info.duration;
            const current = data.info.currentTime;
            if (duration > 0) {
              const played = current / duration;
              onProgress?.({ played, playedSeconds: current, loaded: 1 });
              if (played >= 0.95) onComplete?.();
            }
          }
        }
      } catch {
        // Ignore non-json window postMessage events
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isYouTube, onProgress, onComplete]);

  // Window-level mouse position tracking for Fullscreen & Hover (for YouTube)
  useEffect(() => {
    if (!isYouTube) return;

    const handleWindowMouseMove = (e) => {
      const isCurrentlyFS = Boolean(document.fullscreenElement || document.webkitFullscreenElement);

      if (isCurrentlyFS) {
        handleMouseEnter();
      } else if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const isInside =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;

        if (isInside) {
          handleMouseEnter();
        } else if (isHoveredRef.current) {
          handleMouseLeave();
        }
      }
    };

    const handleFSChange = () => {
      const isCurrentlyFS = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(isCurrentlyFS);
      handleMouseEnter();
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    document.addEventListener('fullscreenchange', handleFSChange);
    document.addEventListener('webkitfullscreenchange', handleFSChange);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      document.removeEventListener('fullscreenchange', handleFSChange);
      document.removeEventListener('webkitfullscreenchange', handleFSChange);
    };
  }, [isYouTube]);

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  if (!url) {
    return (
      <div className="w-full h-full flex items-center justify-center text-dark-400 bg-black aspect-video rounded-2xl">
        <div className="text-center">
          <div className="text-4xl mb-2">🎬</div>
          <p className="font-semibold text-sm">No lecture video available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 ${
        isFullscreen ? '!w-screen !h-screen !max-w-none !rounded-none !border-none' : ''
      }`}
    >
      {/* Option A: YouTube Video (with clean protective ribbons only for YouTube) */}
      {isYouTube && youtubeId ? (
        <>
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=${
              autoPlay ? 1 : 0
            }&color=white&controls=1&rel=0&modestbranding=1&fs=0&iv_load_policy=3&cc_load_policy=0&cc_lang_pref=none&hl=en&playsinline=1`}
            title="Course Video Player"
            className="w-full h-full border-none block"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => {
              if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage(
                  JSON.stringify({ event: 'listening' }),
                  '*'
                );
                enforceCaptionsOff();
              }
            }}
          />

          {/* Top Solid Black Ribbon (Only for YouTube) */}
          <div
            className={`absolute top-0 left-0 right-0 w-full h-[70px] z-10 pointer-events-auto cursor-default bg-black ${
              activeMasks ? 'block opacity-100' : 'hidden opacity-0 pointer-events-none'
            }`}
          />

          {/* Bottom Solid Black Ribbon (Only for YouTube) */}
          <div
            className={`absolute bottom-0 left-0 right-0 w-full h-[62px] z-10 pointer-events-auto cursor-default bg-black ${
              activeMasks ? 'block opacity-100' : 'hidden opacity-0 pointer-events-none'
            }`}
          />

          {/* Fullscreen Button (For YouTube) */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className={`absolute bottom-2 right-2.5 w-9 h-9 bg-neutral-900 hover:bg-blue-600 border border-white/20 hover:border-blue-600 text-white rounded-lg flex items-center justify-center z-20 cursor-pointer ${
              activeMasks ? 'block opacity-100' : 'hidden opacity-0 pointer-events-none'
            }`}
          >
            {isFullscreen ? (
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4l5 5m0 0H4m5 0V4m11 0l-5 5m0 0h5m-5 0V4M4 20l5-5m0 0H4m5 0v5m11 0l-5-5m0 0h5m-5 0v5"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            )}
          </button>
        </>
      ) : (
        /* Option B: Direct Video Files (MP4, WebM, HLS, Cloudinary, S3, etc.) - NO upper or lower black masks & non-downloadable */
        <video
          ref={videoElRef}
          src={url}
          controls
          controlsList="nodownload"
          disableRemotePlayback
          onContextMenu={(e) => e.preventDefault()}
          playsInline
          autoPlay={autoPlay}
          className="w-full h-full object-contain bg-black select-none"
          onTimeUpdate={(e) => {
            const current = e.currentTarget.currentTime;
            const duration = e.currentTarget.duration;
            if (duration > 0) {
              const played = current / duration;
              onProgress?.({ played, playedSeconds: current, loaded: 1 });
              if (played >= 0.95) onComplete?.();
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            onComplete?.();
          }}
        />
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
