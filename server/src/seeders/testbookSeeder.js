import mongoose from 'mongoose';
import ExamCategory from '../modules/exam-category/examCategory.model.js';
import TestSeries from '../modules/test-series/testSeries.model.js';
import Test from '../modules/test/test.model.ts';
import User from '../modules/user/user.model.js';

async function seedTestbookArchitecture() {
  await mongoose.connect('mongodb://127.0.0.1:27017/testbook');
  console.log('Connected to MongoDB for Testbook multi-series seeding...');

  let rajParent = await ExamCategory.findOne({ slug: 'rajasthan-exams' });
  if (!rajParent) {
    rajParent = await ExamCategory.create({
      name: 'Rajasthan Specific Exams',
      slug: 'rajasthan-exams',
      description: 'Comprehensive RPSC & RSMSSB Exams in Rajasthan',
      icon: '🏛️',
      parent: null,
      order: 1,
    });
  } else {
    await ExamCategory.updateOne({ _id: rajParent._id }, { name: 'Rajasthan Specific Exams' });
  }

  let polParent = await ExamCategory.findOne({ slug: 'political-science-exams' });
  if (!polParent) {
    polParent = await ExamCategory.create({
      name: 'Political Science Special Exams',
      slug: 'political-science-exams',
      description: 'Specialized Assistant Professor & PGT Exams',
      icon: '🎓',
      parent: null,
      order: 2,
    });
  } else {
    await ExamCategory.updateOne(
      { _id: polParent._id },
      { name: 'Political Science Special Exams' }
    );
  }

  const rajSlugs = [
    'ras',
    'rpsc-eo-ro',
    'rpsc-si',
    'rpsc-1st-2nd-grade',
    'rajasthan-cet',
    'patwari',
    'vdo',
  ];
  const polSlugs = [
    'rpsc-assistant-professor-political-science',
    'uphesc-assistant-professor-political-science',
    'mppsc-assistant-professor-political-science',
    'pgt-political-science',
  ];

  await ExamCategory.updateMany({ slug: { $in: rajSlugs } }, { parent: rajParent._id });
  await ExamCategory.updateMany({ slug: { $in: polSlugs } }, { parent: polParent._id });

  const exams = await ExamCategory.find({ parent: { $ne: null } }).lean();
  const teacher =
    (await User.findOne({ role: { $in: ['admin', 'teacher'] } })) || (await User.findOne({}));
  const teacherId = teacher._id;
  const tenantId = teacher.tenantId || new mongoose.Types.ObjectId('6a7aad3a7ad4fc7bce698ffd');

  await TestSeries.deleteMany({});
  await Test.deleteMany({});
  console.log('Cleared old TestSeries and Test documents...');

  const packageTemplates = [
    {
      type: 'full_length',
      titleSuffix: 'Full Length Mock Test Series 2026',
      slugSuffix: 'full_length-series',
      description:
        'Complete full-length mock test series based on the latest 2026 exam pattern with all-India rank analytics.',
      testsCount: 15,
      questionsCount: 2250,
      totalMarks: 3000,
      price: 499,
      discountPrice: 999,
    },
    {
      type: 'pyq',
      titleSuffix: 'Official Previous Year Papers (PYQs) Series',
      slugSuffix: 'pyq-series',
      description:
        'Official authentic past year question papers with detailed step-by-step solutions.',
      testsCount: 10,
      questionsCount: 1500,
      totalMarks: 2000,
      price: 299,
      discountPrice: 599,
    },
    {
      type: 'subject_wise',
      titleSuffix: 'Subject-Wise Target Test Series',
      slugSuffix: 'subject_wise-series',
      description:
        'Specialized subject target tests to strengthen core concepts in Polity, History, Geography, and Economy.',
      testsCount: 12,
      questionsCount: 600,
      totalMarks: 1200,
      price: 199,
      discountPrice: 399,
    },
    {
      type: 'topic_wise',
      titleSuffix: 'Chapter & Topic Practice Series',
      slugSuffix: 'topic_wise-series',
      description:
        'Bite-sized chapter practice tests for rapid topic-wise practice and accuracy improvement.',
      testsCount: 18,
      questionsCount: 270,
      totalMarks: 360,
      price: 149,
      discountPrice: 299,
    },
  ];

  let grandTotalSeries = 0;
  let grandTotalTests = 0;

  for (const exam of exams) {
    for (const tpl of packageTemplates) {
      const seriesTitle = `${exam.name} ${tpl.titleSuffix}`;
      const seriesSlug = `${exam.slug}-${tpl.slugSuffix}`;

      const testSeriesDoc = await TestSeries.create({
        title: seriesTitle,
        slug: seriesSlug,
        description: tpl.description,
        instructions:
          '1. All tests are timed.\n2. Negative marking applies.\n3. Solutions and rank analytics provided upon completion.',
        examCategory: exam._id,
        testType: tpl.type,
        testsCount: tpl.testsCount,
        questionsCount: tpl.questionsCount,
        totalMarks: tpl.totalMarks,
        duration: tpl.type === 'full_length' || tpl.type === 'pyq' ? 180 : 45,
        isFree: tpl.type === 'topic_wise',
        price: tpl.price,
        discountPrice: tpl.discountPrice,
        isPublished: true,
        isFeatured: true,
        tenantId,
      });

      grandTotalSeries++;

      // Seed individual tests for this specific package
      const subjects =
        tpl.type === 'pyq'
          ? ['Official Past Paper']
          : [
              'Polity of India',
              'Indian History',
              'Geography of India and World',
              'Indian Economy',
              'Rajasthan GK',
              'Mental Ability',
            ];

      for (let i = 1; i <= tpl.testsCount; i++) {
        const subTag = subjects[(i - 1) % subjects.length];
        const isFree = i <= 2;
        const userCountVal = (Math.random() * 4 + 1.2).toFixed(1);
        const userCountStr = `${userCountVal}k Users`;

        const testTitle =
          tpl.type === 'pyq'
            ? `${exam.name} 202${Math.max(0, 5 - i)} Official Paper (Held On: 0${i} Feb, 202${Math.max(0, 5 - i)})`
            : tpl.type === 'full_length'
              ? `${exam.name} Full Length Mock Test 0${i}`
              : tpl.type === 'subject_wise'
                ? `${exam.name} Subject Test 0${i}: ${subTag}`
                : `CT ${i}: ${exam.name}: ${subTag}`;

        const qCount =
          tpl.type === 'full_length' || tpl.type === 'pyq'
            ? 150
            : tpl.type === 'subject_wise'
              ? 50
              : 15;
        const testMarks =
          tpl.type === 'full_length' || tpl.type === 'pyq'
            ? 200
            : tpl.type === 'subject_wise'
              ? 100
              : 20;
        const testDuration =
          tpl.type === 'full_length' || tpl.type === 'pyq'
            ? 180
            : tpl.type === 'subject_wise'
              ? 60
              : 18;

        const qList = Array.from({ length: 3 }, (_, qIdx) => ({
          _id: new mongoose.Types.ObjectId(),
          question: `Question ${qIdx + 1} for ${testTitle}: Which constitutional provision or historical event relates to ${subTag}?`,
          type: 'mcq',
          options: [
            { text: 'Option A: Primary Law / Event', isCorrect: true },
            { text: 'Option B: Secondary Provision', isCorrect: false },
            { text: 'Option C: Alternative Ordinance', isCorrect: false },
            { text: 'Option D: None of the above', isCorrect: false },
          ],
          correctAnswer: 'Option A: Primary Law / Event',
          marks: Math.round((testMarks / 3) * 10) / 10,
          negativeMarks: Math.round((testMarks / 3) * 0.33 * 10) / 10,
          explanation: `Detailed solution explanation for ${subTag} question.`,
          sectionName: tpl.titleSuffix,
          order: qIdx + 1,
        }));

        await Test.create({
          title: testTitle,
          slug: `${exam.slug}-${tpl.type}-test-${Date.now()}-${i}`,
          description: `Practice test for ${exam.name} (${subTag}).`,
          instructions: '1. Negative marking applies.\n2. Reattempt available anytime.',
          teacher: teacherId,
          category: exam._id,
          testSeries: testSeriesDoc._id,
          testNumber: i,
          questions: qList,
          duration: testDuration,
          totalMarks: testMarks,
          passingMarks: Math.round(testMarks * 0.4),
          difficulty: 'intermediate',
          testType: tpl.type,
          questionsCount: qCount,
          isPublished: true,
          status: 'published',
          isFree,
          price: isFree ? 0 : tpl.price,
          tenantId,
          sectionName: tpl.titleSuffix,
          categoryTag: tpl.type === 'pyq' ? 'PYPs' : 'Mock Tests',
          subjectTag: subTag,
          userCountStr,
        });

        grandTotalTests++;
      }
    }
    console.log(`Created 4 Test Series Packages for exam '${exam.name}'`);
  }

  console.log(
    `Successfully seeded multi-package Testbook architecture: ${grandTotalSeries} Test Series Packages, ${grandTotalTests} Total Tests.`
  );
  process.exit(0);
}

seedTestbookArchitecture().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
