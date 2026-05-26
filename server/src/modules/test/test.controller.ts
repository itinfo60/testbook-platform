import { Response } from 'express';
import { BaseController } from '../../core/base.controller.js';
import { TestService } from './test.service.js';
import { CustomRequest } from '../auth/auth.controller.js';
import { ApiError } from '../../core/api-error.js';

export class TestController extends BaseController {
  private readonly testService: TestService;

  constructor(testService = new TestService()) {
    super();
    this.testService = testService;
  }

  getTests = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const result = await this.testService.getTests(req.query, req.userId || undefined);
    return this.paginated(res, {
      docs: result.docs,
      page: result.page.toString(),
      limit: result.limit.toString(),
      total: result.total,
    });
  });

  getTestById = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const result = await this.testService.getTestById(req.params.id, req.userId || undefined);
    return this.ok(res, result);
  });

  startTest = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized('Authentication required to start a test');
    }
    const result = await this.testService.startTest(req.params.id, req.userId);
    return this.ok(res, result);
  });

  autoSave = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized('Authentication required to auto-save progress');
    }
    const result = await this.testService.autoSave(req.params.attemptId, req.userId, req.body);
    return this.ok(res, result, 'Progress auto-saved');
  });

  logViolation = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized('Authentication required to report violations');
    }
    const result = await this.testService.logViolation(req.params.attemptId, req.userId);
    return this.ok(
      res,
      result,
      result.autoSubmitted ? 'Test auto-submitted due to screen violation lock' : 'Violation logged'
    );
  });

  submitTest = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized('Authentication required to submit test');
    }
    const result = await this.testService.submitTest(req.params.attemptId, req.userId, req.body);
    return this.ok(res, result, 'Test submitted successfully');
  });

  getTestResult = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized('Authentication required to view test result');
    }
    const result = await this.testService.getTestResult(req.params.attemptId, req.userId);
    return this.ok(res, result);
  });

  getMyAttempts = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized('Authentication required to list attempts');
    }
    const result = await this.testService.getMyAttempts(req.userId, req.query);
    return this.paginated(res, {
      docs: result.docs,
      page: result.page.toString(),
      limit: result.limit.toString(),
      total: result.total,
    });
  });

  // Teacher Endpoints
  createTest = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized('Authentication required to create a test');
    }
    const test = await this.testService.createTest(req.body, req.userId);
    return this.created(res, { test }, 'Test created successfully');
  });

  updateTest = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized('Authentication required to update a test');
    }
    const test = await this.testService.updateTest(req.params.id, req.body, req.userId);
    return this.ok(res, { test }, 'Test updated successfully');
  });

  deleteTest = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized('Authentication required to delete a test');
    }
    await this.testService.deleteTest(req.params.id, req.userId);
    return this.ok(res, null, 'Test deleted successfully');
  });

  getTeacherTests = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized('Authentication required to get tests');
    }
    const result = await this.testService.getTeacherTests(req.userId, req.query);
    return this.paginated(res, {
      docs: result.docs,
      page: result.page.toString(),
      limit: result.limit.toString(),
      total: result.total,
    });
  });

  gradeSubjective = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized('Authentication required to grade tests');
    }
    const result = await this.testService.gradeSubjective(
      req.params.attemptId,
      req.userId,
      req.body
    );
    return this.ok(res, { attempt: result }, 'Subjective graded successfully');
  });

  getTestAnalytics = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized('Authentication required to get analytics');
    }
    const result = await this.testService.getTestAnalytics(req.params.id, req.userId);
    return this.ok(res, result);
  });
}
export default TestController;
