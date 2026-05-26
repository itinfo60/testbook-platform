import { Model } from 'mongoose';
import { TenantRepository } from '../../core/tenant.repository.js';
import { ITest } from './test.dto.js';
import Test from './test.model.js';

export class TestRepository extends TenantRepository<ITest> {
  constructor(model: Model<ITest> = Test as Model<ITest>) {
    super(model);
  }
}
export default TestRepository;
