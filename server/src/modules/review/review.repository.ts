import prisma from '../../config/prisma.js';
import { TenantRepository } from '../../core/tenant.repository.js';
import { IReview } from './review.dto.js';

export class ReviewRepository extends TenantRepository<IReview> {
  constructor(model = prisma.review) {
    super(model as any);
  }
}

export default ReviewRepository;
