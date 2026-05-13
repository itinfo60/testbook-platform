import { Router } from 'express';
import * as categoryController from './examCategory.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// Public
router.get('/', categoryController.getCategories);
router.get('/:slug', categoryController.getCategoryBySlug);

// Admin
router.get('/admin/list', authenticate, authorize('admin', 'super_admin'), categoryController.adminGetCategories);
router.post('/', authenticate, authorize('admin', 'super_admin'), categoryController.createCategory);
router.put('/:id', authenticate, authorize('admin', 'super_admin'), categoryController.updateCategory);
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), categoryController.deleteCategory);

export default router;
