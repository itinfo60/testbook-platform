import Course from '../course/course.model.js';
import Test from '../test/test.model.js';
import Blog from '../blog/blog.model.js';
import LibraryResource from '../library/library.model.js';
import ExamCategory from '../exam-category/examCategory.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import catchAsync from '../../utils/catchAsync.js';

/**
 * Global search across all content types.
 * GET /api/v1/search?q=patwari&limit=5
 */
export const globalSearch = catchAsync(async (req, res) => {
  const { q, limit = 5 } = req.query;

  if (!q || q.trim().length < 2) {
    return ApiResponse.ok(res, {
      exams: [],
      courses: [],
      tests: [],
      blogs: [],
      resources: [],
    });
  }

  const searchRegex = new RegExp(q.trim(), 'i');
  const maxResults = Math.min(parseInt(limit) || 5, 20);

  const [exams, courses, tests, blogs, resources] = await Promise.all([
    ExamCategory.find({
      isActive: true,
      $or: [{ name: searchRegex }, { description: searchRegex }, { conductingBody: searchRegex }],
    })
      .select('name slug icon description conductingBody courseCount testCount')
      .limit(maxResults)
      .lean(),

    Course.find({
      isPublished: true,
      $or: [{ title: searchRegex }, { description: searchRegex }],
    })
      .select(
        'title slug thumbnail price discountPrice isFree category averageRating enrollmentCount'
      )
      .populate('category', 'name slug')
      .limit(maxResults)
      .lean(),

    Test.find({
      isPublished: true,
      $or: [{ title: searchRegex }, { description: searchRegex }],
    })
      .select('title slug duration questionsCount totalMarks isFree price category')
      .populate('category', 'name slug')
      .limit(maxResults)
      .lean(),

    Blog.find({
      status: 'published',
      $or: [{ title: searchRegex }, { excerpt: searchRegex }, { tags: searchRegex }],
    })
      .select('title slug excerpt type coverImage publishedAt examCategory')
      .populate('examCategory', 'name slug')
      .limit(maxResults)
      .lean(),

    LibraryResource.find({
      $or: [{ title: searchRegex }, { description: searchRegex }, { tags: searchRegex }],
    })
      .select('title description fileUrl fileType accessLevel resourceType category')
      .populate('category', 'name slug')
      .limit(maxResults)
      .lean(),
  ]);

  const totalResults =
    exams.length + courses.length + tests.length + blogs.length + resources.length;

  ApiResponse.ok(res, {
    query: q.trim(),
    totalResults,
    exams,
    courses,
    tests,
    blogs,
    resources,
  });
});
