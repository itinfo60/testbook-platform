import { Response, Request } from 'express';
import { BaseController } from '../../core/base.controller.js';
import { NoteService } from './note.service.js';
import { ApiError } from '../../core/api-error.js';

interface CustomRequest extends Request {
  userId?: string;
  tenantId?: string | null;
}

export class NoteController extends BaseController {
  private readonly noteService: NoteService;

  constructor(noteService = new NoteService()) {
    super();
    this.noteService = noteService;
  }

  getAllMyNotes = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) throw ApiError.unauthorized();
    const data = await this.noteService.getAllMyNotes(req.userId, req.query);
    return this.ok(res, data);
  });

  getNotes = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) throw ApiError.unauthorized();
    const data = await this.noteService.getNotes(req.userId, req.params.courseId, req.query);
    return this.ok(res, data);
  });

  createNote = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) throw ApiError.unauthorized();
    const note = await this.noteService.createNote(req.userId, req.params.courseId, {
      content: req.body.content,
      lessonId: req.body.lessonId,
      timestamp: req.body.timestamp,
      color: req.body.color,
    });
    return this.created(res, { note }, 'Note created');
  });

  updateNote = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) throw ApiError.unauthorized();
    const note = await this.noteService.updateNote(req.params.id, req.userId, {
      content: req.body.content,
      color: req.body.color,
      isPinned: req.body.isPinned,
    });
    return this.ok(res, { note }, 'Note updated');
  });

  deleteNote = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) throw ApiError.unauthorized();
    await this.noteService.deleteNote(req.params.id, req.userId);
    return this.ok(res, null, 'Note deleted');
  });
}

export default NoteController;
