import { Model } from 'mongoose';
import { TenantRepository } from '../../core/tenant.repository.js';
import { IUser } from './auth.dto.js';
import User from '../user/user.model.js';

export class AuthRepository extends TenantRepository<IUser> {
  constructor(userModel: Model<IUser> = User as Model<IUser>) {
    super(userModel);
  }

  async findByEmail(email: string, selectPassword = false): Promise<IUser | null> {
    const filter = this.getScopedFilter({ email });
    if (selectPassword) {
      return this.model.findOne(filter).select('+password').exec();
    }
    return this.model.findOne(filter).exec();
  }

  async findByEmailWithMfa(email: string): Promise<IUser | null> {
    const filter = this.getScopedFilter({ email });
    return this.model.findOne(filter).select('+password +mfaSecret +mfaBackupCodes').exec();
  }

  async findByIdWithMfa(id: string): Promise<IUser | null> {
    const filter = this.getScopedFilter({ _id: id });
    return this.model.findOne(filter).select('+mfaSecret +mfaBackupCodes').exec();
  }

  async findByResetToken(tokenHash: string): Promise<IUser | null> {
    const filter = this.getScopedFilter({
      resetPasswordToken: tokenHash,
      resetPasswordExpire: { $gt: new Date() },
    });
    return this.model.findOne(filter).exec();
  }

  async findByVerificationToken(tokenHash: string): Promise<IUser | null> {
    const filter = this.getScopedFilter({
      emailVerificationToken: tokenHash,
      emailVerificationExpire: { $gt: new Date() },
    });
    return this.model.findOne(filter).exec();
  }
}
