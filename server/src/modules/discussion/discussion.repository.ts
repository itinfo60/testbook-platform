import { TenantRepository } from '../../core/tenant.repository.js';
import prisma from '../../config/prisma.js';

export class DiscussionRepository extends TenantRepository<any> {
  constructor(model = prisma.discussion) {
    super(model as any);
  }
}

export default DiscussionRepository;
