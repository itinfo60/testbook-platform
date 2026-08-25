import prisma from '../../config/prisma.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';

export const getPublicFaculty = catchAsync(async (req, res) => {
  const where = {
    role: 'teacher',
    isActive: true,
  };

  const [teachers, totalPublishedCourses, totalEnrollments, reviewAgg] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        phone: true,
        teacherProfile: true,
        createdAt: true,
        courses: {
          where: { isPublished: true },
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            price: true,
            rating: true,
            category: { select: { name: true } },
            _count: { select: { enrollments: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.course.count({ where: { isPublished: true } }),
    prisma.enrollment.count(),
    prisma.review.aggregate({ _avg: { rating: true }, _count: true }),
  ]);

  // Parse teacherProfile and filter for enabled faculty (default to true if not explicitly false)
  const faculty = teachers
    .map((t) => {
      const profile =
        typeof t.teacherProfile === 'string'
          ? JSON.parse(t.teacherProfile)
          : t.teacherProfile || {};

      const showOnFaculty = profile.showOnFaculty !== false;
      const teacherEnrollments = t.courses.reduce(
        (sum, c) => sum + (c._count?.enrollments || 0),
        0
      );
      const calculatedAvgRating =
        t.courses.length > 0
          ? Math.round(
              (t.courses.reduce((sum, c) => sum + (c.rating || 5.0), 0) / t.courses.length) * 10
            ) / 10
          : 5.0;

      return {
        id: t.id,
        _id: t.id,
        name: t.name,
        email: t.email,
        avatar: t.avatar,
        phone: t.phone,
        bio:
          profile.bio ||
          t.bio ||
          'Dedicated educator committed to student guidance and success in state & national competitive exams.',
        headline: profile.headline || profile.designation || 'Expert Faculty & Mentor',
        designation: profile.designation || profile.headline || 'Subject Specialist',
        qualification: profile.qualification || 'Educator',
        experience: profile.experience || '',
        specialization: Array.isArray(profile.specialization)
          ? profile.specialization.filter(Boolean)
          : typeof profile.specialization === 'string' && profile.specialization.trim()
            ? profile.specialization
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        subjects:
          Array.isArray(profile.subjects) && profile.subjects.length > 0
            ? profile.subjects.filter(Boolean)
            : Array.isArray(profile.specialization) && profile.specialization.length > 0
              ? profile.specialization.filter(Boolean)
              : typeof profile.specialization === 'string' && profile.specialization.trim()
                ? profile.specialization
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [],
        links: profile.links || profile.socialLinks || {},
        isFeatured: !!profile.isFeatured,
        isVerified: profile.isVerified !== false,
        showOnFaculty,
        courses: t.courses,
        coursesCount: t.courses.length,
        studentCount: teacherEnrollments,
        rating: calculatedAvgRating,
      };
    })
    .filter((f) => f.showOnFaculty)
    .sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return (b.coursesCount || 0) - (a.coursesCount || 0);
    });

  const realAvg = reviewAgg._avg?.rating ? Math.round(reviewAgg._avg.rating * 10) / 10 : 4.9;

  const stats = {
    totalFaculty: faculty.length,
    totalCourses: totalPublishedCourses,
    totalStudents: totalEnrollments,
    avgRating: realAvg,
  };

  ApiResponse.ok(res, { faculty, total: faculty.length, stats });
});
