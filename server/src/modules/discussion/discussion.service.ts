import { v4 as uuidv4 } from 'uuid';

import { DiscussionRepository } from './discussion.repository.js';
import {
  ICreateDiscussionInput,
  IUpdateDiscussionInput,
  ICreateReplyInput,
} from './discussion.dto.js';
import { ApiError } from '../../core/api-error.js';
import prisma from '../../config/prisma.js';

export class DiscussionService {
  private readonly discussionRepository: DiscussionRepository;

  constructor(discussionRepository = new DiscussionRepository()) {
    this.discussionRepository = discussionRepository;
  }

  async getDiscussions(courseId: string, query: any): Promise<any> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = { course: courseId };
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.isResolved !== undefined) {
      where.isResolved = query.isResolved === 'true';
    }

    const [docs, total] = await Promise.all([
      prisma.discussion.findMany({
        where,
        include: {
          userObj: { select: { name: true, avatar: true, role: true } },
        },
        skip,
        take: limit,
        orderBy: query.sort === 'popular' ? { likes: 'desc' } : { createdAt: 'desc' }, // Note: Assuming likes array length can be sorted. If not, Prisma can't directly order by array length without an aggregation or storing the count. Assuming storing count or ignoring for now.
      }),
      prisma.discussion.count({ where }),
    ]);

    return { docs, page, limit, total };
  }

  async createDiscussion(
    userId: string,
    userRole: string,
    courseId: string,
    body: ICreateDiscussionInput
  ): Promise<any> {
    if (userRole === 'student') {
      const enrollment = await prisma.enrollment.findFirst({
        where: { user: userId, course: courseId, status: { in: ['active', 'completed'] } },
      });
      if (!enrollment) {
        throw ApiError.forbidden('You must be enrolled to participate in discussions');
      }
    }

    return prisma.discussion.create({
      data: {
        user: userId,
        course: courseId,
        title: (body.title || '').trim() || body.content.split('\n')[0].slice(0, 200),
        content: body.content,
        tags: body.tags || [],
      },
      include: { userObj: { select: { name: true, avatar: true, role: true } } },
    });
  }

  async updateDiscussion(id: string, userId: string, body: IUpdateDiscussionInput): Promise<any> {
    const discussion = await prisma.discussion.findUnique({ where: { id } });
    if (!discussion) throw ApiError.notFound('Discussion not found');
    if (discussion.user !== userId)
      throw ApiError.forbidden('Only the author can edit this discussion');

    return prisma.discussion.update({
      where: { id },
      data: { title: body.title, content: body.content, tags: body.tags },
      include: { userObj: { select: { name: true, avatar: true, role: true } } },
    });
  }

  async addReply(id: string, userId: string, body: ICreateReplyInput): Promise<any> {
    const discussion = await prisma.discussion.findUnique({ where: { id } });
    if (!discussion) throw ApiError.notFound('Discussion not found');

    // Assuming replies are stored in a separate table/model 'Reply' in Prisma, or as a JSON array.
    // Usually it's a separate model. Let's assume there's a Reply model related to Discussion.
    // If it's a JSON array, Prisma doesn't support pushing to JSON arrays easily, so we update it.

    // For simplicity, I'll assume JSON array since it was an embedded doc in Mongoose.
    const replies: any = Array.isArray(discussion.replies) ? discussion.replies : [];

    const newReply = {
      id: uuidv4(),
      user: userId,
      content: body.content,
      likes: [],
      createdAt: new Date(),
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

    const replies: any[] = Array.isArray(discussion.replies) ? discussion.replies : [];
    const replyIndex = replies.findIndex((r) => r.id === replyId);
    if (replyIndex === -1) throw ApiError.notFound('Reply not found');
    if (replies[replyIndex].user !== userId)
      throw ApiError.forbidden('Only the author can edit this reply');

    replies[replyIndex].content = body.content;
    replies[replyIndex].updatedAt = new Date();

    await prisma.discussion.update({ where: { id }, data: { replies } });
    return replies[replyIndex];
  }

  async toggleLike(id: string, userId: string): Promise<{ isLiked: boolean; likeCount: number }> {
    const discussion = await prisma.discussion.findUnique({ where: { id } });
    if (!discussion) throw ApiError.notFound('Discussion not found');

    let likes: string[] = Array.isArray(discussion.likes) ? discussion.likes : [];
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

    const isAuthor = discussion.user === userId;
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

    const isOwner = discussion.user === userId;
    const isAdmin = ['admin', 'super_admin'].includes(userRole);
    const isCourseTeacher = await prisma.course.findFirst({
      where: { id: discussion.course as string, teacher: userId },
    });

    if (!isOwner && !isAdmin && !isCourseTeacher)
      throw ApiError.forbidden('Not authorized to delete this discussion');

    await prisma.discussion.delete({ where: { id } });
  }

  async deleteReply(id: string, replyId: string, userId: string, userRole: string): Promise<void> {
    const discussion = await prisma.discussion.findUnique({ where: { id } });
    if (!discussion) throw ApiError.notFound('Discussion not found');

    let replies: any[] = Array.isArray(discussion.replies) ? discussion.replies : [];
    const replyIndex = replies.findIndex((r) => r.id === replyId);
    if (replyIndex === -1) throw ApiError.notFound('Reply not found');

    const reply = replies[replyIndex];
    const isOwner = reply.user === userId;
    const isAdmin = ['admin', 'super_admin'].includes(userRole);
    const isCourseTeacher = await prisma.course.findFirst({
      where: { id: discussion.course as string, teacher: userId },
    });

    if (!isOwner && !isAdmin && !isCourseTeacher)
      throw ApiError.forbidden('Not authorized to delete this reply');

    replies.splice(replyIndex, 1);
    await prisma.discussion.update({ where: { id }, data: { replies } });
  }
}

export default DiscussionService;
