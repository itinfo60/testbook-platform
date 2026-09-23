const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
  'www.youtu.be',
]);
const VIDEO_ID = /^[a-zA-Z0-9_-]{11}$/;

function parseUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = value.trim();
  try {
    return new URL(
      trimmed.startsWith('//')
        ? `https:${trimmed}`
        : /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)
          ? trimmed
          : `https://${trimmed}`
    );
  } catch {
    return null;
  }
}

// Recognize the provider separately from the ID: a malformed YouTube link
// must never fall through to the native video player.
export function isYouTubeUrl(value) {
  const url = parseUrl(value);
  return Boolean(url && YOUTUBE_HOSTS.has(url.hostname.toLowerCase()));
}

export function extractYouTubeId(value) {
  const url = parseUrl(value);
  if (
    !url ||
    !YOUTUBE_HOSTS.has(url.hostname.toLowerCase()) ||
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password
  )
    return null;

  const segments = url.pathname.split('/').filter(Boolean);
  let id;
  if (url.hostname === 'youtu.be' || url.hostname === 'www.youtu.be') {
    if (segments.length === 1) id = segments[0];
  } else if (segments.length === 1 && segments[0] === 'watch') {
    id = url.searchParams.get('v');
  } else if (segments.length === 2 && ['embed', 'shorts', 'live', 'v'].includes(segments[0])) {
    id = segments[1];
  }
  return VIDEO_ID.test(id || '') ? id : null;
}

export function getVideoSource(value) {
  if (value == null || (typeof value === 'string' && !value.trim())) return { type: 'empty' };
  if (typeof value !== 'string') return { type: 'invalid', error: 'Invalid video source.' };
  const trimmed = value.trim();
  if (isYouTubeUrl(trimmed)) {
    const videoId = extractYouTubeId(trimmed);
    return videoId
      ? { type: 'youtube', videoId, url: trimmed }
      : { type: 'invalid', error: 'This YouTube video link is invalid.' };
  }

  try {
    const relative = /^(?:\/(?!\/)|\.\.?\/)/.test(trimmed);
    const url = relative ? new URL(trimmed, 'https://local.invalid') : new URL(trimmed);
    if (!['http:', 'https:', 'blob:'].includes(url.protocol) || url.username || url.password) {
      return { type: 'invalid', error: 'This video source is not supported.' };
    }
    return { type: 'direct', url: trimmed };
  } catch {
    return { type: 'invalid', error: 'Invalid video source.' };
  }
}
