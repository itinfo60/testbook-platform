import { Router } from 'express';
import { NoteController } from './note.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate-zod.js';
import { createNoteSchema, updateNoteSchema } from './note.validation.js';

const router = Router();
const controller = new NoteController();

router.use(authenticate);

router.get('/my', controller.getAllMyNotes);
router.get('/course/:courseId', controller.getNotes);
router.post('/course/:courseId', validate(createNoteSchema), controller.createNote);
router.put('/:id', validate(updateNoteSchema), controller.updateNote);
router.delete('/:id', controller.deleteNote);

export default router;
