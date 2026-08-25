import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { mockRedisStore } from '../setup.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecrettestjwtkeythatis32charslong!';

export const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Generate a JWT token with custom payload
 */
export function generateToken(payload = {}, options = {}) {
  const defaultPayload = {
    id: payload.id || crypto.randomUUID(),
    role: payload.role || 'student',
    tenantId: payload.tenantId !== undefined ? payload.tenantId : DEFAULT_TENANT_ID,
    email: payload.email || `user_${Date.now()}@example.com`,
  };

  return jwt.sign({ ...defaultPayload, ...payload }, JWT_SECRET, {
    expiresIn: options.expiresIn || '1h',
    ...options,
  });
}

/**
 * Create a mock user object with sensible defaults and UUID
 */
export function createTestUser(overrides = {}) {
  const id = overrides.id || crypto.randomUUID();
  const email = overrides.email || `user_${id.substring(0, 8)}@example.com`;
  return {
    id,
    _id: id,
    name: overrides.name || 'Test User',
    email,
    password: overrides.password || '$2a$12$e8Z4zK.Vf7V2pC0c0V7oee9YxR4/nQn1d77bN.tD2d76T.F5hZ4QW', // Password123!
    role: overrides.role || 'student',
    tenantId: overrides.tenantId !== undefined ? overrides.tenantId : DEFAULT_TENANT_ID,
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
    isEmailVerified: overrides.isEmailVerified !== undefined ? overrides.isEmailVerified : true,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
    ...overrides,
  };
}

/**
 * Generate HTTP headers with auth Bearer token and optional tenant ID
 */
export function getAuthHeaders(role = 'student', tenantId = DEFAULT_TENANT_ID, customPayload = {}) {
  const user = createTestUser({ role, tenantId, ...customPayload });
  const token = generateToken(user);
  if (mockRedisStore) {
    mockRedisStore.set(`user_${user.id}`, user);
  }
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId;
  }
  return { headers, user, token };
}

export function getStudentHeaders(tenantId = DEFAULT_TENANT_ID, custom = {}) {
  return getAuthHeaders('student', tenantId, custom);
}

export function getTeacherHeaders(tenantId = DEFAULT_TENANT_ID, custom = {}) {
  return getAuthHeaders('teacher', tenantId, custom);
}

export function getAdminHeaders(tenantId = DEFAULT_TENANT_ID, custom = {}) {
  return getAuthHeaders('admin', tenantId, custom);
}

export function getSuperAdminHeaders(custom = {}) {
  return getAuthHeaders('super_admin', null, custom);
}
