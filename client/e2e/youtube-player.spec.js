import { test, expect } from '@playwright/test';

// Mock network/media only. The iframe, sandbox, focus, CSS, touch handling,
// fullscreen, and attempted navigation run in a real Chromium browser.
const sdk = `
window.YT = { Player: function (iframe, options) {
  const player = this;
  window.testPlayer = player;
  player.events = options.events;
  Object.assign(player, {
    getDuration: () => 100, getCurrentTime: () => 25,
    getVideoLoadedFraction: () => 1,
    setVolume() {}, mute() {}, unMute() {}, setPlaybackRate() {}, seekTo() {}, unloadModule() {},
    playVideo() { options.events.onStateChange({data: 1, target: player}); },
    pauseVideo() { options.events.onStateChange({data: 2, target: player}); },
    destroy() { iframe.remove(); }
  });
  setTimeout(() => options.events.onReady({target: player}), 0);
}};
window.onYouTubeIframeAPIReady?.();
`;

test.beforeEach(async ({ page }) => {
  await page.route('https://www.youtube.com/iframe_api', (route) => route.fulfill({ contentType: 'application/javascript', body: sdk }));
  await page.route('https://www.youtube-nocookie.com/embed/**', (route) => route.fulfill({
    contentType: 'text/html',
    body: '<html><body style="margin:0;background:red"><a id="escape" target="_top" href="https://www.youtube.com/watch?v=W6NZfCO5SIk">YouTube</a></body></html>',
  }));
  await page.route('https://i.ytimg.com/**', (route) => route.abort());
  await page.goto('/e2e/fixtures/youtube-player.html');
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeEnabled();
});

test('blocks frame popups and top navigation, even if its script attempts them', async ({ page, context }) => {
  const originalUrl = page.url();
  const frame = page.frames().find((candidate) => candidate.url().startsWith('https://www.youtube-nocookie.com/'));
  expect(frame).toBeTruthy();
  const result = await frame.evaluate(() => {
    let topBlocked = false;
    try { window.top.location.href = 'https://www.youtube.com/watch?v=W6NZfCO5SIk'; }
    catch { topBlocked = true; }
    return { topBlocked, popupBlocked: window.open('https://www.youtube.com', '_blank') === null };
  });
  expect(result).toEqual({ topBlocked: true, popupBlocked: true });
  expect(context.pages()).toHaveLength(1);
  expect(page.url()).toBe(originalUrl);
  await expect(page.locator('iframe')).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin');
  await expect(page.locator('iframe')).toHaveCSS('pointer-events', 'none');
});

test('uses opaque paused/buffering shields and keeps keyboard focus outside the iframe', async ({ page }) => {
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('[data-playback-shield]')).toHaveCount(0);
  for (const state of [2, 3, 0]) {
    await page.evaluate((data) => window.testPlayer.events.onStateChange({ data, target: window.testPlayer }), state);
    await expect(page.locator('[data-playback-shield]')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  }
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement.tagName)).not.toBe('IFRAME');
  }
});

test('fallback fullscreen escapes clipped ancestors, traps focus, and exits without remounting', async ({ page }) => {
  const region = page.getByRole('region', { name: 'Video player' });
  await region.evaluate((element) => {
    element.requestFullscreen = () => Promise.reject(new Error('Simulated unsupported fullscreen'));
    window.originalFrame = element.querySelector('iframe');
  });
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
  await expect(region).toHaveAttribute('data-expanded', 'true');
  const box = await region.boundingBox();
  const viewport = page.viewportSize();
  expect(box.x).toBe(0); expect(box.y).toBe(0);
  expect(Math.abs(box.width - viewport.width)).toBeLessThan(2);
  expect(Math.abs(box.height - viewport.height)).toBeLessThan(2);
  await page.getByRole('button', { name: 'Exit fullscreen' }).focus();
  await page.keyboard.press('Tab');
  expect(await region.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  expect(await page.evaluate(() => document.querySelector('iframe') === window.originalFrame)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(region).toHaveAttribute('data-expanded', 'false');
  await expect(page.getByRole('button', { name: 'Fullscreen', exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
});
