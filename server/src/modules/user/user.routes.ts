import { Router } from 'express';
import { UserController } from './user.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import validate from '../../middleware/validate-zod.js';
import {
  adminCreateUserSchema,
  adminUpdateUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  userQuerySchema,
} from './user.validation.js';

const router = Router();
const controller = new UserController();

// All routes require user authentication and admin or super_admin permissions
router.use(authenticate, authorize('admin', 'super_admin'));

router.get('/', validate(userQuerySchema, 'query'), controller.getUsers);
router.post('/', validate(adminCreateUserSchema, 'body'), controller.createUser);
router.get('/:id', controller.getUserById);
router.put('/:id', validate(adminUpdateUserSchema, 'body'), controller.updateUser);
router.delete('/:id', controller.deleteUser);

router.patch('/:id/role', validate(updateUserRoleSchema, 'body'), controller.updateUserRole);
router.patch('/:id/status', validate(updateUserStatusSchema, 'body'), controller.updateUserStatus);

export default router;
