export interface IReply {
  id: string;
  user: string;
  content: string;
  likes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IDiscussion {
  id: string;
  course: string | null;
  lesson: string | null;
  user: string;
  title: string;
  content: string;
  tags: string[];
  replies: IReply[];
  likes: string[];
  isResolved: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateDiscussionInput {
  title?: string;
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
