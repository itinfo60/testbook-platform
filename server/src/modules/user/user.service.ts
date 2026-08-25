import { UserRepository } from './user.repository.js';
import { IUser } from '../auth/auth.dto.js';
import { AdminCreateUserInput, AdminUpdateUserInput, UserQueryInput } from './user.validation.js';
import { ApiError } from '../../core/api-error.js';
import redis from '../../config/redis.js';
import prisma from '../../config/prisma.js';
import { runWithTenant } from '../../core/tenant.context.js';

export class UserService {
  private readonly userRepository: UserRepository;

  constructor(userRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  async getUsers(query: UserQueryInput): Promise<{ docs: IUser[]; total: number }> {
    return this.userRepository.paginateUsers(query);
  }

  async getUserById(id: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        avatar: true,
        bio: true,
        phone: true,
        teacherProfile: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const [enrollments, testAttempts, quizAttempts, payments] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId: user.id },
        include: {
          course: {
            select: { id: true, title: true, slug: true, thumbnail: true, price: true },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      }),
      prisma.testAttempt.findMany({
        where: { userId: user.id },
        include: {
          test: {
            select: { id: true, title: true, totalMarks: true, duration: true },
          },
        },
        orderBy: { startedAt: 'desc' },
      }),
      prisma.quizAttempt.findMany({
        where: { userId: user.id },
        include: {
          quiz: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalSpent = payments
      .filter((p) => p.status === 'completed')
      .reduce((acc, p) => acc + p.amount, 0);
    const completedCoursesCount = enrollments.filter(
      (e) => e.status === 'completed' || e.progressPercentage >= 100
    ).length;

    const stats = {
      totalEnrolled: enrollments.length,
      completedCourses: completedCoursesCount,
      testsAttempted: testAttempts.length,
      quizzesAttempted: quizAttempts.length,
      totalSpent,
    };

    return {
      ...user,
      enrollments,
      testAttempts,
      quizAttempts,
      payments,
      stats,
    };
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
