import { describe, it, expect, vi, beforeEach } from 'vitest';
import nodemailer from 'nodemailer';
import emailService from '../../src/utils/email.js';
import config from '../../src/config/index.js';
import logger from '../../src/utils/logger.js';

vi.mock('nodemailer');
vi.mock('../../src/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../src/config/index.js', () => ({
  default: {
    email: {
      smtp: {
        host: 'smtp.test.com',
        port: 587,
        auth: { user: 'test', pass: 'test' },
      },
      from: 'test@test.com',
    },
    clientUrl: 'http://localhost:3000',
  },
}));

describe('Email Service', () => {
  let mockSendMail;

  beforeEach(() => {
    mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' });
    nodemailer.createTransport.mockReturnValue({
      sendMail: mockSendMail,
    });

    // Force re-init to use mocked transport
    emailService._init();
    vi.clearAllMocks();
  });

  describe('send', () => {
    it('should send an email successfully', async () => {
      const result = await emailService.send({
        to: 'user@test.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'test@test.com',
        to: 'user@test.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
        text: 'Test',
      });
      expect(result.messageId).toBe('test-id');
      expect(logger.info).toHaveBeenCalled();
    });

    it('should log error and throw if sending fails', async () => {
      const error = new Error('SMTP Error');
      mockSendMail.mockRejectedValue(error);

      await expect(emailService.send({ to: 'user@test.com', subject: 'Test' })).rejects.toThrow(
        'SMTP Error'
      );

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email', async () => {
      const user = { email: 'user@test.com', name: 'John' };
      const token = 'verify-token';

      await emailService.sendVerificationEmail(user, token);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: 'Verify Your Email - CivicsHub',
          html: expect.stringContaining('http://localhost:3000/verify-email?token=verify-token'),
        })
      );
    });
  });

  describe('sendResetPasswordEmail', () => {
    it('should send reset password email', async () => {
      const user = { email: 'user@test.com', name: 'John' };
      const token = 'reset-token';

      await emailService.sendResetPasswordEmail(user, token);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: 'Reset Password - CivicsHub',
          html: expect.stringContaining('http://localhost:3000/reset-password?token=reset-token'),
        })
      );
    });
  });

  describe('sendEnrollmentConfirmation', () => {
    it('should send enrollment confirmation email', async () => {
      const user = { email: 'user@test.com', name: 'John' };
      const course = { _id: 'course123', title: 'Test Course' };

      await emailService.sendEnrollmentConfirmation(user, course);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: 'Enrolled: Test Course - CivicsHub',
          html: expect.stringContaining('http://localhost:3000/learning/course123'),
        })
      );
    });
  });
});
