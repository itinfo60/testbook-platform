import { v4 as uuidv4 } from 'uuid';
import { DiscussionRepository } from './discussion.repository.js';
import {
  ICreateDiscussionInput,
  IUpdateDiscussionInput,
  ICreateReplyInput,
} from './discussion.dto.js';
import { ApiError } from '../../core/api-error.js';
import prisma from '../../config/prisma.js';

function mapDiscussion(d: any) {
  if (!d) return d;
  return {
    ...d,
    _id: d.id,
    user: d.user || { id: d.userId, name: 'User' },
    userId: d.userId,
    course: d.courseId,
    courseId: d.courseId,
    replies: Array.isArray(d.replies) ? d.replies : [],
    likes: Array.isArray(d.likes) ? d.likes : [],
  };
}

export class DiscussionService {
  private readonly discussionRepository: DiscussionRepository;

  constructor(discussionRepository = new DiscussionRepository()) {
    this.discussionRepository = discussionRepository;
  }

  private async resolveCourseId(courseIdOrSlug: string): Promise<string> {
    const course = await prisma.course.findFirst({
      where: { OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }] },
      select: { id: true },
    });
    return course ? course.id : courseIdOrSlug;
  }

  async getDiscussions(courseIdOrSlug: string, query: any): Promise<any> {
    const courseId = await this.resolveCourseId(courseIdOrSlug);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { courseId };
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.isResolved !== undefined) {
      where.isResolved = query.isResolved === 'true';
    }

    const [rawDocs, total] = await Promise.all([
      prisma.discussion.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true, role: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.discussion.count({ where }),
    ]);

    const docs = rawDocs.map(mapDiscussion);
    return { docs, discussions: docs, page, limit, total };
  }

  async createDiscussion(
    userId: string,
    userRole: string,
    courseIdOrSlug: string,
    body: ICreateDiscussionInput
  ): Promise<any> {
    const courseId = await this.resolveCourseId(courseIdOrSlug);

    if (userRole === 'student') {
      const enrollment = await prisma.enrollment.findFirst({
        where: { userId, courseId, status: { in: ['active', 'completed'] } },
      });
      if (!enrollment) {
        throw ApiError.forbidden('You must be enrolled to participate in discussions');
      }
    }

    const raw = await prisma.discussion.create({
      data: {
        userId,
        courseId,
        title: (body.title || '').trim() || body.content.split('\n')[0].slice(0, 200),
        content: body.content,
        tags: body.tags || [],
        likes: [],
        replies: [],
      },
      include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
    });

    return mapDiscussion(raw);
  }

  async updateDiscussion(id: string, userId: string, body: IUpdateDiscussionInput): Promise<any> {
    const discussion = await prisma.discussion.findUnique({ where: { id } });
    if (!discussion) throw ApiError.notFound('Discussion not found');
    if (discussion.userId !== userId)
      throw ApiError.forbidden('Only the author can edit this discussion');

    const raw = await prisma.discussion.update({
      where: { id },
      data: { title: body.title, content: body.content, tags: body.tags },
      include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
    });

    return mapDiscussion(raw);
  }

  async addReply(id: string, userId: string, body: ICreateReplyInput): Promise<any> {
    const discussion = await prisma.discussion.findUnique({ where: { id } });
    if (!discussion) throw ApiError.notFound('Discussion not found');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatar: true, role: true },
    });

    const replies: any = Array.isArray(discussion.replies) ? [...discussion.replies] : [];

    const newReply = {
      id: uuidv4(),
      userId,
      user: userId,
      userName: user?.name || 'User',
      userAvatar: user?.avatar,
      userRole: user?.role || 'student',
      content: body.content,
      likes: [],
      createdAt: new Date().toISOString(),
    };
    replies.push(newReply);

    await prisma.discussion.update({ where: { id }, data: { replies } });

    return newReply;
  }

  async updateReply(
    id: string,
    replyId: string,
    userId: string,
    body: ICreateReplyInput
  ): Promise<any> {
    const discussion = await prisma.discussion.findUnique({ where: { id } });
    if (!discussion) throw ApiError.notFound('Discussion not found');

    const replies: any[] = Array.isArray(discussion.replies) ? [...discussion.replies] : [];
    const replyIndex = replies.findIndex((r) => r.id === replyId);
    if (replyIndex === -1) throw ApiError.notFound('Reply not found');
    if (replies[replyIndex].userId !== userId && replies[replyIndex].user !== userId)
      throw ApiError.forbidden('Only the author can edit this reply');

    replies[replyIndex].content = body.content;
    replies[replyIndex].updatedAt = new Date().toISOString();

    await prisma.discussion.update({ where: { id }, data: { replies } });
    return replies[replyIndex];
  }

  async toggleLike(id: string, userId: string): Promise<{ isLiked: boolean; likeCount: number }> {
    const discussion = await prisma.discussion.findUnique({ where: { id } });
    if (!discussion) throw ApiError.notFound('Discussion not found');

    let likes: string[] = Array.isArray(discussion.likes) ? [...discussion.likes] : [];
    const likeIndex = likes.indexOf(userId);
    const isLiked = likeIndex === -1;

    if (isLiked) {
      likes.push(userId);
    } else {
      likes.splice(likeIndex, 1);
    }

    await prisma.discussion.update({ where: { id }, data: { likes } });
    return { isLiked, likeCount: likes.length };
  }

  async toggleResolved(id: string, userId: string, userRole: string): Promise<boolean> {
    const discussion = await prisma.discussion.findUnique({ where: { id } });
    if (!discussion) throw ApiError.notFound('Discussion not found');

    const isAuthor = discussion.userId === userId;
    const isStaff = ['teacher', 'admin', 'super_admin'].includes(userRole);

    if (!isAuthor && !isStaff)
      throw ApiError.forbidden('Not authorized to resolve this discussion');

    const updated = await prisma.discussion.update({
      where: { id },
      data: { isResolved: !discussion.isResolved },
    });
    return updated.isResolved;
  }

  async deleteDiscussion(id: string, userId: string, userRole: string): Promise<void> {
    const discussion = await prisma.discussion.findUnique({ where: { id } });
    if (!discussion) throw ApiError.notFound('Discussion not found');

    const isOwner = discussion.userId === userId;
    const isAdmin = ['admin', 'super_admin'].includes(userRole);
    const isCourseTeacher = await prisma.course.findFirst({
      where: { id: discussion.courseId, teacherId: userId },
    });

    if (!isOwner && !isAdmin && !isCourseTeacher)
      throw ApiError.forbidden('Not authorized to delete this discussion');

    await prisma.discussion.delete({ where: { id } });
  }

  async deleteReply(id: string, replyId: string, userId: string, userRole: string): Promise<void> {
    const discussion = await prisma.discussion.findUnique({ where: { id } });
    if (!discussion) throw ApiError.notFound('Discussion not found');

    let replies: any[] = Array.isArray(discussion.replies) ? [...discussion.replies] : [];
    const replyIndex = replies.findIndex((r) => r.id === replyId);
    if (replyIndex === -1) throw ApiError.notFound('Reply not found');

    const reply = replies[replyIndex];
    const isOwner = reply.userId === userId || reply.user === userId;
    const isAdmin = ['admin', 'super_admin'].includes(userRole);
    const isCourseTeacher = await prisma.course.findFirst({
      where: { id: discussion.courseId, teacherId: userId },
    });

    if (!isOwner && !isAdmin && !isCourseTeacher)
      throw ApiError.forbidden('Not authorized to delete this reply');

    replies.splice(replyIndex, 1);
    await prisma.discussion.update({ where: { id }, data: { replies } });
  }
}

export default DiscussionService;
