import { Router } from 'express';
import { getPublicFaculty } from './faculty.controller.js';

const router = Router();

// Public faculty directory
router.get('/', getPublicFaculty);

export default router;
