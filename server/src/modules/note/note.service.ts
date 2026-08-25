import { NoteRepository } from './note.repository.js';
import { ICreateNoteInput, IUpdateNoteInput } from './note.dto.js';
import { ApiError } from '../../core/api-error.js';
import prisma from '../../config/prisma.js';

export class NoteService {
  private readonly noteRepository: NoteRepository;

  constructor(noteRepository = new NoteRepository()) {
    this.noteRepository = noteRepository;
  }

  async getNotes(
    userId: string,
    courseId: string,
    query: any
  ): Promise<{ docs: any[]; page: number; limit: number; total: number }> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: any = { user: userId, course: courseId };
    if (query.lessonId) filter.lesson = query.lessonId;

    const [docs, total] = await Promise.all([
      prisma.note.findMany({
        where: filter,
        skip,
        take: limit,
        orderBy: query.sort === 'timestamp' ? { timestamp: 'asc' } : { createdAt: 'desc' },
      }),
      prisma.note.count({ where: filter }),
    ]);

    return { docs, page, limit, total };
  }

  async getAllMyNotes(
    userId: string,
    query: any
  ): Promise<{ docs: any[]; page: number; limit: number; total: number }> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      prisma.note.findMany({
        where: { user: userId },
        skip,
        take: limit,
        include: { courseObj: { select: { title: true, slug: true, thumbnail: true } } },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.note.count({ where: { user: userId } }),
    ]);

    return { docs, page, limit, total };
  }

  async createNote(userId: string, courseId: string, body: ICreateNoteInput): Promise<any> {
    const userObj = await prisma.user.findUnique({ where: { id: userId } });
    const note = await prisma.note.create({
      data: {
        user: userId,
        course: courseId,
        lesson: body.lessonId,
        content: body.content,
        timestamp: body.timestamp || 0,
        color: body.color || '#FFD700',
        tenantId: userObj?.tenantId as string,
      },
    });
    return note;
  }

  async updateNote(id: string, userId: string, body: IUpdateNoteInput): Promise<any> {
    const note = await prisma.note.findFirst({ where: { id, user: userId } });
    if (!note) throw ApiError.notFound('Note not found');

    const updateData: any = {};
    if (body.content !== undefined) updateData.content = body.content;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.isPinned !== undefined) updateData.isPinned = body.isPinned;

    return prisma.note.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteNote(id: string, userId: string): Promise<void> {
    const note = await prisma.note.findFirst({ where: { id, user: userId } });
    if (!note) throw ApiError.notFound('Note not found');
    await prisma.note.delete({ where: { id } });
  }
}

export default NoteService;
