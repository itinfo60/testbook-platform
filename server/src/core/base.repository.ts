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
