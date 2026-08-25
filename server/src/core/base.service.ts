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
