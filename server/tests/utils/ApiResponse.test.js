import { describe, it, expect, vi } from 'vitest';
import ApiResponse from '../../src/utils/ApiResponse.js';

describe('ApiResponse', () => {
  it('should create an ApiResponse instance correctly', () => {
    const response = new ApiResponse(200, { foo: 'bar' }, 'Test message');
    expect(response.success).toBe(true);
    expect(response.statusCode).toBe(200);
    expect(response.message).toBe('Test message');
    expect(response.data).toEqual({ foo: 'bar' });
  });

  it('should default message to "Success"', () => {
    const response = new ApiResponse(200, { foo: 'bar' });
    expect(response.message).toBe('Success');
  });

  it('should set success to false for status codes >= 400', () => {
    const response = new ApiResponse(400, null, 'Error');
    expect(response.success).toBe(false);
  });

  describe('Static Factory Methods', () => {
    const mockRes = () => {
      const res = {};
      res.status = vi.fn().mockReturnValue(res);
      res.json = vi.fn().mockReturnValue(res);
      res.send = vi.fn().mockReturnValue(res);
      return res;
    };

    it('ok', () => {
      const res = mockRes();
      ApiResponse.ok(res, { key: 'value' }, 'Custom OK');
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          statusCode: 200,
          data: { key: 'value' },
          message: 'Custom OK',
        })
      );
    });

    it('created', () => {
      const res = mockRes();
      ApiResponse.created(res, { id: 1 });
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          statusCode: 201,
          data: { id: 1 },
          message: 'Created successfully',
        })
      );
    });

    it('noContent', () => {
      const res = mockRes();
      ApiResponse.noContent(res);
      
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('paginated', () => {
      const res = mockRes();
      const payload = {
        docs: [{ id: 1 }, { id: 2 }],
        page: 2,
        limit: 2,
        total: 5,
        extraParam: 'test'
      };

      ApiResponse.paginated(res, payload);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Success',
          data: [{ id: 1 }, { id: 2 }],
          pagination: {
            page: 2,
            limit: 2,
            total: 5,
            pages: 3,
            hasNext: true,
            hasPrev: true,
          },
          extraParam: 'test',
        })
      );
    });
  });
});
