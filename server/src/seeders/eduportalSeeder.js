import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import models
import ExamCategory from '../modules/exam-category/examCategory.model.js';
import Course from '../modules/course/course.model.ts';
import Test from '../modules/test/test.model.ts';
import Blog from '../modules/blog/blog.model.js';
import LibraryResource from '../modules/library/library.model.ts';
import User from '../modules/user/user.model.ts';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/testbook-platform';

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // 1. Ensure an Admin user exists for tenantId reference
    let adminUser = await User.findOne({ role: { $in: ['admin', 'super_admin'] } });
    if (!adminUser) {
      console.log('Creating default admin user...');
      adminUser = await User.create({
        name: 'EduPortal Admin',
        email: 'admin@eduportal.com',
        password: '$2a$10$X87q8sQpD7M1/m/qQ0m9p.J8zN6hS4G3P5q5z5z5z5z5z5z5z5z5', // dummy
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
      });
    }

    const tenantId = adminUser.tenantId || adminUser._id;

    // 2. Exam Categories List (Rajasthan Specific + Political Science Special)
    const examCategoriesData = [
      // 🟢 RAJASTHAN SPECIFIC
      {
        name: 'RAS (Prelims & Mains)',
        slug: 'ras',
        icon: '🏛️',
        description:
          'Complete Preparation for Rajasthan Administrative Service (RAS) Prelims & Mains Exam conducted by RPSC.',
        conductingBody: 'RPSC (Rajasthan Public Service Commission)',
        latestStatus: 'Notification Expected Soon',
        officialWebsite: 'https://rpsc.rajasthan.gov.in',
        syllabus:
          '<h3>RAS Prelims Syllabus</h3><p>General Knowledge & General Science: History, Art, Culture, Literature, Tradition & Heritage of Rajasthan; Indian History; Geography of World, India & Rajasthan; Indian Constitution, Political System & Governance; Administrative System of Rajasthan; Economic Concepts and Indian Economy; Economy of Rajasthan; Science & Technology; Reasoning & Mental Ability; Current Affairs.</p><h3>RAS Mains Syllabus</h3><p>Paper I: General Studies I (History, Economics, Sociology, Management, Accounting & Auditing)<br/>Paper II: General Studies II (Administrative Ethics, General Science & Technology, Earth Science)<br/>Paper III: General Studies III (Indian Political System, World Politics, Current Affairs, Concepts of Law, State Administration)<br/>Paper IV: General Hindi & General English</p>',
        examPattern:
          '<h4>RAS Prelims Pattern</h4><ul><li>Objective Type Multiple Choice Questions</li><li>Total Marks: 200 | Questions: 150 | Duration: 3 Hours</li><li>Negative Marking: 1/3rd mark deducted per wrong answer</li></ul><h4>RAS Mains Pattern</h4><ul><li>Descriptive / Analytical 4 Papers</li><li>Paper I to IV: 200 Marks Each (Total 800 Marks)</li><li>Duration: 3 Hours per Paper</li></ul>',
        eligibility:
          '<strong>Educational Qualification:</strong> Graduate degree in any discipline from a recognized University.<br/><strong>Age Limit:</strong> 21 to 40 years (Relaxation applicable for reserved categories as per Rajasthan Govt rules).',
        selectionProcess:
          '1. Preliminary Examination (Screening Test)<br/>2. Main Examination (Written Descriptive)<br/>3. Personality Test & Interview (100 Marks)',
        importantDates: [
          {
            label: 'Expected Notification',
            date: new Date('2026-09-01'),
            description: 'Official RPSC Calendar Update',
          },
          {
            label: 'Prelims Exam Date',
            date: new Date('2026-11-15'),
            description: 'Tentative Schedule',
          },
        ],
        order: 1,
        isActive: true,
      },
      {
        name: 'RPSC EO & RO (Part A + Part B Special)',
        slug: 'rpsc-eo-ro',
        icon: '🏢',
        description:
          'Dedicated guidance for Revenue Officer (RO Grade II) & Executive Officer (EO Grade IV) exam.',
        conductingBody: 'RPSC',
        latestStatus: 'Revised Syllabus Published',
        officialWebsite: 'https://rpsc.rajasthan.gov.in',
        syllabus:
          '<h3>Part A (80 Marks)</h3><p>General Knowledge: History, Art & Culture of Rajasthan, Indian Constitution, Polity & Governance, Geography of Rajasthan.</p><h3>Part B (40 Marks)</h3><p>Rajasthan Municipalities Act 2009, Rules & Schemes relating to Urban Bodies in Rajasthan.</p>',
        examPattern:
          'Total Marks: 120 | Total Questions: 120 | Duration: 2 Hours | Negative Marking: 1/3rd',
        eligibility: 'Graduate in any discipline. Age: 18 - 40 Years.',
        selectionProcess:
          'Single Stage Written Competitive Examination followed by Document Verification.',
        importantDates: [
          { label: 'Exam Date', date: new Date('2026-10-20'), description: 'RPSC Tentative Date' },
        ],
        order: 2,
        isActive: true,
      },
      {
        name: 'RPSC SI (Sub-Inspector)',
        slug: 'rpsc-si',
        icon: '👮',
        description:
          'Complete course and test series for Rajasthan Police Sub Inspector (SI) Combined Competitive Exam.',
        conductingBody: 'RPSC & Rajasthan Police',
        latestStatus: 'Physical Test Completed',
        officialWebsite: 'https://rpsc.rajasthan.gov.in',
        syllabus:
          'Paper I: General Hindi (Grammar, Vocabulary, Translation, Composition - 200 Marks)<br/>Paper II: General Knowledge & General Science (200 Marks)',
        examPattern:
          'Paper I (Hindi): 100 Qs / 200 Marks / 2 Hours<br/>Paper II (GK & Science): 100 Qs / 200 Marks / 2 Hours<br/>Negative Marking: 1/3rd',
        eligibility:
          'Graduate degree. Age: 20 to 25 years (relaxations apply). Physical fitness standards as prescribed.',
        selectionProcess:
          '1. Written Examination<br/>2. Physical Efficiency Test (PET)<br/>3. Aptitude Test & Interview',
        importantDates: [],
        order: 3,
        isActive: true,
      },
      {
        name: '1st Grade & 2nd Grade (Teacher)',
        slug: 'rpsc-1st-2nd-grade',
        icon: '👨‍🏫',
        description:
          'RPSC School Lecturer (1st Grade) & Senior Teacher (2nd Grade) Competitive Examination.',
        conductingBody: 'RPSC',
        latestStatus: 'Application Window Announced',
        officialWebsite: 'https://rpsc.rajasthan.gov.in',
        syllabus:
          'Paper 1: General Studies & Educational Management.<br/>Paper 2: Subject Concerned (Political Science, History, Geography, Hindi, English, etc.)',
        examPattern:
          'Paper 1: 150 Marks (75 Qs) | Paper 2: 300 Marks (150 Qs). Minimum qualifying 40% marks required per paper.',
        eligibility: 'Post Graduate + B.Ed (for 1st Grade) / Graduate + B.Ed (for 2nd Grade).',
        selectionProcess: 'Written Examination (Paper 1 + Paper 2) & Merit List.',
        importantDates: [],
        order: 4,
        isActive: true,
      },
      {
        name: 'Rajasthan CET (Graduation & 10+2)',
        slug: 'rajasthan-cet',
        icon: '📝',
        description:
          'Common Eligibility Test for various Rajasthan Subordinate Services (Graduation & Secondary Level).',
        conductingBody: 'RSMSSB (Rajasthan Staff Selection Board)',
        latestStatus: 'Scorecard Valid for 1 Year',
        officialWebsite: 'https://rsmssb.rajasthan.gov.in',
        syllabus:
          'Rajasthan GK, History, Art & Culture, Polity, Geography, General Science, Reasoning, Maths, General Hindi, General English, Computer Knowledge.',
        examPattern: '150 Questions | 300 Marks | Duration: 3 Hours | No Negative Marking.',
        eligibility: '12th Pass (10+2 Level) / Bachelor Degree (Graduation Level).',
        selectionProcess: 'Screening Test (CET Score used for main recruitment applications).',
        importantDates: [],
        order: 5,
        isActive: true,
      },
      {
        name: 'Patwari',
        slug: 'patwari',
        icon: '📐',
        description: 'Rajasthan Revenue Board Patwari Direct Recruitment Examination.',
        conductingBody: 'RSMSSB',
        latestStatus: 'New Vacancy Announcement Soon',
        officialWebsite: 'https://rsmssb.rajasthan.gov.in',
        syllabus:
          'General Science, History, Polity, Geography of India & Rajasthan, General English & Hindi, Mental Ability & Reasoning, Basic Numerical Efficiency, Basic Computer.',
        examPattern: '150 Questions | 300 Marks | Duration: 3 Hours | Negative Marking: 1/3rd',
        eligibility: 'Graduate Degree + RSCIT / Computer Diploma.',
        selectionProcess: 'Written Examination & Document Verification.',
        importantDates: [
          {
            label: 'Target Exam Date',
            date: new Date('2026-12-05'),
            description: 'Expected Schedule',
          },
        ],
        order: 6,
        isActive: true,
      },
      {
        name: 'VDO (Village Development Officer)',
        slug: 'vdo',
        icon: '🌾',
        description:
          'Gram Vikas Adhikari (VDO) Recruitment Examination in Panchayati Raj Department.',
        conductingBody: 'RSMSSB',
        latestStatus: 'Final Result Declared',
        officialWebsite: 'https://rsmssb.rajasthan.gov.in',
        syllabus:
          'Current Affairs, Geography & Natural Resources, Agriculture & Economic Development in Rajasthan, History & Culture, General Mental Ability, Reasoning, Mathematics, Hindi, English, Computer Knowledge.',
        examPattern: 'Prelims + Mains Examination format.',
        eligibility: 'Graduate Degree + RSCIT diploma.',
        selectionProcess: 'Written Examination (Prelims & Mains).',
        importantDates: [],
        order: 7,
        isActive: true,
      },

      // 🔵 POLITICAL SCIENCE SPECIAL
      {
        name: 'Assistant Professor (RPSC Rajasthan)',
        slug: 'rpsc-assistant-professor-political-science',
        icon: '🎓',
        description:
          'Specialized preparation for RPSC Assistant Professor Political Science (College Education Dept).',
        conductingBody: 'RPSC',
        latestStatus: 'Interview Dates Announced',
        officialWebsite: 'https://rpsc.rajasthan.gov.in',
        syllabus:
          '<h3>Paper I (Political Theory & Thought)</h3><p>Political Theory, Political Concepts, Western Political Thought, Indian Political Thought.</p><h3>Paper II (Comparative & International Relations)</h3><p>Comparative Politics, Political Analysis, International Politics, Foreign Policy of India, Political Dynamics of Rajasthan.</p><h3>Paper III (General Studies of Rajasthan)</h3><p>History, Art, Culture, Literature & Heritage, Geography, Economy, Political & Administrative System of Rajasthan (50 Marks).</p>',
        examPattern:
          'Paper I: 75 Marks (150 Qs)<br/>Paper II: 75 Marks (150 Qs)<br/>Paper III (GS of Rajasthan): 50 Marks (100 Qs)<br/>Total Written: 200 Marks | Interview: 24 Marks',
        eligibility:
          'Master Degree in Political Science with minimum 55% marks + UGC NET/SET qualified or Ph.D.',
        selectionProcess: '1. Written Examination (200 Marks)<br/>2. Interview (24 Marks)',
        importantDates: [
          {
            label: 'Written Exam Result',
            date: new Date('2026-08-30'),
            description: 'Merit List Out',
          },
        ],
        order: 8,
        isActive: true,
      },
      {
        name: 'Assistant Professor (UPHESC Uttar Pradesh)',
        slug: 'uphesc-assistant-professor-political-science',
        icon: '🏛️',
        description:
          'UP Higher Education Services Commission Assistant Professor Political Science.',
        conductingBody: 'UPHESC',
        latestStatus: 'Syllabus Updated',
        officialWebsite: 'https://uphesc.org',
        syllabus:
          'General Knowledge (30 Questions - 60 Marks) + Political Science Core Subject (70 Questions - 140 Marks).',
        examPattern: 'Total 100 Questions | 200 Marks | Interview: 30 Marks',
        eligibility: 'MA in Political Science 55% + NET/SLET/Ph.D.',
        selectionProcess: 'Written Test + Interview.',
        importantDates: [],
        order: 9,
        isActive: true,
      },
      {
        name: 'Assistant Professor (MPPSC Madhya Pradesh)',
        slug: 'mppsc-assistant-professor-political-science',
        icon: '📜',
        description:
          'Madhya Pradesh Public Service Commission Assistant Professor Political Science.',
        conductingBody: 'MPPSC',
        latestStatus: 'Exam Notification Active',
        officialWebsite: 'https://mppsc.mp.gov.in',
        syllabus:
          'Paper I: MP GK, History, Culture & IT (200 Marks)<br/>Paper II: Political Science Core (600 Marks)',
        examPattern: 'Written Exam: 800 Marks | Interview: 100 Marks',
        eligibility: 'PG in Political Science + NET/SET/Ph.D.',
        selectionProcess: 'Written Exam + Interview.',
        importantDates: [],
        order: 10,
        isActive: true,
      },
      {
        name: 'PGT / 1st Grade (UP, KVS, NVS, Delhi)',
        slug: 'pgt-political-science',
        icon: '📚',
        description:
          'Post Graduate Teacher (PGT) Political Science for KVS, NVS, DSSSB & State Boards.',
        conductingBody: 'KVS / NVS / DSSSB / UP Secondary Board',
        latestStatus: 'Continuous Batches Available',
        officialWebsite: '',
        syllabus:
          'Political Theory, Indian Constitution, Comparative Politics, International Relations, Political Thought (Plato to Rawls, Kautilya to Ambedkar), Teaching Methodology.',
        examPattern: 'Objective MCQ Test + Interview / Micro Teaching.',
        eligibility: 'M.A. Political Science + B.Ed.',
        selectionProcess: 'Written Test + Interview.',
        importantDates: [],
        order: 11,
        isActive: true,
      },
    ];

    // Delete existing categories and re-seed
    await ExamCategory.deleteMany({});
    console.log('Cleared existing exam categories.');

    examCategoriesData.forEach((c) => {
      c.tenantId = tenantId;
    });

    const createdCategories = await ExamCategory.insertMany(examCategoriesData);
    console.log(`Successfully seeded ${createdCategories.length} Exam Categories!`);

    const categoryMap = {};
    createdCategories.forEach((c) => {
      categoryMap[c.slug] = c._id;
    });

    // 3. Seed Sample Courses
    await Course.deleteMany({});
    console.log('Cleared existing courses.');

    const sampleCourses = [
      {
        title: 'Target Patwari Special Foundation Batch 2026',
        slug: 'target-patwari-special-foundation-batch-2026',
        description:
          'Complete comprehensive course covering Rajasthan GK, Maths, Reasoning, Hindi, English, and Computer for RSMSSB Patwari Exam.',
        teacher: adminUser._id,
        category: categoryMap['patwari'],
        price: 2999,
        discountPrice: 999,
        effectivePrice: 999,
        isFree: false,
        isPublished: true,
        isFeatured: true,
        enrollmentCount: 1420,
        averageRating: 4.8,
        totalReviews: 128,
        sections: [
          {
            title: 'Module 1: Rajasthan Art, Culture & History',
            lessons: [
              {
                title: 'Lecture 01: Forts and Palaces of Rajasthan (Demo Class)',
                type: 'video',
                duration: 45,
                isFree: true,
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
              },
              {
                title: 'Lecture 02: Major Fairs and Festivals of Rajasthan',
                type: 'video',
                duration: 50,
                isFree: false,
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
              },
              {
                title: 'Class Notes: Rajasthan Architecture PDF',
                type: 'text',
                duration: 0,
                isFree: true,
                videoUrl: '',
                content: 'Class notes available in attachments.',
              },
            ],
          },
          {
            title: 'Module 2: Indian Polity & Rajasthan Administrative System',
            lessons: [
              {
                title: 'Lecture 01: Preamble & Fundamental Rights (Demo Class)',
                type: 'video',
                duration: 55,
                isFree: true,
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
              },
              {
                title: 'Lecture 02: Governor & Chief Minister Powers',
                type: 'video',
                duration: 60,
                isFree: false,
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
              },
            ],
          },
        ],
        tenantId,
      },
      {
        title: 'RPSC Assistant Professor Political Science — Paper 1 & 2 Special',
        slug: 'rpsc-assistant-professor-political-science-paper-1-2-special',
        description:
          'Master Political Theory, Western & Indian Political Thought, International Relations & Comparative Politics with In-depth Conceptual Analysis by Senior Faculty.',
        teacher: adminUser._id,
        category: categoryMap['rpsc-assistant-professor-political-science'],
        price: 7999,
        discountPrice: 3499,
        effectivePrice: 3499,
        isFree: false,
        isPublished: true,
        isFeatured: true,
        enrollmentCount: 890,
        averageRating: 4.9,
        totalReviews: 95,
        sections: [
          {
            title: 'Unit 1: Western Political Thought',
            lessons: [
              {
                title: 'Plato: Ideal State, Philosopher King & Theory of Justice (Demo)',
                type: 'video',
                duration: 75,
                isFree: true,
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
              },
              {
                title: 'Aristotle: Theory of State, Slavery & Revolution',
                type: 'video',
                duration: 80,
                isFree: false,
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
              },
              {
                title: 'Machiavelli: Realism, Religion & Statecraft',
                type: 'video',
                duration: 60,
                isFree: false,
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
              },
            ],
          },
          {
            title: 'Unit 2: Political Theory & Concepts',
            lessons: [
              {
                title: 'Liberty, Equality & Justice (Rawls & Nozick)',
                type: 'video',
                duration: 90,
                isFree: true,
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
              },
            ],
          },
        ],
        tenantId,
      },
      {
        title: 'RAS Prelims 2026 Complete GS Crash Course',
        slug: 'ras-prelims-2026-complete-gs-crash-course',
        description:
          'Fast-track targeted preparation for RAS Prelims covering Rajasthan History, Geography, Polity, Science, Reasoning & Current Affairs.',
        teacher: adminUser._id,
        category: categoryMap['ras'],
        price: 4999,
        discountPrice: 1999,
        effectivePrice: 1999,
        isFree: false,
        isPublished: true,
        isFeatured: true,
        enrollmentCount: 2350,
        averageRating: 4.7,
        totalReviews: 210,
        sections: [
          {
            title: 'Section 1: Rajasthan Economy & Budget 2026',
            lessons: [
              {
                title: 'Rajasthan Economic Survey Key Highlights (Demo)',
                type: 'video',
                duration: 50,
                isFree: true,
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
              },
            ],
          },
        ],
        tenantId,
      },
      {
        title: 'RPSC EO & RO Part-B Special Batch (Municipalities Act 2009)',
        slug: 'rpsc-eo-ro-part-b-special-batch',
        description:
          'Complete coverage of Rajasthan Municipalities Act 2009, Rules & Urban Schemes with 1000+ Practice MCQs.',
        teacher: adminUser._id,
        category: categoryMap['rpsc-eo-ro'],
        price: 1999,
        discountPrice: 699,
        effectivePrice: 699,
        isFree: false,
        isPublished: true,
        isFeatured: true,
        enrollmentCount: 1120,
        averageRating: 4.8,
        totalReviews: 87,
        sections: [],
        tenantId,
      },
    ];

    const createdCourses = await Course.insertMany(sampleCourses);
    console.log(`Seeded ${createdCourses.length} sample courses!`);

    // 4. Seed Sample Tests
    await Test.deleteMany({});
    console.log('Cleared existing tests.');

    const sampleTests = [
      {
        title: 'Patwari Full Length Mock Test 1 (Latest Exam Pattern)',
        slug: 'patwari-full-length-mock-test-1',
        description:
          '150 Questions full test according to latest RSMSSB syllabus with detailed answer explanations.',
        teacher: adminUser._id,
        category: categoryMap['patwari'],
        duration: 180,
        questionsCount: 150,
        totalMarks: 300,
        passingMarks: 120,
        isFree: true,
        isPublished: true,
        isFeatured: true,
        totalAttempts: 450,
        averageScore: 184,
        passRate: 68,
        tenantId,
      },
      {
        title: 'RAS Prelims Full Mock Test Series 2026 - Test 01',
        slug: 'ras-prelims-full-mock-test-1',
        description:
          '150 GS Questions covering Rajasthan GK, History, Geography, Polity, Science, Reasoning & Current Affairs.',
        teacher: adminUser._id,
        category: categoryMap['ras'],
        duration: 180,
        questionsCount: 150,
        totalMarks: 200,
        passingMarks: 80,
        isFree: true,
        isPublished: true,
        isFeatured: true,
        totalAttempts: 980,
        averageScore: 92,
        passRate: 54,
        tenantId,
      },
      {
        title: 'Political Science Paper-I Subject Test: Western Political Thought',
        slug: 'pol-sci-paper-1-western-thought-test',
        description: 'Topic-wise mock test for RPSC Assistant Professor & PGT Political Science.',
        teacher: adminUser._id,
        category: categoryMap['rpsc-assistant-professor-political-science'],
        duration: 90,
        questionsCount: 75,
        totalMarks: 150,
        passingMarks: 60,
        isFree: true,
        isPublished: true,
        isFeatured: true,
        totalAttempts: 320,
        averageScore: 104,
        passRate: 72,
        tenantId,
      },
    ];

    const createdTests = await Test.insertMany(sampleTests);
    console.log(`Seeded ${createdTests.length} sample tests!`);

    // 5. Seed Library Resources (Syllabus, PYQs, Mind Maps, Current Affairs)
    await LibraryResource.deleteMany({});
    console.log('Cleared existing library resources.');

    const sampleResources = [
      {
        title: 'Patwari Official Syllabus & Exam Scheme PDF',
        description: 'Detailed topic-wise syllabus issued by RSMSSB for Rajasthan Patwari Exam.',
        category: categoryMap['patwari'],
        resourceType: 'syllabus',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileType: 'application/pdf',
        accessLevel: 'all',
        downloadsCount: 1240,
        tenantId,
      },
      {
        title: 'Patwari 2021 Previous Year Question Paper with Answer Key',
        description: 'Original solved question paper with official answer key.',
        category: categoryMap['patwari'],
        resourceType: 'pyq',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileType: 'application/pdf',
        accessLevel: 'all',
        downloadsCount: 3100,
        tenantId,
      },
      {
        title: 'RAS Prelims 2023 Solved Question Paper PDF',
        description: 'Complete solved paper with authentic RPSC answer key explanations.',
        category: categoryMap['ras'],
        resourceType: 'pyq',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileType: 'application/pdf',
        accessLevel: 'all',
        downloadsCount: 4500,
        tenantId,
      },
      {
        title: 'Political Science: Western Political Thought Mind Map & Quick Revision Notes',
        description:
          'Short revision chart for Plato, Aristotle, Machiavelli, Hobbes, Locke, Rousseau, Mill, Marx, and Rawls.',
        category: categoryMap['rpsc-assistant-professor-political-science'],
        resourceType: 'mind_map',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileType: 'application/pdf',
        accessLevel: 'all',
        downloadsCount: 1890,
        tenantId,
      },
      {
        title: 'Rajasthan Monthly Current Affairs Digest — July 2026',
        description:
          'Coverage of major Rajasthan government schemes, appointments, budget updates, sports & awards.',
        category: categoryMap['ras'],
        resourceType: 'current_affairs',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileType: 'application/pdf',
        accessLevel: 'all',
        downloadsCount: 2750,
        tenantId,
      },
    ];

    const createdResources = await LibraryResource.insertMany(sampleResources);
    console.log(`Seeded ${createdResources.length} library resources!`);

    // 6. Seed Sample Blogs & Job Alerts
    await Blog.deleteMany({});
    console.log('Cleared existing blogs.');

    const sampleBlogs = [
      {
        title: 'RSMSSB Patwari 5546 Vacancy Notification 2026 Released — Check Dates & Syllabus',
        slug: 'rsmssb-patwari-5546-vacancy-notification-2026',
        content:
          '<p>Rajasthan Staff Selection Board (RSMSSB) has announced official notification for direct recruitment of Patwari post in Revenue Department.</p><h4>Key Highlights:</h4><ul><li>Total Posts: 5546</li><li>Application Start: 15 August 2026</li><li>Last Date: 15 September 2026</li><li>Exam Date: December 2026</li></ul>',
        excerpt:
          'RSMSSB has announced 5546 Patwari vacancies. Check application dates, eligibility, and full syllabus details.',
        author: adminUser._id,
        type: 'job_alert',
        examCategory: categoryMap['patwari'],
        status: 'published',
        publishedAt: new Date(),
        jobAlert: {
          organization: 'RSMSSB (Rajasthan Board)',
          notificationDate: new Date('2026-08-01'),
          applicationStart: new Date('2026-08-15'),
          applicationEnd: new Date('2026-09-15'),
          examDate: new Date('2026-12-05'),
          officialNotificationUrl: 'https://rsmssb.rajasthan.gov.in',
          totalVacancies: 5546,
        },
        tenantId,
      },
      {
        title: 'How to Score 120+ Marks in RPSC Assistant Professor Political Science Paper 1',
        slug: 'how-to-score-120-plus-rpsc-assistant-professor-political-science',
        content:
          '<p>Strategy and booklist for mastering Political Theory and Western Political Thought for RPSC College Lecturer exam.</p>',
        excerpt:
          'Expert preparation strategy, unit-wise weightage, and standard reference booklist for RPSC Assistant Professor Political Science.',
        author: adminUser._id,
        type: 'article',
        examCategory: categoryMap['rpsc-assistant-professor-political-science'],
        status: 'published',
        publishedAt: new Date(),
        tenantId,
      },
      {
        title: 'Rajasthan Budget 2026-27: Major Schemes for Competitive Exams',
        slug: 'rajasthan-budget-2026-27-major-schemes-competitive-exams',
        content:
          '<p>Important points from Rajasthan State Budget for RAS, Patwari, and EO/RO Exams.</p>',
        excerpt:
          'Complete summary of newly launched Rajasthan state government welfare schemes and budget allocations.',
        author: adminUser._id,
        type: 'current_affairs',
        examCategory: categoryMap['ras'],
        status: 'published',
        publishedAt: new Date(),
        tenantId,
      },
    ];

    const createdBlogs = await Blog.insertMany(sampleBlogs);
    console.log(`Seeded ${createdBlogs.length} sample blogs/job alerts!`);

    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedData();
