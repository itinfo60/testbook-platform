import { InstituteRepository } from './institute.repository.js';
import { IInstitute } from './institute.model.js';
import {
  OnboardInstituteInput,
  CreateInstituteInput,
  UpdateInstituteInput,
  UpdateBrandingInput,
} from './institute.validation.js';
import { InstituteResponseDto } from './institute.dto.js';
import { ApiError } from '../../core/api-error.js';
import { runWithTenant } from '../../core/tenant.context.js';
import redis from '../../config/redis.js';
import User from '../user/user.model.js';
import Course from '../course/course.model.js';
import Enrollment from '../enrollment/enrollment.model.js';
import SubscriptionPlan from '../subscription/subscriptionPlan.model.js';

async function invalidateTenantCache(subdomain: string, id: string) {
  await Promise.all([redis.del(`tenant:subdomain:${subdomain}`), redis.del(`tenant:id:${id}`)]);
}

export class InstituteService {
  private readonly instituteRepository: InstituteRepository;

  constructor(instituteRepository = new InstituteRepository()) {
    this.instituteRepository = instituteRepository;
  }

  getBranding(tenant: IInstitute): InstituteResponseDto {
    return {
      id: tenant._id.toString(),
      name: tenant.name,
      subdomain: tenant.subdomain,
      customDomain: tenant.customDomain,
      logo: tenant.logo,
      theme: tenant.theme,
      websiteTitle: tenant.websiteTitle,
      contactDetails: tenant.contactDetails,
      isActive: tenant.isActive,
      owner: tenant.owner.toString(),
      subscription: {
        status: tenant.subscription.status,
        expiresAt: tenant.subscription.expiresAt,
      },
      limits: tenant.limits,
      storageUsed: tenant.storageUsed,
    };
  }

  async onboardInstitute(input: OnboardInstituteInput): Promise<{
    institute: Partial<IInstitute>;
    admin: any;
    token: string;
  }> {
    const { name, subdomain, adminName, adminEmail, adminPassword } = input;

    return runWithTenant(null, true, async () => {
      // Check subdomain availability
      const existing = await this.instituteRepository.findBySubdomain(subdomain);
      if (existing) {
        throw ApiError.conflict('This subdomain is already taken.');
      }

      // Check if admin email exists globally
      const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
      if (existingUser) {
        throw ApiError.conflict('Admin email is already registered.');
      }

      // Get or seed starter plan
      let plan = await SubscriptionPlan.findOne({ name: 'starter' });
      if (!plan) {
        plan = await SubscriptionPlan.create({
          name: 'starter',
          price: 0,
          studentLimit: 100,
          teacherLimit: 5,
          storageLimit: 10 * 1024 * 1024 * 1024,
          features: ['custom_branding'],
        });
      }

      const userId = new User()._id;
      const instituteId = this.instituteRepository.createObjectId
        ? new (this.instituteRepository as any).model()._id
        : new User()._id;
      // Safe fallback for id generation:
      const safeInstId = new User()._id;

      // Create Admin/Owner
      const owner = await User.create({
        _id: userId,
        name: adminName,
        email: adminEmail.toLowerCase(),
        password: adminPassword,
        role: 'admin',
        tenantId: safeInstId,
        isEmailVerified: true,
      });

      // Create Institute
      const institute = await this.instituteRepository.create({
        _id: safeInstId,
        name,
        subdomain: subdomain.toLowerCase(),
        owner: userId,
        subscription: {
          plan: plan._id,
          status: 'active',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 day trial
        },
        limits: {
          studentLimit: plan.studentLimit,
          teacherLimit: plan.teacherLimit,
          storageLimit: plan.storageLimit,
        },
      });

      const token = owner.generateAccessToken();

      return {
        institute: {
          _id: institute._id,
          name: institute.name,
          subdomain: institute.subdomain,
        },
        admin: {
          _id: owner._id,
          name: owner.name,
          email: owner.email,
          role: owner.role,
        },
        token,
      };
    });
  }

  async createInstitute(
    input: CreateInstituteInput
  ): Promise<{ institute: IInstitute; admin: any }> {
    const {
      name,
      subdomain,
      customDomain,
      adminName,
      adminEmail,
      adminPassword,
      subscriptionPlanName,
    } = input;

    return runWithTenant(null, true, async () => {
      const existingSubdomain = await this.instituteRepository.findBySubdomain(subdomain);
      if (existingSubdomain) {
        throw ApiError.conflict('Subdomain is already taken.');
      }

      const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
      if (existingUser) {
        throw ApiError.conflict('Admin email is already registered.');
      }

      const planName = subscriptionPlanName || 'starter';
      const plan = await SubscriptionPlan.findOne({ name: planName.toLowerCase() });
      if (!plan) {
        throw ApiError.notFound(`Subscription plan '${planName}' not found`);
      }

      const userId = new User()._id;
      const instituteId = new User()._id;

      const owner = await User.create({
        _id: userId,
        name: adminName,
        email: adminEmail.toLowerCase(),
        password: adminPassword,
        role: 'admin',
        tenantId: instituteId,
        isEmailVerified: true,
      });

      const institute = await this.instituteRepository.create({
        _id: instituteId,
        name,
        subdomain: subdomain.toLowerCase(),
        customDomain: customDomain ? customDomain.toLowerCase() : undefined,
        owner: userId,
        subscription: {
          plan: plan._id,
          status: 'active',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
        limits: {
          studentLimit: plan.studentLimit,
          teacherLimit: plan.teacherLimit,
          storageLimit: plan.storageLimit,
        },
      });

      return { institute, admin: owner };
    });
  }

  async getAllInstitutes(): Promise<IInstitute[]> {
    return runWithTenant(null, true, async () => {
      return this.instituteRepository.find(
        {},
        {},
        {
          populate: [
            { path: 'owner', select: 'name email' },
            { path: 'subscription.plan', select: 'name' },
          ],
        }
      );
    });
  }

  async updateInstitute(id: string, updates: UpdateInstituteInput): Promise<IInstitute> {
    return runWithTenant(null, true, async () => {
      const institute = await this.instituteRepository.updateById(id, updates);
      if (!institute) {
        throw ApiError.notFound('Institute not found');
      }
      await invalidateTenantCache(institute.subdomain, id);
      return institute;
    });
  }

  async updateBranding(instituteId: string, input: UpdateBrandingInput): Promise<IInstitute> {
    return runWithTenant(null, true, async () => {
      const institute = await this.instituteRepository.updateById(instituteId, input);
      if (!institute) {
        throw ApiError.notFound('Institute not found');
      }
      await invalidateTenantCache(institute.subdomain, instituteId);
      return institute;
    });
  }

  async deleteInstitute(id: string): Promise<void> {
    return runWithTenant(null, true, async () => {
      const institute = await this.instituteRepository.updateById(id, { isActive: false });
      if (!institute) {
        throw ApiError.notFound('Institute not found');
      }
      await invalidateTenantCache(institute.subdomain, id);
    });
  }

  async suspendInstitute(id: string): Promise<IInstitute> {
    return runWithTenant(null, true, async () => {
      const institute = await this.instituteRepository.updateById(id, {
        isActive: false,
        'subscription.status': 'suspended',
      });
      if (!institute) throw ApiError.notFound('Institute not found');
      await invalidateTenantCache(institute.subdomain, id);
      return institute;
    });
  }

  async activateInstitute(id: string): Promise<IInstitute> {
    return runWithTenant(null, true, async () => {
      const institute = await this.instituteRepository.updateById(id, {
        isActive: true,
        'subscription.status': 'active',
      });
      if (!institute) throw ApiError.notFound('Institute not found');
      await invalidateTenantCache(institute.subdomain, id);
      return institute;
    });
  }

  async checkSubdomain(
    subdomain: string
  ): Promise<{ available: boolean; reason?: string; subdomain: string }> {
    const normalized = subdomain.toLowerCase().trim();

    if (!/^[a-z0-9-]{3,50}$/.test(normalized)) {
      return {
        available: false,
        subdomain: normalized,
        reason: 'Subdomain must be 3-50 lowercase alphanumeric chars or hyphens',
      };
    }

    const reserved = [
      'www',
      'api',
      'admin',
      'app',
      'mail',
      'ftp',
      'dashboard',
      'staging',
      'dev',
      'test',
    ];
    if (reserved.includes(normalized)) {
      return { available: false, subdomain: normalized, reason: 'This subdomain is reserved' };
    }

    return runWithTenant(null, true, async () => {
      const existing = await this.instituteRepository.findOne({ subdomain: normalized });
      return { available: !existing, subdomain: normalized };
    });
  }

  async getSuperAdminStats(): Promise<any> {
    return runWithTenant(null, true, async () => {
      const [
        totalInstitutes,
        activeInstitutes,
        suspendedInstitutes,
        expiredInstitutes,
        totalUsers,
        totalCourses,
        totalEnrollments,
      ] = await Promise.all([
        this.instituteRepository.countDocuments({}),
        this.instituteRepository.countDocuments({
          isActive: true,
          'subscription.status': 'active',
        }),
        this.instituteRepository.countDocuments({ 'subscription.status': 'suspended' }),
        this.instituteRepository.countDocuments({ 'subscription.status': 'expired' }),
        User.countDocuments({}),
        Course.countDocuments({}),
        Enrollment.countDocuments({}),
      ]);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const growth = await (this.instituteRepository as any).model.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      return {
        institutes: {
          total: totalInstitutes,
          active: activeInstitutes,
          suspended: suspendedInstitutes,
          expired: expiredInstitutes,
        },
        users: totalUsers,
        courses: totalCourses,
        enrollments: totalEnrollments,
        growth,
      };
    });
  }
}
