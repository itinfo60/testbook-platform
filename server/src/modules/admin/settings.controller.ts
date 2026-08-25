import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../core/api-response.js';

let inMemorySettings = {
  siteName: 'CivicsHub Platform',
  siteLogo: '',
  supportEmail: 'support@civicshub.com',
  supportPhone: '',
  maintenanceMode: false,
  allowUserRegistration: true,
  allowMockPayments: process.env.ALLOW_MOCK_PAYMENTS === 'true',
  currency: 'INR',
  currencySymbol: '₹',
  banners: [],
  featureFlags: {},
};

export class SettingsController {
  // Public / User endpoint: Get active platform settings and banners
  async getPublicSettings(req: Request, res: Response, next: NextFunction) {
    try {
      return ApiResponse.ok(res, inMemorySettings, 'Platform settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // Admin endpoint: Get full settings
  async getAdminSettings(req: Request, res: Response, next: NextFunction) {
    try {
      return ApiResponse.ok(res, inMemorySettings, 'Admin settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // Admin endpoint: Update platform settings
  async updateAdminSettings(req: Request, res: Response, next: NextFunction) {
    try {
      inMemorySettings = { ...inMemorySettings, ...req.body };
      return ApiResponse.ok(res, inMemorySettings, 'Platform settings updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // Admin endpoint: Add or update banner
  async updateBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const { banners } = req.body;
      inMemorySettings.banners = banners;
      return ApiResponse.ok(res, inMemorySettings.banners, 'Banners updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new SettingsController();
