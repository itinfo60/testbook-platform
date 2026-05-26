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

const router = Router();

router.use(authenticate, uploadLimiter);

router.post('/image', uploadMiddleware, uploadImage);
router.post('/video', authorize('teacher', 'admin', 'super_admin'), uploadMiddleware, uploadVideo);
router.post('/document', uploadMiddleware, uploadDocument);
router.delete('/:publicId', authorize('teacher', 'admin', 'super_admin'), deleteFile);

export default router;
