import crypto from 'crypto';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import openaiClient from '../../config/openai.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import redis from '../../config/redis.js';
import logger from '../../utils/logger.js';

// Per-tenant daily AI usage limits
const AI_DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT_PER_TENANT, 10) || 500;
const AI_USAGE_TTL = 86400; // 24 hours

const checkAndIncrementUsage = async (tenantId) => {
  if (!tenantId) return; // super_admin bypass
  const key = `ai_usage:${tenantId}:${new Date().toISOString().split('T')[0]}`;
  const current = (await redis.get(key)) || 0;
  if (current >= AI_DAILY_LIMIT) {
    throw ApiError.tooManyRequests(
      `Daily AI usage limit (${AI_DAILY_LIMIT} requests) reached for this institute. Resets tomorrow.`
    );
  }
  // Increment — fire and forget to not block response
  setImmediate(async () => {
    try {
      if (redis.isConnected) {
        await redis.client.incrBy(key, 1);
        await redis.client.expire(key, AI_USAGE_TTL);
      }
    } catch {
      /* ignore */
    }
  });
};

const cacheKey = (prefix, data) =>
  `ai_cache:${prefix}:${crypto.createHash('md5').update(JSON.stringify(data)).digest('hex')}`;

const getCached = async (key) => redis.get(key);
const setCache = async (key, value, ttl = 3600) => redis.set(key, value, ttl);

const requireAI = () => {
  if (!openaiClient) {
    throw ApiError.serviceUnavailable('AI features are not configured. Please set OPENAI_API_KEY.');
  }
};

const getLangChainModel = (model = 'gpt-4o', streaming = false) =>
  new ChatOpenAI({
    modelName: model,
    temperature: 0.3,
    streaming,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

// ===== SSE HELPER =====
const sendSSE = (res, data) => {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

const endSSE = (res) => {
  res.write('data: [DONE]\n\n');
  res.end();
};

// ===== QUESTION GENERATOR =====
export const generateQuestions = catchAsync(async (req, res) => {
  requireAI();
  await checkAndIncrementUsage(req.tenantId);

  const {
    subject,
    topic,
    difficulty = 'medium',
    language = 'English',
    count = 5,
    type = 'mcq',
  } = req.body;
  if (!subject || !topic) throw ApiError.badRequest('subject and topic are required');
  if (count > 20) throw ApiError.badRequest('Maximum 20 questions per request');

  const ck = cacheKey('questions', { subject, topic, difficulty, language, count, type });
  const cached = await getCached(ck);
  if (cached)
    return ApiResponse.ok(
      res,
      { questions: cached, cached: true },
      `${cached.length} questions (cached)`
    );

  const prompt = `Generate ${count} ${difficulty}-difficulty ${type === 'mcq' ? 'multiple choice questions (MCQ)' : 'questions'} about "${topic}" in the subject "${subject}".
Language: ${language}

Return ONLY a valid JSON array (no markdown, no explanation) in this exact format:
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

  const completion = await openaiClient.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are an expert educator who generates high-quality exam questions. Always respond with valid JSON only.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  });

  let questions;
  try {
    const raw = completion.choices[0].message.content;
    const parsed = JSON.parse(raw);
    questions = Array.isArray(parsed) ? parsed : parsed.questions || Object.values(parsed)[0];
  } catch {
    throw ApiError.internal('Failed to parse AI response');
  }

  await setCache(ck, questions, 3600); // Cache for 1 hour
  ApiResponse.ok(res, { questions, cached: false }, `${questions.length} questions generated`);
});

// ===== DOUBT SOLVER (with SSE streaming) =====
export const solveDoubt = catchAsync(async (req, res) => {
  requireAI();
  await checkAndIncrementUsage(req.tenantId);

  const { question, subject, imageBase64, stream = false, courseContext } = req.body;
  if (!question && !imageBase64) throw ApiError.badRequest('question or imageBase64 required');

  // Check cache (only for text questions without images)
  if (!imageBase64 && !stream) {
    const ck = cacheKey('doubt', { question, subject });
    const cached = await getCached(ck);
    if (cached) return ApiResponse.ok(res, { answer: cached, cached: true });
  }

  const systemContent = [
    'You are a helpful and clear teacher who explains concepts at a student level.',
    subject ? `Subject: ${subject}.` : '',
    'Provide a concise explanation with an example if helpful.',
    courseContext ? `\n\nCourse context for this answer:\n${courseContext}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (stream) {
    // SSE streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const model = getLangChainModel('gpt-4o-mini', true);
    const messages = [
      new SystemMessage(systemContent),
      new HumanMessage(question || 'Solve the question'),
    ];

    try {
      const stream = await model.stream(messages);
      for await (const chunk of stream) {
        const token = chunk.content;
        if (token) sendSSE(res, { token });
      }
      endSSE(res);
    } catch (err) {
      sendSSE(res, { error: err.message });
      endSSE(res);
    }
    return;
  }

  // Non-streaming
  const messages = [{ role: 'system', content: systemContent }];
  if (imageBase64) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: question || 'Solve this question from the image.' },
        {
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'high' },
        },
      ],
    });
  } else {
    messages.push({ role: 'user', content: question });
  }

  const completion = await openaiClient.chat.completions.create({
    model: imageBase64 ? 'gpt-4o' : 'gpt-4o-mini',
    messages,
    temperature: 0.3,
    max_tokens: 1200,
  });

  const answer = completion.choices[0].message.content;
  const tokensUsed = completion.usage?.total_tokens || 0;

  if (!imageBase64) {
    const ck = cacheKey('doubt', { question, subject });
    await setCache(ck, answer, 1800); // 30 min cache
  }

  ApiResponse.ok(res, { answer, tokensUsed, cached: false });
});

// ===== RAG: Index course content =====
// In-process vector store (replace with Pinecone for production at scale)
const vectorStores = new Map(); // tenantId -> MemoryVectorStore

export const indexCourseContent = catchAsync(async (req, res) => {
  requireAI();
  const { courseId, content, title } = req.body;
  if (!content) throw ApiError.badRequest('content required');

  const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
  const chunks = await splitter.splitText(content);

  const docs = chunks.map(
    (chunk, i) =>
      new Document({
        pageContent: chunk,
        metadata: { courseId, title, chunkIndex: i, tenantId: req.tenantId },
      })
  );

  const storeKey = req.tenantId || 'global';
  if (!vectorStores.has(storeKey)) {
    vectorStores.set(storeKey, await MemoryVectorStore.fromDocuments(docs, embeddings));
  } else {
    await vectorStores.get(storeKey).addDocuments(docs);
  }

  logger.info(`RAG: indexed ${docs.length} chunks for course ${courseId}`);
  ApiResponse.ok(res, { chunksIndexed: docs.length }, 'Course content indexed for AI');
});

// ===== RAG DOUBT SOLVER =====
export const ragSolveDoubt = catchAsync(async (req, res) => {
  requireAI();
  await checkAndIncrementUsage(req.tenantId);

  const { question, subject, stream = false } = req.body;
  if (!question) throw ApiError.badRequest('question required');

  const storeKey = req.tenantId || 'global';
  let courseContext = '';

  if (vectorStores.has(storeKey)) {
    const store = vectorStores.get(storeKey);
    const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
    const queryEmbedding = await embeddings.embedQuery(question);
    const results = await store.similaritySearchVectorWithScore(queryEmbedding, 3);
    courseContext = results.map(([doc]) => doc.pageContent).join('\n\n---\n\n');
  }

  req.body.courseContext = courseContext;
  return solveDoubt(req, res);
});

// ===== STUDY PLAN GENERATOR =====
export const generateStudyPlan = catchAsync(async (req, res) => {
  requireAI();
  await checkAndIncrementUsage(req.tenantId);

  const { examName, targetDate, hoursPerDay = 3, weakTopics = [], strongTopics = [] } = req.body;
  if (!examName || !targetDate) throw ApiError.badRequest('examName and targetDate required');

  const ck = cacheKey('studyplan', { examName, targetDate, hoursPerDay, weakTopics, strongTopics });
  const cached = await getCached(ck);
  if (cached) return ApiResponse.ok(res, { plan: cached, cached: true, examName });

  const daysLeft = Math.max(1, Math.ceil((new Date(targetDate) - Date.now()) / 86400000));

  const prompt = `Create a personalized study plan for a student preparing for "${examName}".
- Days until exam: ${daysLeft}
- Study hours per day: ${hoursPerDay}
- Weak topics (need more time): ${weakTopics.join(', ') || 'none specified'}
- Strong topics (can review quickly): ${strongTopics.join(', ') || 'none specified'}

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

  const completion = await openaiClient.chat.completions.create({
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
    plan = JSON.parse(completion.choices[0].message.content);
  } catch {
    throw ApiError.internal('Failed to parse study plan');
  }

  await setCache(ck, plan, 3600);
  ApiResponse.ok(res, { plan, cached: false, daysLeft, examName });
});

// ===== WEAK TOPIC DETECTION =====
export const detectWeakTopics = catchAsync(async (req, res) => {
  requireAI();
  await checkAndIncrementUsage(req.tenantId);

  const { attempts } = req.body;
  if (!attempts?.length) throw ApiError.badRequest('attempts array required');

  const ck = cacheKey('weaktopics', { attempts });
  const cached = await getCached(ck);
  if (cached) return ApiResponse.ok(res, { analysis: cached, cached: true });

  const performanceSummary = attempts.map((a) => ({
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

  const completion = await openaiClient.chat.completions.create({
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
    analysis = JSON.parse(completion.choices[0].message.content);
  } catch {
    throw ApiError.internal('Failed to parse analysis');
  }

  await setCache(ck, analysis, 1800);
  ApiResponse.ok(res, { analysis, cached: false });
});

// ===== AI USAGE STATS (admin) =====
export const getAiUsageStats = catchAsync(async (req, res) => {
  if (!req.tenantId) throw ApiError.badRequest('Tenant context required');
  const date = new Date().toISOString().split('T')[0];
  const key = `ai_usage:${req.tenantId}:${date}`;
  const usage = (await redis.get(key)) || 0;
  ApiResponse.ok(res, {
    usage: Number(usage),
    limit: AI_DAILY_LIMIT,
    date,
    remaining: Math.max(0, AI_DAILY_LIMIT - Number(usage)),
  });
});
