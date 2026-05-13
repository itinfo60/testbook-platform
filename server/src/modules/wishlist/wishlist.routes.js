import { Router } from 'express';
import * as wishlistController from './wishlist.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', wishlistController.getWishlist);
router.post('/toggle', wishlistController.toggleWishlist);
router.get('/check/:courseId', wishlistController.checkWishlist);

export default router;
