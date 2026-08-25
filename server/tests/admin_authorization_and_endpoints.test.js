import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authorize } from '../src/middleware/auth.js';
import ApiError from '../src/utils/ApiError.js';

describe('Role Authorization & RBAC Permissions', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('super_admin authorization', () => {
    it('allows super_admin on admin-only routes', () => {
      mockReq.user = { role: 'super_admin' };
      const middleware = authorize('admin');
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('allows super_admin on teacher-only routes', () => {
      mockReq.user = { role: 'super_admin' };
      const middleware = authorize('teacher');
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('allows super_admin on multi-role routes (teacher, admin)', () => {
      mockReq.user = { role: 'super_admin' };
      const middleware = authorize('teacher', 'admin');
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('allows super_admin on student-only routes', () => {
      mockReq.user = { role: 'super_admin' };
      const middleware = authorize('student');
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('admin authorization', () => {
    it('allows admin on admin routes', () => {
      mockReq.user = { role: 'admin' };
      const middleware = authorize('admin');
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('allows admin on teacher routes (admin creates on behalf of teachers)', () => {
      mockReq.user = { role: 'admin' };
      const middleware = authorize('teacher');
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('allows admin on student routes', () => {
      mockReq.user = { role: 'admin' };
      const middleware = authorize('student');
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('teacher authorization', () => {
    it('allows teacher on teacher routes', () => {
      mockReq.user = { role: 'teacher' };
      const middleware = authorize('teacher', 'admin');
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('blocks teacher on admin-only routes', () => {
      mockReq.user = { role: 'teacher' };
      const middleware = authorize('admin');
      expect(() => middleware(mockReq, mockRes, mockNext)).toThrow(ApiError);
    });
  });

  describe('student authorization', () => {
    it('allows student on student routes', () => {
      mockReq.user = { role: 'student' };
      const middleware = authorize('student', 'admin');
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('blocks student on teacher routes', () => {
      mockReq.user = { role: 'student' };
      const middleware = authorize('teacher', 'admin');
      expect(() => middleware(mockReq, mockRes, mockNext)).toThrow(ApiError);
    });

    it('blocks student on admin routes', () => {
      mockReq.user = { role: 'student' };
      const middleware = authorize('admin', 'super_admin');
      expect(() => middleware(mockReq, mockRes, mockNext)).toThrow(ApiError);
    });
  });

  describe('unauthenticated requests', () => {
    it('throws unauthorized when req.user is missing', () => {
      mockReq.user = null;
      const middleware = authorize('admin');
      expect(() => middleware(mockReq, mockRes, mockNext)).toThrow(ApiError);
    });
  });
});
