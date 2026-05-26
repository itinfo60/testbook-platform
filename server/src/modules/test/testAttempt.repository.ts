import { Model } from 'mongoose';
import { TenantRepository } from '../../core/tenant.repository.js';
import { ITestAttempt } from './test.dto.js';
import TestAttempt from './testAttempt.model.js';

export class TestAttemptRepository extends TenantRepository<ITestAttempt> {
  constructor(model: Model<ITestAttempt> = TestAttempt as Model<ITestAttempt>) {
    super(model);
  }
}
export default TestAttemptRepository;
