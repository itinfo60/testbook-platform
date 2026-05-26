/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║          MASTER SEED SCRIPT v2 — Multi-Tenant Architecture          ║
 * ╠══════════════════════════════════════════════════════════════════════╣
 * ║  All data is properly scoped to a tenant (institute) per the new    ║
 * ║  Clean Architecture. Super admin has no tenant; all other users     ║
 * ║  are created inside the "demo" institute context.                   ║
 * ║                                                                      ║
 * ║  Run: node --import tsx scripts/seed.ts                             ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { AsyncLocalStorage } from 'async_hooks';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

// ── Models ────────────────────────────────────────────────────────────────────
import SubscriptionPlan from '../src/modules/subscription/subscriptionPlan.model.js';
import Institute from '../src/modules/institute/institute.model.js';
import User from '../src/modules/user/user.model.js';
import ExamCategory from '../src/modules/exam-category/examCategory.model.js';
import Badge from '../src/modules/badge/badge.model.js';
import Course from '../src/modules/course/course.model.js';
import Test from '../src/modules/test/test.model.js';
import Enrollment from '../src/modules/enrollment/enrollment.model.js';
import Review from '../src/modules/review/review.model.js';
import Discussion from '../src/modules/discussion/discussion.model.js';

// ── Tenant Context (mirrors core/tenant.context.ts) ───────────────────────────
const tenantStorage = new AsyncLocalStorage();
const runWithTenant = (tenantId, bypass, fn) => tenantStorage.run({ tenantId, bypass }, fn);

// ── Helpers ───────────────────────────────────────────────────────────────────
const daysAgo = (n) => new Date(Date.now() - n * 864e5);
const daysFromNow = (n) => new Date(Date.now() + n * 864e5);
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ── Seed Data ─────────────────────────────────────────────────────────────────

const CATEGORIES_DATA = [
  {
    name: 'Web Development',
    slug: 'web-development',
    icon: '🌐',
    description: 'Learn modern web technologies — HTML, CSS, JS, React, Node',
    order: 1,
  },
  {
    name: 'Data Science',
    slug: 'data-science',
    icon: '📊',
    description: 'Master data analysis, Python, Pandas, ML fundamentals',
    order: 2,
  },
  {
    name: 'Mobile Development',
    slug: 'mobile-development',
    icon: '📱',
    description: 'Build Android & iOS apps with React Native and Flutter',
    order: 3,
  },
  {
    name: 'Cloud Computing',
    slug: 'cloud-computing',
    icon: '☁️',
    description: 'AWS, GCP, Azure — certifications and real-world projects',
    order: 4,
  },
  {
    name: 'Cyber Security',
    slug: 'cyber-security',
    icon: '🔒',
    description: 'Security fundamentals, ethical hacking, OWASP',
    order: 5,
  },
  {
    name: 'DevOps',
    slug: 'devops',
    icon: '⚙️',
    description: 'CI/CD pipelines, Docker, Kubernetes, Terraform',
    order: 6,
  },
  {
    name: 'Programming Languages',
    slug: 'programming-languages',
    icon: '💻',
    description: 'Python, Java, Go, Rust — from basics to mastery',
    order: 7,
  },
  {
    name: 'Database',
    slug: 'database',
    icon: '🗃️',
    description: 'SQL, MongoDB, PostgreSQL, Redis — design and optimisation',
    order: 8,
  },
];

const BADGES_DATA = [
  {
    name: 'First Steps',
    slug: 'first-steps',
    description: 'Complete your first course',
    icon: '👶',
    category: 'learning',
    criteria: { type: 'courses_completed', value: 1 },
    points: 10,
    rarity: 'common',
  },
  {
    name: 'Scholar',
    slug: 'scholar',
    description: 'Complete 5 courses',
    icon: '📚',
    category: 'learning',
    criteria: { type: 'courses_completed', value: 5 },
    points: 50,
    rarity: 'rare',
  },
  {
    name: 'Test Taker',
    slug: 'test-taker',
    description: 'Take your first test',
    icon: '📝',
    category: 'achievement',
    criteria: { type: 'tests_taken', value: 1 },
    points: 15,
    rarity: 'common',
  },
  {
    name: 'Test Master',
    slug: 'test-master',
    description: 'Pass 50 tests',
    icon: '🎯',
    category: 'achievement',
    criteria: { type: 'tests_taken', value: 50 },
    points: 100,
    rarity: 'epic',
  },
  {
    name: 'Point Collector',
    slug: 'point-collector',
    description: 'Earn 100 points',
    icon: '⭐',
    category: 'achievement',
    criteria: { type: 'points_earned', value: 100 },
    points: 20,
    rarity: 'common',
  },
  {
    name: 'Streak Warrior',
    slug: 'streak-warrior',
    description: '7-day learning streak',
    icon: '🔥',
    category: 'streak',
    criteria: { type: 'streak_days', value: 7 },
    points: 50,
    rarity: 'rare',
  },
  {
    name: 'Streak Legend',
    slug: 'streak-legend',
    description: '30-day learning streak',
    icon: '💎',
    category: 'streak',
    criteria: { type: 'streak_days', value: 30 },
    points: 200,
    rarity: 'legendary',
  },
  {
    name: 'Course Explorer',
    slug: 'course-explorer',
    description: 'Enroll in 10 courses',
    icon: '🗺️',
    category: 'learning',
    criteria: { type: 'courses_enrolled', value: 10 },
    points: 40,
    rarity: 'rare',
  },
  {
    name: 'Quiz Champion',
    slug: 'quiz-champion',
    description: 'Score 100% on any quiz',
    icon: '🏆',
    category: 'achievement',
    criteria: { type: 'quiz_perfect', value: 1 },
    points: 75,
    rarity: 'epic',
  },
  {
    name: 'Community Helper',
    slug: 'community-helper',
    description: 'Reply to 20 discussions',
    icon: '🤝',
    category: 'social',
    criteria: { type: 'replies_posted', value: 20 },
    points: 30,
    rarity: 'rare',
  },
];

const COURSES_DATA = [
  {
    title: 'Complete JavaScript Mastery',
    description:
      'Go from zero to hero in JavaScript. Covers ES6+, async/await, closures, the event loop, DOM manipulation and modern patterns used in production apps.',
    shortDescription: 'Master JavaScript from fundamentals to advanced concepts.',
    price: 1999,
    discountPrice: 999,
    level: 'beginner',
    language: 'English',
    tags: ['javascript', 'es6', 'web development'],
    requirements: ['Basic HTML & CSS knowledge', 'A computer with a browser'],
    whatYouLearn: [
      'Variables, functions, scope',
      'Async programming',
      'DOM & events',
      'Modern ES6+ syntax',
    ],
    thumbnail: {
      url: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=600',
      publicId: 'js-mastery',
    },
    sections: [
      {
        title: 'JavaScript Foundations',
        description: 'Core language concepts every developer must know.',
        lessons: [
          {
            title: 'Variables & Data Types',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
            duration: 18,
            isFree: true,
            dripDays: 0,
            content: 'Understanding var, let, const and JavaScript data types.',
          },
          {
            title: 'Functions & Scope',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
            duration: 22,
            isFree: true,
            dripDays: 0,
            content: 'Arrow functions, closures and lexical scope.',
          },
          {
            title: 'Arrays & Objects',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
            duration: 25,
            isFree: false,
            dripDays: 1,
            content: 'Destructuring, spread/rest, Map, Set.',
          },
        ],
      },
      {
        title: 'Asynchronous JavaScript',
        description: 'Promises, async/await and the event loop.',
        lessons: [
          {
            title: 'Promises & Callbacks',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=DHvZLI7Db8E',
            duration: 20,
            isFree: false,
            dripDays: 3,
            content: 'Managing async code with promises.',
          },
          {
            title: 'Async/Await Deep Dive',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=V_Kr9OSfDeU',
            duration: 28,
            isFree: false,
            dripDays: 5,
            content: 'Writing clean async code.',
          },
          {
            title: 'The Event Loop',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=8aGhZQkoFbQ',
            duration: 15,
            isFree: false,
            dripDays: 7,
            content: 'How the event loop really works.',
          },
        ],
      },
    ],
  },
  {
    title: 'React 18 — Complete Developer Course',
    description:
      'Build modern React applications with hooks, context, Redux Toolkit, React Query and advanced patterns. Includes 3 full production projects.',
    shortDescription: 'Build real-world apps with React 18 and modern tooling.',
    price: 2499,
    discountPrice: 1299,
    level: 'intermediate',
    language: 'English',
    tags: ['react', 'javascript', 'frontend'],
    requirements: ['Good understanding of JavaScript', 'Basic HTML & CSS'],
    whatYouLearn: [
      'React Hooks in depth',
      'State management with Redux Toolkit',
      'React Query for data fetching',
      'Testing with React Testing Library',
    ],
    thumbnail: {
      url: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=600',
      publicId: 'react-course',
    },
    sections: [
      {
        title: 'React Fundamentals',
        description: 'Components, props and state.',
        lessons: [
          {
            title: 'Intro to React & JSX',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=Ke90Tje7VS0',
            duration: 20,
            isFree: true,
            dripDays: 0,
            content: 'Setting up a React app with Vite.',
          },
          {
            title: 'State & useState Hook',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=O6P86uwfdR0',
            duration: 24,
            isFree: false,
            dripDays: 2,
            content: 'Managing local component state.',
          },
          {
            title: 'useEffect & Side Effects',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=O6P86uwfdR0',
            duration: 22,
            isFree: false,
            dripDays: 4,
            content: 'Handling side effects and lifecycle.',
          },
        ],
      },
      {
        title: 'State Management',
        description: 'Redux Toolkit and React Query.',
        lessons: [
          {
            title: 'Redux Toolkit Essentials',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=CVpUuw9XSjY',
            duration: 35,
            isFree: false,
            dripDays: 7,
            content: 'Slices, thunks and the store.',
          },
          {
            title: 'React Query Deep Dive',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=CVpUuw9XSjY',
            duration: 30,
            isFree: false,
            dripDays: 10,
            content: 'Caching, invalidation and optimistic updates.',
          },
        ],
      },
    ],
  },
  {
    title: 'Node.js & Express — Backend Mastery',
    description:
      'Build production-grade REST APIs with Node.js, Express, MongoDB and JWT authentication. Covers MVC architecture, file uploads, rate limiting and deployment.',
    shortDescription: 'Build scalable backend APIs with Node.js and Express.',
    price: 2199,
    discountPrice: 1099,
    level: 'intermediate',
    language: 'English',
    tags: ['nodejs', 'express', 'backend', 'mongodb'],
    requirements: ['JavaScript fundamentals', 'Basic understanding of HTTP'],
    whatYouLearn: [
      'REST API design',
      'JWT authentication',
      'MongoDB & Mongoose',
      'File uploads & storage',
      'Rate limiting & security',
    ],
    thumbnail: {
      url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600',
      publicId: 'nodejs-course',
    },
    sections: [
      {
        title: 'Node.js Core',
        description: 'Modules, events and the file system.',
        lessons: [
          {
            title: 'Node.js Architecture',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=TlB_eWDSMt4',
            duration: 18,
            isFree: true,
            dripDays: 0,
            content: 'How Node.js works under the hood.',
          },
          {
            title: 'Building with Express',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=SccSCuHhOw0',
            duration: 25,
            isFree: false,
            dripDays: 2,
            content: 'Routes, middleware and error handling.',
          },
          {
            title: 'MongoDB & Mongoose',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=ExcRbA7fy_A',
            duration: 30,
            isFree: false,
            dripDays: 4,
            content: 'Schemas, models and CRUD operations.',
          },
        ],
      },
      {
        title: 'Authentication & Security',
        description: 'JWT, bcrypt and secure API design.',
        lessons: [
          {
            title: 'JWT Authentication',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=7Q17ubqLfaM',
            duration: 28,
            isFree: false,
            dripDays: 7,
            content: 'Access tokens, refresh tokens and blacklisting.',
          },
          {
            title: 'Rate Limiting & Helmet',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=fgTGADljAeg',
            duration: 15,
            isFree: false,
            dripDays: 10,
            content: 'Protecting your API from abuse.',
          },
        ],
      },
    ],
  },
  {
    title: 'Python for Data Science — Zero to Hero',
    description:
      'Master Python for data science including NumPy, Pandas, Matplotlib, Seaborn and an introduction to Machine Learning with scikit-learn.',
    shortDescription: 'Complete Python data science course with ML intro.',
    price: 1799,
    discountPrice: 899,
    level: 'beginner',
    language: 'English',
    tags: ['python', 'data science', 'machine learning'],
    requirements: ['No prior programming experience needed', 'Basic math knowledge'],
    whatYouLearn: [
      'Python fundamentals',
      'Data analysis with Pandas',
      'Data visualization',
      'Machine learning basics',
    ],
    thumbnail: {
      url: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600',
      publicId: 'python-ds',
    },
    sections: [
      {
        title: 'Python Basics',
        description: 'Core Python for data work.',
        lessons: [
          {
            title: 'Python Syntax & Data Types',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
            duration: 22,
            isFree: true,
            dripDays: 0,
            content: 'Variables, lists, dicts, tuples.',
          },
          {
            title: 'NumPy Fundamentals',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=QUT1VHiLmmI',
            duration: 28,
            isFree: false,
            dripDays: 2,
            content: 'Arrays, broadcasting, vectorization.',
          },
          {
            title: 'Pandas for Data Analysis',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=vmEHCJofslg',
            duration: 35,
            isFree: false,
            dripDays: 4,
            content: 'DataFrames, groupby, merge, pivot.',
          },
        ],
      },
      {
        title: 'Data Visualization & ML',
        description: 'Charts and intro to ML.',
        lessons: [
          {
            title: 'Matplotlib & Seaborn',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=3Xc3CA655Y4',
            duration: 25,
            isFree: false,
            dripDays: 7,
            content: 'Line, bar, scatter and heatmaps.',
          },
          {
            title: 'Intro to scikit-learn',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=0Lt9w-BxKFQ',
            duration: 30,
            isFree: false,
            dripDays: 10,
            content: 'Linear regression, classification, pipelines.',
          },
        ],
      },
    ],
  },
  {
    title: 'AWS Cloud Practitioner — Exam Ready',
    description:
      'Comprehensive preparation for the AWS Certified Cloud Practitioner exam. Covers all domains: cloud concepts, security, pricing, and core services.',
    shortDescription: 'Pass the AWS Cloud Practitioner exam with confidence.',
    price: 2999,
    discountPrice: 1499,
    level: 'beginner',
    language: 'English',
    tags: ['aws', 'cloud', 'certification'],
    requirements: ['No prior cloud experience needed', 'Basic IT concepts helpful'],
    whatYouLearn: [
      'AWS core services',
      'Cloud pricing & support',
      'Security & compliance',
      'Exam strategy & practice tests',
    ],
    thumbnail: {
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600',
      publicId: 'aws-course',
    },
    sections: [
      {
        title: 'Cloud Foundations',
        description: 'What is cloud and why AWS?',
        lessons: [
          {
            title: 'Cloud Computing Concepts',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=3hLmDS179YE',
            duration: 20,
            isFree: true,
            dripDays: 0,
            content: 'IaaS, PaaS, SaaS and deployment models.',
          },
          {
            title: 'AWS Global Infrastructure',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=3hLmDS179YE',
            duration: 15,
            isFree: false,
            dripDays: 2,
            content: 'Regions, Availability Zones, Edge Locations.',
          },
        ],
      },
      {
        title: 'Core AWS Services',
        description: 'EC2, S3, RDS, Lambda and more.',
        lessons: [
          {
            title: 'EC2 & Compute Services',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=3hLmDS179YE',
            duration: 30,
            isFree: false,
            dripDays: 4,
            content: 'Instance types, auto scaling, load balancing.',
          },
          {
            title: 'S3 & Storage',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=3hLmDS179YE',
            duration: 22,
            isFree: false,
            dripDays: 6,
            content: 'Buckets, storage classes, lifecycle policies.',
          },
          {
            title: 'IAM & Security',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=3hLmDS179YE',
            duration: 25,
            isFree: false,
            dripDays: 8,
            content: 'Users, roles, policies and MFA.',
          },
          {
            title: 'Pricing & Support Plans',
            type: 'video',
            videoUrl: 'https://www.youtube.com/watch?v=3hLmDS179YE',
            duration: 18,
            isFree: false,
            dripDays: 10,
            content: 'Pay-as-you-go, reserved instances, savings plans.',
          },
        ],
      },
    ],
  },
];

const TEST_QUESTIONS = (topic) => [
  {
    question: `What is the primary purpose of ${topic}?`,
    type: 'mcq',
    options: [
      { text: `To manage and process ${topic} operations efficiently`, isCorrect: true },
      { text: `To replace traditional programming approaches entirely`, isCorrect: false },
      { text: `To only work with frontend development tasks`, isCorrect: false },
      { text: `To eliminate the need for databases`, isCorrect: false },
    ],
    explanation: `${topic} is designed to manage and process operations efficiently in modern software.`,
    marks: 2,
    negativeMarks: 0.5,
    difficulty: 'easy',
  },
  {
    question: `Which of the following is a key feature of ${topic}?`,
    type: 'mcq',
    options: [
      { text: 'Scalability and performance optimization', isCorrect: true },
      { text: 'Only works on Windows systems', isCorrect: false },
      { text: 'Requires physical hardware to function', isCorrect: false },
      { text: 'Cannot integrate with other services', isCorrect: false },
    ],
    explanation: 'Scalability and performance are core features in modern software systems.',
    marks: 2,
    negativeMarks: 0.5,
    difficulty: 'medium',
  },
  {
    question: `In the context of ${topic}, what does "asynchronous" mean?`,
    type: 'mcq',
    options: [
      { text: 'Operations that run independently without blocking execution', isCorrect: true },
      { text: 'Operations that always run sequentially', isCorrect: false },
      { text: 'Operations that require user input', isCorrect: false },
      { text: 'Operations that only run on the server', isCorrect: false },
    ],
    explanation: 'Asynchronous means operations execute independently, improving efficiency.',
    marks: 3,
    negativeMarks: 1,
    difficulty: 'medium',
  },
  {
    question: `Which design pattern is most commonly used in ${topic} development?`,
    type: 'mcq',
    options: [
      { text: 'MVC (Model-View-Controller)', isCorrect: true },
      { text: 'Singleton across all services', isCorrect: false },
      { text: 'Hardcoded configuration files', isCorrect: false },
      { text: 'Manual memory management only', isCorrect: false },
    ],
    explanation: 'MVC separates concerns and is widely adopted in modern applications.',
    marks: 2,
    negativeMarks: 0.5,
    difficulty: 'hard',
  },
  {
    question: `What is the best practice for error handling in ${topic}?`,
    type: 'mcq',
    options: [
      { text: 'Use try-catch blocks and meaningful error messages', isCorrect: true },
      { text: 'Ignore errors to improve performance', isCorrect: false },
      { text: 'Only handle errors in the frontend', isCorrect: false },
      { text: 'Log errors to console and continue', isCorrect: false },
    ],
    explanation:
      'Proper error handling with try-catch and meaningful messages is the industry standard.',
    marks: 2,
    negativeMarks: 0.5,
    difficulty: 'easy',
  },
];

const REVIEW_COMMENTS = [
  'Excellent course! The explanations are crystal clear and the projects are practical.',
  'Great content but could use more advanced examples. Overall very satisfied.',
  'Best course I have taken on this topic. The instructor explains brilliantly.',
  'Very comprehensive. I landed a job after completing this course!',
  'Good pacing and well-structured content. Would recommend to beginners.',
  'The practice tests really helped solidify my understanding.',
  'Amazing course. The real-world projects made all the difference.',
  'Solid fundamentals. Wish there were more advanced sections but still great value.',
  'Clear explanations and good examples. Learned a lot in a short time!',
  'Worth every rupee. The support in discussions is top-notch.',
];
const RATINGS = [5, 4, 5, 5, 4, 5, 4, 5, 4, 5];

const DISCUSSION_SEEDS = [
  {
    title: 'How does the event loop work in JavaScript?',
    content:
      'I understand the concept but I am confused about microtasks vs macrotasks. Can someone explain with a clear example?',
  },
  {
    title: 'Best practices for React state management?',
    content:
      'When should I use Redux vs Context API vs local state? What are the performance implications of each approach?',
  },
  {
    title: 'Understanding async/await error handling',
    content:
      'Should I always wrap async/await in try-catch? Or are there cases where it is fine to let errors propagate?',
  },
  {
    title: 'MongoDB indexing strategy for large datasets',
    content:
      'My queries are slow on a collection with 1M+ documents. What indexes should I create and how do I analyze query performance?',
  },
  {
    title: 'JWT vs Session-based authentication — which to choose?',
    content:
      'I am building a REST API. Should I use JWTs or server sessions? What are the trade-offs in a microservices architecture?',
  },
  {
    title: 'How to structure a large React application?',
    content:
      'My codebase is growing and it is getting hard to maintain. What folder structure and patterns do you recommend for a large React app?',
  },
];

// ─────────────────────────────────────────────────────────────────────────────

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('\n📦 Connected to MongoDB');

  // ── 0. WIPE ALL COLLECTIONS ──────────────────────────────────────────────────
  console.log('\n🗑️  Clearing existing data...');
  await Promise.all([
    SubscriptionPlan.deleteMany({}),
    Institute.deleteMany({}),
    User.deleteMany({}),
    ExamCategory.deleteMany({}),
    Badge.deleteMany({}),
    Course.deleteMany({}),
    Test.deleteMany({}),
    Enrollment.deleteMany({}),
    Review.deleteMany({}),
    Discussion.deleteMany({}),
  ]);
  console.log('   ✓ All collections cleared\n');

  // ── 1. SUBSCRIPTION PLANS ───────────────────────────────────────────────────
  console.log('💳 Seeding subscription plans...');
  const [starterPlan, growthPlan, premiumPlan] = await SubscriptionPlan.insertMany([
    {
      name: 'starter',
      price: 999,
      billingCycle: 'monthly',
      studentLimit: 100,
      teacherLimit: 3,
      storageLimit: 5 * 1024 * 1024 * 1024, // 5 GB
      features: [
        'Up to 100 students',
        'Up to 3 teachers',
        '5 GB storage',
        'Basic analytics',
        'Email support',
      ],
      isActive: true,
    },
    {
      name: 'growth',
      price: 2999,
      billingCycle: 'monthly',
      studentLimit: 500,
      teacherLimit: 10,
      storageLimit: 25 * 1024 * 1024 * 1024, // 25 GB
      features: [
        'Up to 500 students',
        'Up to 10 teachers',
        '25 GB storage',
        'Advanced analytics',
        'Priority support',
        'Custom branding',
      ],
      isActive: true,
    },
    {
      name: 'premium',
      price: 7999,
      billingCycle: 'monthly',
      studentLimit: 5000,
      teacherLimit: 50,
      storageLimit: 100 * 1024 * 1024 * 1024, // 100 GB
      features: [
        'Up to 5000 students',
        'Up to 50 teachers',
        '100 GB storage',
        'Full analytics suite',
        'Dedicated support',
        'White-label',
        'API access',
      ],
      isActive: true,
    },
  ]);
  console.log(`   ✓ 3 plans: starter (₹999), growth (₹2999), premium (₹7999)\n`);

  // ── 2. SUPER ADMIN (no tenant) ───────────────────────────────────────────────
  console.log('👑 Creating super admin...');
  const superAdmin = await User.create({
    name: 'Super Admin',
    email: 'admin@testbook.com',
    password: 'Admin@123456',
    role: 'super_admin',
    isEmailVerified: true,
    isActive: true,
  });
  console.log(`   ✓ admin@testbook.com / Admin@123456\n`);

  // ── 3. INSTITUTE (owned by a platform admin user) ───────────────────────────
  console.log('🏫 Creating demo institute...');

  // Create the institute owner (institute admin) — no tenantId yet
  const instituteOwner = await User.create({
    name: 'Demo Institute Admin',
    email: 'institute@demo.com',
    password: 'Admin@123456',
    role: 'admin',
    isEmailVerified: true,
    isActive: true,
  });

  const institute = await Institute.create({
    name: 'Demo Academy',
    subdomain: 'demo',
    logo: {
      url: 'https://ui-avatars.com/api/?name=Demo+Academy&background=6366f1&color=fff&size=200',
      publicId: 'demo-logo',
    },
    theme: { primaryColor: '#6366f1', secondaryColor: '#4f46e5', bannerUrl: '', faviconUrl: '' },
    websiteTitle: 'Demo Academy — Learn Without Limits',
    contactDetails: {
      email: 'contact@demo.com',
      phone: '+91 98765 43210',
      address: 'Bengaluru, Karnataka, India',
    },
    owner: instituteOwner._id,
    isActive: true,
    subscription: {
      plan: growthPlan._id,
      status: 'active',
      expiresAt: daysFromNow(365),
    },
    limits: {
      studentLimit: 500,
      teacherLimit: 10,
      storageLimit: 25 * 1024 * 1024 * 1024,
    },
  });

  const tenantId = institute._id.toString();
  console.log(`   ✓ "Demo Academy" | subdomain: demo | tenantId: ${tenantId}\n`);

  // Assign tenantId to institute owner now that institute exists
  await User.findByIdAndUpdate(instituteOwner._id, { tenantId });

  // ── 4. TEACHERS & STUDENTS (all scoped to the institute) ────────────────────
  console.log('👨‍🏫 Creating teachers & students...');

  const teacher = await User.create({
    name: 'Rahul Sharma',
    email: 'teacher@demo.com',
    password: 'Teacher@123456',
    role: 'teacher',
    isEmailVerified: true,
    isActive: true,
    tenantId,
    teacherProfile: {
      qualification: 'M.Tech Computer Science, IIT Delhi',
      experience: '8 years of industry + teaching experience',
      specialization: ['Web Development', 'React', 'Node.js'],
      isVerified: true,
    },
  });

  const teacher2 = await User.create({
    name: 'Priya Mehta',
    email: 'teacher2@demo.com',
    password: 'Teacher@123456',
    role: 'teacher',
    isEmailVerified: true,
    isActive: true,
    tenantId,
    teacherProfile: {
      qualification: 'PhD Data Science, IISc Bangalore',
      experience: '6 years in data science and machine learning',
      specialization: ['Python', 'Machine Learning', 'Data Science'],
      isVerified: true,
    },
  });

  const STUDENT_NAMES = [
    ['Arjun Nair', 'arjun@demo.com'],
    ['Sneha Reddy', 'sneha@demo.com'],
    ['Vikram Singh', 'vikram@demo.com'],
    ['Ananya Iyer', 'ananya@demo.com'],
    ['Rohan Patel', 'rohan@demo.com'],
    ['Kavya Krishnan', 'kavya@demo.com'],
    ['Amit Gupta', 'amit@demo.com'],
    ['Divya Menon', 'divya@demo.com'],
    ['Karthik Rajan', 'karthik@demo.com'],
    ['Pooja Desai', 'pooja@demo.com'],
  ];

  const students = await Promise.all(
    STUDENT_NAMES.map(([name, email]) =>
      User.create({
        name,
        email,
        password: 'Student@123456',
        role: 'student',
        isEmailVerified: true,
        isActive: true,
        tenantId,
        lastActiveAt: daysAgo(rand(0, 7)),
      })
    )
  );

  console.log(`   ✓ 2 teachers, ${students.length} students — all in tenant: demo\n`);

  // ── 5. CATEGORIES ────────────────────────────────────────────────────────────
  console.log('📂 Seeding exam categories...');
  // Categories are tenant-scoped
  const categories = await Promise.all(
    CATEGORIES_DATA.map((cat) => ExamCategory.create({ ...cat, tenantId }))
  );
  console.log(`   ✓ ${categories.length} categories\n`);

  // ── 6. BADGES ────────────────────────────────────────────────────────────────
  console.log('🏆 Seeding badges...');
  const badges = await Promise.all(
    BADGES_DATA.map((b) => Badge.create({ ...b, tenantId, isActive: true }))
  );
  console.log(`   ✓ ${badges.length} badges\n`);

  // ── 7. COURSES ───────────────────────────────────────────────────────────────
  console.log('📚 Seeding courses...');
  const webDevCat = categories.find((c) => c.slug === 'web-development')!;
  const dsCat = categories.find((c) => c.slug === 'data-science')!;
  const cloudCat = categories.find((c) => c.slug === 'cloud-computing')!;

  const courseTeachers = [teacher, teacher, teacher2, teacher2, teacher];
  const courseCats = [webDevCat, webDevCat, webDevCat, dsCat, cloudCat];

  const courses = [];
  for (let i = 0; i < COURSES_DATA.length; i++) {
    const cd = COURSES_DATA[i];
    const course = await Course.create({
      ...cd,
      category: courseCats[i]._id,
      teacher: courseTeachers[i]._id,
      status: 'published',
      isFeatured: i < 2,
      tenantId,
      slug:
        cd.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') + `-${Date.now() + i}`,
    });
    courses.push(course);
  }
  console.log(`   ✓ ${courses.length} published courses\n`);

  // ── 8. TESTS ─────────────────────────────────────────────────────────────────
  console.log('📝 Seeding tests...');
  const TEST_TOPICS = ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'];
  const tests = [];
  for (let i = 0; i < TEST_TOPICS.length; i++) {
    const topic = TEST_TOPICS[i];
    const testTeacher = i < 3 ? teacher : teacher2;
    const testCat = i < 3 ? webDevCat : i === 3 ? dsCat : cloudCat;
    const test = await Test.create({
      title: `${topic} Fundamentals Test`,
      description: `Assess your ${topic} knowledge with this comprehensive test covering all key concepts.`,
      course: courses[i]._id,
      teacher: testTeacher._id,
      category: testCat._id,
      questions: TEST_QUESTIONS(topic),
      duration: 30,
      totalMarks: 10,
      passingMarks: 6,
      maxAttempts: 3,
      showResult: true,
      shuffleQuestions: true,
      status: 'published',
      tenantId,
    });
    tests.push(test);
  }
  console.log(`   ✓ ${tests.length} published tests\n`);

  // ── 9. ENROLLMENTS ───────────────────────────────────────────────────────────
  console.log('📋 Seeding enrollments...');
  const enrollments = [];
  for (const student of students) {
    // Each student enrolls in 2–4 courses
    const numCourses = rand(2, 4);
    const shuffled = [...courses].sort(() => 0.5 - Math.random()).slice(0, numCourses);
    for (const course of shuffled) {
      const isCompleted = Math.random() < 0.25;
      const pct = isCompleted ? 100 : rand(10, 90);
      const enrollment = await Enrollment.create({
        user: student._id,
        course: course._id,
        status: isCompleted ? 'completed' : 'active',
        progress: [], // lesson-level progress tracked separately
        progressPercentage: pct,
        enrolledAt: daysAgo(rand(10, 60)),
        lastAccessedAt: daysAgo(rand(0, 7)),
        completedAt: isCompleted ? daysAgo(rand(1, 10)) : undefined,
        tenantId,
      });
      enrollments.push(enrollment);
    }
  }

  // Update course totalStudents
  for (const course of courses) {
    const count = enrollments.filter((e) => e.course.toString() === course._id.toString()).length;
    await Course.findByIdAndUpdate(course._id, { totalStudents: count });
  }
  console.log(`   ✓ ${enrollments.length} enrollments\n`);

  // ── 10. REVIEWS ──────────────────────────────────────────────────────────────
  console.log('⭐ Seeding reviews...');
  let reviewCount = 0;
  const reviewed = new Set();
  for (const enrollment of enrollments) {
    const key = `${enrollment.user}-${enrollment.course}`;
    if (reviewed.has(key)) continue;
    if (Math.random() < 0.7) {
      reviewed.add(key);
      const idx = reviewCount % REVIEW_COMMENTS.length;
      await Review.create({
        user: enrollment.user,
        course: enrollment.course,
        rating: RATINGS[idx],
        comment: REVIEW_COMMENTS[idx],
        isApproved: true,
        tenantId,
        createdAt: daysAgo(rand(1, 30)),
      });
      reviewCount++;
    }
  }
  // Sync average ratings
  for (const course of courses) {
    const courseReviews = await Review.find({ course: course._id });
    if (courseReviews.length > 0) {
      const avg = courseReviews.reduce((s, r) => s + r.rating, 0) / courseReviews.length;
      await Course.findByIdAndUpdate(course._id, {
        averageRating: Math.round(avg * 10) / 10,
        totalReviews: courseReviews.length,
      });
    }
  }
  console.log(`   ✓ ${reviewCount} reviews\n`);

  // ── 11. DISCUSSIONS ──────────────────────────────────────────────────────────
  console.log('💬 Seeding discussions...');
  let discCount = 0;
  for (const [i, ds] of DISCUSSION_SEEDS.entries()) {
    const course = courses[i % courses.length];
    const student = students[i % students.length];
    const replier = students[(i + 1) % students.length];
    await Discussion.create({
      user: student._id,
      course: course._id,
      title: ds.title,
      content: ds.content,
      replies: [
        {
          user: teacher._id,
          content: 'Great question! Let me break it down step by step with a clear example.',
          createdAt: daysAgo(rand(1, 5)),
        },
        {
          user: replier._id,
          content: "I had the same doubt! The teacher's explanation really cleared it up for me.",
          createdAt: daysAgo(rand(0, 3)),
        },
      ],
      likes: students.slice(0, rand(2, 5)).map((s) => s._id),
      isResolved: i % 2 === 0,
      tenantId,
      createdAt: daysAgo(rand(5, 30)),
    });
    discCount++;
  }
  console.log(`   ✓ ${discCount} discussions with replies\n`);

  // ── SUMMARY ──────────────────────────────────────────────────────────────────
  const divider = '═'.repeat(60);
  console.log(divider);
  console.log('✅  SEED COMPLETE — Multi-Tenant Architecture');
  console.log(divider);
  console.log(`  Subscription Plans : 3 (starter, growth, premium)`);
  console.log(`  Institute          : Demo Academy (subdomain: demo)`);
  console.log(`  Tenant ID          : ${tenantId}`);
  console.log(`  Categories         : ${categories.length}`);
  console.log(`  Badges             : ${badges.length}`);
  console.log(
    `  Users              : 1 super_admin + 1 institute_admin + 2 teachers + ${students.length} students`
  );
  console.log(`  Courses            : ${courses.length} (all published)`);
  console.log(`  Tests              : ${tests.length}`);
  console.log(`  Enrollments        : ${enrollments.length}`);
  console.log(`  Reviews            : ${reviewCount}`);
  console.log(`  Discussions        : ${discCount}`);
  console.log('─'.repeat(60));
  console.log('  LOGIN CREDENTIALS');
  console.log('─'.repeat(60));
  console.log('  Super Admin  :  admin@testbook.com         /  Admin@123456');
  console.log('  Inst. Admin  :  institute@demo.com         /  Admin@123456');
  console.log('  Teacher      :  teacher@demo.com           /  Teacher@123456');
  console.log('  Teacher 2    :  teacher2@demo.com          /  Teacher@123456');
  console.log('  Student      :  arjun@demo.com             /  Student@123456');
  console.log('  (all 10 students use Student@123456)');
  console.log('─'.repeat(60));
  console.log('  FRONT-END SETUP');
  console.log('─'.repeat(60));
  console.log(`  Add to client/.env:`);
  console.log(`  VITE_TENANT_ID=${tenantId}`);
  console.log(divider + '\n');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('\n❌ Seed error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
