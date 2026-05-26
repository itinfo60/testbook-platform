import { Document, Types } from 'mongoose';

export interface IUserToken {
  token: string;
  expiresAt: Date;
  device?: string;
}

export interface ITeacherProfile {
  qualification?: string;
  experience?: string;
  specialization?: string[];
  totalStudents?: number;
  totalEarnings?: number;
  rating?: number;
  isVerified?: boolean;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: 'student' | 'teacher' | 'admin' | 'super_admin';
  tenantId: Types.ObjectId;
  avatar: {
    url: string;
    publicId: string;
  };
  bio?: string;
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpire?: Date;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  refreshTokens: IUserToken[];
  mfaSecret?: string;
  mfaEnabled: boolean;
  mfaBackupCodes?: string[];
  consentGiven: boolean;
  consentAt?: Date;
  dataRetentionPolicyVersion: string;
  googleId?: string;
  authProvider: 'local' | 'google';
  fcmTokens: string[];
  enrolledCourses: number;
  completedCourses: number;
  totalTestsTaken: number;
  totalPoints: number;
  streak: number;
  lastActiveAt: Date;
  teacherProfile?: ITeacherProfile;
  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  generateResetToken(): string;
  generateEmailVerificationToken(): string;
  cleanExpiredTokens(): Promise<IUser>;
}

export interface AuthResponseDto {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: { url: string };
    mfaEnabled: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}
