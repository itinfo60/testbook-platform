import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import models
import ExamCategory from '../modules/exam-category/examCategory.model.js';
import TestSeries from '../modules/test-series/testSeries.model.js';
import Test from '../modules/test/test.model.ts';
import User from '../modules/user/user.model.ts';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/testbook';

const seedDailyQuiz = async () => {
  try {
    console.log('Connecting to MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // 1. Get an Admin user
    const adminUser = await User.findOne({ role: { $in: ['admin', 'super_admin'] } });
    if (!adminUser) {
      throw new Error('Admin user not found. Please run eduportalSeeder.js first.');
    }

    const tenantId = adminUser.tenantId || adminUser._id;

    // 2. Get a category for the quiz (e.g. RAS)
    const category = await ExamCategory.findOne({ slug: 'ras' });

    if (!category) {
      throw new Error('RAS category not found. Please run eduportalSeeder.js first.');
    }

    // 3. Create Daily Test Series
    console.log('Creating Daily Test Series...');
    const dailySeries = await TestSeries.create({
      title: 'Daily Challenge: RAS Prelims Specific',
      slug: `daily-challenge-ras-${Date.now()}`,
      description: 'Test your knowledge daily with fresh questions tailored for RAS Prelims.',
      examCategory: category._id,
      testType: 'daily',
      price: 0,
      discountPrice: 0,
      isFree: true,
      isPublished: true,
      publishedAt: new Date(),
      validityDays: 365,
      tenantId: tenantId,
      testsCount: 1,
      questionsCount: 10,
      duration: 10, // 10 minutes
    });

    console.log(`Created Daily Test Series: ${dailySeries.title}`);

    // 4. Create a Test for this series
    console.log('Creating a Daily Test inside the series...');
    const dailyTest = await Test.create({
      title: `Daily Quiz - ${new Date().toLocaleDateString('en-IN')}`,
      slug: `daily-quiz-${Date.now()}`,
      description: "Today's 10-minute sprint challenge. Complete this to maintain your streak!",
      testSeries: dailySeries._id,
      category: category._id,
      type: 'mock',
      difficulty: 'intermediate',
      teacher: adminUser._id,
      price: 0,
      isFree: true,
      isPublished: true,
      totalMarks: 20,
      passingMarks: 8,
      duration: 10, // 10 minutes
      questions: [
        {
          question: '<p>What is the capital of Rajasthan?</p>',
          type: 'mcq',
          options: [
            { text: 'Jaipur', isCorrect: true },
            { text: 'Jodhpur', isCorrect: false },
            { text: 'Udaipur', isCorrect: false },
            { text: 'Kota', isCorrect: false },
          ],
          marks: 2,
          negativeMarks: 0.66,
          order: 1,
        },
      ],
      tenantId: tenantId,
    });

    console.log(`Created Daily Test: ${dailyTest.title}`);

    console.log('🎉 DAILY QUIZ SEEDING COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedDailyQuiz();
