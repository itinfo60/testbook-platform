import { describe, it, expect, vi } from 'vitest';
import { buildPaginationQuery, buildFilterQuery, paginateQuery } from '../../src/utils/pagination.js';
import { PAGINATION } from '../../src/constants/index.js';

describe('Pagination Utility', () => {
  describe('buildPaginationQuery', () => {
    it('should use default values if no query provided', () => {
      const result = buildPaginationQuery();
      expect(result.page).toBe(PAGINATION.DEFAULT_PAGE);
      expect(result.limit).toBe(PAGINATION.DEFAULT_LIMIT);
      expect(result.skip).toBe((PAGINATION.DEFAULT_PAGE - 1) * PAGINATION.DEFAULT_LIMIT);
      expect(result.sort).toBe('-createdAt');
    });

    it('should parse page and limit from query string', () => {
      const result = buildPaginationQuery({ page: '2', limit: '5' });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.skip).toBe(5);
    });

    it('should restrict limit to MAX_LIMIT', () => {
      const result = buildPaginationQuery({ limit: 500 });
      expect(result.limit).toBe(PAGINATION.MAX_LIMIT);
    });

    it('should handle negative or zero page and limit gracefully', () => {
      const result = buildPaginationQuery({ page: -1, limit: 0 });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(1); // Math.max(1, limit)
    });
  });

  describe('buildFilterQuery', () => {
    it('should build regex filter for search type', () => {
      const filterConfig = { keyword: { type: 'search', field: 'title' } };
      const result = buildFilterQuery({ keyword: 'test' }, filterConfig);
      expect(result.title).toEqual({ $regex: 'test', $options: 'i' });
    });

    it('should build exact filter for exact type', () => {
      const filterConfig = { status: { type: 'exact' } };
      const result = buildFilterQuery({ status: 'published' }, filterConfig);
      expect(result.status).toBe('published');
    });

    it('should build boolean filter', () => {
      const filterConfig = { isActive: { type: 'boolean' } };
      const result = buildFilterQuery({ isActive: 'true' }, filterConfig);
      expect(result.isActive).toBe(true);
    });

    it('should build number filter', () => {
      const filterConfig = { price: { type: 'number' } };
      const result = buildFilterQuery({ price: '100' }, filterConfig);
      expect(result.price).toBe(100);
    });

    it('should build in filter for arrays or comma separated strings', () => {
      const filterConfig = { tags: { type: 'in' } };
      
      const result1 = buildFilterQuery({ tags: 'a,b' }, filterConfig);
      expect(result1.tags).toEqual({ $in: ['a', 'b'] });

      const result2 = buildFilterQuery({ tags: ['x', 'y'] }, filterConfig);
      expect(result2.tags).toEqual({ $in: ['x', 'y'] });
    });

    it('should build dateRange filter', () => {
      const filterConfig = { createdAt: { type: 'dateRange' } };
      const result = buildFilterQuery({ createdAtFrom: '2023-01-01', createdAtTo: '2023-12-31' }, filterConfig);
      
      expect(result.createdAt.$gte).toBeInstanceOf(Date);
      expect(result.createdAt.$lte).toBeInstanceOf(Date);
    });

    it('should build range filter', () => {
      const filterConfig = { price: { type: 'range' } };
      const result = buildFilterQuery({ priceMin: '10', priceMax: '50' }, filterConfig);
      
      expect(result.price.$gte).toBe(10);
      expect(result.price.$lte).toBe(50);
    });

    it('should ignore undefined or empty values', () => {
      const filterConfig = { status: { type: 'exact' } };
      const result = buildFilterQuery({ status: '' }, filterConfig);
      expect(result).toEqual({});
    });
  });

  describe('paginateQuery', () => {
    it('should paginate mongoose model correctly', async () => {
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }])
      };

      const Model = {
        countDocuments: vi.fn().mockResolvedValue(5),
        find: vi.fn().mockReturnValue(mockQuery)
      };

      const paginationOpts = { page: 2, limit: 2, skip: 2, sort: '-createdAt' };
      
      const result = await paginateQuery(Model, { status: 'published' }, paginationOpts);

      expect(Model.countDocuments).toHaveBeenCalledWith({ status: 'published' });
      expect(Model.find).toHaveBeenCalledWith({ status: 'published' });
      expect(mockQuery.skip).toHaveBeenCalledWith(2);
      expect(mockQuery.limit).toHaveBeenCalledWith(2);
      
      expect(result).toEqual({
        docs: [{ id: 1 }, { id: 2 }],
        page: 2,
        limit: 2,
        total: 5,
        pages: 3,
        hasNext: true,
        hasPrev: true,
      });
    });
  });
});
