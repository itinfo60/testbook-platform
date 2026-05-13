import { Router } from 'express';
import * as noteController from './note.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/my', noteController.getAllMyNotes);
router.get('/course/:courseId', noteController.getNotes);
router.post('/course/:courseId', noteController.createNote);
router.put('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

export default router;
