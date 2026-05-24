import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../../../src/modules/user/user.model.js';
import config from '../../../src/config/index.js';

describe('User Model', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('Validation', () => {
    it('should validate a correct user', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@test.com',
        password: 'password123',
      });
      await expect(user.validate()).resolves.toBeUndefined();
    });

    it('should throw error if name is empty', async () => {
      const user = new User({ email: 'john@test.com', password: 'password123' });
      const err = user.validateSync();
      expect(err.errors.name).toBeDefined();
    });

    it('should throw error if email is invalid', async () => {
      const user = new User({ name: 'John', email: 'invalid-email', password: 'password123' });
      const err = user.validateSync();
      expect(err.errors.email).toBeDefined();
    });
  });

  describe('Password Hashing (Pre-save)', () => {
    it('should hash password before saving', async () => {
      const user = await User.create({
        name: 'John',
        email: 'john@test.com',
        password: 'password123'
      });
      
      const savedUser = await User.findById(user._id).select('+password');
      expect(savedUser.password).not.toBe('password123');
      const isMatch = await bcrypt.compare('password123', savedUser.password);
      expect(isMatch).toBe(true);
    });

    it('should not re-hash password if not modified', async () => {
      const user = await User.create({
        name: 'John',
        email: 'john@test.com',
        password: 'password123'
      });
      
      const savedUser = await User.findById(user._id).select('+password');
      const initialHash = savedUser.password;
      
      savedUser.name = 'Johnny';
      await savedUser.save();
      
      const updatedUser = await User.findById(user._id).select('+password');
      expect(updatedUser.password).toBe(initialHash);
    });
  });

  describe('Methods', () => {
    it('comparePassword should return true for correct password', async () => {
      const user = new User({
        name: 'John',
        email: 'john@test.com',
        password: 'password123'
      });
      await user.save();
      
      const savedUser = await User.findById(user._id).select('+password');
      const isMatch = await savedUser.comparePassword('password123');
      expect(isMatch).toBe(true);
    });

    it('comparePassword should return false for incorrect password', async () => {
      const user = new User({
        name: 'John',
        email: 'john@test.com',
        password: 'password123'
      });
      await user.save();
      
      const savedUser = await User.findById(user._id).select('+password');
      const isMatch = await savedUser.comparePassword('wrongpassword');
      expect(isMatch).toBe(false);
    });

    it('generateAccessToken should return a valid JWT', () => {
      const user = new User({ _id: new mongoose.Types.ObjectId(), email: 'john@test.com', role: 'student' });
      const token = user.generateAccessToken();
      
      const decoded = jwt.verify(token, config.jwt.secret);
      expect(decoded.id).toBe(user._id.toString());
      expect(decoded.role).toBe('student');
      expect(decoded.email).toBe('john@test.com');
    });

    it('generateResetToken should generate token and set expiry', () => {
      const user = new User({ name: 'John', email: 'john@test.com', password: 'password123' });
      const rawToken = user.generateResetToken();
      
      expect(rawToken).toBeDefined();
      expect(user.resetPasswordToken).toBeDefined();
      expect(user.resetPasswordExpire).toBeDefined();
      
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      expect(user.resetPasswordToken).toBe(hashedToken);
    });

    it('toJSON should remove password and refreshTokens', async () => {
      const user = new User({
        name: 'John',
        email: 'john@test.com',
        password: 'password123',
        refreshTokens: [{ token: 'abc', expiresAt: new Date(), device: 'web' }]
      });
      
      const json = user.toJSON();
      expect(json.password).toBeUndefined();
      expect(json.refreshTokens).toBeUndefined();
      expect(json.name).toBe('John');
    });
  });
});
