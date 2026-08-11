import mongoose from 'mongoose';
import config from './src/config/index.js';
import Course from './src/modules/course/course.model.js';
import Test from './src/modules/test/test.model.js';
import TestAttempt from './src/modules/test/testAttempt.model.js';
import Blog from './src/modules/blog/blog.model.js';
import ExamCategory from './src/modules/exam-category/examCategory.model.js';
import Enrollment from './src/modules/enrollment/enrollment.model.js';
import Quiz from './src/modules/quiz/quiz.model.js';

async function auditOrphans() {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  console.log('Connected to DB');

  const orphans = {
    coursesWithoutCategory: await Course.find({ category: { $exists: false } }).countDocuments(),
    coursesWithInvalidCategory: 0,
    testsWithoutCourseOrCategory: await Test.find({
      $and: [{ course: { $exists: false } }, { category: { $exists: false } }],
    }).countDocuments(),
    blogsWithoutCategory: 0, // Need to check if Blog has category
    enrollmentsWithoutUser: await Enrollment.find({ user: { $exists: false } }).countDocuments(),
    enrollmentsWithoutCourse: await Enrollment.find({
      course: { $exists: false },
    }).countDocuments(),
  };

  // Find invalid categories for courses
  const courses = await Course.find({ category: { $exists: true, $ne: null } }).select('category');
  let invalidCategories = 0;
  for (const c of courses) {
    const cat = await ExamCategory.findById(c.category);
    if (!cat) invalidCategories++;
  }
  orphans.coursesWithInvalidCategory = invalidCategories;

  console.log('Orphan Data Audit:');
  console.log(JSON.stringify(orphans, null, 2));

  process.exit(0);
}

auditOrphans().catch(console.error);
