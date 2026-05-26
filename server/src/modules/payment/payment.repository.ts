import { Model } from 'mongoose';
import { TenantRepository } from '../../core/tenant.repository.js';
import { IPayment } from './payment.dto.js';
import Payment from './payment.model.js';

export class PaymentRepository extends TenantRepository<IPayment> {
  constructor(model: Model<IPayment> = Payment as Model<IPayment>) {
    super(model);
  }
}
export default PaymentRepository;
