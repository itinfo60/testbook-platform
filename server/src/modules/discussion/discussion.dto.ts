import { Document, Types } from 'mongoose';

export interface IReply extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  content: string;
  likes: Types.ObjectId[];
  createdAt: Date;
}

export interface IDiscussion extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  course: Types.ObjectId;
  lesson?: Types.ObjectId;
  title: string;
  content: string;
  replies: Types.DocumentArray<IReply> | IReply[];
  likes: Types.ObjectId[];
  isPinned: boolean;
  isResolved: boolean;
  tags: string[];
  viewCount: number;
  tenantId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  replyCount: number;
  likeCount: number;
}

export interface ICreateDiscussionInput {
  title: string;
  content: string;
  tags?: string[];
}

export interface IUpdateDiscussionInput {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface ICreateReplyInput {
  content: string;
}
