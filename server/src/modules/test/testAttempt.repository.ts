import { TenantRepository } from '../../core/tenant.repository.js';
import { ITestAttempt } from './test.dto.js';
import prisma from '../../config/prisma.js';

export class TestAttemptRepository extends TenantRepository<ITestAttempt> {
  constructor(model = prisma.testAttempt) {
    super(model as any);
  }
}
export default TestAttemptRepository;
