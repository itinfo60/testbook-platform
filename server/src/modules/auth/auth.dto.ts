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

export interface IUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'student' | 'teacher' | 'admin' | 'super_admin';
  tenantId?: string | null;
  avatar?: any;
  bio?: string;
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpire?: Date;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  refreshTokens?: any;
  mfaSecret?: string;
  mfaEnabled: boolean;
  mfaBackupCodes?: string[];
  consentGiven: boolean;
  consentAt?: Date;
  dataRetentionPolicyVersion?: string;
  googleId?: string;
  authProvider: 'local' | 'google';
  fcmTokens?: string[];
  enrolledCourses?: number;
  completedCourses?: number;
  totalTestsTaken?: number;
  totalPoints?: number;
  streak?: number;
  lastActiveAt?: Date;
  teacherProfile?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponseDto {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    tenantId?: string | null;
    avatar?: { url: string };
    mfaEnabled: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}
