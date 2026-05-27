import nodemailer from 'nodemailer';
import config from '../config/index.js';
import logger from './logger.js';

// ─── Permanent SMTP failure codes that should NOT be retried ─────────────────
const PERMANENT_SMTP_CODES = new Set([535, 534, 530, 521, 503, 550, 551, 553, 554]);

function isPlaceholderCreds() {
  const { user, pass } = config.email.smtp.auth || {};
  return (
    !user ||
    !pass ||
    user === 'your-email@gmail.com' ||
    pass === 'your-app-password' ||
    user.includes('your-') ||
    pass.includes('your-')
  );
}

class EmailService {
  constructor() {
    this.transporter = null;
    this.usingEthereal = false;
    // _init is async; we defer until first send
    this._initPromise = this._init();
  }

  async _init() {
    const isDev = config.env !== 'production';

    if (isDev && isPlaceholderCreds()) {
      // Auto-create an Ethereal catch-all account (no real emails sent)
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
        this.usingEthereal = true;
        logger.info(
          `[Email] ⚠ SMTP credentials not set — using Ethereal catch-all for development. Emails are captured at https://ethereal.email (user: ${testAccount.user})`
        );
      } catch (etherealErr) {
        logger.warn(
          `[Email] Could not create Ethereal account: ${etherealErr.message}. Emails will be logged only.`
        );
        this.transporter = null;
      }
      return;
    }

    // Production / real credentials
    this.transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.port === 465,
      auth: config.email.smtp.auth,
    });
  }

  /**
   * Core send method.
   * In dev-ethereal mode: logs the preview URL instead of sending a real email.
   * Throws `PermanentEmailError` for auth/config failures — BullMQ worker
   * catches this and marks the job as failed without retrying.
   */
  async send({ to, subject, html, text }) {
    // Await lazy init (safe to await multiple times — Promise caches result)
    await this._initPromise;

    if (!this.transporter) {
      logger.warn(
        `[Email] No transporter available — skipping email to ${to} (subject: ${subject})`
      );
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: config.email.from,
        to,
        subject,
        html,
        text,
      });

      if (this.usingEthereal) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        logger.info(`[Email] 📧 Ethereal captured: ${to} — Preview: ${previewUrl}`);
      } else {
        logger.info(`[Email] ✅ Sent to ${to}: ${info.messageId}`);
      }

      return info;
    } catch (error) {
      // Extract SMTP response code if available
      const responseCode = error?.responseCode ?? error?.code ?? null;
      const isPermanent = PERMANENT_SMTP_CODES.has(responseCode);

      if (isPermanent) {
        // Mark as permanent so BullMQ does not retry
        const permanent = new PermanentEmailError(error.message);
        permanent.originalError = error;
        logger.error(
          `[Email] ❌ Permanent SMTP failure (code ${responseCode}) for ${to}: ${error.message}`
        );
        throw permanent;
      }

      logger.error(`[Email] ⚠ Transient failure for ${to}: ${error.message}`);
      throw error; // Will be retried by BullMQ
    }
  }

  async sendVerificationEmail(user, token) {
    const verifyUrl = `${config.clientUrl}/verify-email?token=${token}`;
    return this.send({
      to: user.email,
      subject: 'Verify Your Email - TestBook',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#4F46E5;">Welcome to TestBook!</h2>
          <p>Hi ${user.name},</p>
          <p>Please verify your email by clicking the button below:</p>
          <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">Verify Email</a>
          <p style="color:#6B7280;font-size:14px;">This link expires in 24 hours.</p>
        </div>
      `,
    });
  }

  async sendResetPasswordEmail(user, token) {
    const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;
    return this.send({
      to: user.email,
      subject: 'Reset Password - TestBook',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#4F46E5;">Password Reset</h2>
          <p>Hi ${user.name},</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">Reset Password</a>
          <p style="color:#6B7280;font-size:14px;">This link expires in 10 minutes. If you didn't request this, please ignore.</p>
        </div>
      `,
    });
  }

  async sendWelcomeEmail(user) {
    return this.send({
      to: user.email,
      subject: 'Welcome to TestBook!',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#4F46E5;">Welcome, ${user.name}!</h2>
          <p>Your account is ready. Start exploring courses and tests on TestBook.</p>
          <a href="${config.clientUrl}/dashboard" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">Go to Dashboard</a>
        </div>
      `,
    });
  }

  async sendCertificateEmail(user, course, certificateUrl) {
    return this.send({
      to: user.email,
      subject: `Your Certificate: ${course.title} - TestBook`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#4F46E5;">Congratulations, ${user.name}!</h2>
          <p>You've successfully completed <strong>${course.title}</strong>. Your certificate is ready.</p>
          <a href="${certificateUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">Download Certificate</a>
        </div>
      `,
    });
  }

  async sendEnrollmentConfirmation(user, course) {
    return this.send({
      to: user.email,
      subject: `Enrolled: ${course.title} - TestBook`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#4F46E5;">Enrollment Confirmed! 🎉</h2>
          <p>Hi ${user.name},</p>
          <p>You've been enrolled in <strong>${course.title}</strong>.</p>
          <a href="${config.clientUrl}/learning/${course._id}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">Start Learning</a>
        </div>
      `,
    });
  }

  async sendAnnouncementEmail(user, title, message) {
    return this.send({
      to: user.email,
      subject: `[Announcement] ${title}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1F2937;">
          <h2 style="color:#4F46E5;margin-bottom:16px;">Announcement: ${title}</h2>
          <p>Hi ${user.name},</p>
          <div style="background:#F3F4F6;padding:16px;border-radius:8px;margin:16px 0;white-space:pre-wrap;line-height:1.6;color:#374151;">${message}</div>
          <p style="color:#6B7280;font-size:12px;margin-top:24px;">This is a system broadcast notification from your institute.</p>
        </div>
      `,
    });
  }
}

/**
 * Permanent failures (auth, bad credentials, invalid recipient domain).
 * BullMQ treats any job that throws `UnrecoverableError` as permanently failed
 * without consuming retry budget.
 */
export class PermanentEmailError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PermanentEmailError';
  }
}

export default new EmailService();
