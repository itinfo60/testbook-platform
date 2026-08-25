import { Router } from 'express';
import { LibraryController } from './library.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { uploadMiddleware } from '../../modules/upload/upload.controller.js';

const router = Router();
const controller = new LibraryController();

// Admin routes – require teacher or admin role
router.post(
  '/',
  authenticate,
  authorize('teacher', 'admin'),
  uploadMiddleware,
  controller.createResource
);
router.put(
  '/:id',
  authenticate,
  authorize('teacher', 'admin'),
  uploadMiddleware,
  controller.updateResource
);
router.patch(
  '/:id',
  authenticate,
  authorize('teacher', 'admin'),
  uploadMiddleware,
  controller.updateResource
);
router.delete('/:id', authenticate, authorize('teacher', 'admin'), controller.deleteResource);

// Public / student routes
router.get('/', controller.getResources);
router.get('/:id/download', controller.downloadResource);
router.get('/:id', controller.getResourceById);

export default router;
