import { Model } from 'mongoose';
import { TenantRepository } from '../../core/tenant.repository.js';
import { IReview } from './review.dto.js';
import Review from './review.model.js';

export class ReviewRepository extends TenantRepository<IReview> {
  constructor(model: Model<IReview> = Review) {
    super(model);
  }
}

export default ReviewRepository;
