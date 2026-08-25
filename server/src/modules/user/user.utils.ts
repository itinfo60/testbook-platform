import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../../config/index.js';

export async function comparePassword(candidate: string, hash: string) {
  if (!hash) return false;
  return bcrypt.compare(candidate, hash);
}

export function generateAccessToken(user: { id: string; role: string; email: string }) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    config.jwt.secret as string,
    { expiresIn: config.jwt.accessExpiry as any }
  );
}

export function generateRefreshToken(user: { id: string; role: string; email: string }) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    config.jwt.secret as string,
    { expiresIn: config.jwt.refreshExpiry as any }
  );
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function generateEmailVerificationToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const expire = new Date(Date.now() + 10 * 60 * 1000);
  return { token, hashedToken, expire };
}

export function generateResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const expire = new Date(Date.now() + 10 * 60 * 1000);
  return { token, hashedToken, expire };
}

export function sanitizeUser(user: any) {
  const { password, refreshTokens, ...safeUser } = user;
  return safeUser;
}
