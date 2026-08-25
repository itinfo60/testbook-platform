import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseRepository } from '../../src/core/base.repository.js';
import { TenantRepository } from '../../src/core/tenant.repository.js';
import { runWithTenant, getTenantId, isBypassTenant } from '../../src/core/tenant.context.js';
import { ApiError } from '../../src/core/api-error.js';

describe('Milestone 1 Adversarial Challenge: Repository Architecture & Tenant Isolation', () => {
  let mockModel;

  beforeEach(() => {
    mockModel = {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi
        .fn()
        .mockImplementation((args) => Promise.resolve({ id: 'item-1', ...(args.data || args) })),
      update: vi
        .fn()
        .mockImplementation((args) =>
          Promise.resolve({ id: args.where?.id || 'item-1', ...(args.data || {}) })
        ),
      delete: vi
        .fn()
        .mockImplementation((args) => Promise.resolve({ id: args.where?.id || 'item-1' })),
      count: vi.fn().mockResolvedValue(0),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    };
    vi.clearAllMocks();
  });

  class ConcreteBaseRepo extends BaseRepository {
    constructor(model) {
      super(model);
    }
  }

  class ConcreteTenantRepo extends TenantRepository {
    constructor(model) {
      super(model);
    }
  }

  // =========================================================================
  // 1. AsyncLocalStorage Concurrency Stress Test
  // =========================================================================
  describe('1. AsyncLocalStorage Concurrency Stress Test', () => {
    it('should maintain strict isolation across 100 concurrent interleaved asynchronous tasks', async () => {
      const concurrency = 100;
      const tasks = Array.from({ length: concurrency }, (_, i) => {
        const tenantId = `tenant-${i % 5}`;
        const isBypass = i % 7 === 0;

        return runWithTenant(isBypass ? null : tenantId, isBypass, async () => {
          // Add non-deterministic random delay to interleave microtasks
          await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 20)));

          const currentTenantId = getTenantId();
          const currentBypass = isBypassTenant();

          if (isBypass) {
            expect(currentTenantId).toBeNull();
            expect(currentBypass).toBe(true);
          } else {
            expect(currentTenantId).toBe(tenantId);
            expect(currentBypass).toBe(false);
          }
        });
      });

      await Promise.all(tasks);
    });
  });

  // =========================================================================
  // 2. TenantRepository Fail-Closed Enforcement
  // =========================================================================
  describe('2. TenantRepository Fail-Closed Multi-Tenancy Enforcement', () => {
    it('should throw 401 when attempting any read operation without active tenant context or bypass', async () => {
      const repo = new ConcreteTenantRepo(mockModel);

      await expect(repo.findMany()).rejects.toThrow(
        'Access denied: No active tenant context found.'
      );
      await expect(repo.findFirst()).rejects.toThrow(
        'Access denied: No active tenant context found.'
      );
      await expect(repo.findUnique({ where: { id: 'test' } })).rejects.toThrow(
        'Access denied: No active tenant context found.'
      );
      await expect(repo.count()).rejects.toThrow('Access denied: No active tenant context found.');
      await expect(repo.paginate()).rejects.toThrow(
        'Access denied: No active tenant context found.'
      );
    });

    it('should throw 401 when attempting any mutation without active tenant context or bypass', async () => {
      const repo = new ConcreteTenantRepo(mockModel);

      await expect(repo.create({ title: 'Leak test' })).rejects.toThrow(
        'Access denied: No active tenant context found.'
      );
      await expect(repo.update('id-1', { title: 'Update test' })).rejects.toThrow(
        'Access denied: No active tenant context found.'
      );
      await expect(repo.delete('id-1')).rejects.toThrow(
        'Access denied: No active tenant context found.'
      );
    });

    it('should reject update on record belonging to another tenant with 404 Not Found', async () => {
      const repo = new ConcreteTenantRepo(mockModel);
      // findFirst within tenant scope returns null (record belongs to another tenant)
      mockModel.findFirst.mockResolvedValueOnce(null);

      await runWithTenant('tenant-A', false, async () => {
        await expect(repo.update('record-tenant-B', { title: 'Hijack attempt' })).rejects.toThrow(
          'Resource not found in active tenant scope'
        );
      });

      expect(mockModel.findFirst).toHaveBeenCalledWith({
        where: { id: 'record-tenant-B', tenantId: 'tenant-A' },
        select: { id: true },
      });
      expect(mockModel.update).not.toHaveBeenCalled();
    });

    it('should reject delete on record belonging to another tenant with 404 Not Found', async () => {
      const repo = new ConcreteTenantRepo(mockModel);
      mockModel.findFirst.mockResolvedValueOnce(null);

      await runWithTenant('tenant-A', false, async () => {
        await expect(repo.delete('record-tenant-B')).rejects.toThrow(
          'Resource not found in active tenant scope'
        );
      });

      expect(mockModel.findFirst).toHaveBeenCalledWith({
        where: { id: 'record-tenant-B', tenantId: 'tenant-A' },
        select: { id: true },
      });
      expect(mockModel.delete).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. Automatic Tenant Scope Injection
  // =========================================================================
  describe('3. Automatic Tenant Scope Injection', () => {
    it('should inject tenantId into findMany, findFirst, and count queries', async () => {
      const repo = new ConcreteTenantRepo(mockModel);

      await runWithTenant('tenant-ALPHA', false, async () => {
        await repo.findMany({ where: { status: 'published' } });
        expect(mockModel.findMany).toHaveBeenCalledWith({
          where: { status: 'published', tenantId: 'tenant-ALPHA' },
        });

        await repo.findFirst({ where: { isFeatured: true } });
        expect(mockModel.findFirst).toHaveBeenCalledWith({
          where: { isFeatured: true, tenantId: 'tenant-ALPHA' },
        });

        await repo.count({ status: 'published' });
        expect(mockModel.count).toHaveBeenCalledWith({
          where: { status: 'published', tenantId: 'tenant-ALPHA' },
        });
      });
    });

    it('should inject tenantId on create automatically', async () => {
      const repo = new ConcreteTenantRepo(mockModel);

      await runWithTenant('tenant-ALPHA', false, async () => {
        await repo.create({ title: 'New Scoped Entity' });
        expect(mockModel.create).toHaveBeenCalledWith({
          data: { title: 'New Scoped Entity', tenantId: 'tenant-ALPHA' },
        });

        await repo.create({ data: { title: 'With data wrapper' } });
        expect(mockModel.create).toHaveBeenCalledWith({
          data: { title: 'With data wrapper', tenantId: 'tenant-ALPHA' },
        });
      });
    });
  });
});
