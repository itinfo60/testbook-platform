import { TenantRepository } from '../../core/tenant.repository.js';
import { IUser } from './auth.dto.ts';
import prisma from '../../config/prisma.js';

export class AuthRepository extends TenantRepository<IUser> {
  constructor(userModel = prisma.user) {
    super(userModel as any);
  }

  async findByEmail(email: string, selectPassword = false): Promise<IUser | null> {
    const filter = this.getScopedFilter({ email });
    const args: any = { where: filter };
    if (selectPassword) {
      args.select = {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        isActive: true,
        tenantId: true,
      };
    }
    return this.model.findFirst(args);
  }

  async findByEmailWithMfa(email: string): Promise<IUser | null> {
    const filter = this.getScopedFilter({ email });
    // Prisma returns all fields by default, so we don't need to select sensitive fields explicitly
    return this.model.findFirst({ where: filter });
  }

  async findByIdWithMfa(id: string): Promise<IUser | null> {
    const filter = this.getScopedFilter({ id });
    return this.model.findFirst({ where: filter });
  }

  async findByResetToken(tokenHash: string): Promise<IUser | null> {
    const filter = this.getScopedFilter({
      resetPasswordToken: tokenHash,
      resetPasswordExpire: { gt: new Date() },
    });
    return this.model.findFirst({ where: filter });
  }

  async findByVerificationToken(tokenHash: string): Promise<IUser | null> {
    const filter = this.getScopedFilter({
      emailVerificationToken: tokenHash,
      emailVerificationExpire: { gt: new Date() },
    });
    return this.model.findFirst({ where: filter });
  }
}
