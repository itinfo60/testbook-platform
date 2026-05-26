import Note from './note.model.js';
import { NoteRepository } from './note.repository.js';
import { INote, ICreateNoteInput, IUpdateNoteInput } from './note.dto.js';
import { ApiError } from '../../core/api-error.js';
import { buildPaginationQuery } from '../../utils/pagination.js';

export class NoteService {
  private readonly noteRepository: NoteRepository;

  constructor(noteRepository = new NoteRepository()) {
    this.noteRepository = noteRepository;
  }

  async getNotes(
    userId: string,
    courseId: string,
    query: any
  ): Promise<{ docs: INote[]; page: number; limit: number; total: number }> {
    const pagination = buildPaginationQuery(query);
    const filter: any = { user: userId, course: courseId };
    if (query.lessonId) filter.lesson = query.lessonId;

    const result = await (Note as any).paginate(filter, {
      ...pagination,
      sort: query.sort === 'timestamp' ? 'timestamp' : '-createdAt',
    });

    return {
      docs: result.docs,
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
    };
  }

  async getAllMyNotes(
    userId: string,
    query: any
  ): Promise<{ docs: INote[]; page: number; limit: number; total: number }> {
    const pagination = buildPaginationQuery(query);

    const result = await (Note as any).paginate(
      { user: userId },
      {
        ...pagination,
        populate: { path: 'course', select: 'title slug thumbnail' },
        sort: '-updatedAt',
      }
    );

    return {
      docs: result.docs,
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
    };
  }

  async createNote(userId: string, courseId: string, body: ICreateNoteInput): Promise<INote> {
    const note = await this.noteRepository.create({
      user: userId,
      course: courseId,
      lesson: body.lessonId,
      content: body.content,
      timestamp: body.timestamp || 0,
      color: body.color || '#FFD700',
    });
    return note;
  }

  async updateNote(id: string, userId: string, body: IUpdateNoteInput): Promise<INote> {
    const note = await this.noteRepository.findOne({ _id: id, user: userId });
    if (!note) {
      throw ApiError.notFound('Note not found');
    }

    if (body.content !== undefined) note.content = body.content;
    if (body.color !== undefined) note.color = body.color;
    if (body.isPinned !== undefined) note.isPinned = body.isPinned;

    await note.save();
    return note;
  }

  async deleteNote(id: string, userId: string): Promise<void> {
    const note = await this.noteRepository.findOne({ _id: id, user: userId });
    if (!note) {
      throw ApiError.notFound('Note not found');
    }
    await this.noteRepository.deleteById(id);
  }
}

export default NoteService;
