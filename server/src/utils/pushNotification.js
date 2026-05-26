import { messaging } from '../config/firebase.js';
import logger from './logger.js';

/**
 * Send a push notification to a single FCM token.
 */
export async function sendPush({ token, title, body, data = {} }) {
  if (!messaging || !token) return null;

  try {
    const message = {
      token,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: { priority: 'high', notification: { clickAction: 'FLUTTER_NOTIFICATION_CLICK' } },
      apns: { payload: { aps: { badge: 1, sound: 'default' } } },
    };

    const result = await messaging.send(message);
    logger.info(`Push sent: ${result}`);
    return result;
  } catch (err) {
    // Invalid token — should be removed from user profile
    if (err.code === 'messaging/registration-token-not-registered') {
      logger.warn(`Stale FCM token: ${token}`);
      return 'stale';
    }
    logger.error(`Push send failed: ${err.message}`);
    return null;
  }
}

/**
 * Send push to multiple tokens (multicast).
 */
export async function sendMulticastPush({ tokens, title, body, data = {} }) {
  if (!messaging || !tokens?.length) return null;

  const message = {
    tokens,
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
  };

  const result = await messaging.sendEachForMulticast(message);
  logger.info(`Multicast push: success=${result.successCount} fail=${result.failureCount}`);
  return result;
}
