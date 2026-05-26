import { Response } from 'express';
import { BaseController } from '../../core/base.controller.js';
import { AiService } from './ai.service.js';
import { CustomRequest } from '../auth/auth.controller.js';
import { ApiError } from '../../core/api-error.js';

export class AiController extends BaseController {
  private readonly aiService: AiService;

  constructor(aiService = new AiService()) {
    super();
    this.aiService = aiService;
  }

  generateQuestions = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) throw ApiError.unauthorized();
    const result = await this.aiService.generateQuestions(
      req.body,
      req.tenantId || null,
      req.userId
    );
    return this.ok(res, result, 'Questions generated successfully');
  });

  solveDoubt = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) throw ApiError.unauthorized();

    const stream = req.body.stream === true;
    if (stream) {
      // SSE Streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      try {
        const responseStream = await this.aiService.solveDoubt(
          req.body,
          req.tenantId || null,
          req.userId,
          true
        );
        for await (const chunk of responseStream) {
          const token = chunk.choices[0]?.delta?.content || '';
          if (token) {
            res.write(`data: ${JSON.stringify({ token })}\n\n`);
          }
        }
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (err: any) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
      return;
    }

    // JSON response
    const result = await this.aiService.solveDoubt(
      req.body,
      req.tenantId || null,
      req.userId,
      false
    );
    return this.ok(res, result);
  });

  indexCourseContent = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const result = await this.aiService.indexCourseContent(req.body, req.tenantId || null);
    return this.ok(res, result, 'Course content successfully indexed for RAG');
  });

  ragSolveDoubt = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) throw ApiError.unauthorized();

    const stream = req.body.stream === true;
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      try {
        const responseStream = await this.aiService.ragSolveDoubt(
          req.body,
          req.tenantId || null,
          req.userId
        );
        for await (const chunk of responseStream) {
          const token = chunk.choices[0]?.delta?.content || '';
          if (token) {
            res.write(`data: ${JSON.stringify({ token })}\n\n`);
          }
        }
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (err: any) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
      return;
    }

    const result = await this.aiService.ragSolveDoubt(req.body, req.tenantId || null, req.userId);
    return this.ok(res, result);
  });

  generateStudyPlan = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) throw ApiError.unauthorized();
    const result = await this.aiService.generateStudyPlan(
      req.body,
      req.tenantId || null,
      req.userId
    );
    return this.ok(res, result, 'Study plan generated successfully');
  });

  detectWeakTopics = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) throw ApiError.unauthorized();
    const result = await this.aiService.detectWeakTopics(
      req.body,
      req.tenantId || null,
      req.userId
    );
    return this.ok(res, result, 'Performance analyzed successfully');
  });

  getAiUsageStats = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.tenantId || !req.userId) throw ApiError.badRequest('Tenant context and user required');
    const result = await this.aiService.getAiUsageStats(req.tenantId, req.userId);
    return this.ok(res, result);
  });
}

export default AiController;
