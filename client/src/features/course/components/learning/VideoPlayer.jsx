import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  HiArrowPath,
  HiArrowsPointingIn,
  HiArrowsPointingOut,
  HiPause,
  HiPlay,
  HiSpeakerWave,
  HiSpeakerXMark,
} from 'react-icons/hi2';
import YouTubeSurface from './YouTubeSurface';
import { getVideoSource } from './videoSource';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const COMPLETION_RATIO = 0.95;
const CONTROLS_IDLE_MS = 2500;
const SEEK_STEP_SECONDS = 5;
const EXPANDED_Z_INDEX = '2147483000';
// After every start/resume YouTube shows its own round play/pause icon in the
// centre of the frame for about three seconds, even with controls disabled.
const YOUTUBE_ICON_COVER_MS = 3500;
// Overscan reduces provider chrome for typical 16:9 videos. This is cosmetic,
// not access control: YouTube can change its UI and the source ID stays public
// to the viewing browser. Non-playing frames are covered opaquely below.
const YOUTUBE_OVERSCAN = 'calc(max(100px, 15%) * -1)';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function formatTime(value) {
  const total = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`
    : `${minutes}:${seconds}`;
}

function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function errorMessage(error) {
  if (typeof error === 'string' && error) return error;
  return error?.message || 'The video could not be played. Please retry.';
}

function PlayerMessage({ children }) {
  return (
    <div
      role="region"
      aria-label="Video player"
      className="relative flex w-full aspect-video items-center justify-center bg-black text-center text-slate-400"
    >
      <div>
        <div className="text-4xl mb-2" aria-hidden="true">
          🎬
        </div>
        <p className="font-semibold text-sm">{children}</p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span className="block h-12 w-12 rounded-full border-4 border-white/25 border-t-amber-400 animate-spin" />
  );
}

function CenterBadge({ children }) {
  return (
    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-950 text-white shadow-2xl ring-1 ring-white/20 sm:h-20 sm:w-20">
      {children}
    </span>
  );
}

const PlayerSession = forwardRef(function PlayerSession(
  { source, autoPlay = false, onProgress, onComplete },
  ref
) {
  const isYouTube = source.type === 'youtube';
  const regionRef = useRef(null);
  const videoRef = useRef(null);
  const surfaceRef = useRef(null);
  const fullscreenButtonRef = useRef(null);
  const controlsRef = useRef(null);
  const scrubCleanupRef = useRef(null);
  const lifetimeRef = useRef({ active: true, requestingFullscreen: false });
  const callbacksRef = useRef({});
  callbacksRef.current = { onProgress, onComplete };
  const completedRef = useRef(false);
  const pendingSeekRef = useRef(null);
  const autoplayTriedRef = useRef(false);
  const scrubbingRef = useRef(false);
  const idleTimerRef = useRef(null);
  const iconCoverTimerRef = useRef(null);
  const resumeAtRef = useRef(0);
  const pointerTypeRef = useRef('mouse');

  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(!isYouTube);
  // idle | playing | paused | buffering | ended
  const [playback, setPlayback] = useState('idle');
  const [hasStarted, setHasStarted] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [coverYouTubeIcon, setCoverYouTubeIcon] = useState(false);

  const isActive = playback === 'playing' || playback === 'buffering';
  const canPlay = ready && !error;
  const immersive = isFullscreen || expanded;
  const controlsShown = controlsVisible || playback !== 'playing' || Boolean(error);

  const markComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    callbacksRef.current.onComplete?.();
  }, []);

  const handleProgress = useCallback(
    ({ played, playedSeconds, duration: total, loaded }) => {
      if (!scrubbingRef.current) setCurrentTime(playedSeconds);
      if (total > 0) setDuration(total);
      if (Number.isFinite(loaded)) setBuffered(loaded);
      callbacksRef.current.onProgress?.({ played, playedSeconds, duration: total, loaded });
      if (played >= COMPLETION_RATIO) markComplete();
    },
    [markComplete]
  );

  const showControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (!scrubbingRef.current && !controlsRef.current?.contains(document.activeElement)) {
        setControlsVisible(false);
      }
    }, CONTROLS_IDLE_MS);
  }, []);

  const coverIconBriefly = useCallback(() => {
    setCoverYouTubeIcon(true);
    clearTimeout(iconCoverTimerRef.current);
    iconCoverTimerRef.current = setTimeout(() => setCoverYouTubeIcon(false), YOUTUBE_ICON_COVER_MS);
  }, []);

  useEffect(() => {
    const lifetime = lifetimeRef.current;
    const region = regionRef.current;
    lifetime.active = true;
    return () => {
      lifetime.active = false;
      scrubCleanupRef.current?.();
      clearTimeout(idleTimerRef.current);
      clearTimeout(iconCoverTimerRef.current);
      if (getFullscreenElement() === region) {
        try {
          const exit = document.exitFullscreen || document.webkitExitFullscreen;
          Promise.resolve(exit?.call(document)).catch(() => {});
          window.screen?.orientation?.unlock?.();
        } catch {
          /* The browser may already have exited. */
        }
      }
    };
  }, []);

  // ---- Playback commands -------------------------------------------------

  const playNative = async (video) => {
    try {
      await video.play();
    } catch {
      // Autoplay policies reject without a pause event; leave a usable Play button.
      if (video.paused) setPlayback((prev) => (prev === 'ended' ? prev : 'paused'));
    }
  };

  const seek = (seconds) => {
    if (!Number.isFinite(seconds)) return;
    const target = Math.max(0, duration > 0 ? Math.min(seconds, duration) : seconds);
    setCurrentTime(target);
    if (playback === 'ended' && target < duration) setPlayback('paused');
    if (isYouTube) {
      surfaceRef.current?.seekTo(target);
      return;
    }
    const video = videoRef.current;
    if (video && video.readyState >= 1) video.currentTime = target;
    else pendingSeekRef.current = target;
  };
  const seekRef = useRef(seek);
  seekRef.current = seek;

  const play = () => {
    if (!canPlay) return Promise.resolve();
    if (playback === 'ended') seek(0);
    if (isYouTube)
      return Promise.resolve(surfaceRef.current?.play()).catch((err) => {
        if (lifetimeRef.current.active) {
          setError(errorMessage(err));
          setPlayback('paused');
        }
      });
    const video = videoRef.current;
    return video ? playNative(video) : Promise.resolve();
  };

  const pause = () => {
    if (isYouTube) {
      surfaceRef.current?.pause();
      // Cover the frame immediately instead of waiting for YouTube's state event.
      setPlayback((prev) => (prev === 'ended' ? prev : 'paused'));
      return;
    }
    videoRef.current?.pause();
  };

  const togglePlay = () => (isActive ? pause() : play());

  const changeVolume = (value) => {
    if (!Number.isFinite(value)) return;
    const next = clamp(value, 0, 1);
    const nextMuted = next === 0;
    setVolume(next);
    setMuted(nextMuted);
    if (isYouTube) {
      surfaceRef.current?.setVolume(next);
      if (muted !== nextMuted) surfaceRef.current?.setMuted(nextMuted);
    } else if (videoRef.current) {
      videoRef.current.volume = next;
      videoRef.current.muted = nextMuted;
    }
  };

  const toggleMute = () => {
    if (muted && volume === 0) {
      changeVolume(0.5);
      return;
    }
    const next = !muted;
    setMuted(next);
    if (isYouTube) surfaceRef.current?.setMuted(next);
    else if (videoRef.current) videoRef.current.muted = next;
  };

  const changeRate = (value) => {
    if (!SPEEDS.includes(value)) return;
    setRate(value);
    if (isYouTube) surfaceRef.current?.setPlaybackRate(value);
    else if (videoRef.current) videoRef.current.playbackRate = value;
  };

  const retry = () => {
    autoplayTriedRef.current = false;
    resumeAtRef.current = currentTime;
    if (!isYouTube && currentTime > 0) pendingSeekRef.current = currentTime;
    setError(null);
    setReady(!isYouTube);
    setPlayback('idle');
    setAttempt((value) => value + 1);
  };

  // A retried YouTube session is a fresh SDK player; resume where it failed.
  useEffect(() => {
    if (attempt > 0 && isYouTube && resumeAtRef.current > 0) {
      surfaceRef.current?.seekTo(resumeAtRef.current);
    }
  }, [attempt, isYouTube]);

  // ---- Fullscreen ----------------------------------------------------------

  useEffect(() => {
    const sync = () => {
      const active = getFullscreenElement() === regionRef.current;
      setIsFullscreen(active);
      if (isYouTube) coverIconBriefly();
      if (!active) {
        try {
          window.screen?.orientation?.unlock?.();
        } catch {
          // Orientation lock is only available in some mobile browsers.
        }
      }
    };
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, [isYouTube, coverIconBriefly]);

  // Only the player container ever goes fullscreen. The media element or the
  // YouTube frame going fullscreen on its own would bring back the provider's
  // controls, so browsers that refuse (iPhone Safari) get an in-page overlay.
  const enterFullscreen = async () => {
    const region = regionRef.current;
    const lifetime = lifetimeRef.current;
    if (!region || immersive || lifetime.requestingFullscreen) return;
    lifetime.requestingFullscreen = true;
    const request = region.requestFullscreen || region.webkitRequestFullscreen;
    if (request) {
      try {
        await request.call(region);
        if (!lifetime.active) {
          if (getFullscreenElement() === region) {
            const exit = document.exitFullscreen || document.webkitExitFullscreen;
            await exit?.call(document);
          }
          return;
        }
        if (window.matchMedia?.('(pointer: coarse)').matches) {
          window.screen?.orientation?.lock?.('landscape')?.catch?.(() => {});
        }
        return;
      } catch {
        // Fall through to the in-page overlay.
      } finally {
        lifetime.requestingFullscreen = false;
      }
    }
    lifetime.requestingFullscreen = false;
    if (lifetime.active) setExpanded(true);
  };

  const exitFullscreen = async () => {
    if (getFullscreenElement() === regionRef.current) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      try {
        await exit?.call(document);
      } catch {
        // The browser already left fullscreen.
      }
    }
    if (expanded) {
      setExpanded(false);
      fullscreenButtonRef.current?.focus();
    }
  };

  const toggleFullscreen = () => (immersive ? exitFullscreen() : enterFullscreen());

  useEffect(() => {
    if (isYouTube) coverIconBriefly();
    if (!expanded) return undefined;
    const { body } = document;
    const region = regionRef.current;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    // The popover top layer escapes transformed/clipped ancestors without
    // moving or remounting the iframe (which would restart playback).
    let topLayer = false;
    if (region?.showPopover) {
      try {
        region.setAttribute('popover', 'manual');
        region.showPopover();
        topLayer = true;
      } catch {
        region.removeAttribute('popover');
      }
    }
    // A positioned ancestor with a z-index would trap the overlay beneath the
    // sticky navbar; lift that ancestor chain while expanded.
    const lifted = [];
    for (let el = regionRef.current?.parentElement; el && el !== body; el = el.parentElement) {
      const style = window.getComputedStyle(el);
      if (style.position !== 'static' && style.zIndex !== 'auto') {
        lifted.push([el, el.style.zIndex]);
        el.style.zIndex = EXPANDED_Z_INDEX;
      }
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setExpanded(false);
        fullscreenButtonRef.current?.focus();
      } else if (event.key === 'Tab') {
        const focusable = [
          ...region.querySelectorAll(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled)'
          ),
        ].filter((el) => window.getComputedStyle(el).display !== 'none');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const current = document.activeElement;
        if (
          !region.contains(current) ||
          (event.shiftKey && (current === first || current === region))
        ) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        } else if (!event.shiftKey && current === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    fullscreenButtonRef.current?.focus();
    return () => {
      if (topLayer) {
        try {
          region.hidePopover();
        } catch {
          /* Already closed on removal. */
        }
        region.removeAttribute('popover');
      }
      body.style.overflow = previousOverflow;
      lifted.forEach(([el, zIndex]) => {
        el.style.zIndex = zIndex;
      });
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [expanded, isYouTube, coverIconBriefly]);

  useImperativeHandle(ref, () => ({
    play,
    pause,
    seekTo: (seconds) => seek(Number(seconds)),
    requestFullscreen: enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  }));

  // ---- Source events -------------------------------------------------------

  const youtubeHandlers = {
    onReady: () => {
      setReady(true);
      surfaceRef.current?.setVolume(volume);
      surfaceRef.current?.setMuted(muted);
      if (rate !== 1) surfaceRef.current?.setPlaybackRate(rate);
    },
    onStateChange: (state) => {
      if (state === 'playing') {
        setHasStarted(true);
        setPlayback('playing');
        coverIconBriefly();
      } else if (state === 'ended') {
        setPlayback('ended');
        markComplete();
      } else if (state === 'ready') {
        setPlayback('idle');
      } else {
        setPlayback(state);
      }
    },
    onProgress: handleProgress,
    onComplete: markComplete,
    onError: (err) => {
      setError(errorMessage(err));
      setReady(false);
      setPlayback('idle');
    },
    onAutoplayBlocked: () => setPlayback('paused'),
  };

  const nativeHandlers = {
    onLoadedMetadata: (event) => {
      const video = event.currentTarget;
      const total = Number.isFinite(video.duration) ? video.duration : 0;
      setDuration(total);
      video.volume = volume;
      video.muted = muted;
      video.playbackRate = rate;
      if (pendingSeekRef.current !== null) {
        const target = total > 0 ? Math.min(pendingSeekRef.current, total) : pendingSeekRef.current;
        pendingSeekRef.current = null;
        video.currentTime = target;
        setCurrentTime(target);
      }
      if (autoPlay && !autoplayTriedRef.current) {
        autoplayTriedRef.current = true;
        playNative(video);
      }
    },
    onDurationChange: (event) => {
      const total = event.currentTarget.duration;
      if (Number.isFinite(total)) setDuration(total);
    },
    onTimeUpdate: (event) => {
      const video = event.currentTarget;
      const total = Number.isFinite(video.duration) ? video.duration : 0;
      if (total <= 0) return;
      const ranges = video.buffered;
      const loaded = ranges?.length ? clamp(ranges.end(ranges.length - 1) / total, 0, 1) : 0;
      handleProgress({
        played: clamp(video.currentTime / total, 0, 1),
        playedSeconds: video.currentTime,
        duration: total,
        loaded,
      });
    },
    onProgress: (event) => {
      const video = event.currentTarget;
      const ranges = video.buffered;
      if (video.duration > 0 && ranges?.length) {
        setBuffered(clamp(ranges.end(ranges.length - 1) / video.duration, 0, 1));
      }
    },
    onPlay: () => {
      setHasStarted(true);
      setPlayback('playing');
    },
    onPlaying: () => setPlayback('playing'),
    onWaiting: () => setPlayback('buffering'),
    onPause: (event) => {
      if (!event.currentTarget.ended) setPlayback('paused');
    },
    onEnded: () => {
      setPlayback('ended');
      markComplete();
    },
    onVolumeChange: (event) => {
      setVolume(event.currentTarget.volume);
      setMuted(event.currentTarget.muted);
    },
    onError: (event) => {
      // MEDIA_ERR_SRC_NOT_SUPPORTED also covers a missing or forbidden file.
      setError(
        event.currentTarget.error?.code === 4
          ? 'This video is unavailable right now. Please try again later.'
          : 'This video could not be loaded. Please check your connection and retry.'
      );
      setPlayback('idle');
    },
  };

  // ---- Pointer & keyboard ------------------------------------------------

  const handleStageClick = () => {
    const wasHidden = !controlsShown;
    showControls();
    // The first tap on a touch screen only reveals the controls.
    if (pointerTypeRef.current === 'touch' && wasHidden) return;
    if (canPlay) togglePlay();
  };

  const handleKeyDown = (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const tag = event.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (tag === 'BUTTON' && (event.key === ' ' || event.key === 'Enter')) return;
    switch (event.key) {
      case ' ':
      case 'k':
        if (canPlay) togglePlay();
        break;
      case 'ArrowLeft':
        seek(currentTime - SEEK_STEP_SECONDS);
        break;
      case 'ArrowRight':
        seek(currentTime + SEEK_STEP_SECONDS);
        break;
      case 'm':
        toggleMute();
        break;
      case 'f':
        toggleFullscreen();
        break;
      default:
        return;
    }
    event.preventDefault();
    showControls();
  };

  const startScrub = (event) => {
    scrubCleanupRef.current?.();
    const input = event.currentTarget;
    const startValue = Number(input.value);
    scrubbingRef.current = true;
    const cleanup = () => {
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      scrubbingRef.current = false;
    };
    const finish = (endEvent) => {
      cleanup();
      if (!lifetimeRef.current.active || endEvent.type === 'pointercancel') return;
      const value = Number(input.value);
      if (value !== startValue) seekRef.current(value);
    };
    scrubCleanupRef.current = cleanup;
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  };

  // ---- Render --------------------------------------------------------------

  const seekMax = duration > 0 ? duration : 0;
  const seekValue = Math.min(currentTime, seekMax);
  const playedPercent = seekMax > 0 ? (seekValue / seekMax) * 100 : 0;
  const bufferedPercent = clamp(buffered * 100, playedPercent, 100);
  const playLabel = playback === 'ended' ? 'Replay' : isActive ? 'Pause' : 'Play';
  const PlayIcon = playback === 'ended' ? HiArrowPath : isActive ? HiPause : HiPlay;

  // YouTube is only uncovered while it is actually playing: every other state
  // (loading, cued, paused, buffering, ended, error) is covered by our shield.
  const shieldVisible = isYouTube && (!ready || Boolean(error) || playback !== 'playing');
  const showPoster = isYouTube && (!hasStarted || playback === 'ended' || Boolean(error));
  const shieldTone = 'bg-black';

  let centerContent = null;
  if (error) centerContent = null;
  else if ((isYouTube && !ready) || playback === 'buffering') centerContent = <Spinner />;
  else if (playback === 'ended')
    centerContent = (
      <CenterBadge>
        <HiArrowPath className="h-8 w-8" />
      </CenterBadge>
    );
  else if (!isActive)
    centerContent = (
      <CenterBadge>
        <HiPlay className="h-8 w-8 translate-x-0.5" />
      </CenterBadge>
    );
  else if (isYouTube && coverYouTubeIcon)
    centerContent = (
      <CenterBadge>
        <HiPause className="h-8 w-8" />
      </CenterBadge>
    );

  return (
    <div
      ref={regionRef}
      role="region"
      aria-label="Video player"
      tabIndex={0}
      data-fullscreen={isFullscreen ? 'true' : 'false'}
      data-expanded={expanded ? 'true' : 'false'}
      onKeyDown={handleKeyDown}
      onPointerMove={showControls}
      onPointerDown={(event) => {
        pointerTypeRef.current = event.pointerType || 'mouse';
      }}
      onFocus={showControls}
      onContextMenu={(event) => event.preventDefault()}
      style={
        expanded
          ? {
              position: 'fixed',
              inset: 0,
              zIndex: EXPANDED_Z_INDEX,
              width: '100vw',
              height: '100dvh',
              maxWidth: 'none',
              maxHeight: 'none',
              margin: 0,
              padding: 0,
              border: 0,
            }
          : undefined
      }
      className={`group/player relative isolate w-full overflow-hidden bg-black text-white select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400 ${
        immersive ? 'flex h-full items-center justify-center' : 'aspect-video'
      } ${controlsShown ? '' : 'cursor-none'}`}
    >
      <div
        className={
          immersive
            ? 'relative aspect-video w-[min(100%,calc(100dvh*16/9))] max-h-full overflow-hidden'
            : 'absolute inset-0 overflow-hidden'
        }
      >
        {isYouTube ? (
          <div
            className="absolute inset-x-0"
            style={{ top: YOUTUBE_OVERSCAN, bottom: YOUTUBE_OVERSCAN }}
          >
            <YouTubeSurface
              key={attempt}
              ref={surfaceRef}
              videoId={source.videoId}
              autoPlay={autoPlay}
              {...youtubeHandlers}
            />
          </div>
        ) : (
          <video
            key={attempt}
            ref={videoRef}
            src={source.url}
            preload="metadata"
            playsInline
            disablePictureInPicture
            disableRemotePlayback
            controlsList="nodownload noremoteplayback nofullscreen noplaybackrate"
            x-webkit-airplay="deny"
            className="absolute inset-0 h-full w-full object-contain bg-black"
            {...nativeHandlers}
          />
        )}

        {/* Click/tap target: the media below never receives pointer input. */}
        <div aria-hidden="true" className="absolute inset-0 z-10" onClick={handleStageClick} />

        {isYouTube && (
          <>
            <div
              data-video-mask="top"
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-gradient-to-b from-black/60 to-transparent transition-opacity duration-300 ${
                controlsShown ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div
              data-video-mask="bottom"
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${
                controlsShown ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        )}

        {shieldVisible && (
          <div
            data-playback-shield="true"
            className={`pointer-events-none absolute inset-0 z-20 ${shieldTone}`}
          >
            {showPoster && (
              <img
                src={`https://i.ytimg.com/vi/${encodeURIComponent(source.videoId)}/hqdefault.jpg`}
                alt=""
                aria-hidden="true"
                draggable={false}
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover opacity-60"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>
        )}

        {!isYouTube && !error && playback !== 'playing' && hasStarted && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 bg-black/20"
          />
        )}

        {centerContent && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
          >
            {centerContent}
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black p-4 text-center">
            <div role="alert" className="max-w-sm">
              <p className="text-sm font-semibold text-slate-200">{error}</p>
              <button
                type="button"
                onClick={retry}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <HiArrowPath className="h-4 w-4" aria-hidden="true" />
                Retry video
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        ref={controlsRef}
        onBlur={showControls}
        className={`absolute inset-x-0 bottom-0 z-40 px-3 pb-2 pt-6 transition-opacity duration-300 sm:px-4 ${
          isYouTube ? '' : 'bg-gradient-to-t from-black/80 to-transparent'
        } ${controlsShown ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        <div className="group/seek relative flex h-4 items-center">
          <input
            type="range"
            aria-label="Seek"
            aria-valuetext={`${formatTime(seekValue)} of ${formatTime(seekMax)}`}
            min={0}
            max={seekMax}
            step="any"
            value={seekValue}
            disabled={!canPlay || seekMax <= 0}
            onPointerDown={startScrub}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (scrubbingRef.current) setCurrentTime(value);
              else seek(value);
            }}
            className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
          />
          <div className="pointer-events-none relative h-1 w-full overflow-hidden rounded-full bg-white/25 transition-[height] group-hover/seek:h-1.5 peer-focus-visible:h-1.5">
            <div
              className="absolute inset-y-0 left-0 bg-white/35"
              style={{ width: `${bufferedPercent}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 bg-amber-500"
              style={{ width: `${playedPercent}%` }}
            />
          </div>
          <div
            className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 scale-0 rounded-full bg-amber-400 shadow transition-transform group-hover/seek:scale-100 peer-focus-visible:scale-100 peer-focus-visible:ring-2 peer-focus-visible:ring-white"
            style={{ left: `${playedPercent}%` }}
          />
        </div>

        <div className="mt-1.5 flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            aria-label={playLabel}
            title={playLabel}
            disabled={!canPlay}
            onClick={togglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/15 disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <PlayIcon className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="flex items-center">
            <button
              type="button"
              aria-label={muted ? 'Unmute' : 'Mute'}
              title={muted ? 'Unmute' : 'Mute'}
              onClick={toggleMute}
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              {muted ? (
                <HiSpeakerXMark className="h-5 w-5" aria-hidden="true" />
              ) : (
                <HiSpeakerWave className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
            <input
              type="range"
              aria-label="Volume"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(event) => changeVolume(Number(event.target.value))}
              className="hidden h-1 w-20 cursor-pointer accent-amber-500 sm:block"
            />
          </div>

          <span className="ml-1 whitespace-nowrap text-xs font-semibold tabular-nums text-slate-200">
            {formatTime(seekValue)} / {formatTime(seekMax)}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <select
              aria-label="Playback speed"
              title="Playback speed"
              value={rate}
              onChange={(event) => changeRate(Number(event.target.value))}
              className="h-8 cursor-pointer rounded-lg border-0 bg-transparent px-1.5 text-xs font-bold text-white hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              {SPEEDS.map((speed) => (
                <option key={speed} value={speed} className="bg-slate-900 text-white">
                  {speed}x
                </option>
              ))}
            </select>
            <button
              ref={fullscreenButtonRef}
              type="button"
              aria-label={immersive ? 'Exit fullscreen' : 'Fullscreen'}
              title={immersive ? 'Exit fullscreen' : 'Fullscreen'}
              onClick={toggleFullscreen}
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              {immersive ? (
                <HiArrowsPointingIn className="h-5 w-5" aria-hidden="true" />
              ) : (
                <HiArrowsPointingOut className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const VideoPlayer = forwardRef(function VideoPlayer({ url, ...props }, ref) {
  const source = useMemo(() => getVideoSource(url), [url]);
  if (source.type === 'empty')
    return <PlayerMessage>No video available for this lesson.</PlayerMessage>;
  if (source.type === 'invalid') return <PlayerMessage>{source.error}</PlayerMessage>;
  // Every source gets a fresh session: progress, completion and media never
  // leak from one lesson into the next.
  const sessionKey =
    source.type === 'youtube' ? `youtube:${source.videoId}` : `direct:${source.url}`;
  return <PlayerSession key={sessionKey} ref={ref} source={source} {...props} />;
});

export default VideoPlayer;
