import { Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import { BaseRepository } from './base.repository.js';
import { getTenantId, isBypassTenant } from './tenant.context.js';
import { ApiError } from './api-error.js';

export abstract class TenantRepository<T extends Document> extends BaseRepository<T> {
  protected getScopedFilter(filter: FilterQuery<T> = {}): FilterQuery<T> {
    if (isBypassTenant()) {
      return filter;
    }
    const tenantId = getTenantId();
    if (!tenantId) {
      throw ApiError.unauthorized('Access denied: No active tenant context found.');
    }
    return { ...filter, tenantId };
  }

  override async create(doc: Partial<T> | any): Promise<T> {
    if (!isBypassTenant()) {
      const tenantId = getTenantId();
      if (!tenantId) {
        throw ApiError.unauthorized('Access denied: No active tenant context found.');
      }
      doc.tenantId = tenantId;
    }
    return super.create(doc);
  }

  override async findById(id: string, projection?: any, options?: QueryOptions): Promise<T | null> {
    const filter = this.getScopedFilter({ _id: id } as FilterQuery<T>);
    return this.model.findOne(filter, projection, options).exec();
  }

  override async findOne(
    filter: FilterQuery<T>,
    projection?: any,
    options?: QueryOptions
  ): Promise<T | null> {
    const scopedFilter = this.getScopedFilter(filter);
    return super.findOne(scopedFilter, projection, options);
  }

  override async find(
    filter: FilterQuery<T>,
    projection?: any,
    options?: QueryOptions
  ): Promise<T[]> {
    const scopedFilter = this.getScopedFilter(filter);
    return super.find(scopedFilter, projection, options);
  }

  override async updateById(
    id: string,
    update: UpdateQuery<T>,
    options?: QueryOptions
  ): Promise<T | null> {
    const filter = this.getScopedFilter({ _id: id } as FilterQuery<T>);
    return this.model.findOneAndUpdate(filter, update, { new: true, ...options }).exec();
  }

  override async updateOne(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: QueryOptions
  ): Promise<any> {
    const scopedFilter = this.getScopedFilter(filter);
    return super.updateOne(scopedFilter, update, options);
  }

  override async deleteById(id: string, options?: QueryOptions): Promise<T | null> {
    const filter = this.getScopedFilter({ _id: id } as FilterQuery<T>);
    return this.model.findOneAndDelete(filter, options).exec();
  }

  override async deleteMany(filter: FilterQuery<T>, options?: QueryOptions): Promise<any> {
    const scopedFilter = this.getScopedFilter(filter);
    return super.deleteMany(scopedFilter, options);
  }

  override async countDocuments(filter: FilterQuery<T>): Promise<number> {
    const scopedFilter = this.getScopedFilter(filter);
    return super.countDocuments(scopedFilter);
  }
}
