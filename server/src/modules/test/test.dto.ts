import { Types, Document } from 'mongoose';

export interface IOption {
  _id?: Types.ObjectId;
  text: string;
  isCorrect: boolean;
}

export interface IQuestion {
  _id: Types.ObjectId;
  question: string;
  type: 'mcq' | 'msq' | 'true_false' | 'fill_blank' | 'subjective';
  options?: IOption[];
  correctAnswer?: string;
  marks: number;
  negativeMarks: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
  sectionName: string;
  order: number;
}

export interface ITest extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  instructions: string;
  teacher: Types.ObjectId;
  category: Types.ObjectId;
  questions: IQuestion[];
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionsCount: number;
  maxAttempts: number; // 0 = unlimited
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  status: 'draft' | 'published' | 'archived';
  isPublished: boolean;
  isFeatured: boolean;
  isFree: boolean;
  price: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  publishedAt?: Date;
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  questionCount?: number;
}

export interface IAttemptAnswer {
  questionId: Types.ObjectId;
  selectedOptions?: number[];
  textAnswer?: string;
  isCorrect: boolean;
  marksObtained: number;
  timeTaken: number; // seconds
}

export interface IPaletteItem {
  questionId: Types.ObjectId;
  status: 'visited' | 'skipped' | 'flagged' | 'answered';
}

export interface ITestAttempt extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  user: Types.ObjectId;
  test: Types.ObjectId;
  answers: IAttemptAnswer[];
  palette: IPaletteItem[];
  score: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  status: 'in_progress' | 'completed' | 'timed_out' | 'abandoned';
  gradingStatus: 'auto_graded' | 'pending_manual' | 'manually_graded';
  startedAt: Date;
  completedAt?: Date;
  timeTaken: number; // total seconds
  attemptNumber: number;
  windowViolations: number;
  createdAt: Date;
  updatedAt: Date;
  calculateScore(): this;
}

export interface ICreateTestDto {
  title: string;
  description?: string;
  instructions?: string;
  category: string;
  questions: Omit<IQuestion, '_id'>[];
  duration: number;
  totalMarks: number;
  passingMarks: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  maxAttempts?: number;
  isFree?: boolean;
  price?: number;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  status?: 'draft' | 'published' | 'archived';
}

export interface IUpdateTestDto extends Partial<ICreateTestDto> {}

export interface IAutoSaveDto {
  answers: {
    questionId: string;
    selectedOptions?: number[];
    textAnswer?: string;
    timeTaken?: number;
  }[];
  palette?: {
    questionId: string;
    status: 'visited' | 'skipped' | 'flagged' | 'answered';
  }[];
}

export interface ISubmitTestDto {
  answers: {
    questionId: string;
    selectedOptions?: number[];
    textAnswer?: string;
    timeTaken?: number;
  }[];
}

export interface IGradeSubjectiveDto {
  questionId: string;
  marksObtained: number;
  feedback?: string;
}
