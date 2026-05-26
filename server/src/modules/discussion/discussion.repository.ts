import { Model } from 'mongoose';
import { TenantRepository } from '../../core/tenant.repository.js';
import { IDiscussion } from './discussion.dto.js';
import Discussion from './discussion.model.js';

export class DiscussionRepository extends TenantRepository<IDiscussion> {
  constructor(model: Model<IDiscussion> = Discussion) {
    super(model);
  }
}

export default DiscussionRepository;
