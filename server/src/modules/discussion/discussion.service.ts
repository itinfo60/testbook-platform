import mongoose from 'mongoose';
import { DiscussionRepository } from './discussion.repository.js';
import Discussion from './discussion.model.js';
import Course from '../course/course.model.js';
import Enrollment from '../enrollment/enrollment.model.js';
import {
  ICreateDiscussionInput,
  IUpdateDiscussionInput,
  ICreateReplyInput,
  IDiscussion,
  IReply,
} from './discussion.dto.js';
import { ApiError } from '../../core/api-error.js';
import { buildPaginationQuery } from '../../utils/pagination.js';

export class DiscussionService {
  private readonly discussionRepository: DiscussionRepository;

  constructor(discussionRepository = new DiscussionRepository()) {
    this.discussionRepository = discussionRepository;
  }

  async getDiscussions(
    courseId: string,
    query: any
  ): Promise<{
    docs: IDiscussion[];
    page: number;
    limit: number;
    total: number;
  }> {
    const pagination = buildPaginationQuery(query);
    const filter: any = { course: courseId };

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { content: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.isResolved !== undefined) {
      filter.isResolved = query.isResolved === 'true';
    }

    const result = await (Discussion as any).paginate(filter, {
      ...pagination,
      populate: [
        { path: 'user', select: 'name avatar role' },
        { path: 'replies.user', select: 'name avatar role' },
      ],
      sort: query.sort === 'popular' ? '-likes' : '-createdAt',
    });

    return {
      docs: result.docs,
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
    };
  }

  async createDiscussion(
    userId: string,
    userRole: string,
    courseId: string,
    body: ICreateDiscussionInput
  ): Promise<IDiscussion> {
    // Verify enrollment if user is student
    if (userRole === 'student') {
      const enrollment = await Enrollment.findOne({
        user: userId,
        course: courseId,
        status: { $in: ['active', 'completed'] },
      });
      if (!enrollment) {
        throw ApiError.forbidden('You must be enrolled to participate in discussions');
      }
    }

    const discussion = await this.discussionRepository.create({
      user: userId,
      course: courseId,
      title: body.title,
      content: body.content,
      tags: body.tags || [],
    });

    await discussion.populate('user', 'name avatar role');
    return discussion;
  }

  async updateDiscussion(
    id: string,
    userId: string,
    body: IUpdateDiscussionInput
  ): Promise<IDiscussion> {
    const discussion = await this.discussionRepository.findById(id);
    if (!discussion) {
      throw ApiError.notFound('Discussion not found');
    }

    if (discussion.user.toString() !== userId) {
      throw ApiError.forbidden('Only the author can edit this discussion');
    }

    if (body.title) discussion.title = body.title;
    if (body.content) discussion.content = body.content;
    if (body.tags) discussion.tags = body.tags;

    await discussion.save();
    await discussion.populate('user', 'name avatar role');
    return discussion;
  }

  async addReply(id: string, userId: string, body: ICreateReplyInput): Promise<IReply> {
    const discussion = await this.discussionRepository.findById(id);
    if (!discussion) {
      throw ApiError.notFound('Discussion not found');
    }

    const replyPayload = {
      user: new mongoose.Types.ObjectId(userId) as any,
      content: body.content,
      likes: [],
    };

    discussion.replies.push(replyPayload as any);
    await discussion.save();

    await discussion.populate('replies.user', 'name avatar role');
    const newReply = discussion.replies[discussion.replies.length - 1];
    return newReply;
  }

  async updateReply(
    id: string,
    replyId: string,
    userId: string,
    body: ICreateReplyInput
  ): Promise<IReply> {
    const discussion = await this.discussionRepository.findById(id);
    if (!discussion) {
      throw ApiError.notFound('Discussion not found');
    }

    const reply = (discussion.replies as any).id(replyId);
    if (!reply) {
      throw ApiError.notFound('Reply not found');
    }

    if (reply.user.toString() !== userId) {
      throw ApiError.forbidden('Only the author can edit this reply');
    }

    reply.content = body.content;
    await discussion.save();

    await discussion.populate('replies.user', 'name avatar role');
    return reply;
  }

  async toggleLike(id: string, userId: string): Promise<{ isLiked: boolean; likeCount: number }> {
    const discussion = await this.discussionRepository.findById(id);
    if (!discussion) {
      throw ApiError.notFound('Discussion not found');
    }

    const likeIndex = discussion.likes.findIndex((l) => l.toString() === userId);
    const isLiked = likeIndex === -1;

    if (isLiked) {
      discussion.likes.push(new mongoose.Types.ObjectId(userId));
    } else {
      discussion.likes.splice(likeIndex, 1);
    }

    await discussion.save();
    return {
      isLiked,
      likeCount: discussion.likes.length,
    };
  }

  async toggleResolved(id: string, userId: string, userRole: string): Promise<boolean> {
    const discussion = await this.discussionRepository.findById(id);
    if (!discussion) {
      throw ApiError.notFound('Discussion not found');
    }

    const isAuthor = discussion.user.toString() === userId;
    const isStaff = ['teacher', 'admin', 'super_admin'].includes(userRole);

    if (!isAuthor && !isStaff) {
      throw ApiError.forbidden('Not authorized to resolve this discussion');
    }

    discussion.isResolved = !discussion.isResolved;
    await discussion.save();
    return discussion.isResolved;
  }

  async deleteDiscussion(id: string, userId: string, userRole: string): Promise<void> {
    const discussion = await this.discussionRepository.findById(id);
    if (!discussion) {
      throw ApiError.notFound('Discussion not found');
    }

    const isOwner = discussion.user.toString() === userId;
    const isAdmin = ['admin', 'super_admin'].includes(userRole);
    const isCourseTeacher = await Course.exists({ _id: discussion.course, teacher: userId });

    if (!isOwner && !isAdmin && !isCourseTeacher) {
      throw ApiError.forbidden('Not authorized to delete this discussion');
    }

    await this.discussionRepository.deleteById(id);
  }

  async deleteReply(id: string, replyId: string, userId: string, userRole: string): Promise<void> {
    const discussion = await this.discussionRepository.findById(id);
    if (!discussion) {
      throw ApiError.notFound('Discussion not found');
    }

    const reply = (discussion.replies as any).id(replyId);
    if (!reply) {
      throw ApiError.notFound('Reply not found');
    }

    const isOwner = reply.user.toString() === userId;
    const isAdmin = ['admin', 'super_admin'].includes(userRole);
    const isCourseTeacher = await Course.exists({ _id: discussion.course, teacher: userId });

    if (!isOwner && !isAdmin && !isCourseTeacher) {
      throw ApiError.forbidden('Not authorized to delete this reply');
    }

    (discussion.replies as any).pull(replyId);
    await discussion.save();
  }
}

export default DiscussionService;
