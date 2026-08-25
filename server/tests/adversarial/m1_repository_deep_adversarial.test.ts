import { describe, it, expect, beforeEach } from 'vitest';
import {
  BaseRepository,
  PaginationOptions,
  PaginationResult,
  PrismaModelDelegate,
} from '../../src/core/base.repository.js';
import { TenantRepository } from '../../src/core/tenant.repository.js';
import { BaseService } from '../../src/core/base.service.js';
import {
  runWithTenant,
  getTenantId,
  isBypassTenant,
  getTenantStore,
} from '../../src/core/tenant.context.js';
import { ApiError } from '../../src/core/api-error.js';

/**
 * Stateful In-Memory Prisma Model Delegate Simulator
 * Faithfully simulates Prisma Client query and mutation semantics for empirical adversarial verification.
 */
class InMemoryPrismaDelegate<
  T extends { id: string; tenantId?: string; [key: string]: any },
> implements PrismaModelDelegate<T> {
  private records: Map<string, T> = new Map();

  constructor(initialRecords: T[] = []) {
    for (const rec of initialRecords) {
      this.records.set(rec.id, JSON.parse(JSON.stringify(rec)));
    }
  }

  // Reset or seed store
  public seed(records: T[]) {
    this.records.clear();
    for (const rec of records) {
      this.records.set(rec.id, JSON.parse(JSON.stringify(rec)));
    }
  }

  public getAllRaw(): T[] {
    return Array.from(this.records.values()).map((r) => JSON.parse(JSON.stringify(r)));
  }

  private matchesFilter(record: T, where?: any): boolean {
    if (!where || Object.keys(where).length === 0) return true;
    for (const key of Object.keys(where)) {
      const condition = where[key];
      if (condition === undefined) continue;

      if (key === 'AND' && Array.isArray(condition)) {
        if (!condition.every((c) => this.matchesFilter(record, c))) return false;
        continue;
      }
      if (key === 'OR' && Array.isArray(condition)) {
        if (!condition.some((c) => this.matchesFilter(record, c))) return false;
        continue;
      }
      if (key === 'NOT') {
        if (this.matchesFilter(record, condition)) return false;
        continue;
      }

      const val = record[key];
      if (typeof condition === 'object' && condition !== null) {
        if ('gt' in condition && !(val > condition.gt)) return false;
        if ('gte' in condition && !(val >= condition.gte)) return false;
        if ('lt' in condition && !(val < condition.lt)) return false;
        if ('lte' in condition && !(val <= condition.lte)) return false;
        if ('equals' in condition && val !== condition.equals) return false;
        if ('in' in condition && Array.isArray(condition.in) && !condition.in.includes(val))
          return false;
        if ('notIn' in condition && Array.isArray(condition.notIn) && condition.notIn.includes(val))
          return false;
      } else {
        if (val !== condition) return false;
      }
    }
    return true;
  }

  private applySort(records: T[], orderBy?: any): T[] {
    if (!orderBy) return records;
    const sorted = [...records];
    const orderEntries: Array<[string, 'asc' | 'desc']> = [];

    if (Array.isArray(orderBy)) {
      for (const item of orderBy) {
        const [k, v] = Object.entries(item)[0];
        orderEntries.push([k, v as 'asc' | 'desc']);
      }
    } else if (typeof orderBy === 'object') {
      for (const [k, v] of Object.entries(orderBy)) {
        orderEntries.push([k, v as 'asc' | 'desc']);
      }
    }

    if (orderEntries.length === 0) return sorted;

    sorted.sort((a, b) => {
      for (const [key, dir] of orderEntries) {
        const aVal = a[key];
        const bVal = b[key];
        if (aVal < bVal) return dir === 'asc' ? -1 : 1;
        if (aVal > bVal) return dir === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }

  async findMany(args: any = {}): Promise<T[]> {
    let filtered = Array.from(this.records.values()).filter((r) =>
      this.matchesFilter(r, args.where)
    );
    filtered = this.applySort(filtered, args.orderBy);

    const skip = args.skip || 0;
    const take = args.take !== undefined ? args.take : filtered.length;
    const sliced = filtered.slice(skip, skip + take);

    return sliced.map((r) => JSON.parse(JSON.stringify(r)));
  }

  async findUnique(args: any): Promise<T | null> {
    if (!args || !args.where) return null;
    for (const record of this.records.values()) {
      if (this.matchesFilter(record, args.where)) {
        return JSON.parse(JSON.stringify(record));
      }
    }
    return null;
  }

  async findFirst(args: any = {}): Promise<T | null> {
    let filtered = Array.from(this.records.values()).filter((r) =>
      this.matchesFilter(r, args.where)
    );
    filtered = this.applySort(filtered, args.orderBy);
    const first = filtered[0];
    return first ? JSON.parse(JSON.stringify(first)) : null;
  }

  async create(args: any): Promise<T> {
    const data = args?.data || args;
    const id = data.id || `id-${Math.random().toString(36).substring(2, 9)}`;
    const newRecord = { ...data, id } as T;
    this.records.set(id, JSON.parse(JSON.stringify(newRecord)));
    return JSON.parse(JSON.stringify(newRecord));
  }

  async createMany(args: any): Promise<{ count: number }> {
    const dataArray = args?.data || [];
    let count = 0;
    for (const d of dataArray) {
      await this.create({ data: d });
      count++;
    }
    return { count };
  }

  async update(args: any): Promise<T> {
    const { where, data } = args;
    const existing = await this.findFirst({ where });
    if (!existing) {
      const error: any = new Error('Record to update not found');
      error.code = 'P2025';
      throw error;
    }
    const updated = { ...existing, ...data };
    this.records.set(existing.id, JSON.parse(JSON.stringify(updated)));
    return JSON.parse(JSON.stringify(updated));
  }

  async updateMany(args: any): Promise<{ count: number }> {
    const { where, data } = args;
    const matched = Array.from(this.records.values()).filter((r) => this.matchesFilter(r, where));
    for (const rec of matched) {
      const updated = { ...rec, ...data };
      this.records.set(rec.id, JSON.parse(JSON.stringify(updated)));
    }
    return { count: matched.length };
  }

  async delete(args: any): Promise<T> {
    const { where } = args;
    const existing = await this.findFirst({ where });
    if (!existing) {
      const error: any = new Error('Record to delete not found');
      error.code = 'P2025';
      throw error;
    }
    this.records.delete(existing.id);
    return JSON.parse(JSON.stringify(existing));
  }

  async deleteMany(args: any = {}): Promise<{ count: number }> {
    const where = args.where || {};
    const matched = Array.from(this.records.values()).filter((r) => this.matchesFilter(r, where));
    for (const rec of matched) {
      this.records.delete(rec.id);
    }
    return { count: matched.length };
  }

  async count(args: any = {}): Promise<number> {
    const where = args.where || {};
    return Array.from(this.records.values()).filter((r) => this.matchesFilter(r, where)).length;
  }
}

// Domain Model Entities for Testing
interface TestItem {
  id: string;
  tenantId?: string;
  name: string;
  category: string;
  score: number;
  createdAt: string;
}

class TestBaseRepo extends BaseRepository<TestItem> {
  constructor(delegate: PrismaModelDelegate<TestItem>) {
    super(delegate);
  }
}

class TestTenantRepo extends TenantRepository<TestItem> {
  constructor(delegate: PrismaModelDelegate<TestItem>) {
    super(delegate);
  }
}

class TestItemService extends BaseService<TestItem, TestTenantRepo> {
  constructor(repo: TestTenantRepo) {
    super(repo);
  }
}

describe('Adversarial Challenger Suite: BaseRepository, TenantRepository, and TenantContext', () => {
  let delegate: InMemoryPrismaDelegate<TestItem>;
  let baseRepo: TestBaseRepo;
  let tenantRepo: TestTenantRepo;
  let service: TestItemService;

  const dataset: TestItem[] = [
    {
      id: 'item-t1-1',
      tenantId: 'tenant-1',
      name: 'Alpha Course',
      category: 'Math',
      score: 95,
      createdAt: '2026-01-01T10:00:00Z',
    },
    {
      id: 'item-t1-2',
      tenantId: 'tenant-1',
      name: 'Beta Course',
      category: 'Science',
      score: 85,
      createdAt: '2026-01-02T10:00:00Z',
    },
    {
      id: 'item-t1-3',
      tenantId: 'tenant-1',
      name: 'Gamma Course',
      category: 'Math',
      score: 75,
      createdAt: '2026-01-03T10:00:00Z',
    },
    {
      id: 'item-t2-1',
      tenantId: 'tenant-2',
      name: 'Delta Course',
      category: 'History',
      score: 90,
      createdAt: '2026-01-04T10:00:00Z',
    },
    {
      id: 'item-t2-2',
      tenantId: 'tenant-2',
      name: 'Epsilon Course',
      category: 'Math',
      score: 60,
      createdAt: '2026-01-05T10:00:00Z',
    },
    {
      id: 'item-t3-1',
      tenantId: 'tenant-3',
      name: 'Zeta Course',
      category: 'Science',
      score: 88,
      createdAt: '2026-01-06T10:00:00Z',
    },
  ];

  beforeEach(() => {
    delegate = new InMemoryPrismaDelegate<TestItem>(dataset);
    baseRepo = new TestBaseRepo(delegate);
    tenantRepo = new TestTenantRepo(delegate);
    service = new TestItemService(tenantRepo);
  });

  // =========================================================================
  // 1. FAIL-CLOSED SECURITY IN ADVERSARIAL ZERO-CONTEXT ENVIRONMENT
  // =========================================================================
  describe('1. Fail-Closed Security: Zero Context Rejection', () => {
    const unauthenticatedOps = [
      { name: 'findMany', op: (repo: TestTenantRepo) => repo.findMany() },
      { name: 'findFirst', op: (repo: TestTenantRepo) => repo.findFirst() },
      {
        name: 'findUnique',
        op: (repo: TestTenantRepo) => repo.findUnique({ where: { id: 'item-t1-1' } }),
      },
      { name: 'findById', op: (repo: TestTenantRepo) => repo.findById('item-t1-1') },
      { name: 'findOne', op: (repo: TestTenantRepo) => repo.findOne({ category: 'Math' }) },
      { name: 'find', op: (repo: TestTenantRepo) => repo.find({ category: 'Math' }) },
      {
        name: 'create (object)',
        op: (repo: TestTenantRepo) =>
          repo.create({ name: 'Hack', category: 'Hacking', score: 100, createdAt: '2026-01-01' }),
      },
      {
        name: 'create ({ data })',
        op: (repo: TestTenantRepo) =>
          repo.create({
            data: { name: 'Hack', category: 'Hacking', score: 100, createdAt: '2026-01-01' },
          }),
      },
      {
        name: 'update (string id)',
        op: (repo: TestTenantRepo) => repo.update('item-t1-1', { score: 99 }),
      },
      {
        name: 'update ({ where, data })',
        op: (repo: TestTenantRepo) =>
          repo.update({ where: { id: 'item-t1-1' }, data: { score: 99 } }),
      },
      {
        name: 'updateById',
        op: (repo: TestTenantRepo) => repo.updateById('item-t1-1', { score: 99 }),
      },
      {
        name: 'updateOne',
        op: (repo: TestTenantRepo) => repo.updateOne({ id: 'item-t1-1' }, { score: 99 }),
      },
      { name: 'delete (string id)', op: (repo: TestTenantRepo) => repo.delete('item-t1-1') },
      {
        name: 'delete ({ where })',
        op: (repo: TestTenantRepo) => repo.delete({ where: { id: 'item-t1-1' } }),
      },
      { name: 'deleteById', op: (repo: TestTenantRepo) => repo.deleteById('item-t1-1') },
      { name: 'deleteMany', op: (repo: TestTenantRepo) => repo.deleteMany({ category: 'Math' }) },
      { name: 'count', op: (repo: TestTenantRepo) => repo.count() },
      { name: 'countDocuments', op: (repo: TestTenantRepo) => repo.countDocuments() },
      { name: 'paginate', op: (repo: TestTenantRepo) => repo.paginate({}, { page: 1, limit: 10 }) },
    ];

    for (const { name, op } of unauthenticatedOps) {
      it(`MUST reject [${name}] with HTTP 401 Unauthorized when executed without tenant context`, async () => {
        expect(getTenantId()).toBeNull();
        expect(isBypassTenant()).toBe(false);

        let error: any = null;
        try {
          await op(tenantRepo);
        } catch (err) {
          error = err;
        }

        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(401);
        expect(error.message).toMatch(/No active tenant context found/);
      });
    }
  });

  // =========================================================================
  // 2. TENANT ISOLATION: CROSS-TENANT READ PREVENTION
  // =========================================================================
  describe('2. Multi-Tenant Read Isolation', () => {
    it('Tenant 1 queries NEVER return records from Tenant 2 or Tenant 3', async () => {
      await runWithTenant('tenant-1', false, async () => {
        const items = await tenantRepo.findMany();
        expect(items).toHaveLength(3);
        expect(items.map((i) => i.id)).toEqual(['item-t1-1', 'item-t1-2', 'item-t1-3']);
        expect(items.every((i) => i.tenantId === 'tenant-1')).toBe(true);

        const count = await tenantRepo.count();
        expect(count).toBe(3);

        const countMath = await tenantRepo.count({ category: 'Math' });
        expect(countMath).toBe(2);

        // findOne on category 'History' (which only exists in tenant-2) must return null
        const historyItem = await tenantRepo.findOne({ category: 'History' });
        expect(historyItem).toBeNull();

        // findUnique for tenant-2 record ID must return null
        const t2Item = await tenantRepo.findUnique({ where: { id: 'item-t2-1' } });
        expect(t2Item).toBeNull();

        // findById for tenant-3 record ID must return null
        const t3Item = await tenantRepo.findById('item-t3-1');
        expect(t3Item).toBeNull();
      });
    });

    it('Tenant 2 queries NEVER return records from Tenant 1 or Tenant 3', async () => {
      await runWithTenant('tenant-2', false, async () => {
        const items = await tenantRepo.findMany();
        expect(items).toHaveLength(2);
        expect(items.map((i) => i.id)).toEqual(['item-t2-1', 'item-t2-2']);
        expect(items.every((i) => i.tenantId === 'tenant-2')).toBe(true);

        const count = await tenantRepo.count();
        expect(count).toBe(2);

        const t1Item = await tenantRepo.findById('item-t1-1');
        expect(t1Item).toBeNull();
      });
    });

    it('Tenant with zero records returns empty results cleanly without errors', async () => {
      await runWithTenant('tenant-empty-999', false, async () => {
        const items = await tenantRepo.findMany();
        expect(items).toEqual([]);

        const count = await tenantRepo.count();
        expect(count).toBe(0);

        const paginated = await tenantRepo.paginate({}, { page: 1, limit: 10 });
        expect(paginated.docs).toEqual([]);
        expect(paginated.total).toBe(0);
        expect(paginated.pagination.pages).toBe(0);
      });
    });
  });

  // =========================================================================
  // 3. MUTATION SAFETY & CROSS-TENANT HIJACKING DEFENSE
  // =========================================================================
  describe('3. Cross-Tenant Mutation & Deletion Safety', () => {
    it('Tenant 1 cannot modify Tenant 2 record via update(string id) -> throws 404', async () => {
      await runWithTenant('tenant-1', false, async () => {
        let err: any = null;
        try {
          await tenantRepo.update('item-t2-1', { score: 999, name: 'Hijacked' });
        } catch (e) {
          err = e;
        }

        expect(err).toBeDefined();
        expect(err).toBeInstanceOf(ApiError);
        expect(err.statusCode).toBe(404);
        expect(err.message).toBe('Resource not found in active tenant scope');
      });

      // Verify the record in the store is pristine and unmodified
      const t2Record = (await delegate.findUnique({ where: { id: 'item-t2-1' } }))!;
      expect(t2Record.score).toBe(90);
      expect(t2Record.name).toBe('Delta Course');
    });

    it('Tenant 1 cannot modify Tenant 2 record via updateById(id, data) -> returns null safely', async () => {
      await runWithTenant('tenant-1', false, async () => {
        const res = await tenantRepo.updateById('item-t2-1', { score: 999, name: 'Hijacked' });
        expect(res).toBeNull();
      });

      const t2Record = (await delegate.findUnique({ where: { id: 'item-t2-1' } }))!;
      expect(t2Record.score).toBe(90);
      expect(t2Record.name).toBe('Delta Course');
    });

    it('Tenant 1 cannot delete Tenant 2 record via delete(string id) -> throws 404', async () => {
      await runWithTenant('tenant-1', false, async () => {
        let err: any = null;
        try {
          await tenantRepo.delete('item-t2-1');
        } catch (e) {
          err = e;
        }

        expect(err).toBeDefined();
        expect(err).toBeInstanceOf(ApiError);
        expect(err.statusCode).toBe(404);
        expect(err.message).toBe('Resource not found in active tenant scope');
      });

      // Verify record still exists in the database
      const t2Record = await delegate.findUnique({ where: { id: 'item-t2-1' } });
      expect(t2Record).toBeDefined();
      expect(t2Record?.id).toBe('item-t2-1');
    });

    it('Tenant 1 cannot delete Tenant 2 record via deleteById(id) -> returns null safely', async () => {
      await runWithTenant('tenant-1', false, async () => {
        const res = await tenantRepo.deleteById('item-t2-1');
        expect(res).toBeNull();
      });

      const t2Record = await delegate.findUnique({ where: { id: 'item-t2-1' } });
      expect(t2Record).toBeDefined();
    });

    it('Tenant 1 executing deleteMany({ category: "Math" }) ONLY deletes Tenant 1 Math records', async () => {
      await runWithTenant('tenant-1', false, async () => {
        const result = await tenantRepo.deleteMany({ category: 'Math' });
        // Tenant 1 has 2 Math records ('item-t1-1', 'item-t1-3')
        expect(result.count).toBe(2);
      });

      // Tenant 2 has a Math record ('item-t2-2') - it MUST still exist!
      const t2Math = await delegate.findUnique({ where: { id: 'item-t2-2' } });
      expect(t2Math).toBeDefined();
      expect(t2Math?.tenantId).toBe('tenant-2');
      expect(t2Math?.name).toBe('Epsilon Course');
    });

    it('Tenant create automatically attaches active tenantId', async () => {
      let createdId: string = '';
      await runWithTenant('tenant-1', false, async () => {
        const created = await tenantRepo.create({
          name: 'New T1 Course',
          category: 'Art',
          score: 100,
          createdAt: '2026-01-10T00:00:00Z',
        });
        expect(created.tenantId).toBe('tenant-1');
        expect(created.name).toBe('New T1 Course');
        createdId = created.id;
      });

      // Verify from raw store
      const inStore = await delegate.findUnique({ where: { id: createdId } });
      expect(inStore).toBeDefined();
      expect(inStore?.tenantId).toBe('tenant-1');
    });
  });

  // =========================================================================
  // 4. GLOBAL BYPASS MODE VERIFICATION
  // =========================================================================
  describe('4. Global Bypass Mode (Super Admin / Global Queries)', () => {
    it('Bypass mode permits querying all records across all tenants', async () => {
      await runWithTenant(null, true, async () => {
        expect(isBypassTenant()).toBe(true);
        expect(getTenantId()).toBeNull();

        const all = await tenantRepo.findMany();
        expect(all).toHaveLength(6);

        const totalCount = await tenantRepo.count();
        expect(totalCount).toBe(6);

        const itemT1 = await tenantRepo.findById('item-t1-1');
        expect(itemT1).toBeDefined();
        expect(itemT1?.tenantId).toBe('tenant-1');

        const itemT2 = await tenantRepo.findById('item-t2-1');
        expect(itemT2).toBeDefined();
        expect(itemT2?.tenantId).toBe('tenant-2');
      });
    });

    it('Bypass mode permits updating and deleting records across any tenant', async () => {
      await runWithTenant(null, true, async () => {
        const updated = await tenantRepo.updateById('item-t2-1', { score: 95 });
        expect(updated).toBeDefined();
        expect(updated?.score).toBe(95);

        const deleted = await tenantRepo.deleteById('item-t3-1');
        expect(deleted).toBeDefined();
        expect(deleted?.id).toBe('item-t3-1');
      });

      // Verify deletion in delegate
      const checkDeleted = await delegate.findUnique({ where: { id: 'item-t3-1' } });
      expect(checkDeleted).toBeNull();
    });
  });

  // =========================================================================
  // 5. PAGINATION, SORTING & ARITHMETIC BOUNDARY TESTING
  // =========================================================================
  describe('5. Pagination, Sorting & Boundary Calculations', () => {
    beforeEach(() => {
      // Seed 25 items for tenant-1
      const t1Items: TestItem[] = Array.from({ length: 25 }, (_, i) => ({
        id: `gen-t1-${i + 1}`,
        tenantId: 'tenant-1',
        name: `Course ${String(i + 1).padStart(2, '0')}`,
        category: i % 2 === 0 ? 'Math' : 'Science',
        score: (i * 7) % 100,
        createdAt: `2026-01-${String((i % 28) + 1).padStart(2, '0')}T10:00:00Z`,
      }));
      // Seed 15 items for tenant-2
      const t2Items: TestItem[] = Array.from({ length: 15 }, (_, i) => ({
        id: `gen-t2-${i + 1}`,
        tenantId: 'tenant-2',
        name: `T2 Course ${i + 1}`,
        category: 'Literature',
        score: i * 5,
        createdAt: `2026-01-${String((i % 28) + 1).padStart(2, '0')}T10:00:00Z`,
      }));
      delegate.seed([...t1Items, ...t2Items]);
    });

    it('Calculates correct pages, skip, take, hasNext, and hasPrev on Page 1', async () => {
      await runWithTenant('tenant-1', false, async () => {
        const result = await tenantRepo.paginate({}, { page: 1, limit: 10 });
        expect(result.docs).toHaveLength(10);
        expect(result.total).toBe(25);
        expect(result.pagination).toEqual({
          page: 1,
          limit: 10,
          total: 25,
          pages: 3,
          hasNext: true,
          hasPrev: false,
        });
      });
    });

    it('Calculates correct metadata on Middle Page (Page 2 of 3)', async () => {
      await runWithTenant('tenant-1', false, async () => {
        const result = await tenantRepo.paginate({}, { page: 2, limit: 10 });
        expect(result.docs).toHaveLength(10);
        expect(result.total).toBe(25);
        expect(result.pagination).toEqual({
          page: 2,
          limit: 10,
          total: 25,
          pages: 3,
          hasNext: true,
          hasPrev: true,
        });
      });
    });

    it('Calculates correct metadata on Last Page (Page 3 of 3 with partial items)', async () => {
      await runWithTenant('tenant-1', false, async () => {
        const result = await tenantRepo.paginate({}, { page: 3, limit: 10 });
        expect(result.docs).toHaveLength(5);
        expect(result.total).toBe(25);
        expect(result.pagination).toEqual({
          page: 3,
          limit: 10,
          total: 25,
          pages: 3,
          hasNext: false,
          hasPrev: true,
        });
      });
    });

    it('Handles out-of-bounds page numbers gracefully (Page 99 of 3)', async () => {
      await runWithTenant('tenant-1', false, async () => {
        const result = await tenantRepo.paginate({}, { page: 99, limit: 10 });
        expect(result.docs).toHaveLength(0);
        expect(result.total).toBe(25);
        expect(result.pagination.page).toBe(99);
        expect(result.pagination.pages).toBe(3);
        expect(result.pagination.hasNext).toBe(false);
        expect(result.pagination.hasPrev).toBe(true);
      });
    });

    it('Correctly parses and applies string sorting: asc ("name") and desc ("-name")', async () => {
      await runWithTenant('tenant-1', false, async () => {
        // Ascending sort by name
        const ascRes = await tenantRepo.paginate({}, { page: 1, limit: 5, sort: 'name' });
        expect(ascRes.docs[0].name).toBe('Course 01');
        expect(ascRes.docs[1].name).toBe('Course 02');

        // Descending sort by name
        const descRes = await tenantRepo.paginate({}, { page: 1, limit: 5, sort: '-name' });
        expect(descRes.docs[0].name).toBe('Course 25');
        expect(descRes.docs[1].name).toBe('Course 24');
      });
    });

    it('Combines custom filter, tenant scope, and pagination seamlessly', async () => {
      await runWithTenant('tenant-1', false, async () => {
        // Math courses in tenant-1 (indices 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24 = 13 items)
        const mathRes = await tenantRepo.paginate({ category: 'Math' }, { page: 1, limit: 5 });
        expect(mathRes.total).toBe(13);
        expect(mathRes.docs).toHaveLength(5);
        expect(mathRes.docs.every((d) => d.category === 'Math' && d.tenantId === 'tenant-1')).toBe(
          true
        );
        expect(mathRes.pagination.pages).toBe(3);
      });
    });
  });

  // =========================================================================
  // 6. HIGH-CONCURRENCY ASYNCHRONOUS CONTEXT ISOLATION
  // =========================================================================
  describe('6. High-Concurrency Asynchronous Context Interleaving', () => {
    it('Stress-tests 200 concurrent tasks across 10 distinct tenants with random interleaving delays', async () => {
      const tenants = Array.from({ length: 10 }, (_, i) => `concurrent-tenant-${i}`);

      // Seed 5 items per tenant
      const allItems: TestItem[] = [];
      for (const tId of tenants) {
        for (let j = 0; j < 5; j++) {
          allItems.push({
            id: `item-${tId}-${j}`,
            tenantId: tId,
            name: `${tId} Item ${j}`,
            category: 'General',
            score: j * 10,
            createdAt: '2026-01-01T00:00:00Z',
          });
        }
      }
      delegate.seed(allItems);

      const tasks = Array.from({ length: 200 }, (_, i) => {
        const selectedTenant = tenants[i % tenants.length];
        const isBypass = i % 11 === 0;

        return runWithTenant(isBypass ? null : selectedTenant, isBypass, async () => {
          // Microtask yield with random delay
          await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 15)));

          const activeTenantId = getTenantId();
          const bypassActive = isBypassTenant();

          if (isBypass) {
            expect(bypassActive).toBe(true);
            expect(activeTenantId).toBeNull();
            const total = await tenantRepo.count();
            expect(total).toBe(50);
          } else {
            expect(bypassActive).toBe(false);
            expect(activeTenantId).toBe(selectedTenant);

            const scopedItems = await tenantRepo.findMany();
            expect(scopedItems).toHaveLength(5);
            expect(scopedItems.every((it) => it.tenantId === selectedTenant)).toBe(true);

            const count = await tenantRepo.count();
            expect(count).toBe(5);
          }
        });
      });

      await Promise.all(tasks);
    });
  });

  // =========================================================================
  // 7. BASE REPOSITORY GENERAL CONTRACT & DIRECT TESTING
  // =========================================================================
  describe('7. BaseRepository Contract & Query Mechanics', () => {
    it('findMany, findUnique, findFirst, create, update, delete, count work directly', async () => {
      const all = await baseRepo.findMany();
      expect(all).toHaveLength(6);

      const unique = await baseRepo.findUnique({ where: { id: 'item-t1-1' } });
      expect(unique?.name).toBe('Alpha Course');

      const first = await baseRepo.findFirst({
        where: { category: 'Math' },
        orderBy: { score: 'desc' },
      });
      expect(first?.id).toBe('item-t1-1'); // score 95

      const created = await baseRepo.create({
        name: 'Direct Created',
        category: 'Music',
        score: 100,
        createdAt: '2026-01-15T00:00:00Z',
      });
      expect(created.name).toBe('Direct Created');

      const updated = await baseRepo.update(created.id, { score: 105 });
      expect(updated.score).toBe(105);

      const deleted = await baseRepo.delete(created.id);
      expect(deleted.id).toBe(created.id);

      const count = await baseRepo.count();
      expect(count).toBe(6);
    });

    it('Legacy adapter methods work identically', async () => {
      const byId = await baseRepo.findById('item-t1-1');
      expect(byId?.id).toBe('item-t1-1');

      const one = await baseRepo.findOne({ category: 'Science' });
      expect(one).toBeDefined();

      const many = await baseRepo.find({ category: 'Math' });
      expect(many).toHaveLength(3); // items t1-1, t1-3, t2-2

      const updated = await baseRepo.updateById('item-t1-1', { score: 96 });
      expect(updated?.score).toBe(96);

      const count = await baseRepo.countDocuments({ category: 'Math' });
      expect(count).toBe(3);
    });
  });

  // =========================================================================
  // 8. CONTEXT LIFECYCLE, NESTED CALLS & EXCEPTION SAFETY
  // =========================================================================
  describe('8. Context Lifecycle, Nested Tenant Calls & Exception Safety', () => {
    it('handles nested runWithTenant calls without context corruption or leakage', async () => {
      await runWithTenant('tenant-outer', false, async () => {
        expect(getTenantId()).toBe('tenant-outer');
        expect(getTenantStore()).toEqual({ tenantId: 'tenant-outer', bypass: false });

        // Nested call with different tenant
        await runWithTenant('tenant-inner', false, async () => {
          expect(getTenantId()).toBe('tenant-inner');
          expect(getTenantStore()).toEqual({ tenantId: 'tenant-inner', bypass: false });
        });

        // Restores to outer tenant
        expect(getTenantId()).toBe('tenant-outer');

        // Nested call with bypass
        await runWithTenant(null, true, async () => {
          expect(getTenantId()).toBeNull();
          expect(isBypassTenant()).toBe(true);
        });

        // Restores back to outer tenant
        expect(getTenantId()).toBe('tenant-outer');
        expect(isBypassTenant()).toBe(false);
      });

      // Completely clear after exiting
      expect(getTenantId()).toBeNull();
      expect(isBypassTenant()).toBe(false);
      expect(getTenantStore()).toBeUndefined();
    });

    it('preserves clean context isolation even when an exception is thrown inside', async () => {
      expect(getTenantId()).toBeNull();

      try {
        await runWithTenant('tenant-throw', false, async () => {
          expect(getTenantId()).toBe('tenant-throw');
          throw new Error('Explosion inside tenant callback');
        });
      } catch (err: any) {
        expect(err.message).toBe('Explosion inside tenant callback');
      }

      // Context must NOT leak out after exception
      expect(getTenantId()).toBeNull();
      expect(isBypassTenant()).toBe(false);
      expect(getTenantStore()).toBeUndefined();
    });
  });

  // =========================================================================
  // 9. BASESERVICE INTEGRATION & ADVERSARIAL VERIFICATION
  // =========================================================================
  describe('9. BaseService Integration with TenantRepository', () => {
    it('BaseService propagates 401 when called without tenant context', async () => {
      await expect(service.findMany()).rejects.toThrow(
        'Access denied: No active tenant context found.'
      );
      await expect(service.findById('item-t1-1')).rejects.toThrow(
        'Access denied: No active tenant context found.'
      );
      await expect(
        service.create({
          name: 'Service Item',
          category: 'Math',
          score: 80,
          createdAt: '2026-01-01',
        })
      ).rejects.toThrow('Access denied: No active tenant context found.');
    });

    it('BaseService executes cleanly within active tenant context', async () => {
      await runWithTenant('tenant-1', false, async () => {
        const items = await service.findMany();
        expect(items).toHaveLength(3);

        const item = await service.findById('item-t1-1');
        expect(item?.name).toBe('Alpha Course');

        const created = await service.create({
          name: 'Service Created',
          category: 'Physics',
          score: 88,
          createdAt: '2026-01-20T00:00:00Z',
        });
        expect(created.tenantId).toBe('tenant-1');
      });
    });
  });

  // =========================================================================
  // 10. ADVERSARIAL INJECTION & FILTER TAMPERING
  // =========================================================================
  describe('10. Adversarial Injection & Filter Tampering', () => {
    it('Scopes query to active tenant even if caller supplies a malicious tenantId in where clause', async () => {
      await runWithTenant('tenant-1', false, async () => {
        // Tampering attempt: caller tries to search tenant-2 records while in tenant-1 context
        const tamperedWhere = { tenantId: 'tenant-2' };
        const scopedWhere = tenantRepo.getScopedWhere(tamperedWhere);
        // TenantRepository overwrites or forces tenantId to active tenant
        expect(scopedWhere.tenantId).toBe('tenant-1');

        const results = await tenantRepo.findMany({ where: { tenantId: 'tenant-2' } });
        // Since tenantId is forced to tenant-1, it searches tenant-1 and returns tenant-1 items
        expect(results.every((r) => r.tenantId === 'tenant-1')).toBe(true);
      });
    });

    it('getScopedArgs forces tenantId into where clause when args is empty or already has where', () => {
      runWithTenant('tenant-scope-test', false, () => {
        const scopedEmpty = tenantRepo.getScopedArgs();
        expect(scopedEmpty).toEqual({ where: { tenantId: 'tenant-scope-test' } });

        const scopedExisting = tenantRepo.getScopedArgs({
          where: { category: 'Art' },
          select: { id: true },
        });
        expect(scopedExisting).toEqual({
          where: { category: 'Art', tenantId: 'tenant-scope-test' },
          select: { id: true },
        });
      });
    });
  });
});
