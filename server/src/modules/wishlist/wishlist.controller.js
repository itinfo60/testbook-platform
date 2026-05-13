import Wishlist from './wishlist.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import catchAsync from '../../utils/catchAsync.js';
import { buildPaginationQuery } from '../../utils/pagination.js';

export const getWishlist = catchAsync(async (req, res) => {
  const pagination = buildPaginationQuery(req.query);

  const result = await Wishlist.paginate({ user: req.userId }, {
    ...pagination,
    populate: {
      path: 'course',
      select: 'title slug thumbnail price discountPrice averageRating enrollmentCount teacher',
      populate: { path: 'teacher', select: 'name avatar' },
    },
    sort: '-createdAt',
  });

  ApiResponse.paginated(res, {
    docs: result.docs,
    page: result.pagination.page,
    limit: result.pagination.limit,
    total: result.pagination.total,
  });
});

export const toggleWishlist = catchAsync(async (req, res) => {
  const { courseId } = req.body;

  const existing = await Wishlist.findOne({ user: req.userId, course: courseId });

  if (existing) {
    await Wishlist.findByIdAndDelete(existing._id);
    return ApiResponse.ok(res, { isWishlisted: false }, 'Removed from wishlist');
  }

  await Wishlist.create({ user: req.userId, course: courseId });
  ApiResponse.created(res, { isWishlisted: true }, 'Added to wishlist');
});

export const checkWishlist = catchAsync(async (req, res) => {
  const exists = await Wishlist.findOne({ user: req.userId, course: req.params.courseId });
  ApiResponse.ok(res, { isWishlisted: !!exists });
});
