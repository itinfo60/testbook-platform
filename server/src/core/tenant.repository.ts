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
   * Alias for getScopedWhere for backward compatibility.
   */
  public getScopedFilter(filter: any = {}): any {
    return this.getScopedWhere(filter);
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
