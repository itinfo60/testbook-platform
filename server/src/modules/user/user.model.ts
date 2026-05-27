import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../../config/index.js';
import paginatePlugin from '../../models/plugins/paginatePlugin.js';
import tenantPlugin from '../../models/plugins/tenantPlugin.js';
import { IUser } from '../auth/auth.dto.ts';

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin', 'super_admin', 'parent'],
      default: 'student',
      index: true,
    },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    phone: {
      type: String,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
    },

    // Auth
    isActive: { type: Boolean, default: true, index: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    refreshTokens: [
      {
        token: String,
        expiresAt: Date,
        device: String,
      },
    ],

    // MFA
    mfaSecret: { type: String, select: false },
    mfaEnabled: { type: Boolean, default: false },
    mfaBackupCodes: { type: [String], select: false },

    // Parent Portal fields
    parentAccessCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    linkedStudents: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // GDPR consent
    consentGiven: { type: Boolean, default: false },
    consentAt: { type: Date },
    dataRetentionPolicyVersion: { type: String, default: '1.0' },

    // OAuth
    googleId: { type: String, sparse: true },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },

    // Push notifications
    fcmTokens: [{ type: String }],

    // Stats
    enrolledCourses: { type: Number, default: 0 },
    completedCourses: { type: Number, default: 0 },
    totalTestsTaken: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0, index: true },
    streak: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now },

    // Teacher specific
    teacherProfile: {
      qualification: String,
      experience: String,
      specialization: [String],
      totalStudents: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
      isVerified: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.password;
        delete ret.refreshTokens;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ totalPoints: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ name: 'text', email: 'text' });
userSchema.index({ email: 1, tenantId: 1 }, { unique: true });
userSchema.index({ tenantId: 1, role: 1, isActive: 1 });
userSchema.index({ tenantId: 1, createdAt: -1 });
userSchema.index({ resetPasswordExpire: 1 }, { expireAfterSeconds: 0, sparse: true });
userSchema.index({ emailVerificationExpire: 1 }, { expireAfterSeconds: 0, sparse: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password!, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password || '');
};

// Generate access token
userSchema.methods.generateAccessToken = function (): string {
  return jwt.sign(
    { id: this._id.toString(), role: this.role, email: this.email },
    config.jwt.secret!,
    { expiresIn: config.jwt.accessExpiry }
  );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function (): string {
  return jwt.sign(
    { id: this._id.toString(), type: 'refresh', jti: crypto.randomUUID() },
    config.jwt.secret!,
    { expiresIn: config.jwt.refreshExpiry }
  );
};

// Generate reset password token
userSchema.methods.generateResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  return resetToken;
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function (): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hr
  return token;
};

// Clean expired refresh tokens
userSchema.methods.cleanExpiredTokens = function (): Promise<IUser> {
  this.refreshTokens = this.refreshTokens.filter((t: any) => t.expiresAt > new Date());
  return this.save();
};

// Apply plugins
userSchema.plugin(paginatePlugin);
userSchema.plugin(tenantPlugin);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default User;
