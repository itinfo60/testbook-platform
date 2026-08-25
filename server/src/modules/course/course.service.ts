import { CourseRepository } from './course.repository.js';
import { CreateCourseInput, UpdateCourseInput, CourseQueryInput } from './course.validation.js';
import { ApiError } from '../../core/api-error.js';
import redis from '../../config/redis.js';
import { generateSlug } from '../../utils/helpers.js';
import prisma from '../../config/prisma.js';

export class CourseService {
  private readonly courseRepository: CourseRepository;

  constructor(courseRepository = new CourseRepository()) {
    this.courseRepository = courseRepository;
  }

  async getCourses(query: CourseQueryInput): Promise<{ docs: any[]; total: number }> {
    return this.courseRepository.paginateCourses(query);
  }

  private isCourseAuthor(course: any, userId: string | null, role: string | null): boolean {
    if (!userId) return false;
    if (role === 'admin' || role === 'super_admin' || role === 'superadmin') return true;
    const teacherId = typeof course.teacher === 'object' ? course.teacher?.id : course.teacher;
    return teacherId === userId || course.teacherId === userId;
  }

  private applyLessonVisibility(
    courseObj: any,
    {
      isAuthor,
      isEnrolled,
      enrollment,
    }: { isAuthor: boolean; isEnrolled: boolean; enrollment: any }
  ): any {
    const now = Date.now();
    let sections = [];
    if (typeof courseObj.sections === 'string') {
      try {
        sections = JSON.parse(courseObj.sections);
      } catch (e) {}
    } else {
      sections = courseObj.sections || [];
    }

    courseObj.sections = sections.map((section: any) => ({
      ...section,
      lessons: (section.lessons || []).map((lesson: any) => {
        if (isAuthor) return { ...lesson, dripLocked: false };
        if (!isEnrolled) {
          return {
            id: lesson.id || lesson._id,
            title: lesson.title,
            type: lesson.type,
            duration: lesson.duration,
            isFree: lesson.isFree,
            dripDays: lesson.dripDays,
            content: lesson.isFree ? lesson.content : undefined,
            videoUrl: lesson.isFree ? lesson.videoUrl : undefined,
            resources: lesson.isFree
              ? lesson.resources
              : lesson.resources?.map((r: any) => ({ title: r.title, type: r.type })),
            quizId: lesson.quizId,
            testSeriesSlug: lesson.testSeriesSlug,
          };
        }
        const dripLocked = Boolean(
          lesson.dripDays > 0 &&
          enrollment &&
          now < new Date(enrollment.enrolledAt).getTime() + lesson.dripDays * 86400000
        );
        return {
          ...lesson,
          dripLocked,
          content: dripLocked ? undefined : lesson.content,
          videoUrl: dripLocked ? undefined : lesson.videoUrl,
        };
      }),
    }));
    return courseObj;
  }

  async getCourseBySlug(
    slug: string,
    userId: string | null,
    role: string | null = null
  ): Promise<any> {
    const cacheKey = `course:${slug}:${userId || 'anon'}`;
    const cached = await redis.get(cacheKey);
    if (cached) return cached;

    const course = await prisma.course.findFirst({
      where: { slug, isPublished: true },
      include: {
        teacher: { select: { name: true, avatar: true, bio: true, teacherProfile: true } },
        category: { select: { name: true, slug: true } },
      },
    });
    if (!course) throw ApiError.notFound('Course not found');

    const reviews = await prisma.review.findMany({
      where: { courseId: course.id, isApproved: true },
      include: { user: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    let isEnrolled = false;
    let enrollment: any = null;
    if (userId) {
      enrollment = await prisma.enrollment.findFirst({
        where: { userId, courseId: course.id, status: { in: ['active', 'completed'] } },
      });
      isEnrolled = !!enrollment;
    }

    const isAuthor = this.isCourseAuthor(course, userId, role);
    const courseObj = this.applyLessonVisibility(
      { ...course },
      { isAuthor, isEnrolled, enrollment }
    );
    const result = { course: courseObj, reviews, isEnrolled: isEnrolled || isAuthor };
    if (!isAuthor) await redis.set(cacheKey, result, 300);
    return result;
  }

  async getCourseById(id: string, userId: string | null, role: string | null = null): Promise<any> {
    let course = await prisma.course.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        teacher: { select: { id: true, name: true, email: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { enrollments: true, reviews: true } },
      },
    });

    if (!course) throw ApiError.notFound('Course not found');
    const isAdmin = role === 'admin' || role === 'super_admin';
    const isAuthor = this.isCourseAuthor(course, userId, role);

    if (!course.isPublished && !isAuthor && !isAdmin) {
      throw ApiError.notFound('Course not found');
    }

    const reviews = await prisma.review.findMany({
      where: { courseId: course.id, ...(isAdmin ? {} : { isApproved: true }) },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    let isEnrolled = false;
    let enrollment: any = null;
    if (userId) {
      enrollment = await prisma.enrollment.findFirst({
        where: { userId, courseId: course.id, status: { in: ['active', 'completed'] } },
      });
      isEnrolled = !!enrollment;
    }

    // If admin or author, fetch enrolled students and full analytics
    let enrolledStudents: any[] = [];
    let liveClasses: any[] = [];
    let stats = {
      totalEnrollments: course._count?.enrollments || 0,
      totalReviews: course._count?.reviews || 0,
      totalRevenue: (course._count?.enrollments || 0) * (course.price || 0),
      averageRating: course.rating || 0,
    };

    if (isAdmin || isAuthor) {
      enrolledStudents = await prisma.enrollment.findMany({
        where: { courseId: course.id },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
        },
        orderBy: { enrolledAt: 'desc' },
        take: 100,
      });

      liveClasses = await prisma.liveClass.findMany({
        where: { teacherId: course.teacherId },
        orderBy: { scheduledAt: 'desc' },
        take: 20,
      });
    }

    const courseObj = this.applyLessonVisibility(
      { ...course },
      { isAuthor, isEnrolled, enrollment }
    );
    return {
      course: courseObj,
      reviews,
      isEnrolled: isEnrolled || isAuthor || isAdmin,
      enrolledStudents,
      liveClasses,
      stats,
    };
  }

  async createCourse(input: CreateCourseInput, teacherId: string): Promise<any> {
    const baseSlug = (input as any).slug
      ? generateSlug((input as any).slug)
      : generateSlug(input.title);
    const existing = await prisma.course.findUnique({ where: { slug: baseSlug } });
    const finalSlug = existing ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    const assignedTeacherId = (input as any).teacherId || teacherId;
    const categoryId =
      (input as any).categoryId || (input as any).category || (input as any).examCategory || null;

    const sections = input.sections || [];
    let totalLessons = 0;
    let totalDuration = 0;
    sections.forEach((sec: any) => {
      (sec.lessons || []).forEach((les: any) => {
        totalLessons++;
        totalDuration += Number(les.duration) || 0;
      });
    });

    const thumbnail =
      typeof input.thumbnail === 'object'
        ? input.thumbnail
        : input.thumbnail
          ? { url: input.thumbnail }
          : { url: '' };

    const course = await prisma.course.create({
      data: {
        title: input.title,
        slug: finalSlug,
        description: input.description || '',
        price: Number(input.price) || 0,
        isPublished:
          (input as any).isPublished !== undefined ? Boolean((input as any).isPublished) : false,
        isFeatured:
          (input as any).isFeatured !== undefined ? Boolean((input as any).isFeatured) : false,
        thumbnail,
        language: input.language || 'English',
        level: input.level || 'beginner',
        sections,
        totalLessons,
        totalDuration,
        teacherId: assignedTeacherId,
        categoryId,
        tenantId: (input as any).tenantId || null,
      },
    });
    await redis.delPattern('courses:*');
    return course;
  }

  async updateCourse(
    id: string,
    teacherId: string,
    input: UpdateCourseInput,
    isAdmin = false
  ): Promise<any> {
    const where = isAdmin ? { id } : { id, teacherId };
    const course = await prisma.course.findFirst({ where });
    if (!course) throw ApiError.notFound('Course not found or unauthorized');

    let newSlug = course.slug;
    if (input.title && input.title !== course.title) {
      const generatedSlug = generateSlug(input.title);
      const existing = await prisma.course.findUnique({ where: { slug: generatedSlug } });
      newSlug =
        existing && existing.id !== course.id
          ? `${generatedSlug}-${Date.now().toString().slice(-4)}`
          : generatedSlug;
    }

    const updateData: any = {};
    if (input.title) {
      updateData.title = input.title;
      updateData.slug = newSlug;
    }
    if (input.description !== undefined) updateData.description = input.description;
    if (input.price !== undefined) updateData.price = Number(input.price);
    if ((input as any).isPublished !== undefined)
      updateData.isPublished = Boolean((input as any).isPublished);
    if ((input as any).isFeatured !== undefined)
      updateData.isFeatured = Boolean((input as any).isFeatured);
    if (input.thumbnail !== undefined) {
      updateData.thumbnail =
        typeof input.thumbnail === 'object' ? input.thumbnail : { url: input.thumbnail };
    }
    if (input.language !== undefined) updateData.language = input.language;
    if (input.level !== undefined) updateData.level = input.level;
    if (input.sections !== undefined) {
      updateData.sections = input.sections;
      let totalLessons = 0;
      let totalDuration = 0;
      input.sections.forEach((sec: any) => {
        (sec.lessons || []).forEach((les: any) => {
          totalLessons++;
          totalDuration += Number(les.duration) || 0;
        });
      });
      updateData.totalLessons = totalLessons;
      updateData.totalDuration = totalDuration;
    }
    if ((input as any).categoryId || (input as any).category || (input as any).examCategory) {
      updateData.categoryId =
        (input as any).categoryId || (input as any).category || (input as any).examCategory;
    }

    const updated = await prisma.course.update({
      where: { id },
      data: updateData,
    });
    await redis.delPattern('courses:*');
    await redis.delPattern(`course:${course.slug}:*`);
    return updated;
  }

  async deleteCourse(id: string, teacherId: string, isAdmin = false): Promise<void> {
    const where = isAdmin ? { id } : { id, teacherId };
    const course = await prisma.course.findFirst({ where });
    if (!course) throw ApiError.notFound('Course not found or unauthorized');

    const enrollmentCount = await prisma.enrollment.count({ where: { courseId: course.id } });
    if (enrollmentCount > 0) {
      await prisma.course.update({ where: { id: course.id }, data: { isPublished: false } });
    } else {
      await prisma.course.delete({ where: { id: course.id } });
    }
    await redis.delPattern('courses:*');
    await redis.delPattern(`course:${course.slug}:*`);
  }

  async getTeacherCourses(
    teacherId: string,
    query: { page?: number; limit?: number; status?: string; search?: string }
  ): Promise<{ docs: any[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = { teacherId };
    if (query.status) {
      if (query.status === 'published') filter.isPublished = true;
      if (query.status === 'draft') filter.isPublished = false;
    }
    if (query.search) {
      filter.title = { contains: query.search, mode: 'insensitive' };
    }

    const [docs, total] = await Promise.all([
      prisma.course.findMany({
        where: filter,
        skip,
        take: limit,
        include: { category: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.course.count({ where: filter }),
    ]);
    return { docs, total };
  }

  async publishCourse(id: string, teacherId: string, isAdmin = false): Promise<any> {
    const where: any = { id };
    if (!isAdmin) {
      where.teacherId = teacherId;
    }
    const course = await prisma.course.findFirst({ where });
    if (!course) throw ApiError.notFound('Course not found');

    const nextStatus = !course.isPublished;

    if (nextStatus && !isAdmin) {
      let sections = [];
      if (typeof course.sections === 'string') {
        try {
          sections = JSON.parse(course.sections);
        } catch (e) {}
      } else {
        sections = (course.sections as any) || [];
      }

      if (!sections.length) throw ApiError.badRequest('Course must have at least one section');
      const hasLessons = sections.some((s: any) => s.lessons && s.lessons.length > 0);
      if (!hasLessons) throw ApiError.badRequest('Course must have at least one lesson');
    }

    const updated = await prisma.course.update({
      where: { id },
      data: { isPublished: nextStatus },
    });

    await redis.delPattern('courses:*');
    await redis.delPattern(`course:${course.slug}:*`);
    return { ...updated, _id: updated.id, status: updated.isPublished ? 'published' : 'draft' };
  }

  async getFeaturedCourses(): Promise<any[]> {
    const cacheKey = 'courses:featured';
    const cached = await redis.get(cacheKey);
    if (cached) return (cached as any).courses;

    const courses = await prisma.course.findMany({
      where: { isPublished: true, isFeatured: true },
      include: {
        teacher: { select: { name: true, avatar: true } },
        category: { select: { name: true, slug: true } },
      },
      orderBy: { rating: 'desc' },
      take: 8,
    });

    await redis.set(cacheKey, { courses }, 1800);
    return courses;
  }

  async getSampleClasses(): Promise<any[]> {
    const cacheKey = 'courses:samples';
    const cached = await redis.get(cacheKey);
    if (cached) return (cached as any).samples;

    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      include: { teacher: { select: { name: true, avatar: true } } },
      take: 10,
    });

    const samples: any[] = [];
    courses.forEach((course: any) => {
      let sections = [];
      if (typeof course.sections === 'string') {
        try {
          sections = JSON.parse(course.sections);
        } catch (e) {}
      } else {
        sections = (course.sections as any) || [];
      }
      sections.forEach((section: any) => {
        (section.lessons || []).forEach((lesson: any) => {
          if (lesson.isFree && lesson.type === 'video') {
            samples.push({
              id: lesson.id || lesson._id,
              courseId: course.id,
              courseTitle: course.title,
              courseSlug: course.slug,
              teacher: course.teacher,
              thumbnail: course.thumbnail,
              title: lesson.title,
              duration: lesson.duration,
              videoUrl: lesson.videoUrl,
            });
          }
        });
      });
    });

    const topSamples = samples.slice(0, 6);
    await redis.set(cacheKey, { samples: topSamples }, 3600);
    return topSamples;
  }
}
export default CourseService;
