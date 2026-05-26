import { Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';

export abstract class BaseRepository<T extends Document> {
  protected constructor(protected readonly model: Model<T>) {}

  async create(doc: Partial<T> | any): Promise<T> {
    return this.model.create(doc);
  }

  async findById(id: string, projection?: any, options?: QueryOptions): Promise<T | null> {
    return this.model.findById(id, projection, options).exec();
  }

  async findOne(
    filter: FilterQuery<T>,
    projection?: any,
    options?: QueryOptions
  ): Promise<T | null> {
    return this.model.findOne(filter, projection, options).exec();
  }

  async find(filter: FilterQuery<T>, projection?: any, options?: QueryOptions): Promise<T[]> {
    return this.model.find(filter, projection, options).exec();
  }

  async updateById(id: string, update: UpdateQuery<T>, options?: QueryOptions): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, update, { new: true, ...options }).exec();
  }

  async updateOne(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: QueryOptions
  ): Promise<any> {
    return this.model.updateOne(filter, update, options).exec();
  }

  async deleteById(id: string, options?: QueryOptions): Promise<T | null> {
    return this.model.findByIdAndDelete(id, options).exec();
  }

  async deleteMany(filter: FilterQuery<T>, options?: QueryOptions): Promise<any> {
    return this.model.deleteMany(filter, options).exec();
  }

  async countDocuments(filter: FilterQuery<T>): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }
}
