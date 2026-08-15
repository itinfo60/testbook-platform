import { Request, Response, NextFunction } from 'express';
import PlatformSettings from '../../models/settings.model.js';
import { ApiResponse } from '../../core/api-response.js';
import { ApiError } from '../../core/api-error.js';
import redis from '../../config/redis.js';

export class SettingsController {
  // Public / User endpoint: Get active platform settings and banners
  async getPublicSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const cacheKey = 'platform:settings:public';
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
          return ApiResponse.ok(res, parsed, 'Platform settings retrieved from cache');
        }
      } catch (err) {
        // Redis unavailable fallback
      }

      let settings = await PlatformSettings.findOne().lean();
      if (!settings) {
        settings = (await PlatformSettings.create({})) as any;
      }

      // Filter active banners ordered by order
      const activeBanners = (settings.banners || [])
        .filter((b: any) => b.isActive)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

      const flags =
        settings.featureFlags instanceof Map
          ? Object.fromEntries(settings.featureFlags)
          : settings.featureFlags || {};

      const payload = {
        siteName: settings.siteName,
        siteLogo: settings.siteLogo,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
        maintenanceMode: settings.maintenanceMode,
        allowUserRegistration: settings.allowUserRegistration,
        allowMockPayments: settings.allowMockPayments || process.env.ALLOW_MOCK_PAYMENTS === 'true',
        currency: settings.currency,
        currencySymbol: settings.currencySymbol,
        banners: activeBanners,
        featureFlags: flags,
      };

      try {
        await redis.set(cacheKey, payload, 300);
      } catch (err) {
        // Redis write error ignored
      }

      return ApiResponse.ok(res, payload, 'Platform settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // Admin endpoint: Get full settings
  async getAdminSettings(req: Request, res: Response, next: NextFunction) {
    try {
      let settings = await PlatformSettings.findOne();
      if (!settings) {
        settings = await PlatformSettings.create({});
      }
      return ApiResponse.ok(res, settings, 'Admin settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // Admin endpoint: Update platform settings
  async updateAdminSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?._id;
      const updateData = { ...req.body, updatedBy: userId };

      let settings = await PlatformSettings.findOneAndUpdate(
        {},
        { $set: updateData },
        { new: true, upsert: true, runValidators: true }
      );

      // Invalidate cache
      try {
        await redis.del('platform:settings:public');
      } catch (err) {
        // ignore redis error
      }

      return ApiResponse.ok(res, settings, 'Platform settings updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // Admin endpoint: Add or update banner
  async updateBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const { banners } = req.body;
      if (!Array.isArray(banners)) {
        throw ApiError.badRequest('Banners must be an array');
      }

      const settings = await PlatformSettings.findOneAndUpdate(
        {},
        { $set: { banners } },
        { new: true, upsert: true }
      );

      await redis.del('platform:settings:public');
      return ApiResponse.ok(res, settings.banners, 'Banners updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new SettingsController();
