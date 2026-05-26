import { Document } from 'mongoose';
import { BaseRepository } from './base.repository.js';

export abstract class BaseService<T extends Document, R extends BaseRepository<T>> {
  protected constructor(protected readonly repository: R) {}

  async create(doc: Partial<T> | any): Promise<T> {
    return this.repository.create(doc);
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findById(id);
  }

  async findOne(filter: any): Promise<T | null> {
    return this.repository.findOne(filter);
  }

  async find(filter: any): Promise<T[]> {
    return this.repository.find(filter);
  }

  async updateById(id: string, update: any): Promise<T | null> {
    return this.repository.updateById(id, update);
  }

  async deleteById(id: string): Promise<T | null> {
    return this.repository.deleteById(id);
  }
}
