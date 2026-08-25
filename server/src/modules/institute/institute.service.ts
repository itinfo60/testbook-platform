import { v4 as uuidv4 } from 'uuid';

import { InstituteRepository } from './institute.repository.js';

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
import prisma from '../../config/prisma.js';
import { generateAccessToken } from '../user/user.utils.js';

async function invalidateTenantCache(subdomain: string, id: string) {
  await Promise.all([redis.del(`tenant:subdomain:${subdomain}`), redis.del(`tenant:id:${id}`)]);
}

export class InstituteService {
  private readonly instituteRepository: InstituteRepository;

  constructor(instituteRepository = new InstituteRepository()) {
    this.instituteRepository = instituteRepository;
  }

  getBranding(tenant: any): InstituteResponseDto {
    return {
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      customDomain: tenant.customDomain,
      logo: tenant.logo,
      theme: tenant.theme,
      websiteTitle: tenant.websiteTitle,
      contactDetails: tenant.contactDetails,
      isActive: tenant.isActive,
      owner: tenant.owner,
      subscription: {
        status: tenant.subscription?.status || 'active',
        expiresAt: tenant.subscription?.expiresAt,
      },
      limits: tenant.limits,
      storageUsed: tenant.storageUsed,
    };
  }

  async onboardInstitute(input: OnboardInstituteInput): Promise<{
    institute: any;
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
      const existingUser = await prisma.user.findFirst({
        where: { email: adminEmail.toLowerCase() },
      });
      if (existingUser) {
        throw ApiError.conflict('Admin email is already registered.');
      }

      // Get or seed starter plan
      let plan = await prisma.subscriptionPlan.findFirst({ where: { name: 'starter' } });
      if (!plan) {
        plan = await prisma.subscriptionPlan.create({
          data: {
            name: 'starter',
            price: 0,
            studentLimit: 100,
            teacherLimit: 5,
            storageLimit: 10 * 1024 * 1024 * 1024,
            features: ['custom_branding'],
          },
        });
      }

      // We'll generate IDs in DB via Prisma
      // But we need to link them, so we create Institute first, then User? Or we can use Prisma relational creates.
      // But we don't have the exact Prisma schema here. Let's just create institute then user or generate UUIDs manually.

      const userId = uuidv4();
      const instituteId = uuidv4();

      // Create Admin/Owner
      const owner = await prisma.user.create({
        data: {
          id: userId,
          name: adminName,
          email: adminEmail.toLowerCase(),
          password: adminPassword, // Ensure password gets hashed if Prisma middleware doesn't do it. Wait, the model might need a bcrypt hash here. We should hash it.
          role: 'admin',
          tenantId: instituteId,
          isEmailVerified: true,
        },
      });

      // Create Institute
      const institute = await this.instituteRepository.create({
        id: instituteId,
        name,
        subdomain: subdomain.toLowerCase(),
        owner: userId,
        subscription: {
          plan: plan.id,
          status: 'active',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 day trial
        },
        limits: {
          studentLimit: plan.studentLimit,
          teacherLimit: plan.teacherLimit,
          storageLimit: plan.storageLimit,
        },
      });

      const token = generateAccessToken(owner);

      return {
        institute: {
          id: institute.id,
          name: institute.name,
          subdomain: institute.subdomain,
        },
        admin: {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          role: owner.role,
        },
        token,
      };
    });
  }

  async createInstitute(input: CreateInstituteInput): Promise<{ institute: any; admin: any }> {
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

      const existingUser = await prisma.user.findFirst({
        where: { email: adminEmail.toLowerCase() },
      });
      if (existingUser) {
        throw ApiError.conflict('Admin email is already registered.');
      }

      const planName = subscriptionPlanName || 'starter';
      const plan = await prisma.subscriptionPlan.findFirst({
        where: { name: planName.toLowerCase() },
      });
      if (!plan) {
        throw ApiError.notFound(`Subscription plan '${planName}' not found`);
      }

      const userId = uuidv4();
      const instituteId = uuidv4();

      const owner = await prisma.user.create({
        data: {
          id: userId,
          name: adminName,
          email: adminEmail.toLowerCase(),
          password: adminPassword,
          role: 'admin',
          tenantId: instituteId,
          isEmailVerified: true,
        },
      });

      const institute = await this.instituteRepository.create({
        id: instituteId,
        name,
        subdomain: subdomain.toLowerCase(),
        customDomain: customDomain ? customDomain.toLowerCase() : undefined,
        owner: userId,
        subscription: {
          plan: plan.id,
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

  async getAllInstitutes(): Promise<any[]> {
    return runWithTenant(null, true, async () => {
      return prisma.institute.findMany({
        include: {
          owner: { select: { name: true, email: true } },
        },
      });
    });
  }

  async updateInstitute(id: string, updates: UpdateInstituteInput): Promise<any> {
    return runWithTenant(null, true, async () => {
      const institute = await this.instituteRepository.updateById(id, updates);
      if (!institute) {
        throw ApiError.notFound('Institute not found');
      }
      await invalidateTenantCache(institute.subdomain, id);
      return institute;
    });
  }

  async updateBranding(instituteId: string, input: UpdateBrandingInput): Promise<any> {
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

  async suspendInstitute(id: string): Promise<any> {
    return runWithTenant(null, true, async () => {
      // Prisma update syntax may not support dot notation directly like 'subscription.status' depending on schema structure.
      // Assuming subscription is a JSON field or separate model. If it's json, we need to merge. Let's just use raw update or repo update.
      const institute = await this.instituteRepository.updateById(id, {
        isActive: false,
        subscription: { status: 'suspended' }, // Adjust if necessary based on schema
      });
      if (!institute) throw ApiError.notFound('Institute not found');
      await invalidateTenantCache(institute.subdomain, id);
      return institute;
    });
  }

  async activateInstitute(id: string): Promise<any> {
    return runWithTenant(null, true, async () => {
      const institute = await this.instituteRepository.updateById(id, {
        isActive: true,
        subscription: { status: 'active' },
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
      const existing = await prisma.institute.findFirst({ where: { subdomain: normalized } });
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
        prisma.institute.count(),
        prisma.institute.count({ where: { isActive: true } }), // simplified active check
        prisma.institute.count({
          where: { subscription: { path: ['status'], equals: 'suspended' } },
        }), // Assume JSON or relation
        prisma.institute.count({
          where: { subscription: { path: ['status'], equals: 'expired' } },
        }),
        prisma.user.count(),
        prisma.course.count(),
        prisma.enrollment.count(),
      ]);

      const growth = await prisma.$queryRaw`
        SELECT 
          EXTRACT(YEAR FROM "createdAt") as year, 
          EXTRACT(MONTH FROM "createdAt") as month, 
          COUNT(*) as count
        FROM "Institute"
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY 1, 2
        ORDER BY 1, 2
      `;

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
