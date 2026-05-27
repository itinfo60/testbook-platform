// Validation schemas for AI Quiz routes using Zod
import { z } from 'zod';

// Payload for generating a quiz via LLM
export const generateQuizSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  title: z.string().optional(),
});

// Payload for saving a generated quiz
export const saveQuizSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  course: z.string().min(1, 'Course ID is required'),
  // Questions can be an array of any objects; deeper validation can be added later
  questions: z.array(z.any()).min(1, 'At least one question is required'),
});
