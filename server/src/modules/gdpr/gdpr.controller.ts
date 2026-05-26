import { Response, Request } from 'express';
import { BaseController } from '../../core/base.controller.js';
import { GdprService } from './gdpr.service.js';
import { ApiError } from '../../core/api-error.js';

interface CustomRequest extends Request {
  userId?: string;
  tenantId?: string | null;
}

export class GdprController extends BaseController {
  private readonly gdprService: GdprService;

  constructor(gdprService = new GdprService()) {
    super();
    this.gdprService = gdprService;
  }

  exportMyData = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }

    const payload = await this.gdprService.exportMyData(req.userId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="my-data-${req.userId}.json"`);
    return res.json(payload);
  });

  eraseMyData = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }

    const { password } = req.body;
    await this.gdprService.eraseMyData(req.userId, password);

    // Clear refresh token cookies if any
    res.clearCookie('refreshToken');

    return this.ok(res, null, 'Your data has been erased. Account deactivated.');
  });

  recordConsent = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }

    const { version = '1.0' } = req.body;
    await this.gdprService.recordConsent(req.userId, version);

    return this.ok(res, null, 'Consent recorded');
  });

  getConsentStatus = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }

    const consent = await this.gdprService.getConsentStatus(req.userId);
    return this.ok(res, { consent });
  });
}

export default GdprController;
