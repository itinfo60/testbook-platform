import { Model } from 'mongoose';
import { BaseRepository } from '../../core/base.repository.js';
import { IInstitute } from './institute.model.js';
import Institute from './institute.model.js';

export class InstituteRepository extends BaseRepository<IInstitute> {
  constructor(model: Model<IInstitute> = Institute as Model<IInstitute>) {
    super(model);
  }

  async findBySubdomain(subdomain: string): Promise<IInstitute | null> {
    return this.model.findOne({ subdomain: subdomain.toLowerCase(), isActive: true }).exec();
  }

  async findByCustomDomain(customDomain: string): Promise<IInstitute | null> {
    return this.model.findOne({ customDomain: customDomain.toLowerCase(), isActive: true }).exec();
  }

  async findActiveById(id: string): Promise<IInstitute | null> {
    return this.model.findOne({ _id: id, isActive: true }).exec();
  }
}
export default InstituteRepository;
