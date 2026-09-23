import { StrictMode, createRef } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import YouTubeSurface from '../../features/course/components/learning/YouTubeSurface';
import {
  getVideoSource,
  extractYouTubeId,
} from '../../features/course/components/learning/videoSource';

const mocks = vi.hoisted(() => ({ load: vi.fn(), players: [] }));
vi.mock('../../features/course/components/learning/youtubeApi', () => ({
  loadYouTubeApi: mocks.load,
}));
const ID = 'W6NZfCO5SIk';
const SDK = {
  Player: function (iframe, { events }) {
    Object.assign(this, {
      iframe,
      events,
      playVideo: vi.fn(),
      pauseVideo: vi.fn(),
      seekTo: vi.fn(),
      setVolume: vi.fn(),
      mute: vi.fn(),
      unMute: vi.fn(),
      setPlaybackRate: vi.fn(),
      getDuration: vi.fn(() => 100),
      getCurrentTime: vi.fn(() => 25),
      getVideoLoadedFraction: vi.fn(() => 0.6),
      destroy: vi.fn(() => iframe.remove()),
    });
    mocks.players.push(this);
  },
};
const settle = () => act(async () => {});
function ready(player) {
  act(() => player.events.onReady({ target: player }));
}

beforeEach(() => {
  vi.useFakeTimers();
  mocks.players.length = 0;
  mocks.load.mockReset().mockResolvedValue(SDK);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('YouTube iframe boundary', () => {
  it('sets sandbox and input restrictions before the SDK receives the frame', async () => {
    const { container } = render(<YouTubeSurface videoId={ID} />);
    const frame = container.querySelector('iframe');
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts allow-same-origin');
    expect(frame.getAttribute('allow')).toContain("fullscreen 'none'");
    expect(frame.getAttribute('allow')).toContain("picture-in-picture 'none'");
    expect(frame).not.toHaveAttribute('allowfullscreen');
    expect(frame).toHaveAttribute('tabindex', '-1');
    expect(frame.parentElement).toHaveAttribute('inert');
    expect(frame.style.pointerEvents).toBe('none');
    expect(frame.getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin');
    const source = new URL(frame.src);
    expect(source.origin).toBe('https://www.youtube-nocookie.com');
    for (const [key, value] of Object.entries({
      controls: '0',
      disablekb: '1',
      fs: '0',
      playsinline: '1',
      origin: location.origin,
    })) {
      expect(source.searchParams.get(key)).toBe(value);
    }
    await settle();
    expect(mocks.players[0].iframe).toBe(frame);
  });

  it('queues commands before ready, reports progress, and handles blocked autoplay', async () => {
    const ref = createRef();
    const progress = vi.fn();
    const blocked = vi.fn();
    render(
      <YouTubeSurface ref={ref} videoId={ID} onProgress={progress} onAutoplayBlocked={blocked} />
    );
    act(() => {
      ref.current.seekTo(42);
      ref.current.setVolume(0.4);
      ref.current.setMuted(true);
    });
    const playing = ref.current.play();
    await settle();
    const player = mocks.players[0];
    ready(player);
    await playing;
    expect(player.seekTo).toHaveBeenCalledWith(42, true);
    expect(player.setVolume).toHaveBeenCalledWith(40);
    expect(player.mute).toHaveBeenCalled();
    expect(player.playVideo).toHaveBeenCalledOnce();
    act(() => vi.advanceTimersByTime(1000));
    expect(progress).toHaveBeenLastCalledWith({
      played: 0.25,
      playedSeconds: 25,
      duration: 100,
      loaded: 0.6,
    });
    act(() => player.events.onAutoplayBlocked());
    expect(blocked).toHaveBeenCalledOnce();
  });

  it('destroys failed playback and rejects pending play without any navigation fallback', async () => {
    const ref = createRef();
    const error = vi.fn();
    const { container } = render(<YouTubeSurface ref={ref} videoId={ID} onError={error} />);
    const pending = ref.current.play().catch((value) => value);
    await settle();
    const player = mocks.players[0];
    act(() => player.events.onError({ data: 101 }));
    expect(await pending).toBeInstanceOf(Error);
    expect(player.destroy).toHaveBeenCalled();
    expect(container.querySelector('iframe')).toBeNull();
    expect(container.querySelector('a')).toBeNull();
    expect(error).toHaveBeenCalledOnce();
    ready(player);
    expect(player.playVideo).not.toHaveBeenCalled();
  });

  it('cleans up timers and ignores stale callbacks when switching sources', async () => {
    const progress = vi.fn();
    const state = vi.fn();
    const { rerender, unmount } = render(
      <YouTubeSurface videoId={ID} onProgress={progress} onStateChange={state} />
    );
    await settle();
    const old = mocks.players[0];
    ready(old);
    rerender(<YouTubeSurface videoId="9bZkp7q19f0" onProgress={progress} onStateChange={state} />);
    await settle();
    expect(old.destroy).toHaveBeenCalledOnce();
    state.mockClear();
    progress.mockClear();
    act(() => old.events.onStateChange({ data: 0, target: old }));
    expect(state).not.toHaveBeenCalled();
    unmount();
    act(() => vi.advanceTimersByTime(30000));
    expect(progress).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('survives StrictMode and reports a readiness timeout locally', async () => {
    const error = vi.fn();
    const { container } = render(
      <StrictMode>
        <YouTubeSurface videoId={ID} onError={error} />
      </StrictMode>
    );
    await settle();
    expect(container.querySelectorAll('iframe')).toHaveLength(1);
    expect(mocks.players).toHaveLength(1);
    act(() => vi.advanceTimersByTime(20000));
    expect(error.mock.calls[0][0].message).toMatch(/too long/);
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('does not start a late SDK load after unmount', async () => {
    let resolve;
    mocks.load.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      })
    );
    const { unmount } = render(<YouTubeSurface videoId={ID} />);
    unmount();
    await act(async () => resolve(SDK));
    expect(mocks.players).toHaveLength(0);
  });

  it('validates IDs even when the adapter is used without the parent component', () => {
    const error = vi.fn();
    const { container } = render(<YouTubeSurface videoId="../invalid" onError={error} />);
    expect(error).toHaveBeenCalledOnce();
    expect(mocks.load).not.toHaveBeenCalled();
    expect(container.querySelector('iframe')).toBeNull();
  });
});

describe('source validation', () => {
  it.each([
    `https://youtube.com/watch?feature=share&v=${ID}`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://music.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}?t=12`,
    `youtube.com/shorts/${ID}`,
    `//www.youtube-nocookie.com/embed/${ID}`,
    `https://youtube.com/live/${ID}`,
  ])('normalizes %s to a validated video ID', (url) => {
    expect(extractYouTubeId(url)).toBe(ID);
    expect(getVideoSource(url).type).toBe('youtube');
  });
  it.each([
    'javascript:alert(1)',
    'data:text/html,hi',
    `https://user:pass@youtube.com/watch?v=${ID}`,
    'https://youtube.com/watch?v=invalid',
    'https://youtube.com/playlist?list=PL123',
    'file:///tmp/video.mp4',
  ])('rejects unsafe or invalid source %s', (url) => {
    expect(getVideoSource(url).type).toBe('invalid');
  });
  it('does not treat lookalike domains or IDs buried in another URL as YouTube', () => {
    expect(extractYouTubeId(`https://youtube.com.evil.example/watch?v=${ID}`)).toBeNull();
    expect(extractYouTubeId(`https://evil.example/?url=https://youtu.be/${ID}`)).toBeNull();
    expect(getVideoSource('/media/lesson.mp4').type).toBe('direct');
  });
});
