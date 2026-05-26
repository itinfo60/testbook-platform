import crypto from 'crypto';
import OpenAI from 'openai';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import openaiClient from '../../config/openai.js';
import { ApiError } from '../../core/api-error.js';
import redis from '../../config/redis.js';
import logger from '../../utils/logger.js';
import config from '../../config/index.js';
import { sanitizePrompt } from './prompt-sanitize.js';
import {
  IGenerateQuestionsDto,
  ISolveDoubtDto,
  IGenerateStudyPlanDto,
  IDetectWeakTopicsDto,
  IIndexCourseContentDto,
} from './ai.dto.js';

// In-memory vector store for RAG
const vectorStores = new Map<string, any>(); // tenantId -> chunk docs array

export class AiService {
  private readonly openai: OpenAI | null;
  private readonly tenantDailyLimit: number;
  private readonly studentDailyLimit: number;

  constructor() {
    this.openai = openaiClient;
    this.tenantDailyLimit = parseInt(process.env.AI_DAILY_LIMIT_PER_TENANT || '500', 10);
    this.studentDailyLimit = parseInt(process.env.AI_DAILY_LIMIT_PER_STUDENT || '20', 10);
  }

  private requireAI() {
    if (!this.openai) {
      throw ApiError.serviceUnavailable(
        'AI features are not configured. OPENAI_API_KEY is missing.'
      );
    }
  }

  /**
   * Enforces dual-tier limits in Redis:
   * 1. Per-tenant daily limit (default 500 requests)
   * 2. Per-student daily limit (default 20 requests)
   */
  async checkAndIncrementUsage(tenantId: string | null, userId: string) {
    if (!tenantId) return; // bypass for super admins

    const dateStr = new Date().toISOString().split('T')[0];
    const tenantKey = `ai_usage:tenant:${tenantId}:${dateStr}`;
    const studentKey = `ai_usage:student:${userId}:${dateStr}`;

    const tenantCount = (await redis.get(tenantKey)) || 0;
    if (Number(tenantCount) >= this.tenantDailyLimit) {
      throw ApiError.tooManyRequests(
        `Daily AI usage limit (${this.tenantDailyLimit} requests) reached for this institute. Resets tomorrow.`
      );
    }

    const studentCount = (await redis.get(studentKey)) || 0;
    if (Number(studentCount) >= this.studentDailyLimit) {
      throw ApiError.tooManyRequests(
        `Daily AI usage limit (${this.studentDailyLimit} requests) reached for your student account. Resets tomorrow.`
      );
    }

    // Increment asynchronously (fire-and-forget)
    redis.set(tenantKey, Number(tenantCount) + 1, 86400).catch(() => {});
    redis.set(studentKey, Number(studentCount) + 1, 86400).catch(() => {});
  }

  private getCacheKey(prefix: string, data: any): string {
    const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    return `ai_cache:${prefix}:${hash}`;
  }

  async generateQuestions(data: IGenerateQuestionsDto, tenantId: string | null, userId: string) {
    this.requireAI();
    sanitizePrompt(data.topic);
    sanitizePrompt(data.subject);

    await this.checkAndIncrementUsage(tenantId, userId);

    const ck = this.getCacheKey('questions', data);
    const cached = await redis.get(ck);
    if (cached) {
      return { questions: cached, cached: true };
    }

    const {
      subject,
      topic,
      difficulty = 'medium',
      language = 'English',
      count = 5,
      type = 'mcq',
    } = data;

    const prompt = `Generate ${count} ${difficulty}-difficulty ${type === 'mcq' ? 'multiple choice questions (MCQ)' : 'questions'} about "${topic}" in the subject "${subject}".
Language: ${language}

Return ONLY a valid JSON array (no markdown backticks, no wrap, no trailing comma) in this exact format:
[
  {
    "question": "Question text here",
    "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
    "correctAnswer": "A",
    "explanation": "Why A is correct",
    "difficulty": "${difficulty}",
    "tags": ["tag1", "tag2"]
  }
]`;

    const completion = await this.openai!.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert educator who generates high-quality exam questions. Always respond with valid JSON arrays only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    let questions;
    try {
      const raw = completion.choices[0].message.content || '[]';
      const parsed = JSON.parse(raw);
      questions = Array.isArray(parsed) ? parsed : parsed.questions || Object.values(parsed)[0];
    } catch {
      throw ApiError.internal('Failed to parse AI response json array');
    }

    await redis.set(ck, questions, 3600); // 1 hour cache
    return { questions, cached: false };
  }

  async solveDoubt(
    data: ISolveDoubtDto,
    tenantId: string | null,
    userId: string,
    streamEnabled = false
  ) {
    this.requireAI();
    if (data.question) {
      sanitizePrompt(data.question);
    }

    await this.checkAndIncrementUsage(tenantId, userId);

    // Cache lookup for non-image, non-streaming requests
    const ck = this.getCacheKey('doubt', {
      question: data.question,
      subject: data.subject,
      courseContext: data.courseContext,
    });
    if (!data.imageBase64 && !streamEnabled) {
      const cached = await redis.get(ck);
      if (cached) {
        return { answer: cached, cached: true };
      }
    }

    const systemContent = [
      'You are a helpful and clear teacher who explains concepts at a student level.',
      data.subject ? `Subject: ${data.subject}.` : '',
      'Provide a concise explanation with an example if helpful.',
      data.courseContext ? `\n\nCourse context for this answer:\n${data.courseContext}` : '',
    ]
      .filter(Boolean)
      .join(' ');

    if (streamEnabled) {
      // Return OpenAI stream object directly
      const messages: any[] = [
        { role: 'system', content: systemContent },
        { role: 'user', content: data.question || 'Solve the question' },
      ];
      return this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.3,
        stream: true,
      });
    }

    // Non-streaming completion
    const messages: any[] = [{ role: 'system', content: systemContent }];
    if (data.imageBase64) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: data.question || 'Solve this question from the image.' },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${data.imageBase64}`, detail: 'high' },
          },
        ],
      });
    } else {
      messages.push({ role: 'user', content: data.question });
    }

    const completion = await this.openai!.chat.completions.create({
      model: data.imageBase64 ? 'gpt-4o' : 'gpt-4o-mini',
      messages,
      temperature: 0.3,
      max_tokens: 1200,
    });

    const answer = completion.choices[0].message.content || '';
    if (!data.imageBase64) {
      await redis.set(ck, answer, 1800); // 30 mins cache
    }

    return { answer, cached: false, tokensUsed: completion.usage?.total_tokens || 0 };
  }

  async generateStudyPlan(data: IGenerateStudyPlanDto, tenantId: string | null, userId: string) {
    this.requireAI();
    sanitizePrompt(data.examName);

    await this.checkAndIncrementUsage(tenantId, userId);

    const ck = this.getCacheKey('studyplan', data);
    const cached = await redis.get(ck);
    if (cached) {
      return { plan: cached, cached: true };
    }

    const daysLeft = Math.max(
      1,
      Math.ceil((new Date(data.targetDate).getTime() - Date.now()) / 86400000)
    );

    const prompt = `Create a personalized study plan for a student preparing for "${data.examName}".
- Days until exam: ${daysLeft}
- Study hours per day: ${data.hoursPerDay || 3}
- Weak topics (need more time): ${data.weakTopics?.join(', ') || 'none specified'}
- Strong topics (can review quickly): ${data.strongTopics?.join(', ') || 'none specified'}

Return ONLY valid JSON in this format:
{
  "overview": "Brief overview string",
  "weeklyPlan": [
    {
      "week": 1,
      "theme": "Foundation",
      "days": [
        { "day": "Day 1", "topics": ["topic1"], "duration": 3, "priority": "high" }
      ]
    }
  ],
  "tips": ["tip1", "tip2"],
  "dailyGoal": "What to achieve each day"
}`;

    const completion = await this.openai!.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert academic coach who creates evidence-based study plans. Return valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    let plan;
    try {
      plan = JSON.parse(completion.choices[0].message.content || '{}');
    } catch {
      throw ApiError.internal('Failed to parse study plan');
    }

    await redis.set(ck, plan, 3600);
    return { plan, cached: false, daysLeft };
  }

  async detectWeakTopics(data: IDetectWeakTopicsDto, tenantId: string | null, userId: string) {
    this.requireAI();
    await this.checkAndIncrementUsage(tenantId, userId);

    const ck = this.getCacheKey('weaktopics', data);
    const cached = await redis.get(ck);
    if (cached) {
      return { analysis: cached, cached: true };
    }

    const performanceSummary = data.attempts.map((a) => ({
      topic: a.topic || 'Unknown',
      score: a.score,
      total: a.total,
      accuracy: Math.round((a.score / a.total) * 100),
    }));

    const prompt = `A student has taken multiple tests. Analyze their performance and identify weak topics.

Performance data:
${JSON.stringify(performanceSummary, null, 2)}

Return ONLY valid JSON:
{
  "weakTopics": [{ "topic": "name", "accuracy": 40, "priority": "high", "suggestion": "Spend 2 hours reviewing..." }],
  "strongTopics": [{ "topic": "name", "accuracy": 85 }],
  "overallAnalysis": "Summary string",
  "recommendedFocus": ["topic1", "topic2"]
}`;

    const completion = await this.openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a learning analytics expert. Return valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    let analysis;
    try {
      analysis = JSON.parse(completion.choices[0].message.content || '{}');
    } catch {
      throw ApiError.internal('Failed to parse analysis');
    }

    await redis.set(ck, analysis, 1800);
    return { analysis, cached: false };
  }

  async indexCourseContent(data: IIndexCourseContentDto, tenantId: string | null) {
    this.requireAI();
    sanitizePrompt(data.content);

    const storeKey = tenantId || 'global';
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const chunks = await splitter.splitText(data.content);

    const docs = chunks.map((chunk, i) => ({
      pageContent: chunk,
      metadata: { courseId: data.courseId, title: data.title, chunkIndex: i, tenantId },
    }));

    if (!vectorStores.has(storeKey)) {
      vectorStores.set(storeKey, []);
    }
    vectorStores.get(storeKey)!.push(...docs);

    logger.info(
      `[RAG Index] Indexed ${docs.length} chunks for course ${data.courseId} in tenant context ${storeKey}`
    );
    return { chunksIndexed: docs.length };
  }

  async ragSolveDoubt(data: ISolveDoubtDto, tenantId: string | null, userId: string) {
    this.requireAI();
    if (!data.question) throw ApiError.badRequest('question required');
    sanitizePrompt(data.question);

    const storeKey = tenantId || 'global';
    let courseContext = '';

    const docs = vectorStores.get(storeKey) || [];
    if (docs.length > 0) {
      // Basic keyword search since we're using in-memory store for quick queries in unit tests
      const keywords = data.question
        .toLowerCase()
        .split(' ')
        .filter((w) => w.length > 4);
      const matches = docs.filter((doc: any) =>
        keywords.some((kw) => doc.pageContent.toLowerCase().includes(kw))
      );
      courseContext = matches
        .slice(0, 3)
        .map((doc: any) => doc.pageContent)
        .join('\n\n---\n\n');
    }

    data.courseContext = courseContext;
    return this.solveDoubt(data, tenantId, userId, data.stream);
  }

  async getAiUsageStats(tenantId: string, userId: string) {
    const dateStr = new Date().toISOString().split('T')[0];
    const tenantKey = `ai_usage:tenant:${tenantId}:${dateStr}`;
    const studentKey = `ai_usage:student:${userId}:${dateStr}`;

    const tUsage = (await redis.get(tenantKey)) || 0;
    const sUsage = (await redis.get(studentKey)) || 0;

    return {
      date: dateStr,
      tenantUsage: Number(tUsage),
      tenantLimit: this.tenantDailyLimit,
      tenantRemaining: Math.max(0, this.tenantDailyLimit - Number(tUsage)),
      studentUsage: Number(sUsage),
      studentLimit: this.studentDailyLimit,
      studentRemaining: Math.max(0, this.studentDailyLimit - Number(sUsage)),
    };
  }
}

export default AiService;
