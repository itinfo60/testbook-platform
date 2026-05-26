import twilio from 'twilio';
import config from '../config/index.js';
import logger from './logger.js';

let client = null;

const getClient = () => {
  if (!client && config.twilio?.accountSid && config.twilio?.authToken) {
    client = twilio(config.twilio.accountSid, config.twilio.authToken);
  }
  return client;
};

/**
 * Send a WhatsApp message via Twilio WhatsApp API.
 * Falls back gracefully if Twilio is not configured.
 */
export const sendWhatsAppMessage = async (to, message) => {
  const twilioClient = getClient();
  if (!twilioClient) {
    logger.warn('WhatsApp: Twilio not configured, skipping message');
    return;
  }

  // Normalize to E.164 with +91 prefix for India if bare number
  const formattedTo = to.startsWith('+') ? to : `+91${to}`;

  try {
    await twilioClient.messages.create({
      from: `whatsapp:${config.twilio.whatsappFrom}`,
      to: `whatsapp:${formattedTo}`,
      body: message,
    });
    logger.info(`WhatsApp sent to ${formattedTo}`);
  } catch (err) {
    logger.error(`WhatsApp failed for ${formattedTo}: ${err.message}`);
  }
};

export const sendLiveClassReminder = async (phone, className, startsAt) => {
  const time = new Date(startsAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const message = `📚 *Live Class Reminder*\n\n"${className}" starts at *${time}* — in 15 minutes!\n\nJoin on time. Good luck! 🎯`;
  return sendWhatsAppMessage(phone, message);
};

export const sendEnrollmentWhatsApp = async (phone, courseName) => {
  const message = `🎉 *Enrollment Confirmed!*\n\nYou've been enrolled in *"${courseName}"*.\n\nStart learning now on TestBook! 🚀`;
  return sendWhatsAppMessage(phone, message);
};

export const sendResultWhatsApp = async (phone, testName, score, total) => {
  const pct = Math.round((score / total) * 100);
  const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '✅' : '📈';
  const message = `${emoji} *Test Result*\n\n*${testName}*\nScore: ${score}/${total} (${pct}%)\n\nKeep practicing! 💪`;
  return sendWhatsAppMessage(phone, message);
};
