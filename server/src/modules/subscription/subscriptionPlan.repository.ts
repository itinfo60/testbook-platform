import { Model } from 'mongoose';
import { BaseRepository } from '../../core/base.repository.js';
import { ISubscriptionPlan } from '../payment/payment.dto.js';
import SubscriptionPlan from './subscriptionPlan.model.js';

export class SubscriptionPlanRepository extends BaseRepository<ISubscriptionPlan> {
  constructor(model: Model<ISubscriptionPlan> = SubscriptionPlan as Model<ISubscriptionPlan>) {
    super(model);
  }
}
export default SubscriptionPlanRepository;
