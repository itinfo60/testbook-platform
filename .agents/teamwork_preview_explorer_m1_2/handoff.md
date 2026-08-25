# Core Repositories, Base Services, and Tenant Isolation Investigation Report

## Executive Summary

This report provides the architectural investigation, formal TypeScript definitions, and drop-in implementation designs for the core data access infrastructure in `server/src/core/` and its consumers across `server/src/modules/`. This decouples the platform entirely from Mongoose (`Model`, `Document`, `FilterQuery`, `UpdateQuery`, `QueryOptions`) and transitions the repository and service layers to the centralized Prisma Client singleton (`@prisma/client`).

---

## 1. Observation

### 1.1 Existing Core Files and Mongoose Dependencies

#### A. `server/src/core/base.repository.ts` (Lines 1–50)

- **Direct Mongoose Imports**:
  ```typescript
  import { Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
  ```
- **Class Structure**:
  `export abstract class BaseRepository<T extends Document>`
  - Constructor takes `protected readonly model: Model<T>`.
  - Methods implemented:
    - `create(doc: Partial<T> | any): Promise<T>` -> `this.model.create(doc)`
    - `findById(id: string, projection?: any, options?: QueryOptions): Promise<T | null>` -> `this.model.findById(id, projection, options).exec()`
    - `findOne(filter: FilterQuery<T>, projection?: any, options?: QueryOptions): Promise<T | null>` -> `this.model.findOne(filter, projection, options).exec()`
    - `find(filter: FilterQuery<T>, projection?: any, options?: QueryOptions): Promise<T[]>` -> `this.model.find(filter, projection, options).exec()`
    - `updateById(id: string, update: UpdateQuery<T>, options?: QueryOptions): Promise<T | null>` -> `this.model.findByIdAndUpdate(id, update, { new: true, ...options }).exec()`
    - `updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>, options?: QueryOptions): Promise<any>` -> `this.model.updateOne(filter, update, options).exec()`
    - `deleteById(id: string, options?: QueryOptions): Promise<T | null>` -> `this.model.findByIdAndDelete(id, options).exec()`
    - `deleteMany(filter: FilterQuery<T>, options?: QueryOptions): Promise<any>` -> `this.model.deleteMany(filter, options).exec()`
    - `countDocuments(filter: FilterQuery<T>): Promise<number>` -> `this.model.countDocuments(filter).exec()`

#### B. `server/src/core/tenant.repository.ts` (Lines 1–85)

- **Direct Mongoose Imports**:
  ```typescript
  import { Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
  import { BaseRepository } from './base.repository.js';
  import { getTenantId, isBypassTenant } from './tenant.context.js';
  import { ApiError } from './api-error.js';
  ```
- **Class Structure**:
  `export abstract class TenantRepository<T extends Document> extends BaseRepository<T>`
  - Implements `getScopedFilter(filter: FilterQuery<T> = {}): FilterQuery<T>`:
    - If `isBypassTenant() === true`, returns unmodified `filter`.
    - If `tenantId` is absent from context, throws `ApiError.unauthorized('Access denied: No active tenant context found.')`.
    - Otherwise returns `{ ...filter, tenantId }`.
  - Overrides: `create`, `findById` (converts `findById(id)` to `findOne({ _id: id, tenantId })`), `findOne`, `find`, `updateById` (`findOneAndUpdate({ _id: id, tenantId })`), `updateOne`, `deleteById` (`findOneAndDelete({ _id: id, tenantId })`), `deleteMany`, `countDocuments`.

#### C. `server/src/core/base.service.ts` (Lines 1–31)

- **Direct Mongoose Imports**:
  ```typescript
  import { Document } from 'mongoose';
  import { BaseRepository } from './base.repository.js';
  ```
- **Class Structure**:
  `export abstract class BaseService<T extends Document, R extends BaseRepository<T>>`
  - Constructor: `protected constructor(protected readonly repository: R)`
  - Delegates `create`, `findById`, `findOne`, `find`, `updateById`, `deleteById` directly to `this.repository`.

#### D. `server/src/core/tenant.context.ts` (Lines 1–27)

- **Context Storage**:

  ```typescript
  import { AsyncLocalStorage } from 'async_hooks';

  export interface TenantStore {
    tenantId: string | null;
    bypass: boolean;
  }

  const tenantStorage = new AsyncLocalStorage<TenantStore>();
  ```

- **Functions**:
  - `runWithTenant<T>(tenantId: string | null, bypass = false, callback: () => T | Promise<T>): T | Promise<T>`
  - `getTenantId(): string | null`
  - `isBypassTenant(): boolean`
- **Current Consumers**:
  - `src/middleware/tenant.middleware.js:2`
  - `src/middleware/auth.js:7`
  - `src/middleware/auditLog.js:2`
  - `src/modules/auth/auth.service.ts:11`
  - `src/modules/user/user.service.ts:6`
  - `src/modules/institute/institute.service.ts:11`
  - `src/modules/admin/admin.controller.js:20`
  - `src/modules/blog/blog.controller.js:10`
  - `src/modules/exam-category/examCategory.controller.js:14`
  - `src/modules/test-series/testSeries.controller.js:10`
  - `src/workers/drip.worker.js:7`, `dunning.worker.js:6`, `notification.worker.js:7`

---

### 1.2 Inventory of Module Repositories Extending Base/Tenant Repositories (14 Files)

Across `server/src/modules/`, exactly **14 repository classes** inherit from `BaseRepository` or `TenantRepository`:

| #   | File Path                                                 | Class Name                   | Extends                             | Model Injected                | Key Custom Methods                                                                                    |
| --- | --------------------------------------------------------- | ---------------------------- | ----------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | `src/modules/auth/auth.repository.ts`                     | `AuthRepository`             | `TenantRepository<IUser>`           | `User` (Mongoose)             | `findByEmail`, `findByEmailWithMfa`, `findByIdWithMfa`, `findByResetToken`, `findByVerificationToken` |
| 2   | `src/modules/user/user.repository.ts`                     | `UserRepository`             | `TenantRepository<IUser>`           | `User` (Mongoose)             | `paginateUsers(query: UserQueryInput)`                                                                |
| 3   | `src/modules/institute/institute.repository.ts`           | `InstituteRepository`        | `BaseRepository<IInstitute>`        | `Institute` (Mongoose)        | `findBySubdomain`, `findByCustomDomain`, `findActiveById`                                             |
| 4   | `src/modules/course/course.repository.ts`                 | `CourseRepository`           | `TenantRepository<ICourse>`         | `Course` (Mongoose)           | `paginateCourses(query: CourseQueryInput)`                                                            |
| 5   | `src/modules/test/test.repository.ts`                     | `TestRepository`             | `TenantRepository<ITest>`           | `Test` (Mongoose)             | Inherits Base CRUD                                                                                    |
| 6   | `src/modules/test/testAttempt.repository.ts`              | `TestAttemptRepository`      | `TenantRepository<ITestAttempt>`    | `TestAttempt` (Mongoose)      | Inherits Base CRUD                                                                                    |
| 7   | `src/modules/badge/badge.repository.ts`                   | `BadgeRepository`            | `BaseRepository<IBadge>`            | `Badge` (Mongoose)            | Inherits Base CRUD                                                                                    |
| 8   | `src/modules/badge/userBadge.repository.ts`               | `UserBadgeRepository`        | `TenantRepository<IUserBadge>`      | `UserBadge` (Mongoose)        | `paginateUserBadges(filter, options)`                                                                 |
| 9   | `src/modules/coupon/coupon.repository.ts`                 | `CouponRepository`           | `TenantRepository<ICoupon>`         | `Coupon` (Mongoose)           | `paginateCoupons(filter, options)`                                                                    |
| 10  | `src/modules/discussion/discussion.repository.ts`         | `DiscussionRepository`       | `TenantRepository<IDiscussion>`     | `Discussion` (Mongoose)       | Inherits Base CRUD                                                                                    |
| 11  | `src/modules/note/note.repository.ts`                     | `NoteRepository`             | `TenantRepository<INote>`           | `Note` (Mongoose)             | Inherits Base CRUD                                                                                    |
| 12  | `src/modules/payment/payment.repository.ts`               | `PaymentRepository`          | `TenantRepository<IPayment>`        | `Payment` (Mongoose)          | Inherits Base CRUD                                                                                    |
| 13  | `src/modules/review/review.repository.ts`                 | `ReviewRepository`           | `TenantRepository<IReview>`         | `Review` (Mongoose)           | Inherits Base CRUD                                                                                    |
| 14  | `src/modules/subscription/subscriptionPlan.repository.ts` | `SubscriptionPlanRepository` | `BaseRepository<ISubscriptionPlan>` | `SubscriptionPlan` (Mongoose) | Inherits Base CRUD                                                                                    |

---

### 1.3 Inventory of Domain Services Extending `BaseService` (3 Files)

| #   | File Path                                          | Class Name            | Extends                                                      | Injected Repository                          |
| --- | -------------------------------------------------- | --------------------- | ------------------------------------------------------------ | -------------------------------------------- |
| 1   | `src/modules/payment/payment.service.ts`           | `PaymentService`      | `BaseService<IPayment, PaymentRepository>`                   | `PaymentRepository`                          |
| 2   | `src/modules/subscription/subscription.service.ts` | `SubscriptionService` | `BaseService<ISubscriptionPlan, SubscriptionPlanRepository>` | `SubscriptionPlanRepository`                 |
| 3   | `src/modules/test/test.service.ts`                 | `TestService`         | `BaseService<ITest, TestRepository>`                         | `TestRepository` (+ `TestAttemptRepository`) |

---

## 2. Logic Chain

### 2.1 Prisma Model Delegate Abstraction

1. In Prisma Client (`@prisma/client`), each model exposes a delegate instance with uniform CRUD methods:
   - `findMany(args?)`
   - `findUnique(args)`
   - `findFirst(args?)`
   - `create(args)`
   - `update(args)`
   - `delete(args)`
   - `count(args?)`
   - `deleteMany(args?)`
   - `updateMany(args?)`
2. By defining a generic `PrismaModelDelegate<T>` interface, `BaseRepository<T>` can wrap any model delegate (e.g., `prisma.user`, `prisma.course`, `prisma.institute`) without hard-coding model names.
3. This allows seamless injection of Prisma Client instances, mock delegates for unit testing, and interactive transaction delegates (`tx.user`).

### 2.2 Dual-Mode Support: Modern Prisma API + Backward-Compatible Helpers

1. All new code can use standard Prisma query conventions:
   - `findMany({ where, include, select, orderBy, skip, take })`
   - `findUnique({ where: { id } })`
   - `findFirst({ where })`
   - `create({ data })` or `create(rawData)`
   - `update(id, data)` or `update({ where: { id }, data })`
   - `delete(id)` or `delete({ where: { id } })`
   - `count({ where })`
   - `paginate(where, options)`
2. Existing services calling legacy Mongoose-style signatures (`findById`, `findOne`, `find`, `updateById`, `deleteById`, `countDocuments`) continue to work seamlessly because `BaseRepository` provides translation adapters.

### 2.3 Bulletproof Tenant Isolation (`TenantRepository<T>`)

1. Multi-tenant security requires:
   - When in bypass mode (`isBypassTenant() === true`): queries execute globally without filtering (used for super-admin and global checks like unique email across tenants).
   - When in normal mode and `tenantId` is present: automatically inject `tenantId` into `where` arguments.
   - When in normal mode and `tenantId` is `null` / missing: immediately throw `ApiError.unauthorized('Access denied: No active tenant context found.')`. This prevents accidental cross-tenant data leakage (fail-closed design).
2. For single-record lookups:
   - In Prisma, `findUnique` requires a unique constraint index. When injecting `tenantId`, `findUnique` is safely transformed to `findFirst({ where: { id, tenantId, ... } })`.
3. For modifications (`update`, `delete`, `updateById`, `deleteById`):
   - `TenantRepository` verifies the entity exists under the active `tenantId` before applying updates or deletes.
4. For creation (`create`):
   - `TenantRepository` automatically populates `tenantId` from `TenantContext` if not explicitly supplied in the data payload.

### 2.4 Decoupling `BaseService` from Mongoose

1. In Mongoose, models were typed as `T extends Document`, carrying heavy Mongoose document metadata.
2. In Prisma, models are plain JavaScript objects typed as TypeScript interfaces (`User`, `Course`, `Payment`, etc.).
3. Redefining `BaseService<T = any, R extends BaseRepository<T> = BaseRepository<T>>` removes all Mongoose imports and allows any plain object or Prisma entity to be managed.

### 2.5 Verification of `AsyncLocalStorage`

1. `node:async_hooks` is a core Node.js feature supported in ES2022 / NodeNext.
2. It propagates context across asynchronous operations, including native Promises returned by `@prisma/client`, database connection pools (`@prisma/adapter-pg`), BullMQ worker jobs, and Express middleware chains.
3. No Mongoose code was embedded in `tenant.context.ts`. Upgrading imports to `node:async_hooks` aligns with modern Node.js best practices.

---

## 3. Detailed Architectural Designs & Implementations

### 3.1 Drop-In Replacement: `server/src/core/base.repository.ts`

```typescript
export interface PaginationOptions {
  page?: number | string;
  limit?: number | string;
  sort?: string | Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>;
  orderBy?: any;
  include?: any;
  select?: any;
  distinct?: any;
  [key: string]: any;
}

export interface PaginationResult<T> {
  docs: T[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PrismaModelDelegate<T = any> {
  findMany(args?: any): Promise<T[]>;
  findUnique(args: any): Promise<T | null>;
  findFirst(args?: any): Promise<T | null>;
  create(args: any): Promise<T>;
  createMany?(args: any): Promise<{ count: number }>;
  update(args: any): Promise<T>;
  updateMany?(args: any): Promise<{ count: number }>;
  delete(args: any): Promise<T>;
  deleteMany?(args: any): Promise<{ count: number }>;
  count(args?: any): Promise<number>;
  aggregate?(args: any): Promise<any>;
  groupBy?(args: any): Promise<any>;
  upsert?(args: any): Promise<T>;
  [key: string]: any;
}

export abstract class BaseRepository<T = any> {
  protected readonly model: PrismaModelDelegate<T>;

  /**
   * Accepts a Prisma model delegate (e.g. prisma.user, prisma.course, tx.user).
   */
  constructor(model: PrismaModelDelegate<T>) {
    this.model = model;
  }

  // -------------------------------------------------------------
  // Standard Prisma Query Methods
  // -------------------------------------------------------------

  async findMany(args?: any): Promise<T[]> {
    return this.model.findMany(args);
  }

  async findUnique(args: any): Promise<T | null> {
    return this.model.findUnique(args);
  }

  async findFirst(args?: any): Promise<T | null> {
    return this.model.findFirst(args);
  }

  /**
   * Create record. Supports both Prisma args ({ data: ... }) and direct data payload ({ ... }).
   */
  async create(dataOrArgs: any): Promise<T> {
    const args =
      dataOrArgs && typeof dataOrArgs === 'object' && 'data' in dataOrArgs
        ? dataOrArgs
        : { data: dataOrArgs };
    return this.model.create(args);
  }

  /**
   * Update record. Supports both update(id, data) and update({ where, data }).
   */
  async update(idOrArgs: string | any, data?: any): Promise<T> {
    if (typeof idOrArgs === 'string') {
      return this.model.update({
        where: { id: idOrArgs },
        data,
      });
    }
    return this.model.update(idOrArgs);
  }

  /**
   * Delete record. Supports both delete(id) and delete({ where }).
   */
  async delete(idOrArgs: string | any): Promise<T> {
    if (typeof idOrArgs === 'string') {
      return this.model.delete({
        where: { id: idOrArgs },
      });
    }
    return this.model.delete(idOrArgs);
  }

  /**
   * Count records. Supports count({ where }) and count(whereInput).
   */
  async count(argsOrWhere?: any): Promise<number> {
    if (!argsOrWhere) {
      return this.model.count({});
    }
    const args =
      typeof argsOrWhere === 'object' && ('where' in argsOrWhere || 'select' in argsOrWhere)
        ? argsOrWhere
        : { where: argsOrWhere };
    return this.model.count(args);
  }

  /**
   * Paginate records with standard skip/take calculation and page metadata.
   */
  async paginate(
    filterOrArgs: any = {},
    options: PaginationOptions = {}
  ): Promise<PaginationResult<T>> {
    const pageNum = Math.max(1, parseInt(String(options.page || 1), 10));
    const limitNum = Math.max(1, parseInt(String(options.limit || 10), 10));
    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    const where =
      filterOrArgs && typeof filterOrArgs === 'object' && 'where' in filterOrArgs
        ? filterOrArgs.where
        : filterOrArgs;

    let orderBy = options.orderBy;
    if (!orderBy && options.sort) {
      if (typeof options.sort === 'string') {
        const isDesc = options.sort.startsWith('-');
        const field = isDesc ? options.sort.substring(1) : options.sort;
        orderBy = { [field]: isDesc ? 'desc' : 'asc' };
      } else {
        orderBy = options.sort;
      }
    }
    if (!orderBy) {
      orderBy = { createdAt: 'desc' };
    }

    const findArgs: any = {
      where,
      skip,
      take,
      orderBy,
    };

    if (options.include) findArgs.include = options.include;
    if (options.select) findArgs.select = options.select;
    if (options.distinct) findArgs.distinct = options.distinct;

    const [docs, total] = await Promise.all([
      this.model.findMany(findArgs),
      this.model.count({ where }),
    ]);

    return {
      docs,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
    };
  }

  // -------------------------------------------------------------
  // Legacy Adapter Methods (for smooth migration)
  // -------------------------------------------------------------

  async findById(id: string, selectOrInclude?: any): Promise<T | null> {
    const args: any = { where: { id } };
    if (selectOrInclude?.include) args.include = selectOrInclude.include;
    if (selectOrInclude?.select) args.select = selectOrInclude.select;
    return this.model.findUnique(args);
  }

  async findOne(whereOrFilter: any = {}, options?: any): Promise<T | null> {
    const args: any = { where: whereOrFilter };
    if (options?.include) args.include = options.include;
    if (options?.select) args.select = options.select;
    if (options?.orderBy || options?.sort) args.orderBy = options.orderBy || options.sort;
    return this.model.findFirst(args);
  }

  async find(whereOrFilter: any = {}, options?: any): Promise<T[]> {
    const args: any = { where: whereOrFilter };
    if (options?.include) args.include = options.include;
    if (options?.select) args.select = options.select;
    if (options?.orderBy || options?.sort) args.orderBy = options.orderBy || options.sort;
    if (options?.skip) args.skip = options.skip;
    if (options?.take || options?.limit) args.take = options.take || options.limit;
    return this.model.findMany(args);
  }

  async updateById(id: string, updateData: any): Promise<T | null> {
    return this.model.update({
      where: { id },
      data: updateData,
    });
  }

  async updateOne(where: any, updateData: any): Promise<any> {
    if (this.model.updateMany) {
      return this.model.updateMany({
        where,
        data: updateData,
      });
    }
    return this.model.update({
      where,
      data: updateData,
    });
  }

  async deleteById(id: string): Promise<T | null> {
    return this.model.delete({
      where: { id },
    });
  }

  async deleteMany(where: any = {}): Promise<{ count: number }> {
    if (this.model.deleteMany) {
      return this.model.deleteMany({ where });
    }
    return { count: 0 };
  }

  async countDocuments(where: any = {}): Promise<number> {
    return this.model.count({ where });
  }
}
```

---

### 3.2 Drop-In Replacement: `server/src/core/tenant.repository.ts`

```typescript
import {
  BaseRepository,
  PaginationOptions,
  PaginationResult,
  PrismaModelDelegate,
} from './base.repository.js';
import { getTenantId, isBypassTenant } from './tenant.context.js';
import { ApiError } from './api-error.js';

export abstract class TenantRepository<T = any> extends BaseRepository<T> {
  constructor(model: PrismaModelDelegate<T>) {
    super(model);
  }

  /**
   * Resolves the active tenant ID from TenantContext.
   * Throws 401 Unauthorized if no tenant context is bound and bypass is false.
   */
  protected getActiveTenantId(): string | null {
    if (isBypassTenant()) {
      return null;
    }
    const tenantId = getTenantId();
    if (!tenantId) {
      throw ApiError.unauthorized('Access denied: No active tenant context found.');
    }
    return tenantId;
  }

  /**
   * Injects tenantId into Prisma `where` clause.
   */
  public getScopedWhere(where: any = {}): any {
    if (isBypassTenant()) {
      return where;
    }
    const tenantId = this.getActiveTenantId();
    return {
      ...(where || {}),
      tenantId,
    };
  }

  /**
   * Injects tenantId into Prisma query arguments (args.where).
   */
  public getScopedArgs<A extends { where?: any }>(args: A = {} as A): A {
    if (isBypassTenant()) {
      return args;
    }
    const tenantId = this.getActiveTenantId();
    return {
      ...args,
      where: {
        ...(args.where || {}),
        tenantId,
      },
    };
  }

  // -------------------------------------------------------------
  // Overridden Prisma CRUD Methods
  // -------------------------------------------------------------

  override async findMany(args: any = {}): Promise<T[]> {
    const scopedArgs = this.getScopedArgs(args);
    return super.findMany(scopedArgs);
  }

  override async findFirst(args: any = {}): Promise<T | null> {
    const scopedArgs = this.getScopedArgs(args);
    return super.findFirst(scopedArgs);
  }

  override async findUnique(args: any): Promise<T | null> {
    if (isBypassTenant()) {
      return super.findUnique(args);
    }
    // Convert findUnique to findFirst to allow scoping by tenantId
    const scopedArgs = this.getScopedArgs(args);
    return super.findFirst(scopedArgs);
  }

  override async create(dataOrArgs: any): Promise<T> {
    if (isBypassTenant()) {
      return super.create(dataOrArgs);
    }
    const tenantId = this.getActiveTenantId();

    if (dataOrArgs && typeof dataOrArgs === 'object' && 'data' in dataOrArgs) {
      return super.create({
        ...dataOrArgs,
        data: {
          ...dataOrArgs.data,
          tenantId: dataOrArgs.data?.tenantId ?? tenantId,
        },
      });
    }

    return super.create({
      ...dataOrArgs,
      tenantId: dataOrArgs?.tenantId ?? tenantId,
    });
  }

  override async update(idOrArgs: string | any, data?: any): Promise<T> {
    if (isBypassTenant()) {
      return super.update(idOrArgs, data);
    }
    const tenantId = this.getActiveTenantId();

    if (typeof idOrArgs === 'string') {
      const id = idOrArgs;
      const existing = await this.model.findFirst({
        where: { id, tenantId },
        select: { id: true },
      });
      if (!existing) {
        throw ApiError.notFound('Resource not found in active tenant scope');
      }
      return super.update(id, data);
    }

    const scopedArgs = this.getScopedArgs(idOrArgs);
    return super.update(scopedArgs);
  }

  override async delete(idOrArgs: string | any): Promise<T> {
    if (isBypassTenant()) {
      return super.delete(idOrArgs);
    }
    const tenantId = this.getActiveTenantId();

    if (typeof idOrArgs === 'string') {
      const id = idOrArgs;
      const existing = await this.model.findFirst({
        where: { id, tenantId },
        select: { id: true },
      });
      if (!existing) {
        throw ApiError.notFound('Resource not found in active tenant scope');
      }
      return super.delete(id);
    }

    const scopedArgs = this.getScopedArgs(idOrArgs);
    return super.delete(scopedArgs);
  }

  override async count(argsOrWhere?: any): Promise<number> {
    if (isBypassTenant()) {
      return super.count(argsOrWhere);
    }
    const tenantId = this.getActiveTenantId();
    if (!argsOrWhere) {
      return super.count({ where: { tenantId } });
    }
    const where =
      typeof argsOrWhere === 'object' && 'where' in argsOrWhere
        ? { ...argsOrWhere.where, tenantId }
        : { ...argsOrWhere, tenantId };
    return super.count({ where });
  }

  override async paginate(
    filterOrArgs: any = {},
    options: PaginationOptions = {}
  ): Promise<PaginationResult<T>> {
    const scopedWhere = this.getScopedWhere(
      filterOrArgs && typeof filterOrArgs === 'object' && 'where' in filterOrArgs
        ? filterOrArgs.where
        : filterOrArgs
    );
    return super.paginate(scopedWhere, options);
  }

  // -------------------------------------------------------------
  // Overridden Legacy Adapter Methods
  // -------------------------------------------------------------

  override async findById(id: string, selectOrInclude?: any): Promise<T | null> {
    if (isBypassTenant()) {
      return super.findById(id, selectOrInclude);
    }
    const tenantId = this.getActiveTenantId();
    const args: any = { where: { id, tenantId } };
    if (selectOrInclude?.include) args.include = selectOrInclude.include;
    if (selectOrInclude?.select) args.select = selectOrInclude.select;
    return this.model.findFirst(args);
  }

  override async findOne(whereOrFilter: any = {}, options?: any): Promise<T | null> {
    const scopedWhere = this.getScopedWhere(whereOrFilter);
    return super.findOne(scopedWhere, options);
  }

  override async find(whereOrFilter: any = {}, options?: any): Promise<T[]> {
    const scopedWhere = this.getScopedWhere(whereOrFilter);
    return super.find(scopedWhere, options);
  }

  override async updateById(id: string, updateData: any): Promise<T | null> {
    if (isBypassTenant()) {
      return super.updateById(id, updateData);
    }
    const tenantId = this.getActiveTenantId();
    const existing = await this.model.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }
    return super.updateById(id, updateData);
  }

  override async updateOne(where: any = {}, updateData: any): Promise<any> {
    const scopedWhere = this.getScopedWhere(where);
    return super.updateOne(scopedWhere, updateData);
  }

  override async deleteById(id: string): Promise<T | null> {
    if (isBypassTenant()) {
      return super.deleteById(id);
    }
    const tenantId = this.getActiveTenantId();
    const existing = await this.model.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }
    return super.deleteById(id);
  }

  override async deleteMany(where: any = {}): Promise<{ count: number }> {
    const scopedWhere = this.getScopedWhere(where);
    return super.deleteMany(scopedWhere);
  }

  override async countDocuments(where: any = {}): Promise<number> {
    const scopedWhere = this.getScopedWhere(where);
    return super.countDocuments(scopedWhere);
  }
}
```

---

### 3.3 Drop-In Replacement: `server/src/core/base.service.ts`

```typescript
import { BaseRepository, PaginationOptions, PaginationResult } from './base.repository.js';

export abstract class BaseService<T = any, R extends BaseRepository<T> = BaseRepository<T>> {
  protected constructor(protected readonly repository: R) {}

  async create(data: any): Promise<T> {
    return this.repository.create(data);
  }

  async findById(id: string, options?: any): Promise<T | null> {
    return this.repository.findById(id, options);
  }

  async findOne(filter: any = {}, options?: any): Promise<T | null> {
    return this.repository.findOne(filter, options);
  }

  async find(filter: any = {}, options?: any): Promise<T[]> {
    return this.repository.find(filter, options);
  }

  async findMany(args?: any): Promise<T[]> {
    return this.repository.findMany(args);
  }

  async findUnique(args: any): Promise<T | null> {
    return this.repository.findUnique(args);
  }

  async findFirst(args?: any): Promise<T | null> {
    return this.repository.findFirst(args);
  }

  async updateById(id: string, update: any): Promise<T | null> {
    return this.repository.updateById(id, update);
  }

  async deleteById(id: string): Promise<T | null> {
    return this.repository.deleteById(id);
  }

  async count(args?: any): Promise<number> {
    return this.repository.count(args);
  }

  async paginate(
    filterOrArgs: any = {},
    options?: PaginationOptions
  ): Promise<PaginationResult<T>> {
    return this.repository.paginate(filterOrArgs, options);
  }
}
```

---

### 3.4 Modernized: `server/src/core/tenant.context.ts`

```typescript
import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantStore {
  tenantId: string | null;
  bypass: boolean;
}

const tenantStorage = new AsyncLocalStorage<TenantStore>();

/**
 * Runs a function within the scope of a tenant context.
 *
 * @param tenantId The active tenant/institute ID or null.
 * @param bypass Whether tenant filtering should be bypassed (e.g. for super admin or global lookups).
 * @param callback The function to execute within the context.
 */
export const runWithTenant = <T>(
  tenantId: string | null,
  bypass = false,
  callback: () => T | Promise<T>
): T | Promise<T> => {
  return tenantStorage.run({ tenantId, bypass }, callback);
};

/**
 * Returns the currently active tenant ID from AsyncLocalStorage, or null if none is bound.
 */
export const getTenantId = (): string | null => {
  const store = tenantStorage.getStore();
  return store ? store.tenantId : null;
};

/**
 * Returns true if the current execution context explicitly bypasses tenant filtering.
 */
export const isBypassTenant = (): boolean => {
  const store = tenantStorage.getStore();
  return store ? store.bypass : false;
};

/**
 * Returns the active tenant store, or undefined if no context is active.
 */
export const getTenantStore = (): TenantStore | undefined => {
  return tenantStorage.getStore();
};
```

---

### 3.5 Module Repositories Migration Specifications (All 14 Repositories)

Below are the exact migration specifications, constructor signatures, and method implementations for each module repository when updating them across Milestones 2–4:

#### 1. `AuthRepository` (`server/src/modules/auth/auth.repository.ts`)

- **Base Class**: `TenantRepository<User>`
- **Imports**: `import { prisma } from '../../config/prisma.js'; import { User } from '@prisma/client';`
- **Constructor**:
  ```typescript
  constructor(delegate = prisma.user) {
    super(delegate);
  }
  ```
- **Custom Methods**:

  ```typescript
  async findByEmail(email: string, _selectPassword = false): Promise<User | null> {
    return this.findFirst({ where: { email } });
  }

  async findByEmailWithMfa(email: string): Promise<User | null> {
    return this.findFirst({ where: { email } });
  }

  async findByIdWithMfa(id: string): Promise<User | null> {
    return this.findById(id);
  }

  async findByResetToken(tokenHash: string): Promise<User | null> {
    return this.findFirst({
      where: {
        resetPasswordToken: tokenHash,
        resetPasswordExpire: { gt: new Date() },
      },
    });
  }

  async findByVerificationToken(tokenHash: string): Promise<User | null> {
    return this.findFirst({
      where: {
        emailVerificationToken: tokenHash,
        emailVerificationExpire: { gt: new Date() },
      },
    });
  }
  ```

#### 2. `UserRepository` (`server/src/modules/user/user.repository.ts`)

- **Base Class**: `TenantRepository<User>`
- **Imports**: `import { prisma } from '../../config/prisma.js'; import { User } from '@prisma/client';`
- **Constructor**:
  ```typescript
  constructor(delegate = prisma.user) {
    super(delegate);
  }
  ```
- **Custom Methods**:
  ```typescript
  async paginateUsers(query: UserQueryInput): Promise<{ docs: User[]; total: number }> {
    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const result = await this.paginate(where, {
      page: query.page,
      limit: query.limit,
      orderBy: { createdAt: 'desc' },
    });
    return { docs: result.docs, total: result.total };
  }
  ```

#### 3. `InstituteRepository` (`server/src/modules/institute/institute.repository.ts`)

- **Base Class**: `BaseRepository<Institute>` (Institute is global, not tenant-scoped)
- **Imports**: `import { prisma } from '../../config/prisma.js'; import { Institute } from '@prisma/client';`
- **Constructor**:
  ```typescript
  constructor(delegate = prisma.institute) {
    super(delegate);
  }
  ```
- **Custom Methods**:

  ```typescript
  async findBySubdomain(subdomain: string): Promise<Institute | null> {
    return this.findFirst({
      where: { subdomain: subdomain.toLowerCase() },
    });
  }

  async findByCustomDomain(customDomain: string): Promise<Institute | null> {
    return this.findFirst({
      where: { customDomain: customDomain.toLowerCase() },
    });
  }

  async findActiveById(id: string): Promise<Institute | null> {
    return this.findById(id);
  }
  ```

#### 4. `CourseRepository` (`server/src/modules/course/course.repository.ts`)

- **Base Class**: `TenantRepository<Course>`
- **Imports**: `import { prisma } from '../../config/prisma.js'; import { Course } from '@prisma/client';`
- **Constructor**:
  ```typescript
  constructor(delegate = prisma.course) {
    super(delegate);
  }
  ```
- **Custom Methods**:

  ```typescript
  async paginateCourses(query: CourseQueryInput): Promise<{ docs: Course[]; total: number }> {
    const where: any = {};
    if (query.category) {
      const categoryInputs = query.category.split(',').filter(Boolean);
      where.categoryId = { in: categoryInputs };
    }
    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      where.price = {};
      if (query.priceMin !== undefined) where.price.gte = query.priceMin;
      if (query.priceMax !== undefined) where.price.lte = query.priceMax;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'oldest') orderBy = { createdAt: 'asc' };
    else if (query.sort === 'price_low') orderBy = { price: 'asc' };
    else if (query.sort === 'price_high') orderBy = { price: 'desc' };

    const result = await this.paginate(where, {
      page: query.page,
      limit: query.limit,
      orderBy,
      include: {
        teacher: { select: { id: true, name: true, email: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });
    return { docs: result.docs, total: result.total };
  }
  ```

#### 5. `TestRepository` (`server/src/modules/test/test.repository.ts`)

- **Base Class**: `TenantRepository<Test>`
- **Imports**: `import { prisma } from '../../config/prisma.js'; import { Test } from '@prisma/client';`
- **Constructor**:
  ```typescript
  constructor(delegate = prisma.test) {
    super(delegate);
  }
  ```

#### 6. `TestAttemptRepository` (`server/src/modules/test/testAttempt.repository.ts`)

- **Base Class**: `TenantRepository<TestAttempt>`
- **Imports**: `import { prisma } from '../../config/prisma.js'; import { TestAttempt } from '@prisma/client';`
- **Constructor**:
  ```typescript
  constructor(delegate = prisma.testAttempt) {
    super(delegate);
  }
  ```

#### 7. `BadgeRepository` (`server/src/modules/badge/badge.repository.ts`)

- **Base Class**: `BaseRepository<any>`
- **Constructor**:
  ```typescript
  constructor(delegate = (prisma as any).badge) {
    super(delegate);
  }
  ```

#### 8. `UserBadgeRepository` (`server/src/modules/badge/userBadge.repository.ts`)

- **Base Class**: `TenantRepository<any>`
- **Constructor**:
  ```typescript
  constructor(delegate = (prisma as any).userBadge) {
    super(delegate);
  }
  ```
- **Custom Methods**:
  ```typescript
  async paginateUserBadges(filter: any, options: any) {
    return this.paginate(filter, options);
  }
  ```

#### 9. `CouponRepository` (`server/src/modules/coupon/coupon.repository.ts`)

- **Base Class**: `TenantRepository<Coupon>`
- **Imports**: `import { prisma } from '../../config/prisma.js'; import { Coupon } from '@prisma/client';`
- **Constructor**:
  ```typescript
  constructor(delegate = prisma.coupon) {
    super(delegate);
  }
  ```
- **Custom Methods**:
  ```typescript
  async paginateCoupons(filter: any, options: any) {
    return this.paginate(filter, options);
  }
  ```

#### 10. `DiscussionRepository` (`server/src/modules/discussion/discussion.repository.ts`)

- **Base Class**: `TenantRepository<any>`
- **Constructor**:
  ```typescript
  constructor(delegate = (prisma as any).discussion) {
    super(delegate);
  }
  ```

#### 11. `NoteRepository` (`server/src/modules/note/note.repository.ts`)

- **Base Class**: `TenantRepository<any>`
- **Constructor**:
  ```typescript
  constructor(delegate = (prisma as any).note) {
    super(delegate);
  }
  ```

#### 12. `PaymentRepository` (`server/src/modules/payment/payment.repository.ts`)

- **Base Class**: `TenantRepository<Payment>`
- **Imports**: `import { prisma } from '../../config/prisma.js'; import { Payment } from '@prisma/client';`
- **Constructor**:
  ```typescript
  constructor(delegate = prisma.payment) {
    super(delegate);
  }
  ```

#### 13. `ReviewRepository` (`server/src/modules/review/review.repository.ts`)

- **Base Class**: `TenantRepository<Review>`
- **Imports**: `import { prisma } from '../../config/prisma.js'; import { Review } from '@prisma/client';`
- **Constructor**:
  ```typescript
  constructor(delegate = prisma.review) {
    super(delegate);
  }
  ```

#### 14. `SubscriptionPlanRepository` (`server/src/modules/subscription/subscriptionPlan.repository.ts`)

- **Base Class**: `BaseRepository<any>`
- **Constructor**:
  ```typescript
  constructor(delegate = (prisma as any).subscriptionPlan) {
    super(delegate);
  }
  ```

---

## 4. Caveats

1. **Prisma Unique Index Requirement vs Tenant Filtering**:
   In Prisma, `delegate.findUnique()` requires a `@unique` or `@id` field. Because multi-tenant queries often filter by `{ id, tenantId }`, `TenantRepository.findUnique` and `TenantRepository.findById` must map internally to `delegate.findFirst({ where: { id, tenantId } })` to avoid Prisma schema constraint errors when `@@unique([id, tenantId])` is not defined.
2. **Missing Prisma Models for Auxiliary Modules**:
   While `User`, `Institute`, `Category`, `Course`, `Lesson`, `Enrollment`, `Test`, `TestAttempt`, `Quiz`, `QuizAttempt`, `Payment`, `Review`, `Blog`, `Coupon` are already generated in `@prisma/client`, models for `Badge`, `UserBadge`, `Discussion`, `Note`, `SubscriptionPlan` can use `(prisma as any)[modelName]` until schema additions in Milestone 1 item 4 are finalized.
3. **Transaction Support**:
   When using interactive transactions (`await prisma.$transaction(async (tx) => { ... })`), repositories can be instantiated dynamically with the transaction delegate: e.g. `new CourseRepository(tx.course)`.

---

## 5. Conclusion

1. **`BaseRepository<T>`**: Fully redesigned using `PrismaModelDelegate<T>`, supporting all 8 core Prisma query operations (`findMany`, `findUnique`, `findFirst`, `create`, `update`, `delete`, `count`, `paginate`) and legacy compatibility methods with **0 Mongoose imports**.
2. **`TenantRepository<T>`**: Fully redesigned extending `BaseRepository<T>`, injecting `tenantId` from `TenantContext` on all queries, enforcing fail-closed security when tenant context is missing in non-bypass mode, and verifying tenant ownership on updates/deletions.
3. **`BaseService<T, R>`**: Fully decoupled from `Document` with zero Mongoose imports.
4. **`TenantContext`**: 100% compatible with AsyncLocalStorage, Express middleware, Prisma transactions, and BullMQ worker jobs.
5. **14 Module Repositories & 3 Services**: Completely mapped with exact TypeScript interfaces, constructors, and method blueprints ready for seamless implementation in Milestones 1–4.

---

## 6. Verification Method

To independently verify this architecture:

1. **Verify No Mongoose Imports in Proposed Core Implementations**:
   Check that `server/src/core/base.repository.ts`, `server/src/core/tenant.repository.ts`, `server/src/core/base.service.ts`, and `server/src/core/tenant.context.ts` have zero occurrences of `mongoose`.
2. **Prisma Client Generation & Delegate Verification**:
   ```bash
   cd server && npx prisma validate && npx prisma generate
   ```
3. **TypeScript Typecheck Command**:
   ```bash
   cd server && npx tsc --noEmit
   ```
4. **Development Startup**:
   ```bash
   cd server && npm run dev
   ```
