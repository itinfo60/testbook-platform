import { afterEach, beforeEach, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  delete window.YT;
});
afterEach(() => {
  document
    .querySelectorAll('script[src="https://www.youtube.com/iframe_api"]')
    .forEach((node) => node.remove());
  delete window.onYouTubeIframeAPIReady;
  delete window.YT;
  vi.useRealTimers();
});

it('shares one SDK load between players and restores the previous callback', async () => {
  const previous = vi.fn();
  window.onYouTubeIframeAPIReady = previous;
  const { loadYouTubeApi } = await import('../../features/course/components/learning/youtubeApi');
  const first = loadYouTubeApi();
  expect(loadYouTubeApi()).toBe(first);
  expect(
    document.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]')
  ).toHaveLength(1);
  window.YT = { Player: vi.fn() };
  window.onYouTubeIframeAPIReady();
  expect(await first).toBe(window.YT);
  expect(previous).toHaveBeenCalledOnce();
  expect(window.onYouTubeIframeAPIReady).toBe(previous);
  expect(vi.getTimerCount()).toBe(0);
});

it('retries a failed preexisting script instead of waiting on it forever', async () => {
  const external = document.createElement('script');
  external.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(external);
  const { loadYouTubeApi } = await import('../../features/course/components/learning/youtubeApi');
  const failed = loadYouTubeApi().catch((error) => error);
  external.dispatchEvent(new Event('error'));
  expect(await failed).toBeInstanceOf(Error);
  const retry = loadYouTubeApi();
  expect(
    document.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]')
  ).toHaveLength(2);
  window.YT = { Player: vi.fn() };
  window.onYouTubeIframeAPIReady();
  expect(await retry).toBe(window.YT);
});

it('times out locally and allows a later retry', async () => {
  const { loadYouTubeApi } = await import('../../features/course/components/learning/youtubeApi');
  const failed = loadYouTubeApi().catch((error) => error);
  vi.advanceTimersByTime(15000);
  expect(await failed).toBeInstanceOf(Error);
  expect(document.querySelector('script[src="https://www.youtube.com/iframe_api"]')).toBeNull();
  const retry = loadYouTubeApi();
  window.YT = { Player: vi.fn() };
  window.onYouTubeIframeAPIReady();
  await retry;
});
