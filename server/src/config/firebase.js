import admin from 'firebase-admin';
import logger from '../utils/logger.js';

let messaging = null;

const initFirebase = () => {
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_PRIVATE_KEY ||
    !process.env.FIREBASE_CLIENT_EMAIL
  ) {
    logger.warn('Firebase credentials not configured — push notifications disabled');
    return;
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }

  messaging = admin.messaging();
  logger.info('Firebase initialized — push notifications enabled');
};

initFirebase();

export { messaging };
export default admin;
