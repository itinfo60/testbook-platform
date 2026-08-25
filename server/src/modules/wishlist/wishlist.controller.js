import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';
import redis from '../../config/redis.js';
import prisma from '../../config/prisma.js';

export const getWishlist = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const courseIds = (await redis.get(`wishlist:${userId}`)) || [];

  if (courseIds.length === 0) {
    return ApiResponse.paginated(res, { docs: [], page: 1, limit: 10, total: 0 });
  }

  // Fetch actual course details from DB
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, title: true, slug: true, price: true, thumbnail: true, rating: true },
  });

  const docs = courses.map((course) => ({
    id: course.id,
    courseId: course.id,
    course,
  }));

  ApiResponse.paginated(res, { docs, page: 1, limit: 10, total: docs.length });
});

export const toggleWishlist = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { courseId } = req.body;
  if (!courseId) return ApiResponse.badRequest(res, 'Course ID is required');

  const key = `wishlist:${userId}`;
  let courseIds = (await redis.get(key)) || [];

  const index = courseIds.indexOf(courseId);
  if (index !== -1) {
    courseIds.splice(index, 1);
    await redis.set(key, courseIds, 60 * 60 * 24 * 30);
    return ApiResponse.ok(res, { isWishlisted: false }, 'Removed from wishlist');
  } else {
    courseIds.push(courseId);
    await redis.set(key, courseIds, 60 * 60 * 24 * 30);
    return ApiResponse.ok(res, { isWishlisted: true }, 'Added to wishlist');
  }
});

export const checkWishlist = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { courseId } = req.params;
  const courseIds = (await redis.get(`wishlist:${userId}`)) || [];
  ApiResponse.ok(res, { isWishlisted: courseIds.includes(courseId) });
});
