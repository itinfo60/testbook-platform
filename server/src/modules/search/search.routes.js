import { Router } from 'express';
import * as searchController from './search.controller.js';

const router = Router();

// Public global search
router.get('/', searchController.globalSearch);

export default router;
