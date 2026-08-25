import { Response } from 'express';
import { BaseController } from '../../core/base.controller.js';
import { CourseService } from './course.service.js';
import { CustomRequest } from '../auth/auth.controller.js';
import { ApiError } from '../../core/api-error.js';

export class CourseController extends BaseController {
  private readonly courseService: CourseService;

  constructor(courseService = new CourseService()) {
    super();
    this.courseService = courseService;
  }

  getCourses = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const result = await this.courseService.getCourses(req.query as any);
    return this.paginated(res, {
      docs: result.docs,
      page: (req.query.page as string) || '1',
      limit: (req.query.limit as string) || '12',
      total: result.total,
    });
  });

  getCourseBySlug = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const { slug } = req.params;
    if (!slug) {
      throw ApiError.badRequest('Slug parameter is required');
    }
    const result = await this.courseService.getCourseBySlug(
      slug,
      req.userId || null,
      req.user?.role || null
    );
    return this.ok(res, result);
  });

  getCourseById = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const result = await this.courseService.getCourseById(
      req.params.id,
      req.userId || null,
      req.user?.role || null
    );
    return this.ok(res, result);
  });

  createCourse = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }
    const course = await this.courseService.createCourse(req.body, req.userId);
    return this.created(res, { course }, 'Course created successfully');
  });

  updateCourse = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
    const course = await this.courseService.updateCourse(
      req.params.id,
      req.userId,
      req.body,
      isAdmin
    );
    return this.ok(res, { course }, 'Course updated successfully');
  });

  deleteCourse = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
    await this.courseService.deleteCourse(req.params.id, req.userId, isAdmin);
    return this.ok(res, null, 'Course deleted successfully');
  });

  getTeacherCourses = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }
    const result = await this.courseService.getTeacherCourses(req.userId, req.query as any);
    return this.paginated(res, {
      docs: result.docs,
      page: (req.query.page as string) || '1',
      limit: (req.query.limit as string) || '10',
      total: result.total,
    });
  });

  publishCourse = this.catchAsync(async (req: CustomRequest, res: Response) => {
    if (!req.userId) {
      throw ApiError.unauthorized();
    }
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
    const course = await this.courseService.publishCourse(req.params.id, req.userId, isAdmin);
    return this.ok(res, { course }, 'Course publish status updated successfully');
  });

  getFeaturedCourses = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const courses = await this.courseService.getFeaturedCourses();
    return this.ok(res, { courses });
  });

  getSampleClasses = this.catchAsync(async (req: CustomRequest, res: Response) => {
    const samples = await this.courseService.getSampleClasses();
    return this.ok(res, { samples });
  });
}
export default CourseController;
