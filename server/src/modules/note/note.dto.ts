export interface INote {
  id: string;
  user: string;
  course: string;
  lesson?: string;
  content: string;
  timestamp: number;
  color: string;
  isPinned: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateNoteInput {
  lessonId?: string;
  content: string;
  timestamp?: number;
  color?: string;
}

export interface IUpdateNoteInput {
  content?: string;
  color?: string;
  isPinned?: boolean;
}
