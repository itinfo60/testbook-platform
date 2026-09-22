import React, { createRef } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import VideoPlayer from '@/features/course/components/learning/VideoPlayer';

const youtube = vi.hoisted(() => ({
  props: null,
  play: vi.fn(),
  pause: vi.fn(),
  seekTo: vi.fn(),
  setVolume: vi.fn(),
  setMuted: vi.fn(),
  setPlaybackRate: vi.fn(),
}));

vi.mock('@/features/course/components/learning/YouTubeSurface', async () => {
  const { forwardRef, useImperativeHandle } = await import('react');
  const Surface = forwardRef((props, ref) => {
    youtube.props = props;
    useImperativeHandle(ref, () => youtube);
    return <div data-testid="youtube-surface" />;
  });
  Surface.displayName = 'MockYouTubeSurface';
  return { default: Surface };
});

const VIDEO_URL = 'https://media.example.com/lesson.mp4';
const YOUTUBE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const SECOND_YOUTUBE_URL = 'https://youtu.be/9bZkp7q19f0';

function videoElement(container) {
  const video = container.querySelector('video');
  expect(video).not.toBeNull();
  return video;
}

function loadMetadata(video, duration = 100) {
  Object.defineProperties(video, {
    duration: { configurable: true, value: duration },
    readyState: { configurable: true, value: 1 },
    buffered: { configurable: true, value: { length: 1, end: () => duration } },
  });
  fireEvent.loadedMetadata(video);
  fireEvent.canPlay(video);
}

function updateTime(video, seconds) {
  video.currentTime = seconds;
  fireEvent.timeUpdate(video);
}

function youtubeReady() {
  act(() => youtube.props.onReady());
}

function youtubeState(state) {
  act(() => youtube.props.onStateChange(state));
}

function youtubeProgress(seconds, duration = 100) {
  act(() =>
    youtube.props.onProgress({
      played: seconds / duration,
      playedSeconds: seconds,
      duration,
      loaded: 1,
    })
  );
}

describe('VideoPlayer', () => {
  let play;
  let pause;
  let fullscreenElement;
  let originalFullscreenElement;
  let originalExitFullscreen;
  let originalBodyOverflow;

  beforeEach(() => {
    vi.clearAllMocks();
    youtube.props = null;
    youtube.play.mockResolvedValue(undefined);
    play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function () {
      this.dispatchEvent(new Event('play'));
      this.dispatchEvent(new Event('playing'));
      return Promise.resolve();
    });
    pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function () {
      this.dispatchEvent(new Event('pause'));
    });
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    fullscreenElement = null;
    originalFullscreenElement = Object.getOwnPropertyDescriptor(document, 'fullscreenElement');
    originalExitFullscreen = Object.getOwnPropertyDescriptor(document, 'exitFullscreen');
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => fullscreenElement,
    });
    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: vi.fn(async () => {
        fullscreenElement = null;
        document.dispatchEvent(new Event('fullscreenchange'));
      }),
    });
    originalBodyOverflow = document.body.style.overflow;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.style.overflow = originalBodyOverflow;
    if (originalFullscreenElement) {
      Object.defineProperty(document, 'fullscreenElement', originalFullscreenElement);
    } else {
      delete document.fullscreenElement;
    }
    if (originalExitFullscreen) {
      Object.defineProperty(document, 'exitFullscreen', originalExitFullscreen);
    } else {
      delete document.exitFullscreen;
    }
  });

  it('uses custom controls and disables native controls, picture-in-picture, and remote playback', () => {
    const { container } = render(<VideoPlayer url={VIDEO_URL} />);
    const video = videoElement(container);

    expect(video).not.toHaveAttribute('controls');
    expect(video).toHaveAttribute('playsinline');
    expect(video).toHaveAttribute('disablepictureinpicture');
    expect(video).toHaveAttribute('disableremoteplayback');
    expect(video.getAttribute('controlslist')).toEqual(expect.stringContaining('nodownload'));
    expect(video.getAttribute('controlslist')).toEqual(expect.stringContaining('noremoteplayback'));
    expect(video.getAttribute('controlslist')).toEqual(expect.stringContaining('nofullscreen'));
    expect(screen.getByRole('button', { name: 'Play' })).toBeVisible();
    expect(screen.getByRole('slider', { name: 'Seek' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Volume' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Playback speed' })).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('plays, pauses, seeks, mutes, and changes volume and speed through native media', async () => {
    const { container } = render(<VideoPlayer url={VIDEO_URL} />);
    const video = videoElement(container);
    loadMetadata(video);

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pause' })).toBeVisible());
    expect(play).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(pause).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Play' })).toBeVisible();

    fireEvent.change(screen.getByRole('slider', { name: 'Seek' }), { target: { value: '42' } });
    expect(video.currentTime).toBe(42);
    fireEvent.click(screen.getByRole('button', { name: 'Mute' }));
    expect(video.muted).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Unmute' }));
    expect(video.muted).toBe(false);
    fireEvent.change(screen.getByRole('slider', { name: 'Volume' }), { target: { value: '0.4' } });
    expect(video.volume).toBeCloseTo(0.4);
    fireEvent.change(screen.getByRole('combobox', { name: 'Playback speed' }), {
      target: { value: '1.5' },
    });
    expect(video.playbackRate).toBe(1.5);
  });

  it('recovers from rejected native autoplay with a usable Play button', async () => {
    play.mockRejectedValueOnce(new DOMException('A gesture is required', 'NotAllowedError'));
    const { container } = render(<VideoPlayer url={VIDEO_URL} autoPlay />);
    loadMetadata(videoElement(container));

    await waitFor(() => expect(play).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pause' })).toBeVisible());
    expect(play).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('queues a resume seek until native metadata is available', () => {
    const ref = createRef();
    const { container } = render(<VideoPlayer ref={ref} url={VIDEO_URL} />);
    const video = videoElement(container);

    act(() => ref.current.seekTo(37));
    expect(video.currentTime).toBe(0);
    loadMetadata(video);
    expect(video.currentTime).toBe(37);
    expect(screen.getByRole('slider', { name: 'Seek' })).toHaveValue('37');
  });

  it('reports progress and completes once per source, including repeated 95% and ended events', () => {
    const onProgress = vi.fn();
    const onComplete = vi.fn();
    const { container, rerender } = render(
      <VideoPlayer url={VIDEO_URL} onProgress={onProgress} onComplete={onComplete} />
    );
    const firstVideo = videoElement(container);
    loadMetadata(firstVideo);

    updateTime(firstVideo, 94);
    expect(onProgress).toHaveBeenLastCalledWith(
      expect.objectContaining({ played: 0.94, playedSeconds: 94 })
    );
    expect(onComplete).not.toHaveBeenCalled();
    updateTime(firstVideo, 95);
    updateTime(firstVideo, 99);
    fireEvent.ended(firstVideo);
    fireEvent.ended(firstVideo);
    expect(onComplete).toHaveBeenCalledTimes(1);

    rerender(
      <VideoPlayer
        url="https://media.example.com/next.mp4"
        onProgress={onProgress}
        onComplete={onComplete}
      />
    );
    const nextVideo = videoElement(container);
    expect(nextVideo).not.toBe(firstVideo);
    loadMetadata(nextVideo);
    expect(nextVideo.currentTime).toBe(0);
    updateTime(nextVideo, 96);
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it('replays an ended native video from the beginning without completing it twice', async () => {
    const onComplete = vi.fn();
    const { container } = render(<VideoPlayer url={VIDEO_URL} onComplete={onComplete} />);
    const video = videoElement(container);
    loadMetadata(video);
    updateTime(video, 100);
    fireEvent.ended(video);

    fireEvent.click(screen.getByRole('button', { name: 'Replay' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pause' })).toBeVisible());
    expect(video.currentTime).toBe(0);
    updateTime(video, 96);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('keeps YouTube covered outside playback and preserves edge covers after pointer inactivity', () => {
    vi.useFakeTimers();
    const { container } = render(<VideoPlayer url={YOUTUBE_URL} />);
    const region = screen.getByRole('region', { name: 'Video player' });
    const shield = () => container.querySelector('[data-playback-shield="true"]');
    const masks = () => container.querySelectorAll('[data-video-mask]');

    expect(shield()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled();
    youtubeReady();
    youtubeState('playing');
    expect(shield()).not.toBeInTheDocument();
    expect(masks()).toHaveLength(2);
    fireEvent.mouseLeave(region);
    act(() => vi.advanceTimersByTime(15000));
    expect(masks()).toHaveLength(2);

    for (const state of ['paused', 'buffering', 'ended', 'ready']) {
      youtubeState(state);
      expect(shield()).toBeInTheDocument();
      expect(masks()).toHaveLength(2);
    }
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('routes custom playback, seeking, volume, and speed controls to YouTube', async () => {
    render(<VideoPlayer url={YOUTUBE_URL} />);
    youtubeReady();
    youtubeProgress(0);
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(youtube.play).toHaveBeenCalledTimes(1);
    youtubeState('playing');
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(youtube.pause).toHaveBeenCalledTimes(1);
    youtubeState('paused');
    fireEvent.change(screen.getByRole('slider', { name: 'Seek' }), { target: { value: '42' } });
    expect(youtube.seekTo).toHaveBeenLastCalledWith(42);
    fireEvent.click(screen.getByRole('button', { name: 'Mute' }));
    expect(youtube.setMuted).toHaveBeenLastCalledWith(true);
    fireEvent.change(screen.getByRole('slider', { name: 'Volume' }), { target: { value: '0.4' } });
    expect(youtube.setVolume).toHaveBeenLastCalledWith(0.4);
    fireEvent.change(screen.getByRole('combobox', { name: 'Playback speed' }), {
      target: { value: '1.5' },
    });
    expect(youtube.setPlaybackRate).toHaveBeenLastCalledWith(1.5);
    await act(async () => {});
  });

  it('recovers from blocked YouTube autoplay and shields player errors with a retry action', async () => {
    const { container } = render(<VideoPlayer url={YOUTUBE_URL} autoPlay />);
    youtubeReady();
    act(() => youtube.props.onAutoplayBlocked());
    expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled();
    expect(container.querySelector('[data-playback-shield="true"]')).toBeInTheDocument();
    youtubeState('playing');
    act(() => youtube.props.onError('This video cannot be played here.'));

    expect(container.querySelector('[data-playback-shield="true"]')).toBeInTheDocument();
    expect(screen.getByText('This video cannot be played here.')).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry video' }));
    expect(screen.queryByText('This video cannot be played here.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled();
    youtubeReady();
    expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled();
    await act(async () => {});
  });

  it('deduplicates YouTube completion and resets playback state when the lesson changes', () => {
    const onComplete = vi.fn();
    const { rerender } = render(<VideoPlayer url={YOUTUBE_URL} onComplete={onComplete} />);
    youtubeReady();
    youtubeState('playing');
    youtubeProgress(95);
    youtubeProgress(99);
    act(() => youtube.props.onComplete());
    youtubeState('ended');
    expect(onComplete).toHaveBeenCalledTimes(1);

    rerender(<VideoPlayer url={SECOND_YOUTUBE_URL} onComplete={onComplete} />);
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled();
    expect(screen.getByRole('slider', { name: 'Seek' })).toHaveValue('0');
    youtubeReady();
    youtubeProgress(96);
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it('requests browser fullscreen only on the container and follows browser exit events', async () => {
    const ref = createRef();
    const { container } = render(<VideoPlayer ref={ref} url={VIDEO_URL} />);
    const region = screen.getByRole('region', { name: 'Video player' });
    const nativeFullscreen = vi.fn();
    Object.defineProperty(videoElement(container), 'requestFullscreen', {
      value: nativeFullscreen,
    });
    const requestFullscreen = vi.fn(async () => {
      fullscreenElement = region;
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    Object.defineProperty(region, 'requestFullscreen', { value: requestFullscreen });

    await act(async () => ref.current.requestFullscreen());
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
    expect(nativeFullscreen).not.toHaveBeenCalled();
    expect(region).toHaveAttribute('data-fullscreen', 'true');
    expect(screen.getByRole('button', { name: 'Exit fullscreen' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Exit fullscreen' }));
    await waitFor(() => expect(document.exitFullscreen).toHaveBeenCalledTimes(1));
    expect(region).toHaveAttribute('data-fullscreen', 'false');
    expect(screen.getByRole('button', { name: 'Fullscreen' })).toBeVisible();
  });

  it.each(['unsupported', 'rejected'])(
    'uses the covered container when browser fullscreen is %s and restores focus on Escape',
    async (mode) => {
      document.body.style.overflow = 'scroll';
      const { container } = render(<VideoPlayer url={YOUTUBE_URL} />);
      const region = screen.getByRole('region', { name: 'Video player' });
      if (mode === 'rejected') {
        Object.defineProperty(region, 'requestFullscreen', {
          value: vi.fn().mockRejectedValue(new Error('Fullscreen unavailable')),
        });
      }
      const fullscreenButton = screen.getByRole('button', { name: 'Fullscreen' });
      fullscreenButton.focus();
      fireEvent.click(fullscreenButton);

      await waitFor(() => expect(region).toHaveAttribute('data-expanded', 'true'));
      expect(document.body.style.overflow).toBe('hidden');
      expect(container.querySelectorAll('[data-video-mask]')).toHaveLength(2);
      expect(container.querySelector('[data-playback-shield="true"]')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Exit fullscreen' })).toBeVisible();
      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => expect(region).toHaveAttribute('data-expanded', 'false'));
      expect(document.body.style.overflow).toBe('scroll');
      expect(screen.getByRole('button', { name: 'Fullscreen' })).toHaveFocus();
    }
  );

  it('restores body scrolling if an expanded player is unmounted', async () => {
    document.body.style.overflow = 'auto';
    const { unmount } = render(<VideoPlayer url={VIDEO_URL} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fullscreen' }));
    await waitFor(() => expect(document.body.style.overflow).toBe('hidden'));
    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });

  it.each(['', 'javascript:alert(1)', 'https://www.youtube.com/watch?v=bad'])(
    'shows a local unavailable state without a redirect for invalid source %j',
    (url) => {
      const { container } = render(<VideoPlayer url={url} />);
      expect(container.querySelector('video')).not.toBeInTheDocument();
      expect(container.querySelector('iframe')).not.toBeInTheDocument();
      expect(screen.queryByTestId('youtube-surface')).not.toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(container.textContent).toMatch(
        /unavailable|not available|invalid|unsupported|no video|not supported/i
      );
    }
  );
});
