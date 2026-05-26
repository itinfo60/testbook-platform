export interface IGenerateQuestionsDto {
  subject: string;
  topic: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  language?: string;
  count?: number;
  type?: 'mcq' | 'msq' | 'true_false' | 'fill_blank';
}

export interface ISolveDoubtDto {
  question?: string;
  subject?: string;
  imageBase64?: string;
  stream?: boolean;
  courseContext?: string;
}

export interface IGenerateStudyPlanDto {
  examName: string;
  targetDate: string;
  hoursPerDay?: number;
  weakTopics?: string[];
  strongTopics?: string[];
}

export interface IAttemptPerformance {
  topic: string;
  score: number;
  total: number;
}

export interface IDetectWeakTopicsDto {
  attempts: IAttemptPerformance[];
}

export interface IIndexCourseContentDto {
  courseId: string;
  content: string;
  title: string;
}

export interface IAiUsageStats {
  usage: number;
  limit: number;
  date: string;
  remaining: number;
}
