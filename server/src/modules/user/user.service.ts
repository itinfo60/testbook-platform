import { UserRepository } from './user.repository.js';
import { IUser } from '../auth/auth.dto.js';
import { AdminCreateUserInput, AdminUpdateUserInput, UserQueryInput } from './user.validation.js';
import { ApiError } from '../../core/api-error.js';
import redis from '../../config/redis.js';
import { runWithTenant } from '../../core/tenant.context.js';

export class UserService {
  private readonly userRepository: UserRepository;

  constructor(userRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  async getUsers(query: UserQueryInput): Promise<{ docs: IUser[]; total: number }> {
    return this.userRepository.paginateUsers(query);
  }

  async getUserById(id: string): Promise<IUser> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  async createUser(input: AdminCreateUserInput, tenantId: string | null): Promise<IUser> {
    const { name, email, password, role } = input;

    // Check email uniqueness globally
    const existing = await runWithTenant(null, true, () => this.userRepository.findOne({ email }));
    if (existing) {
      throw ApiError.conflict('Email is already registered');
    }

    return runWithTenant(tenantId, tenantId === null, () =>
      this.userRepository.create({
        name,
        email,
        password,
        role,
        isEmailVerified: true, // Admin-created users are pre-verified
      })
    );
  }

  async updateUser(id: string, input: AdminUpdateUserInput): Promise<IUser> {
    const user = await this.userRepository.updateById(id, input);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    await redis.del(`user_${id}`);
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.updateById(id, { isActive: false });
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    await redis.del(`user_${id}`);
  }

  async updateUserRole(id: string, role: 'student' | 'teacher' | 'admin'): Promise<IUser> {
    const user = await this.userRepository.updateById(id, { role });
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    await redis.del(`user_${id}`);
    return user;
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<IUser> {
    const user = await this.userRepository.updateById(id, { isActive });
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    await redis.del(`user_${id}`);
    return user;
  }
}
export default UserService;
