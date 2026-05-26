import { Document, Types } from 'mongoose';

export interface INote extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  course: Types.ObjectId;
  lesson?: Types.ObjectId;
  content: string;
  timestamp: number;
  color: string;
  isPinned: boolean;
  tenantId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateNoteInput {
  content: string;
  lessonId?: string;
  timestamp?: number;
  color?: string;
}

export interface IUpdateNoteInput {
  content?: string;
  color?: string;
  isPinned?: boolean;
}
