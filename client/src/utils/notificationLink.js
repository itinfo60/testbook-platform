/**
 * Extracts or infers a clickable redirect link from a notification object.
 * Checks explicit link fields, data payloads, entity IDs, and embedded URLs in text.
 */
export function getNotificationLink(notif) {
  if (!notif) return null;

  // 1. Explicit direct link / url / path / actionUrl in root or data
  const explicit =
    notif.link ||
    notif.url ||
    notif.path ||
    notif.actionUrl ||
    notif.data?.link ||
    notif.data?.url ||
    notif.data?.path ||
    notif.data?.actionUrl;

  if (explicit && typeof explicit === 'string' && explicit.trim()) {
    return explicit.trim();
  }

  // 2. Resolve via entity type & ID
  const entityType = String(
    notif.data?.entityType || notif.entityType || notif.type || ''
  ).toLowerCase();
  const entityId =
    notif.data?.entityId ||
    notif.data?.courseId ||
    notif.data?.testId ||
    notif.data?.quizId ||
    notif.data?.blogId ||
    notif.data?.liveClassId ||
    notif.entityId;

  if (notif.data?.courseId || entityType.includes('course')) {
    const id = notif.data?.courseId || entityId;
    return id ? `/courses/${id}` : '/courses';
  }

  if (notif.data?.testId || entityType.includes('test')) {
    const id = notif.data?.testId || entityId;
    return id ? `/tests/${id}` : '/tests';
  }

  if (notif.data?.quizId || entityType.includes('quiz')) {
    const id = notif.data?.quizId || entityId;
    return id ? `/daily-quiz` : '/daily-quiz';
  }

  if (notif.data?.liveClassId || entityType.includes('live')) {
    const id = notif.data?.liveClassId || entityId;
    return id ? `/live-classes/${id}` : '/live-classes';
  }

  if (notif.data?.blogId || entityType.includes('blog') || entityType.includes('article')) {
    const id = notif.data?.blogId || entityId;
    return id ? `/blog/${id}` : '/blog';
  }

  if (
    entityType.includes('order') ||
    entityType.includes('payment') ||
    entityType.includes('invoice')
  ) {
    return '/orders';
  }

  if (entityType.includes('certif') || entityType.includes('profile')) {
    return '/profile';
  }

  // 3. Scan title and message for embedded URLs or internal routes
  const combinedText = `${notif.title || ''} ${notif.message || ''}`;
  const urlMatch = combinedText.match(
    /https?:\/\/[^\s"'<>)]+|\/(?:courses|tests|test-series|daily-quiz|live-classes|blog|dashboard|orders|profile|settings|free-resources)[^\s"'<>)]*/i
  );
  if (urlMatch) {
    return urlMatch[0];
  }

  // 4. Keyword fallback routing
  if (/live\s*class|webinar/i.test(combinedText)) {
    return '/live-classes';
  }
  if (/course|curriculum|module|lesson/i.test(combinedText)) {
    return '/courses';
  }
  if (/test\s*series|mock\s*test|exam/i.test(combinedText)) {
    return '/tests';
  }
  if (/daily\s*quiz|quiz/i.test(combinedText)) {
    return '/daily-quiz';
  }
  if (/payment|order|enrolled|subscription/i.test(combinedText)) {
    return '/orders';
  }
  if (/certificate/i.test(combinedText)) {
    return '/profile';
  }

  return null;
}
