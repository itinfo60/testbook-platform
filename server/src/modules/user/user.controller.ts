import { Response } from 'express';
import { BaseController } from '../../core/base.controller.js';
import { UserService } from './user.service.js';
import { CustomRequest } from '../auth/auth.controller.js';
import redis from '../../config/redis.js';

export class UserController extends BaseController {
  private readonly userService: UserService;

  constructor(userService = new UserService()) {
    super();
    this.userService = userService;
  }

  getUsers = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const result = await this.userService.getUsers(req.query as any);
    return this.paginated(res, {
      docs: result.docs,
      page: (req.query.page as string) || '1',
      limit: (req.query.limit as string) || '10',
      total: result.total,
    });
  });

  getUserById = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const user = await this.userService.getUserById(req.params.id);
    return this.ok(res, { user });
  });

  createUser = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const user = await this.userService.createUser(req.body, req.tenantId || null);
    return this.created(res, { user }, 'User created successfully');
  });

  updateUser = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const user = await this.userService.updateUser(req.params.id, req.body);
    return this.ok(res, { user }, 'User updated successfully');
  });

  deleteUser = this.catchAsync(async (req: CustomRequest, res: Response) => {
    await this.userService.deleteUser(req.params.id);
    // Bust the per-tenant dashboard cache so stats update immediately
    const tenantId = req.tenantId || 'global';
    await redis.del(`admin:dashboard:${tenantId}`);
    return this.noContent(res);
  });

  updateUserRole = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const user = await this.userService.updateUserRole(req.params.id, req.body.role);
    return this.ok(res, { user }, 'User role updated successfully');
  });

  updateUserStatus = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const user = await this.userService.updateUserStatus(req.params.id, req.body.isActive);
    return this.ok(res, { user }, 'User status updated successfully');
  });
}
export default UserController;
