import { TenantRepository } from '../../core/tenant.repository.js';
import { ITest } from './test.dto.js';
import prisma from '../../config/prisma.js';

export class TestRepository extends TenantRepository<ITest> {
  constructor(model = prisma.test) {
    super(model as any);
  }
}
export default TestRepository;
