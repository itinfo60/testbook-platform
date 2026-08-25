import prisma from '../../config/prisma.js';
import { TenantRepository } from '../../core/tenant.repository.js';
import { IPayment } from './payment.dto.js';

export class PaymentRepository extends TenantRepository<IPayment> {
  constructor(model = prisma.payment) {
    super(model as any);
  }
}
export default PaymentRepository;
