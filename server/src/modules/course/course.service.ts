import { CourseRepository } from './course.repository.js';
import { ICourse } from './course.model.js';
import { CreateCourseInput, UpdateCourseInput, CourseQueryInput } from './course.validation.js';
import { ApiError } from '../../core/api-error.js';
import redis from '../../config/redis.js';
import { generateSlug } from '../../utils/helpers.js';
import Enrollment from '../enrollment/enrollment.model.js';
import Review from '../review/review.model.js';

export class CourseService {
  private readonly courseRepository: CourseRepository;

  constructor(courseRepository = new CourseRepository()) {
    this.courseRepository = courseRepository;
  }

  async getCourses(query: CourseQueryInput): Promise<{ docs: ICourse[]; total: number }> {
    return this.courseRepository.paginateCourses(query);
  }

  async getCourseBySlug(slug: string, userId: string | null): Promise<any> {
    const cacheKey = `course:${slug}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const course = await this.courseRepository.findOne({ slug, isPublished: true }, null, {
      populate: [
        { path: 'teacher', select: 'name avatar bio teacherProfile' },
        { path: 'category', select: 'name slug' },
      ],
    });

    if (!course) {
      throw ApiError.notFound('Course not found');
    }

    const reviews = await Review.find({ course: course._id, isApproved: true })
      .populate('user', 'name avatar')
      .sort('-createdAt')
      .limit(10)
      .lean();

    let isEnrolled = false;
    let enrollment: any = null;

    if (userId) {
      enrollment = await Enrollment.findOne({
        user: userId,
        course: course._id,
        status: { $in: ['active', 'completed'] },
      });
      isEnrolled = !!enrollment;
    }

    const now = Date.now();
    const courseObj = course.toObject();

    courseObj.sections = courseObj.sections.map((section: any) => ({
      ...section,
      lessons: section.lessons.map((lesson: any) => {
        if (!isEnrolled) {
          return {
            _id: lesson._id,
            title: lesson.title,
            type: lesson.type,
            duration: lesson.duration,
            isFree: lesson.isFree,
            dripDays: lesson.dripDays,
            content: lesson.isFree ? lesson.content : undefined,
            videoUrl: lesson.isFree ? lesson.videoUrl : undefined,
          };
        }

        const dripLocked =
          lesson.dripDays > 0 &&
          enrollment &&
          now < new Date(enrollment.enrolledAt).getTime() + lesson.dripDays * 86400000;

        return {
          ...lesson,
          dripLocked,
          content: dripLocked ? undefined : lesson.content,
          videoUrl: dripLocked ? undefined : lesson.videoUrl,
        };
      }),
    }));

    const result = { course: courseObj, reviews, isEnrolled };

    await redis.set(cacheKey, result, 300); // 5 min cache
    return result;
  }

  async getCourseById(id: string, userId: string | null): Promise<any> {
    const course = await this.courseRepository.findById(id, null, {
      populate: [
        { path: 'teacher', select: 'name avatar' },
        { path: 'category', select: 'name slug' },
      ],
    });

    if (!course) {
      throw ApiError.notFound('Course not found');
    }

    const reviews = await Review.find({ course: course._id, isApproved: true })
      .populate('user', 'name avatar')
      .sort('-createdAt')
      .limit(10)
      .lean();

    let isEnrolled = false;
    let enrollment: any = null;

    if (userId) {
      enrollment = await Enrollment.findOne({
        user: userId,
        course: course._id,
        status: { $in: ['active', 'completed'] },
      });
      isEnrolled = !!enrollment;
    }

    const now = Date.now();
    const courseObj = course.toObject();

    courseObj.sections = courseObj.sections.map((section: any) => ({
      ...section,
      lessons: section.lessons.map((lesson: any) => {
        if (!isEnrolled) {
          return {
            _id: lesson._id,
            title: lesson.title,
            type: lesson.type,
            duration: lesson.duration,
            isFree: lesson.isFree,
            dripDays: lesson.dripDays,
            content: lesson.isFree ? lesson.content : undefined,
            videoUrl: lesson.isFree ? lesson.videoUrl : undefined,
          };
        }

        const dripLocked =
          lesson.dripDays > 0 &&
          enrollment &&
          now < new Date(enrollment.enrolledAt).getTime() + lesson.dripDays * 86400000;

        return {
          ...lesson,
          dripLocked,
          content: dripLocked ? undefined : lesson.content,
          videoUrl: dripLocked ? undefined : lesson.videoUrl,
        };
      }),
    }));

    return { course: courseObj, reviews, isEnrolled };
  }

  async createCourse(input: CreateCourseInput, teacherId: string): Promise<ICourse> {
    const slug = generateSlug(input.title);

    // Verify slug uniqueness within tenant
    const existing = await this.courseRepository.findOne({ slug });
    const finalSlug = existing ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

    const course = await this.courseRepository.create({
      ...input,
      slug: finalSlug,
      teacher: teacherId,
      status: 'draft',
      isPublished: false,
    });

    await redis.delPattern('courses:*');
    return course;
  }

  async updateCourse(id: string, teacherId: string, input: UpdateCourseInput): Promise<ICourse> {
    const course = await this.courseRepository.findOne({ _id: id, teacher: teacherId });
    if (!course) {
      throw ApiError.notFound('Course not found or unauthorized');
    }

    const updates: any = { ...input };
    if (input.title && input.title !== course.title) {
      const newSlug = generateSlug(input.title);
      const existing = await this.courseRepository.findOne({ slug: newSlug });
      updates.slug = existing ? `${newSlug}-${Date.now().toString().slice(-4)}` : newSlug;
    }

    Object.assign(course, updates);
    await course.save();

    await redis.delPattern('courses:*');
    await redis.del(`course:${course.slug}`);

    return course;
  }

  async deleteCourse(id: string, teacherId: string): Promise<void> {
    const course = await this.courseRepository.findOne({ _id: id, teacher: teacherId });
    if (!course) {
      throw ApiError.notFound('Course not found or unauthorized');
    }

    const enrollmentCount = await Enrollment.countDocuments({ course: course._id });
    if (enrollmentCount > 0) {
      // Soft delete using custom mongoose plugin method
      if (typeof (course as any).softDelete === 'function') {
        await (course as any).softDelete(teacherId);
      } else {
        await this.courseRepository.updateById(course._id.toString(), { isDeleted: true });
      }
    } else {
      await this.courseRepository.deleteById(course._id.toString());
    }

    await redis.delPattern('courses:*');
    await redis.del(`course:${course.slug}`);
  }

  async getTeacherCourses(
    teacherId: string,
    query: { page?: number; limit?: number; status?: string; search?: string }
  ): Promise<{ docs: ICourse[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = { teacher: teacherId };
    if (query.status) {
      filter.status = query.status;
    }
    if (query.search) {
      filter.title = { $regex: query.search, $options: 'i' };
    }

    const [docs, total] = await Promise.all([
      this.courseRepository.find(filter, null, {
        skip,
        limit,
        populate: { path: 'category', select: 'name' },
        sort: { createdAt: -1 },
      }),
      this.courseRepository.countDocuments(filter),
    ]);

    return { docs, total };
  }

  async publishCourse(id: string, teacherId: string): Promise<ICourse> {
    const course = await this.courseRepository.findOne({ _id: id, teacher: teacherId });
    if (!course) {
      throw ApiError.notFound('Course not found');
    }

    if (!course.sections.length) {
      throw ApiError.badRequest('Course must have at least one section');
    }

    const hasLessons = course.sections.some((s) => s.lessons.length > 0);
    if (!hasLessons) {
      throw ApiError.badRequest('Course must have at least one lesson');
    }

    if (!course.thumbnail?.url) {
      throw ApiError.badRequest('Course must have a thumbnail');
    }

    course.status = 'published';
    course.isPublished = true;
    course.publishedAt = new Date();
    await course.save();

    await redis.delPattern('courses:*');
    await redis.del(`course:${course.slug}`);

    return course;
  }

  async getFeaturedCourses(): Promise<ICourse[]> {
    const cacheKey = 'courses:featured';
    const cached = await redis.get(cacheKey);
    if (cached) {
      return (cached as any).courses;
    }

    const courses = await this.courseRepository.find(
      { isPublished: true, isFeatured: true },
      '-sections',
      {
        populate: [
          { path: 'teacher', select: 'name avatar' },
          { path: 'category', select: 'name slug' },
        ],
        sort: { enrollmentCount: -1 },
        limit: 8,
      }
    );

    await redis.set(cacheKey, { courses }, 1800); // 30 min cache
    return courses;
  }
}
export default CourseService;
