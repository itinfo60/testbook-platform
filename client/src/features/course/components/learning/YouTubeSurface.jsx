import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { loadYouTubeApi } from './youtubeApi';

const STATE_NAMES = {
  '-1': 'ready',
  0: 'ended',
  1: 'playing',
  2: 'paused',
  3: 'buffering',
  5: 'ready',
};
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function playbackError(code) {
  if ([100, 101, 150].includes(code)) {
    return new Error('This video is unavailable or its owner has disabled playback here.');
  }
  if (code === 153) return new Error('This video could not verify the player. Please retry.');
  return new Error('The video could not be played. Please retry.');
}

const YouTubeSurface = forwardRef(function YouTubeSurface(
  {
    videoId,
    autoPlay = false,
    onReady,
    onStateChange,
    onProgress,
    onComplete,
    onError,
    onAutoplayBlocked,
  },
  ref
) {
  const hostRef = useRef(null);
  const callbacks = useRef({});
  callbacks.current = {
    autoPlay,
    onReady,
    onStateChange,
    onProgress,
    onComplete,
    onError,
    onAutoplayBlocked,
  };

  const session = useMemo(
    () => ({
      videoId,
      player: null,
      ready: false,
      disposed: false,
      error: null,
      pendingSeek: null,
      pendingPlayback: null,
      volume: 1,
      muted: false,
      playbackRate: 1,
      waitingPlays: [],
    }),
    [videoId]
  );

  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        if (session.error || session.disposed) {
          return Promise.reject(session.error || new Error('The video player was closed.'));
        }
        session.pendingPlayback = 'play';
        if (session.ready) {
          try {
            session.player.playVideo();
            return Promise.resolve();
          } catch (error) {
            return Promise.reject(error);
          }
        }
        return new Promise((resolve, reject) => session.waitingPlays.push({ resolve, reject }));
      },
      pause: () => {
        session.pendingPlayback = 'pause';
        if (session.ready) session.player.pauseVideo();
        session.waitingPlays.splice(0).forEach(({ resolve }) => resolve());
      },
      seekTo: (seconds) => {
        if (!Number.isFinite(seconds)) return;
        session.pendingSeek = Math.max(0, seconds);
        if (session.ready) {
          const duration = session.player.getDuration();
          session.player.seekTo(
            duration > 0 ? Math.min(duration, session.pendingSeek) : session.pendingSeek,
            true
          );
          session.pendingSeek = null;
        }
      },
      setVolume: (volume) => {
        if (!Number.isFinite(volume)) return;
        session.volume = clamp(volume, 0, 1);
        if (session.ready) session.player.setVolume(session.volume * 100);
      },
      setMuted: (muted) => {
        session.muted = Boolean(muted);
        if (session.ready) session.player[session.muted ? 'mute' : 'unMute']();
      },
      setPlaybackRate: (rate) => {
        if (!Number.isFinite(rate) || rate <= 0) return;
        session.playbackRate = rate;
        if (session.ready) session.player.setPlaybackRate(rate);
      },
    }),
    [session]
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let active = true;
    let ownedPlayer;
    let interval;
    let readyTimeout;
    session.disposed = false;
    session.error = null;

    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId || '')) {
      const error = new Error('This YouTube video link is invalid.');
      session.error = error;
      session.waitingPlays.splice(0).forEach(({ reject }) => reject(error));
      callbacks.current.onError?.(error);
      return undefined;
    }

    const fail = (error) => {
      if (!active || session.error) return;
      session.error = error;
      session.ready = false;
      clearTimeout(readyTimeout);
      clearInterval(interval);
      // Do not leave a failed player streaming behind the error screen.
      try {
        ownedPlayer?.destroy();
      } catch {
        /* Partially initialized SDK. */
      }
      iframe.remove();
      session.waitingPlays.splice(0).forEach(({ reject }) => reject(error));
      callbacks.current.onError?.(error);
    };

    const reportProgress = () => {
      if (!active || !session.ready || session.error) return;
      // Metadata can be temporarily unavailable while a stream starts/buffers.
      try {
        const rawDuration = Number(session.player.getDuration());
        const rawCurrent = Number(session.player.getCurrentTime());
        const duration = Number.isFinite(rawDuration) ? Math.max(0, rawDuration) : 0;
        const current = Number.isFinite(rawCurrent) ? Math.max(0, rawCurrent) : 0;
        callbacks.current.onProgress?.({
          played: duration > 0 ? clamp(current / duration, 0, 1) : 0,
          playedSeconds: duration > 0 ? Math.min(current, duration) : current,
          duration,
          loaded: clamp(Number(session.player.getVideoLoadedFraction()) || 0, 0, 1),
        });
      } catch {
        // The next tick can read metadata after a temporary stream transition.
      }
    };

    // Configure restrictions before src is set or the frame enters the DOM.
    // The SDK owns this imperative child, so destroy() cannot remove a React node.
    const iframe = document.createElement('iframe');
    iframe.title = 'Course video';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.setAttribute(
      'allow',
      "autoplay; encrypted-media; fullscreen 'none'; picture-in-picture 'none'"
    );
    iframe.setAttribute('tabindex', '-1');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    iframe.style.cssText = 'width:100%;height:100%;border:0;display:block;pointer-events:none;';
    const params = new URLSearchParams({
      enablejsapi: '1',
      origin: window.location.origin,
      controls: '0',
      disablekb: '1',
      fs: '0',
      playsinline: '1',
      rel: '0',
      autoplay: '0',
      iv_load_policy: '3',
      cc_load_policy: '0',
    });
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params}`;
    host.appendChild(iframe);

    loadYouTubeApi()
      .then((YT) => {
        if (!active) return;
        ownedPlayer = new YT.Player(iframe, {
          events: {
            onReady: ({ target }) => {
              if (!active || session.error) return;
              clearTimeout(readyTimeout);
              session.player = target;
              session.ready = true;
              try {
                target.setVolume(session.volume * 100);
                target[session.muted ? 'mute' : 'unMute']();
                target.setPlaybackRate(session.playbackRate);
                if (session.pendingSeek !== null) {
                  const duration = target.getDuration();
                  target.seekTo(
                    duration > 0 ? Math.min(session.pendingSeek, duration) : session.pendingSeek,
                    true
                  );
                  session.pendingSeek = null;
                }
                callbacks.current.onStateChange?.('ready');
                callbacks.current.onReady?.();
                reportProgress();
                const playback =
                  session.pendingPlayback ?? (callbacks.current.autoPlay ? 'play' : null);
                if (playback === 'play') target.playVideo();
                else if (playback === 'pause') target.pauseVideo();
                session.waitingPlays.splice(0).forEach(({ resolve }) => resolve());
                interval = setInterval(reportProgress, 1000);
              } catch (error) {
                fail(error);
              }
            },
            onStateChange: ({ data, target }) => {
              if (!active || session.error) return;
              const state = STATE_NAMES[data];
              if (data === 1) {
                // cc_load_policy cannot override captions an uploader forces on.
                try {
                  target.unloadModule?.('captions');
                } catch {
                  // Captions are cosmetic; playback continues without this call.
                }
              }
              if (state) callbacks.current.onStateChange?.(state);
              reportProgress();
              if (data === 0) callbacks.current.onComplete?.();
            },
            onError: ({ data }) => fail(playbackError(data)),
            onAutoplayBlocked: () => {
              if (!active || session.error) return;
              session.pendingPlayback = 'pause';
              callbacks.current.onStateChange?.('paused');
              callbacks.current.onAutoplayBlocked?.();
            },
          },
        });
        session.player = ownedPlayer;
        if (!session.ready && !session.error) {
          readyTimeout = setTimeout(
            () => fail(new Error('The video player took too long to load. Please retry.')),
            20000
          );
        }
      })
      .catch(fail);

    return () => {
      active = false;
      session.disposed = true;
      session.ready = false;
      session.player = null;
      clearInterval(interval);
      clearTimeout(readyTimeout);
      session.waitingPlays
        .splice(0)
        .forEach(({ reject }) => reject(new Error('The video player was closed.')));
      try {
        ownedPlayer?.destroy();
      } catch {
        // A partially initialized SDK player may already have removed its frame.
      }
      iframe.remove();
    };
  }, [videoId, session]);

  return (
    <div
      ref={hostRef}
      inert=""
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
    />
  );
});

export default YouTubeSurface;
