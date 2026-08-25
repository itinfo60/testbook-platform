export interface IOption {
  id?: string;
  text: string;
  isCorrect: boolean;
}

export interface IQuestion {
  id: string;
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

export interface ITest {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  description: string;
  instructions: string;
  teacherId: string;
  categoryId: string;
  testSeriesId?: string;
  testNumber?: number;
  questions: any; // Prisma Json type
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  difficulty: string;
  testType?: string;
  questionsCount: number;
  maxAttempts: number; // 0 = unlimited
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  status: string;
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
  questionId: string;
  selectedOptions?: number[];
  textAnswer?: string;
  isCorrect: boolean;
  marksObtained: number;
  timeTaken: number; // seconds
}

export interface IPaletteItem {
  questionId: string;
  status: 'visited' | 'skipped' | 'flagged' | 'answered';
}

export interface ITestAttempt {
  id: string;
  tenantId: string;
  userId: string;
  testId: string;
  answers: any; // Prisma Json
  palette: any; // Prisma Json
  score: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  status: string;
  gradingStatus: string;
  startedAt: Date;
  completedAt?: Date;
  timeTaken: number; // total seconds
  attemptNumber: number;
  windowViolations: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateTestDto {
  title: string;
  description?: string;
  instructions?: string;
  categoryId: string;
  testSeriesId?: string;
  sectionTag?: string;
  subjectTag?: string;
  questions: Omit<IQuestion, 'id'>[];
  duration: number;
  totalMarks: number;
  passingMarks?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'easy' | 'medium' | 'hard';
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
