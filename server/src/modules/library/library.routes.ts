import { Router } from 'express';
import { LibraryController } from './library.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import validate from '../../middleware/validate-zod.js';
import { uploadMiddleware } from '../../modules/upload/upload.controller.js'; // Cloudinary upload middleware
// Define validation schemas (you can expand later)
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
router.patch(
  '/:id',
  authenticate,
  authorize('teacher', 'admin'),
  uploadMiddleware,
  controller.updateResource
);
router.delete('/:id', authenticate, authorize('teacher', 'admin'), controller.deleteResource);

// Public / student routes – optional auth (tenant resolved)
router.get('/', controller.getResources);
router.get('/:id/download', controller.downloadResource);

export default router;
