import { Request, Response } from 'express';
import { BaseController } from '../../core/base.controller.js';
import { InstituteService } from './institute.service.js';
import { ApiError } from '../../core/api-error.js';

interface CustomRequest extends Request {
  tenantId?: string | null;
  tenant?: any;
}

export class InstituteController extends BaseController {
  private readonly instituteService: InstituteService;

  constructor(instituteService = new InstituteService()) {
    super();
    this.instituteService = instituteService;
  }

  getBranding = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.tenant) {
      return this.ok(
        res,
        {
          name: 'CivicsHub Platform',
          logo: '',
          primaryColor: '#f59e0b',
          secondaryColor: '#ea580c',
          domain: 'localhost',
        },
        'Default branding configuration'
      );
    }
    const result = this.instituteService.getBranding(req.tenant);
    return this.ok(res, result, 'Branding configuration retrieved');
  });

  onboardInstitute = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const result = await this.instituteService.onboardInstitute(req.body);
    return this.created(res, result, 'Institute onboarded successfully');
  });

  createInstitute = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const result = await this.instituteService.createInstitute(req.body);
    return this.created(res, result, 'Institute created successfully');
  });

  getAllInstitutes = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const institutes = await this.instituteService.getAllInstitutes();
    return this.ok(res, { institutes });
  });

  updateInstitute = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const institute = await this.instituteService.updateInstitute(req.params.id, req.body);
    return this.ok(res, { institute }, 'Institute updated successfully');
  });

  updateBranding = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.tenantId) {
      throw ApiError.badRequest('No active institute context.');
    }
    const institute = await this.instituteService.updateBranding(req.tenantId, req.body);
    return this.ok(res, { institute }, 'Branding updated successfully');
  });

  deleteInstitute = this.catchAsync(async (req: CustomRequest, res: Response) => {
    await this.instituteService.deleteInstitute(req.params.id);
    return this.ok(res, null, 'Institute deactivated successfully');
  });

  checkSubdomain = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const result = await this.instituteService.checkSubdomain(req.params.subdomain);
    return this.ok(res, result);
  });

  suspendInstitute = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const institute = await this.instituteService.suspendInstitute(req.params.id);
    return this.ok(res, { institute }, 'Institute suspended');
  });

  activateInstitute = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const institute = await this.instituteService.activateInstitute(req.params.id);
    return this.ok(res, { institute }, 'Institute activated');
  });

  getSuperAdminStats = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const stats = await this.instituteService.getSuperAdminStats();
    return this.ok(res, stats, 'Platform stats retrieved');
  });
}
export default InstituteController;
