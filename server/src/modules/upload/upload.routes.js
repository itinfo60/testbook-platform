import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  uploadMiddleware,
  uploadImage,
  uploadVideo,
  uploadDocument,
  deleteFile,
} from './upload.controller.js';
import { uploadLimiter } from '../../middleware/rateLimiter.js';
import { checkStorageLimit } from '../../middleware/tenant.middleware.js';

const router = Router();

router.use(authenticate, uploadLimiter);

router.post('/image', checkStorageLimit, uploadMiddleware, uploadImage);
router.post(
  '/video',
  authorize('teacher', 'admin', 'super_admin'),
  checkStorageLimit,
  uploadMiddleware,
  uploadVideo
);
router.post('/document', checkStorageLimit, uploadMiddleware, uploadDocument);
router.delete('/:publicId', authorize('teacher', 'admin', 'super_admin'), deleteFile);

export default router;
