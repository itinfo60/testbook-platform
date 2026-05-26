import nodemailer from 'nodemailer';
import config from '../config/index.js';
import logger from './logger.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this._init();
  }

  _init() {
    this.transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.port === 465,
      auth: config.email.smtp.auth,
    });
  }

  async send({ to, subject, html, text }) {
    try {
      const info = await this.transporter.sendMail({
        from: config.email.from,
        to,
        subject,
        html,
        text,
      });
      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error(`Email send failed to ${to}:`, error.message);
      throw error;
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
}

export default new EmailService();
