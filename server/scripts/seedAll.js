/**
 * Master seed script — wipes all collections and inserts rich bulk data.
 * Run: node scripts/seedAll.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../src/modules/user/user.model.js';
import ExamCategory from '../src/modules/exam-category/examCategory.model.js';
import Badge from '../src/modules/badge/badge.model.js';
import Course from '../src/modules/course/course.model.js';
import Test from '../src/modules/test/test.model.js';
import Quiz from '../src/modules/quiz/quiz.model.js';
import QuizAttempt from '../src/modules/quiz/quizAttempt.model.js';
import Enrollment from '../src/modules/enrollment/enrollment.model.js';
import Payment from '../src/modules/payment/payment.model.js';
import Review from '../src/modules/review/review.model.js';
import Discussion from '../src/modules/discussion/discussion.model.js';
import Blog from '../src/modules/blog/blog.model.js';

// ─── helpers ──────────────────────────────────────────────────────────────────
const daysAgo = (n) => new Date(Date.now() - n * 864e5);
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const uniqueSlug = (title, suffix = '') =>
  `${title}${suffix}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// ─── raw data ─────────────────────────────────────────────────────────────────

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

// Real YouTube educational videos mapped by topic keyword
const VIDEO_MAP = {
  // JavaScript
  javascript: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
  variables: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
  functions: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
  arrays: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
  es6: 'https://www.youtube.com/watch?v=NCwa_xi0Uuc',
  closures: 'https://www.youtube.com/watch?v=3a0I8ICR1Vg',
  promises: 'https://www.youtube.com/watch?v=DHvZLI7Db8E',
  async: 'https://www.youtube.com/watch?v=V_Kr9OSfDeU',
  'event loop': 'https://www.youtube.com/watch?v=8aGhZQkoFbQ',
  // React
  react: 'https://www.youtube.com/watch?v=Ke90Tje7VS0',
  hooks: 'https://www.youtube.com/watch?v=O6P86uwfdR0',
  redux: 'https://www.youtube.com/watch?v=CVpUuw9XSjY',
  jsx: 'https://www.youtube.com/watch?v=Ke90Tje7VS0',
  props: 'https://www.youtube.com/watch?v=Ke90Tje7VS0',
  // Node / Backend
  node: 'https://www.youtube.com/watch?v=TlB_eWDSMt4',
  express: 'https://www.youtube.com/watch?v=SccSCuHhOw0',
  mongodb: 'https://www.youtube.com/watch?v=ExcRbA7fy_A',
  'rest api': 'https://www.youtube.com/watch?v=fgTGADljAeg',
  jwt: 'https://www.youtube.com/watch?v=7Q17ubqLfaM',
  mongoose: 'https://www.youtube.com/watch?v=ExcRbA7fy_A',
  // Python / Data Science
  python: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
  numpy: 'https://www.youtube.com/watch?v=QUT1VHiLmmI',
  pandas: 'https://www.youtube.com/watch?v=vmEHCJofslg',
  matplotlib: 'https://www.youtube.com/watch?v=3Xc3CA655Y4',
  scikit: 'https://www.youtube.com/watch?v=0Lt9w-BxKFQ',
  'machine learning': 'https://www.youtube.com/watch?v=GwIo3gDZCVQ',
  // AWS / Cloud
  aws: 'https://www.youtube.com/watch?v=3hLmDS179YE',
  cloud: 'https://www.youtube.com/watch?v=3hLmDS179YE',
  iam: 'https://www.youtube.com/watch?v=3hLmDS179YE',
  s3: 'https://www.youtube.com/watch?v=3hLmDS179YE',
  ec2: 'https://www.youtube.com/watch?v=3hLmDS179YE',
  // MERN / Full stack
  mern: 'https://www.youtube.com/watch?v=7CqJlxBYj-M',
  fullstack: 'https://www.youtube.com/watch?v=7CqJlxBYj-M',
  deployment: 'https://www.youtube.com/watch?v=l134cBAJCuc',
  // Generic fallback
  default: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
};

const pickVideo = (title) => {
  const lower = title.toLowerCase();
  for (const [key, url] of Object.entries(VIDEO_MAP)) {
    if (lower.includes(key)) return url;
  }
  return VIDEO_MAP.default;
};

// Lesson resources by topic
const RESOURCES_MAP = {
  javascript: [
    {
      title: 'MDN JavaScript Guide',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
      type: 'link',
    },
    { title: 'JavaScript Cheatsheet (PDF)', url: 'https://htmlcheatsheet.com/js/', type: 'link' },
  ],
  react: [
    { title: 'React Official Docs', url: 'https://react.dev', type: 'link' },
    { title: 'React Hooks Reference', url: 'https://react.dev/reference/react', type: 'link' },
  ],
  node: [
    { title: 'Node.js Official Docs', url: 'https://nodejs.org/en/docs/', type: 'link' },
    { title: 'Express.js Guide', url: 'https://expressjs.com/en/guide/routing.html', type: 'link' },
  ],
  python: [
    { title: 'Python Official Docs', url: 'https://docs.python.org/3/', type: 'link' },
    { title: 'NumPy Documentation', url: 'https://numpy.org/doc/', type: 'link' },
  ],
  aws: [
    { title: 'AWS Free Tier Guide', url: 'https://aws.amazon.com/free/', type: 'link' },
    {
      title: 'AWS Exam Guide (PDF)',
      url: 'https://d1.awsstatic.com/training-and-certification/docs-cloud-practitioner/AWS-Certified-Cloud-Practitioner_Exam-Guide.pdf',
      type: 'pdf',
    },
  ],
  mern: [
    { title: 'MERN Stack Guide', url: 'https://www.mongodb.com/mern-stack', type: 'link' },
    {
      title: 'GitHub Repo Template',
      url: 'https://github.com/monovertex/mern-boilerplate',
      type: 'link',
    },
  ],
  default: [
    {
      title: 'Course Notes & Slides',
      url: 'https://drive.google.com/drive/folders/example',
      type: 'link',
    },
  ],
};

const pickResources = (title) => {
  const lower = title.toLowerCase();
  for (const [key, res] of Object.entries(RESOURCES_MAP)) {
    if (lower.includes(key)) return res;
  }
  return RESOURCES_MAP.default;
};

// Lesson builder
const mkLesson = (title, type = 'video', isFree = false, dur = 600) => ({
  title,
  type,
  isFree,
  content:
    type === 'text'
      ? `<h2>${title}</h2><p>This lesson covers the core concepts of <strong>${title}</strong>. Review the notes below and complete the exercises before moving on.</p><h3>Key Points</h3><ul><li>Understand the fundamentals thoroughly</li><li>Practice with the provided examples</li><li>Complete the hands-on exercises</li></ul><h3>Summary</h3><p>By the end of this lesson you should be comfortable applying these concepts in real projects.</p>`
      : '',
  videoUrl: type === 'video' ? pickVideo(title) : '',
  duration: dur,
  order: 0,
  resources: type === 'video' ? pickResources(title) : [],
});

// Section builder
const mkSection = (title, lessons) => ({
  title,
  description: `${title} — in-depth coverage`,
  order: 0,
  lessons,
});

const COURSES_DATA = [
  {
    title: 'Complete JavaScript Masterclass 2024',
    shortDescription: 'From zero to hero — variables to advanced patterns',
    description:
      'A comprehensive JavaScript course that takes you from absolute beginner to advanced developer. Covers ES6+, async/await, closures, prototypes, DOM manipulation, and modern patterns used in industry.',
    price: 1299,
    discountPrice: 799,
    isFree: false,
    level: 'beginner',
    language: 'English',
    tags: ['javascript', 'es6', 'web', 'frontend'],
    requirements: ['Basic HTML/CSS', 'A modern browser'],
    whatYouLearn: [
      'Core JS concepts',
      'ES6+ features',
      'Async programming',
      'DOM manipulation',
      'Error handling',
    ],
    thumbnail: {
      url: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800',
      publicId: 'js-course',
    },
    catSlug: 'web-development',
    sections: [
      mkSection('Getting Started', [
        mkLesson('Course Overview', 'video', true, 300),
        mkLesson('Setting Up VS Code', 'video', true, 420),
        mkLesson('Your First JS Program', 'video', false, 600),
      ]),
      mkSection('Core Concepts', [
        mkLesson('Variables & Data Types', 'video', false, 900),
        mkLesson('Functions & Scope', 'video', false, 1200),
        mkLesson('Arrays & Objects', 'video', false, 1100),
        mkLesson('Core Concepts Notes', 'text', false, 0),
      ]),
      mkSection('ES6+ Features', [
        mkLesson('Arrow Functions', 'video', false, 800),
        mkLesson('Destructuring', 'video', false, 750),
        mkLesson('Spread & Rest', 'video', false, 600),
        mkLesson('Promises & Async/Await', 'video', false, 1400),
      ]),
      mkSection('Advanced Topics', [
        mkLesson('Closures Deep Dive', 'video', false, 1100),
        mkLesson('Prototypes & Classes', 'video', false, 1300),
        mkLesson('Event Loop & Concurrency', 'video', false, 900),
      ]),
    ],
  },
  {
    title: 'React.js — Build Modern Web Apps',
    shortDescription: 'Hooks, Redux, React Query, and real projects',
    description:
      'Master React.js from the ground up. Learn functional components, all built-in hooks, context API, Redux Toolkit, React Query, and build three full production-ready projects.',
    price: 1599,
    discountPrice: 999,
    isFree: false,
    level: 'intermediate',
    language: 'English',
    tags: ['react', 'redux', 'frontend', 'javascript'],
    requirements: ['JavaScript fundamentals', 'Basic HTML/CSS'],
    whatYouLearn: [
      'React components & JSX',
      'State management with Redux',
      'API integration',
      'Testing with Jest',
    ],
    thumbnail: {
      url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      publicId: 'react-course',
    },
    catSlug: 'web-development',
    sections: [
      mkSection('React Fundamentals', [
        mkLesson('What is React?', 'video', true, 400),
        mkLesson('JSX Deep Dive', 'video', false, 800),
        mkLesson('Props & State', 'video', false, 1000),
      ]),
      mkSection('Hooks', [
        mkLesson('useState & useEffect', 'video', false, 1100),
        mkLesson('useContext & useReducer', 'video', false, 900),
        mkLesson('Custom Hooks', 'video', false, 850),
      ]),
      mkSection('State Management', [
        mkLesson('Redux Toolkit Intro', 'video', false, 1200),
        mkLesson('createSlice & createAsyncThunk', 'video', false, 1400),
        mkLesson('RTK Query', 'video', false, 1100),
      ]),
      mkSection('Project — Todo App', [
        mkLesson('Project Setup', 'video', false, 600),
        mkLesson('Building Components', 'video', false, 1300),
        mkLesson('Deployment', 'video', false, 700),
      ]),
    ],
  },
  {
    title: 'Node.js & Express — Backend Development',
    shortDescription: 'REST APIs, MongoDB, Auth, and deployment',
    description:
      'Build scalable backend systems with Node.js and Express. Covers REST API design, MongoDB with Mongoose, JWT authentication, file uploads, caching with Redis, and deployment to cloud platforms.',
    price: 1499,
    discountPrice: 899,
    isFree: false,
    level: 'intermediate',
    language: 'English',
    tags: ['nodejs', 'express', 'mongodb', 'backend', 'api'],
    requirements: ['JavaScript basics', 'Command line familiarity'],
    whatYouLearn: [
      'REST API design',
      'MongoDB & Mongoose',
      'JWT Auth',
      'Redis caching',
      'Deployment',
    ],
    thumbnail: {
      url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
      publicId: 'node-course',
    },
    catSlug: 'web-development',
    sections: [
      mkSection('Node.js Basics', [
        mkLesson('Node.js Architecture', 'video', true, 500),
        mkLesson('Modules & NPM', 'video', false, 700),
        mkLesson('File System & Streams', 'video', false, 900),
      ]),
      mkSection('Express Framework', [
        mkLesson('Express Setup', 'video', false, 600),
        mkLesson('Routing & Middleware', 'video', false, 1000),
        mkLesson('Error Handling', 'video', false, 800),
      ]),
      mkSection('Database', [
        mkLesson('MongoDB Intro', 'video', false, 800),
        mkLesson('Mongoose ODM', 'video', false, 1100),
        mkLesson('Aggregation Pipeline', 'video', false, 1200),
      ]),
      mkSection('Auth & Security', [
        mkLesson('JWT Authentication', 'video', false, 1000),
        mkLesson('bcrypt & Password Hashing', 'video', false, 700),
        mkLesson('Rate Limiting & Helmet', 'video', false, 600),
      ]),
    ],
  },
  {
    title: 'Python for Data Science',
    shortDescription: 'NumPy, Pandas, Matplotlib, Scikit-Learn',
    description:
      'A complete Python data science course covering NumPy arrays, Pandas DataFrames, data visualisation with Matplotlib and Seaborn, and machine learning with Scikit-Learn.',
    price: 1399,
    discountPrice: 849,
    isFree: false,
    level: 'beginner',
    language: 'English',
    tags: ['python', 'numpy', 'pandas', 'data-science', 'ml'],
    requirements: ['Basic Python knowledge', 'High school mathematics'],
    whatYouLearn: [
      'NumPy & Pandas',
      'Data cleaning',
      'Visualisation',
      'ML algorithms',
      'Model evaluation',
    ],
    thumbnail: {
      url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
      publicId: 'python-ds-course',
    },
    catSlug: 'data-science',
    sections: [
      mkSection('Python Refresher', [
        mkLesson('Python Basics', 'video', true, 600),
        mkLesson('Lists, Dicts, Tuples', 'video', false, 800),
        mkLesson('Functions & Lambdas', 'video', false, 700),
      ]),
      mkSection('NumPy', [
        mkLesson('Arrays & Broadcasting', 'video', false, 1000),
        mkLesson('Linear Algebra with NumPy', 'video', false, 900),
        mkLesson('NumPy Practice Notebook', 'text', false, 0),
      ]),
      mkSection('Pandas', [
        mkLesson('DataFrames & Series', 'video', false, 1100),
        mkLesson('Data Cleaning', 'video', false, 1300),
        mkLesson('GroupBy & Pivot Tables', 'video', false, 900),
      ]),
      mkSection('Machine Learning', [
        mkLesson('Scikit-Learn Pipeline', 'video', false, 1400),
        mkLesson('Classification & Regression', 'video', false, 1500),
        mkLesson('Model Evaluation', 'video', false, 800),
      ]),
    ],
  },
  {
    title: 'Full Stack MERN Development',
    shortDescription: 'MongoDB, Express, React, Node — complete bootcamp',
    description:
      'The ultimate MERN stack bootcamp. Build three full-stack applications from scratch, learn deployment with Railway and Vercel, and master modern full-stack architecture patterns.',
    price: 2499,
    discountPrice: 1499,
    isFree: false,
    level: 'advanced',
    language: 'English',
    tags: ['mern', 'fullstack', 'react', 'nodejs', 'mongodb'],
    requirements: ['HTML/CSS/JS', 'Basic React', 'Basic Node.js'],
    whatYouLearn: [
      'Full-stack architecture',
      'MERN project setup',
      'Auth systems',
      'File uploads',
      'Deployment',
    ],
    thumbnail: {
      url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
      publicId: 'mern-course',
    },
    catSlug: 'web-development',
    sections: [
      mkSection('Project Architecture', [
        mkLesson('Monorepo Setup', 'video', true, 500),
        mkLesson('Environment Config', 'video', false, 600),
      ]),
      mkSection('Backend API', [
        mkLesson('REST API Design', 'video', false, 1000),
        mkLesson('Auth System', 'video', false, 1400),
        mkLesson('File Upload with Cloudinary', 'video', false, 900),
      ]),
      mkSection('Frontend', [
        mkLesson('React Project Structure', 'video', false, 700),
        mkLesson('Redux + RTK Query', 'video', false, 1300),
        mkLesson('Protected Routes', 'video', false, 800),
      ]),
      mkSection('Deployment', [
        mkLesson('Deploy Backend to Railway', 'video', false, 900),
        mkLesson('Deploy Frontend to Vercel', 'video', false, 700),
        mkLesson('CI/CD with GitHub Actions', 'video', false, 1100),
      ]),
    ],
  },
  {
    title: 'AWS Cloud Practitioner Certification',
    shortDescription: 'Ace CLF-C02 — complete exam prep',
    description:
      'Comprehensive AWS Cloud Practitioner preparation. Covers all exam domains: cloud concepts, AWS services, security, billing, and support. Includes 300+ practice questions and mock exams.',
    price: 1799,
    discountPrice: 1099,
    isFree: false,
    level: 'beginner',
    language: 'English',
    tags: ['aws', 'cloud', 'certification', 'devops'],
    requirements: ['No prior cloud experience needed', 'Basic IT literacy'],
    whatYouLearn: ['AWS core services', 'Cloud pricing models', 'IAM & security', 'Exam strategy'],
    thumbnail: {
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
      publicId: 'aws-course',
    },
    catSlug: 'cloud-computing',
    sections: [
      mkSection('Cloud Concepts', [
        mkLesson('What is Cloud Computing?', 'video', true, 600),
        mkLesson('AWS Global Infrastructure', 'video', false, 800),
      ]),
      mkSection('Core Services', [
        mkLesson('EC2 & S3', 'video', false, 1200),
        mkLesson('RDS & DynamoDB', 'video', false, 1000),
        mkLesson('Lambda & API Gateway', 'video', false, 900),
      ]),
      mkSection('Security & IAM', [
        mkLesson('IAM Users, Groups, Roles', 'video', false, 1100),
        mkLesson('Security Groups & NACLs', 'video', false, 800),
      ]),
      mkSection('Exam Prep', [
        mkLesson('Practice Test 1', 'text', false, 0),
        mkLesson('Practice Test 2', 'text', false, 0),
        mkLesson('Exam Tips & Strategy', 'video', false, 700),
      ]),
    ],
  },
];

const TESTS_DATA = [
  {
    title: 'JavaScript Fundamentals — Full Test',
    description:
      'Test your core JavaScript knowledge: variables, scope, closures, async, prototypes.',
    duration: 45,
    difficulty: 'intermediate',
    isFree: false,
    price: 199,
    catSlug: 'web-development',
    questions: [
      {
        question: 'Which keyword declares a block-scoped variable in ES6?',
        options: [
          { text: 'var', isCorrect: false },
          { text: 'let', isCorrect: true },
          { text: 'define', isCorrect: false },
          { text: 'scope', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: '`let` and `const` are block-scoped; `var` is function-scoped.',
      },
      {
        question: 'What does `typeof null` return?',
        options: [
          { text: '"null"', isCorrect: false },
          { text: '"undefined"', isCorrect: false },
          { text: '"object"', isCorrect: true },
          { text: '"boolean"', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: 'A known JavaScript quirk — `typeof null` returns "object".',
      },
      {
        question: 'Which method creates a new array with transformed elements?',
        options: [
          { text: 'forEach', isCorrect: false },
          { text: 'filter', isCorrect: false },
          { text: 'map', isCorrect: true },
          { text: 'reduce', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: '`map` returns a new array; `forEach` returns undefined.',
      },
      {
        question: 'What is the output of `console.log(0.1 + 0.2 === 0.3)`?',
        options: [
          { text: 'true', isCorrect: false },
          { text: 'false', isCorrect: true },
          { text: 'NaN', isCorrect: false },
          { text: 'undefined', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: 'Floating-point precision — 0.1 + 0.2 = 0.30000000000000004.',
      },
      {
        question: 'What does the `===` operator check?',
        options: [
          { text: 'Value only', isCorrect: false },
          { text: 'Type only', isCorrect: false },
          { text: 'Value and type', isCorrect: true },
          { text: 'Reference', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: 'Strict equality checks both value and type without coercion.',
      },
      {
        question: 'Which array method removes and returns the last element?',
        options: [
          { text: 'shift', isCorrect: false },
          { text: 'pop', isCorrect: true },
          { text: 'splice', isCorrect: false },
          { text: 'slice', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: '`pop` removes from end; `shift` removes from beginning.',
      },
      {
        question: 'What is a closure in JavaScript?',
        options: [
          { text: 'A function with no parameters', isCorrect: false },
          { text: 'A function that remembers its outer scope', isCorrect: true },
          { text: 'An immediately invoked function', isCorrect: false },
          { text: 'A function stored in an object', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation:
          'A closure is a function that retains access to variables from its enclosing scope.',
      },
      {
        question: 'Which built-in method converts JSON string to object?',
        options: [
          { text: 'JSON.stringify', isCorrect: false },
          { text: 'JSON.objectify', isCorrect: false },
          { text: 'JSON.parse', isCorrect: true },
          { text: 'JSON.decode', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: 'JSON.parse() parses a string; JSON.stringify() serialises to string.',
      },
      {
        question: 'What does `Array.isArray([])` return?',
        options: [
          { text: 'false', isCorrect: false },
          { text: 'undefined', isCorrect: false },
          { text: 'true', isCorrect: true },
          { text: '"array"', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: 'Array.isArray is the reliable way to check for arrays.',
      },
      {
        question: 'Which statement about `const` is correct?',
        options: [
          { text: 'const variables can be reassigned', isCorrect: false },
          { text: 'const objects can have properties mutated', isCorrect: true },
          { text: 'const is function-scoped', isCorrect: false },
          { text: 'const values are immutable in all cases', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation:
          '`const` prevents reassignment of the binding, but object properties can still change.',
      },
    ],
  },
  {
    title: 'React.js Developer Test',
    description:
      'Assess React component design, hooks, state management, and performance optimisation.',
    duration: 60,
    difficulty: 'advanced',
    isFree: false,
    price: 299,
    catSlug: 'web-development',
    questions: [
      {
        question: 'Which hook replaces componentDidMount in functional components?',
        options: [
          { text: 'useState', isCorrect: false },
          { text: 'useEffect', isCorrect: true },
          { text: 'useRef', isCorrect: false },
          { text: 'useMemo', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation:
          'useEffect with an empty dependency array runs after the first render, like componentDidMount.',
      },
      {
        question: 'What does React.memo do?',
        options: [
          { text: 'Memoises a value', isCorrect: false },
          { text: 'Prevents re-render if props unchanged', isCorrect: true },
          { text: 'Caches API results', isCorrect: false },
          { text: 'Replaces useMemo', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: 'React.memo is a HOC that prevents re-renders when props are the same.',
      },
      {
        question: 'What is the purpose of the key prop in lists?',
        options: [
          { text: 'Styling list items', isCorrect: false },
          { text: 'Helping React identify changed elements', isCorrect: true },
          { text: 'Preventing re-renders', isCorrect: false },
          { text: 'Passing data to children', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: 'Keys help React reconcile the virtual DOM diff efficiently.',
      },
      {
        question: 'Which hook is used for accessing a DOM element directly?',
        options: [
          { text: 'useCallback', isCorrect: false },
          { text: 'useContext', isCorrect: false },
          { text: 'useRef', isCorrect: true },
          { text: 'useImperativeHandle', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation:
          'useRef returns a mutable ref object whose .current points to the mounted DOM node.',
      },
      {
        question: 'What triggers a re-render in React?',
        options: [
          { text: 'Prop or state change', isCorrect: true },
          { text: 'Only state change', isCorrect: false },
          { text: 'Only prop change', isCorrect: false },
          { text: 'Context change only', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation:
          'Re-renders are triggered by state updates, prop changes, and context changes.',
      },
      {
        question: 'What does useCallback memoize?',
        options: [
          { text: 'A computed value', isCorrect: false },
          { text: 'A function reference', isCorrect: true },
          { text: 'An API response', isCorrect: false },
          { text: 'A component', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation:
          'useCallback returns a memoised callback, stable across re-renders unless dependencies change.',
      },
      {
        question: 'Which Redux Toolkit function creates a slice?',
        options: [
          { text: 'createReducer', isCorrect: false },
          { text: 'createSlice', isCorrect: true },
          { text: 'createStore', isCorrect: false },
          { text: 'configureSlice', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation:
          'createSlice generates action creators and a reducer from a single configuration object.',
      },
      {
        question: 'What is prop drilling?',
        options: [
          { text: 'Passing props through many nested layers', isCorrect: true },
          { text: 'Drilling holes in HTML elements', isCorrect: false },
          { text: 'A performance optimisation', isCorrect: false },
          { text: 'Updating props dynamically', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation:
          'Prop drilling occurs when intermediate components pass props they do not need themselves.',
      },
    ],
  },
  {
    title: 'Python & Data Science Basics',
    description: 'Test your Python, NumPy, Pandas, and data visualisation skills.',
    duration: 50,
    difficulty: 'beginner',
    isFree: false,
    price: 199,
    catSlug: 'data-science',
    questions: [
      {
        question: 'Which Python library is primarily used for numerical computing?',
        options: [
          { text: 'Pandas', isCorrect: false },
          { text: 'NumPy', isCorrect: true },
          { text: 'Matplotlib', isCorrect: false },
          { text: 'SciPy', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: 'NumPy provides the ndarray object and mathematical operations on arrays.',
      },
      {
        question: 'What does `.shape` return on a NumPy array?',
        options: [
          { text: 'Number of elements', isCorrect: false },
          { text: 'Data type', isCorrect: false },
          { text: 'Tuple of dimensions', isCorrect: true },
          { text: 'Memory size', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: '.shape returns a tuple like (rows, columns) describing the array dimensions.',
      },
      {
        question: 'Which Pandas method reads a CSV file?',
        options: [
          { text: 'pd.load_csv', isCorrect: false },
          { text: 'pd.read_csv', isCorrect: true },
          { text: 'pd.import_csv', isCorrect: false },
          { text: 'pd.open_csv', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: 'pd.read_csv() is the standard function to load CSV files into a DataFrame.',
      },
      {
        question: 'What does `df.dropna()` do?',
        options: [
          { text: 'Drops duplicate rows', isCorrect: false },
          { text: 'Removes rows with missing values', isCorrect: true },
          { text: 'Resets the index', isCorrect: false },
          { text: 'Converts NaN to 0', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: 'dropna removes any row (or column) containing NaN values.',
      },
      {
        question: 'Which Matplotlib function shows the plot?',
        options: [
          { text: 'plt.render()', isCorrect: false },
          { text: 'plt.draw()', isCorrect: false },
          { text: 'plt.show()', isCorrect: true },
          { text: 'plt.display()', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation:
          'plt.show() displays the current figure and blocks execution until it is closed.',
      },
      {
        question: 'What is a Pandas Series?',
        options: [
          { text: 'A 2D labelled data structure', isCorrect: false },
          { text: 'A 1D labelled array', isCorrect: true },
          { text: 'A group of DataFrames', isCorrect: false },
          { text: 'A SQL table', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: 'Series is a 1D labelled array; DataFrame is a 2D labelled structure.',
      },
      {
        question: 'Which method returns basic descriptive statistics?',
        options: [
          { text: 'df.info()', isCorrect: false },
          { text: 'df.head()', isCorrect: false },
          { text: 'df.describe()', isCorrect: true },
          { text: 'df.summary()', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation:
          'df.describe() returns count, mean, std, min, percentiles, and max for numeric columns.',
      },
    ],
  },
  {
    title: 'Node.js & REST API Mastery',
    description:
      'Backend development concepts — Express, middleware, authentication, and databases.',
    duration: 55,
    difficulty: 'intermediate',
    isFree: false,
    price: 249,
    catSlug: 'web-development',
    questions: [
      {
        question: 'Which HTTP method is used to update a resource partially?',
        options: [
          { text: 'PUT', isCorrect: false },
          { text: 'POST', isCorrect: false },
          { text: 'PATCH', isCorrect: true },
          { text: 'UPDATE', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: 'PATCH applies partial modifications; PUT replaces the entire resource.',
      },
      {
        question: 'What does middleware in Express do?',
        options: [
          { text: 'Stores data in MongoDB', isCorrect: false },
          { text: 'Functions that process requests before the route handler', isCorrect: true },
          { text: 'Renders HTML templates', isCorrect: false },
          { text: 'Manages environment variables', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation:
          'Middleware functions have access to req, res, and next — they can modify the request/response or terminate the cycle.',
      },
      {
        question: 'Which status code means "Created"?',
        options: [
          { text: '200', isCorrect: false },
          { text: '204', isCorrect: false },
          { text: '201', isCorrect: true },
          { text: '202', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: '201 Created is returned after a successful POST that creates a new resource.',
      },
      {
        question: 'What is JWT used for?',
        options: [
          { text: 'Database queries', isCorrect: false },
          { text: 'Stateless authentication', isCorrect: true },
          { text: 'File compression', isCorrect: false },
          { text: 'Caching responses', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation:
          'JWT (JSON Web Token) enables stateless auth by encoding claims in a signed token.',
      },
      {
        question: 'Which Mongoose method finds one document by its _id?',
        options: [
          { text: 'Model.findOne', isCorrect: false },
          { text: 'Model.get', isCorrect: false },
          { text: 'Model.findById', isCorrect: true },
          { text: 'Model.getById', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: 'findById(id) is shorthand for findOne({ _id: id }) in Mongoose.',
      },
      {
        question: 'What does CORS stand for?',
        options: [
          { text: 'Content Object Resource Sharing', isCorrect: false },
          { text: 'Cross-Origin Resource Sharing', isCorrect: true },
          { text: 'Cross-Object Rendering System', isCorrect: false },
          { text: 'Core Object Response Standard', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: 'CORS controls which origins can make HTTP requests to your server.',
      },
      {
        question: 'Which tool is commonly used to test REST APIs?',
        options: [
          { text: 'Jest', isCorrect: false },
          { text: 'Postman', isCorrect: true },
          { text: 'Webpack', isCorrect: false },
          { text: 'Babel', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: 'Postman is a popular API development and testing tool.',
      },
      {
        question: 'What does `app.use(express.json())` do?',
        options: [
          { text: 'Sends JSON responses', isCorrect: false },
          { text: 'Parses incoming JSON request bodies', isCorrect: true },
          { text: 'Validates JSON schemas', isCorrect: false },
          { text: 'Logs JSON to console', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: 'This middleware parses the request body as JSON and populates req.body.',
      },
    ],
  },
  {
    title: 'AWS Cloud Practitioner Mock Exam',
    description: 'Full mock exam matching CLF-C02 blueprint — 65 questions, 90 minutes.',
    duration: 90,
    difficulty: 'intermediate',
    isFree: false,
    price: 399,
    catSlug: 'cloud-computing',
    questions: [
      {
        question: 'What is the AWS shared responsibility model?',
        options: [
          { text: 'AWS is responsible for everything', isCorrect: false },
          { text: 'Customer is responsible for everything', isCorrect: false },
          { text: 'AWS manages infra; customer manages their data and apps', isCorrect: true },
          { text: 'Responsibility is determined per contract', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation:
          'AWS is responsible for security OF the cloud; customers are responsible for security IN the cloud.',
      },
      {
        question: 'Which AWS service provides object storage?',
        options: [
          { text: 'EBS', isCorrect: false },
          { text: 'EFS', isCorrect: false },
          { text: 'S3', isCorrect: true },
          { text: 'Glacier', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: 'Amazon S3 (Simple Storage Service) is the object storage offering.',
      },
      {
        question: 'What is an AWS Region?',
        options: [
          { text: 'A single data centre', isCorrect: false },
          { text: 'A group of geographically isolated data centres (AZs)', isCorrect: true },
          { text: 'An edge location', isCorrect: false },
          { text: 'A virtual private cloud', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: 'A Region consists of multiple Availability Zones (isolated data centres).',
      },
      {
        question: 'Which service is a managed relational database?',
        options: [
          { text: 'DynamoDB', isCorrect: false },
          { text: 'ElastiCache', isCorrect: false },
          { text: 'RDS', isCorrect: true },
          { text: 'Redshift', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: 'RDS supports MySQL, PostgreSQL, Oracle, SQL Server, and MariaDB.',
      },
      {
        question: 'What does IAM stand for?',
        options: [
          { text: 'Internet Access Management', isCorrect: false },
          { text: 'Identity and Access Management', isCorrect: true },
          { text: 'Internal Application Monitor', isCorrect: false },
          { text: 'Infrastructure Automation Manager', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation: 'AWS IAM controls who can access which AWS resources.',
      },
      {
        question: 'Which pricing model offers the largest EC2 discount?',
        options: [
          { text: 'On-Demand', isCorrect: false },
          { text: 'Spot Instances', isCorrect: true },
          { text: 'Reserved Instances', isCorrect: false },
          { text: 'Savings Plans', isCorrect: false },
        ],
        marks: 4,
        negativeMarks: 1,
        explanation:
          'Spot Instances can provide up to 90% savings vs On-Demand, but can be interrupted.',
      },
    ],
  },
];

const QUIZ_TEMPLATES = [
  {
    title: 'JavaScript Variables & Types Quiz',
    passingScore: 60,
    questions: [
      {
        question: 'Which keyword declares a block-scoped variable?',
        options: [
          { text: 'var', isCorrect: false },
          { text: 'let', isCorrect: true },
          { text: 'define', isCorrect: false },
          { text: 'block', isCorrect: false },
        ],
        explanation: 'let is block-scoped; var is function-scoped.',
      },
      {
        question: 'What is the type of `null`?',
        options: [
          { text: 'null', isCorrect: false },
          { text: 'undefined', isCorrect: false },
          { text: 'object', isCorrect: true },
          { text: 'number', isCorrect: false },
        ],
        explanation: 'typeof null === "object" is a historical JS bug.',
      },
      {
        question: 'What does `===` check?',
        options: [
          { text: 'Value only', isCorrect: false },
          { text: 'Type only', isCorrect: false },
          { text: 'Value and type', isCorrect: true },
          { text: 'Reference equality', isCorrect: false },
        ],
        explanation: 'Strict equality checks both value and type.',
      },
      {
        question: 'Which is NOT a primitive type?',
        options: [
          { text: 'string', isCorrect: false },
          { text: 'boolean', isCorrect: false },
          { text: 'object', isCorrect: true },
          { text: 'number', isCorrect: false },
        ],
        explanation: 'Objects are reference types, not primitives.',
      },
    ],
  },
  {
    title: 'React Hooks Quick Check',
    passingScore: 70,
    questions: [
      {
        question: 'Which hook manages component state?',
        options: [
          { text: 'useEffect', isCorrect: false },
          { text: 'useState', isCorrect: true },
          { text: 'useContext', isCorrect: false },
          { text: 'useRef', isCorrect: false },
        ],
        explanation: 'useState is the primary hook for local state.',
      },
      {
        question: 'When does useEffect with [] run?',
        options: [
          { text: 'On every render', isCorrect: false },
          { text: 'Only on first render', isCorrect: true },
          { text: 'On unmount only', isCorrect: false },
          { text: 'Never', isCorrect: false },
        ],
        explanation: 'Empty deps array = run once after first mount.',
      },
      {
        question: 'What does useRef return?',
        options: [
          { text: 'A state value', isCorrect: false },
          { text: 'A mutable ref object', isCorrect: true },
          { text: 'A callback function', isCorrect: false },
          { text: 'A boolean', isCorrect: false },
        ],
        explanation: 'useRef returns { current: initialValue } that persists across renders.',
      },
    ],
  },
  {
    title: 'Node.js Fundamentals Quiz',
    passingScore: 65,
    questions: [
      {
        question: 'What is Node.js?',
        options: [
          { text: 'A browser', isCorrect: false },
          { text: 'A JS runtime built on V8', isCorrect: true },
          { text: 'A database', isCorrect: false },
          { text: 'A CSS framework', isCorrect: false },
        ],
        explanation: 'Node.js uses the V8 engine to run JavaScript outside the browser.',
      },
      {
        question: 'Which module handles file operations?',
        options: [
          { text: 'os', isCorrect: false },
          { text: 'path', isCorrect: false },
          { text: 'fs', isCorrect: true },
          { text: 'net', isCorrect: false },
        ],
        explanation: 'The built-in `fs` module provides file system operations.',
      },
      {
        question: 'What does `require()` do in CommonJS?',
        options: [
          { text: 'Runs a shell command', isCorrect: false },
          { text: 'Imports a module', isCorrect: true },
          { text: 'Exports a function', isCorrect: false },
          { text: 'Creates a server', isCorrect: false },
        ],
        explanation: 'require() loads and caches a module, returning its exports.',
      },
      {
        question: 'Which event loop phase handles I/O callbacks?',
        options: [
          { text: 'timers', isCorrect: false },
          { text: 'poll', isCorrect: true },
          { text: 'check', isCorrect: false },
          { text: 'close callbacks', isCorrect: false },
        ],
        explanation: 'The poll phase retrieves new I/O events and executes their callbacks.',
      },
    ],
  },
  {
    title: 'Python Basics Quiz',
    passingScore: 60,
    questions: [
      {
        question: 'Which keyword defines a function in Python?',
        options: [
          { text: 'function', isCorrect: false },
          { text: 'func', isCorrect: false },
          { text: 'def', isCorrect: true },
          { text: 'define', isCorrect: false },
        ],
        explanation: 'Python uses `def` to declare functions.',
      },
      {
        question: 'What does `len([1,2,3])` return?',
        options: [
          { text: '2', isCorrect: false },
          { text: '4', isCorrect: false },
          { text: '3', isCorrect: true },
          { text: '1', isCorrect: false },
        ],
        explanation: 'len() returns the number of items in a sequence.',
      },
      {
        question: 'How do you start a comment in Python?',
        options: [
          { text: '//', isCorrect: false },
          { text: '/*', isCorrect: false },
          { text: '#', isCorrect: true },
          { text: '--', isCorrect: false },
        ],
        explanation: 'Python uses # for single-line comments.',
      },
    ],
  },
];

const BLOG_POSTS = [
  {
    title: 'Top 10 JavaScript Interview Questions in 2024',
    slug: 'top-10-javascript-interview-questions-2024',
    excerpt:
      'Ace your next JavaScript interview with these commonly asked questions and detailed answers.',
    content: `<h2>Introduction</h2><p>JavaScript interviews can be challenging. Here are the top 10 questions you must know...</p><h2>1. What is hoisting?</h2><p>Hoisting is JavaScript's default behaviour of moving declarations to the top of their scope before code execution...</p><h2>2. Explain closures</h2><p>A closure is a function that retains access to variables from its enclosing scope even after the outer function has returned...</p><h2>3. What is the event loop?</h2><p>The event loop is the mechanism that allows Node.js and browsers to perform non-blocking I/O operations...</p>`,
    tags: ['javascript', 'interview', 'career'],
    status: 'published',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800',
      publicId: 'blog-js-interview',
    },
  },
  {
    title: 'React vs Vue vs Angular — Which to Learn in 2024?',
    slug: 'react-vs-vue-vs-angular-2024',
    excerpt:
      "A developer's honest comparison of the three major frontend frameworks to help you make the right choice.",
    content: `<h2>Overview</h2><p>Choosing a frontend framework is one of the most important decisions for a web developer in 2024...</p><h2>React</h2><p>React is a library maintained by Meta. It uses JSX and a component-based architecture...</p><h2>Vue</h2><p>Vue.js is known for its gentle learning curve and excellent documentation...</p><h2>Angular</h2><p>Angular is a full-featured framework from Google, using TypeScript by default...</p><h2>Our Verdict</h2><p>For job opportunities: React. For beginners: Vue. For enterprise: Angular.</p>`,
    tags: ['react', 'vue', 'angular', 'frontend'],
    status: 'published',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      publicId: 'blog-frameworks',
    },
  },
  {
    title: 'How to Land Your First Developer Job — A Realistic Guide',
    slug: 'how-to-land-first-developer-job',
    excerpt:
      'From learning to your first offer — a step-by-step guide based on real success stories.',
    content: `<h2>Step 1: Build Your Foundation</h2><p>Focus on one language and one framework. Don't jump between technologies...</p><h2>Step 2: Build Projects That Matter</h2><p>Three strong projects beat 20 tutorial clones. Build something you'd actually use...</p><h2>Step 3: Create Your Online Presence</h2><p>GitHub profile, LinkedIn, and a simple portfolio site are non-negotiable...</p><h2>Step 4: Apply Strategically</h2><p>Target startups and mid-size companies first. Tailor each application...</p>`,
    tags: ['career', 'jobs', 'beginner'],
    status: 'published',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800',
      publicId: 'blog-first-job',
    },
  },
  {
    title: 'Understanding Async/Await in JavaScript',
    slug: 'understanding-async-await-javascript',
    excerpt:
      'Stop struggling with asynchronous code — master async/await with real-world examples.',
    content: `<h2>The Problem with Callbacks</h2><p>Callback hell made async code hard to read and debug...</p><h2>Promises to the Rescue</h2><p>Promises introduced a cleaner way to handle async operations with .then() and .catch()...</p><h2>Async/Await Syntax</h2><p>async/await is syntactic sugar over Promises that makes async code look synchronous...</p><pre><code>async function fetchUser(id) {\n  try {\n    const res = await fetch(\`/api/users/\${id}\`);\n    return await res.json();\n  } catch (err) {\n    console.error(err);\n  }\n}</code></pre>`,
    tags: ['javascript', 'async', 'es6'],
    status: 'published',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
      publicId: 'blog-async',
    },
  },
  {
    title: 'MongoDB vs PostgreSQL — Choosing the Right Database',
    slug: 'mongodb-vs-postgresql-choosing-right-database',
    excerpt: 'SQL or NoSQL? This guide helps you pick the right database for your next project.',
    content: `<h2>When to Use MongoDB</h2><p>MongoDB excels with flexible, document-based data structures. Perfect for content management, catalogs, and real-time analytics...</p><h2>When to Use PostgreSQL</h2><p>PostgreSQL shines with relational data, complex queries, and ACID compliance. Ideal for financial apps and ERPs...</p><h2>Performance Comparison</h2><p>For write-heavy workloads, MongoDB is often faster. For complex joins, PostgreSQL wins...</p>`,
    tags: ['database', 'mongodb', 'postgresql', 'backend'],
    status: 'published',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800',
      publicId: 'blog-database',
    },
  },
];

const DISCUSSION_SEEDS = [
  {
    title: 'Why does useEffect run twice in React 18?',
    content:
      'I noticed useEffect runs twice in development mode with React 18. Is this a bug or expected behaviour? It is causing my API to be called twice on mount.',
  },
  {
    title: 'Best way to handle JWT refresh tokens?',
    content:
      'What is the recommended approach for handling refresh tokens in a React + Node.js app? Should I store them in cookies or localStorage?',
  },
  {
    title: 'Async/Await vs .then() — which is better?',
    content:
      'I keep seeing both patterns in codebases. Is there a performance difference, or is it purely a style preference?',
  },
  {
    title: 'How to structure a large React project?',
    content:
      "Our app is growing and we're not sure how to organise files. Currently everything is flat in /components. Should we use feature-based folders?",
  },
  {
    title: 'MongoDB aggregation pipeline — confused about $lookup',
    content:
      'I am trying to join two collections but the $lookup stage is not returning what I expect. Can someone explain how it works with an example?',
  },
];

// ─── main ──────────────────────────────────────────────────────────────────────
const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // ── 1. WIPE ──────────────────────────────────────────────────────────────────
  console.log('🗑️  Wiping all collections...');
  await Promise.all([
    User.deleteMany({}),
    ExamCategory.deleteMany({}),
    Badge.deleteMany({}),
    Course.deleteMany({}),
    Test.deleteMany({}),
    Quiz.deleteMany({}),
    QuizAttempt.deleteMany({}),
    Enrollment.deleteMany({}),
    Payment.deleteMany({}),
    Review.deleteMany({}),
    Discussion.deleteMany({}),
    Blog.deleteMany({}),
  ]);
  console.log('   Done.\n');

  // ── 2. CATEGORIES ─────────────────────────────────────────────────────────────
  console.log('📂 Seeding categories...');
  const categories = await ExamCategory.insertMany(CATEGORIES_DATA);
  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));
  console.log(`   ${categories.length} categories created.\n`);

  // ── 3. BADGES ─────────────────────────────────────────────────────────────────
  console.log('🏆 Seeding badges...');
  await Badge.insertMany(BADGES_DATA);
  console.log(`   ${BADGES_DATA.length} badges created.\n`);

  // ── 4. USERS ──────────────────────────────────────────────────────────────────
  console.log('👥 Seeding users...');
  const hashedStudent = await bcrypt.hash('Student@123456', 10);

  const admin = await User.create({
    name: 'Super Admin',
    email: 'admin@civicshub.com',
    password: 'Admin@123456',
    role: 'super_admin',
    isEmailVerified: true,
    isActive: true,
    avatar: 'https://ui-avatars.com/api/?name=Super+Admin&background=6366f1&color=fff',
  });

  const teacher = await User.create({
    name: 'Rajesh Kumar',
    email: 'teacher@civicshub.com',
    password: 'Teacher@123456',
    role: 'teacher',
    isEmailVerified: true,
    isActive: true,
    avatar: 'https://ui-avatars.com/api/?name=Rajesh+Kumar&background=10b981&color=fff',
    bio: 'Senior full-stack developer with 8+ years of experience. Passionate about teaching modern web technologies.',
    teacherProfile: {
      qualification: 'B.Tech Computer Science, IIT Delhi',
      experience: '8 years',
      specialization: ['Web Development', 'Data Science', 'Cloud Computing'],
      isVerified: true,
    },
  });

  const teacher2 = await User.create({
    name: 'Priya Sharma',
    email: 'teacher2@civicshub.com',
    password: 'Teacher@123456',
    role: 'teacher',
    isEmailVerified: true,
    isActive: true,
    avatar: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=f59e0b&color=fff',
    bio: 'Data Scientist at a Fortune 500 company. Expert in Python, ML, and AI.',
    teacherProfile: {
      qualification: 'M.Tech Data Science, IISc Bangalore',
      experience: '6 years',
      specialization: ['Data Science', 'Machine Learning', 'Python'],
      isVerified: true,
    },
  });

  const STUDENTS = [
    { name: 'Arjun Mehta', email: 'arjun@student.com' },
    { name: 'Kavya Reddy', email: 'kavya@student.com' },
    { name: 'Rohan Singh', email: 'rohan@student.com' },
    { name: 'Ananya Patel', email: 'ananya@student.com' },
    { name: 'Vikram Nair', email: 'vikram@student.com' },
    { name: 'Sneha Gupta', email: 'sneha@student.com' },
    { name: 'Amit Kumar', email: 'amit@student.com' },
    { name: 'Divya Joshi', email: 'divya@student.com' },
    { name: 'Rahul Verma', email: 'rahul@student.com' },
    { name: 'Ishaan Kapoor', email: 'ishaan@student.com' },
    { name: 'Meera Iyer', email: 'meera@student.com' },
    { name: 'Karan Malhotra', email: 'karan@student.com' },
  ];

  const students = await User.insertMany(
    STUDENTS.map((s, i) => ({
      ...s,
      password: hashedStudent,
      role: 'student',
      isEmailVerified: true,
      isActive: true,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=${['6366f1', '10b981', 'f59e0b', 'ef4444', '8b5cf6', 'ec4899'][i % 6]}&color=fff`,
    }))
  );
  console.log(`   ${students.length} students, 2 teachers, 1 admin created.\n`);

  // ── 5. COURSES ────────────────────────────────────────────────────────────────
  console.log('📚 Seeding courses...');
  const courses = [];
  for (const [i, cd] of COURSES_DATA.entries()) {
    const cat = catBySlug[cd.catSlug];
    const assignedTeacher = i < 4 ? teacher : teacher2;

    // fix section/lesson orders
    cd.sections.forEach((sec, si) => {
      sec.order = si + 1;
      sec.lessons.forEach((les, li) => {
        les.order = li + 1;
      });
    });

    const totalLessons = cd.sections.reduce((s, sec) => s + sec.lessons.length, 0);
    const totalDuration = cd.sections.reduce(
      (s, sec) => s + sec.lessons.reduce((ls, l) => ls + (l.duration || 0), 0),
      0
    );

    const slug = uniqueSlug(cd.title, `-${Date.now()}-${i}`);
    const c = await Course.create({
      title: cd.title,
      slug,
      description: cd.description,
      shortDescription: cd.shortDescription,
      thumbnail: cd.thumbnail,
      teacher: assignedTeacher._id,
      category: cat._id,
      price: cd.price,
      discountPrice: cd.discountPrice,
      effectivePrice: cd.discountPrice,
      isFree: false,
      level: cd.level,
      language: cd.language,
      tags: cd.tags,
      requirements: cd.requirements,
      whatYouLearn: cd.whatYouLearn,
      sections: cd.sections,
      totalLessons,
      totalDuration,
      totalStudents: 0,
      isPublished: true,
      status: 'published',
      isFeatured: i < 3,
    });
    courses.push(c);
    console.log(`   ✅ ${c.title}`);
  }
  console.log();

  // ── 6. TESTS ──────────────────────────────────────────────────────────────────
  console.log('📝 Seeding tests...');
  const tests = [];
  for (const [i, td] of TESTS_DATA.entries()) {
    const cat = catBySlug[td.catSlug];
    const totalMarks = td.questions.length * 4;
    const slug = uniqueSlug(td.title, `-${Date.now()}-${i}`);
    const t = await Test.create({
      title: td.title,
      slug,
      description: td.description,
      teacher: teacher._id,
      category: cat._id,
      questions: td.questions.map((q, qi) => ({ ...q, order: qi + 1 })),
      questionsCount: td.questions.length,
      duration: td.duration,
      totalMarks,
      passingMarks: Math.ceil(totalMarks * 0.4),
      difficulty: td.difficulty,
      isFree: td.isFree,
      price: td.price,
      isPublished: true,
      status: 'published',
    });
    tests.push(t);
    console.log(`   ✅ ${t.title}`);
  }
  console.log();

  // ── 6b. UPDATE CATEGORY COUNTS ───────────────────────────────────────────────
  console.log('📂 Updating category counts...');
  for (const cat of categories) {
    const [courseCount, testCount] = await Promise.all([
      Course.countDocuments({ category: cat._id, isPublished: true }),
      Test.countDocuments({ category: cat._id, isPublished: true }),
    ]);
    await ExamCategory.findByIdAndUpdate(cat._id, { courseCount, testCount });
    if (courseCount > 0 || testCount > 0) {
      console.log(`   ${cat.name}: ${courseCount} courses, ${testCount} tests`);
    }
  }
  console.log();

  // ── 7. QUIZZES ────────────────────────────────────────────────────────────────
  console.log('🧩 Seeding quizzes...');
  const quizzes = [];
  for (const [i, qt] of QUIZ_TEMPLATES.entries()) {
    const course = courses[i % courses.length];
    const q = await Quiz.create({
      title: qt.title,
      course: course._id,
      teacher: teacher._id,
      questions: qt.questions.map((q, qi) => ({ ...q, order: qi + 1 })),
      passingScore: qt.passingScore,
      isPublished: true,
    });
    quizzes.push(q);
    console.log(`   ✅ ${q.title}`);
  }
  console.log();

  // ── 8. ENROLLMENTS + PAYMENTS ─────────────────────────────────────────────────
  console.log('💳 Seeding enrollments & payments...');
  const enrollments = [];
  const payments = [];
  let orderCounter = 1000;

  for (const student of students) {
    // each student enrolls in 2–4 random courses
    const shuffled = [...courses].sort(() => Math.random() - 0.5);
    const enrolCount = rand(2, 4);
    const chosen = shuffled.slice(0, enrolCount);

    for (const course of chosen) {
      const dAgo = rand(5, 90);
      const progress = rand(10, 100);
      const status = progress === 100 ? 'completed' : 'active';
      const amount = course.discountPrice;

      const payment = await Payment.create({
        user: student._id,
        course: course._id,
        orderId: `ORD-${Date.now()}-${++orderCounter}`,
        paymentId: `PAY-${Date.now()}-${orderCounter}`,
        amount,
        currency: 'INR',
        status: 'completed',
        provider: 'demo',
        netAmount: amount,
        createdAt: daysAgo(dAgo),
      });
      payments.push(payment);

      const enrollment = await Enrollment.create({
        user: student._id,
        course: course._id,
        status,
        progressPercentage: progress,
        amountPaid: amount,
        paymentId: payment._id,
        enrolledAt: daysAgo(dAgo),
        lastAccessedAt: daysAgo(rand(0, dAgo)),
        completedAt: status === 'completed' ? daysAgo(rand(0, 5)) : undefined,
      });
      enrollments.push(enrollment);
    }
  }

  // Update course totalStudents
  for (const course of courses) {
    const count = enrollments.filter((e) => e.course.toString() === course._id.toString()).length;
    await Course.findByIdAndUpdate(course._id, { totalStudents: count });
  }
  console.log(`   ${enrollments.length} enrollments, ${payments.length} payments.\n`);

  // ── 9. REVIEWS ────────────────────────────────────────────────────────────────
  console.log('⭐ Seeding reviews...');
  const REVIEW_COMMENTS = [
    'Excellent course! The explanations are very clear and the projects are practical.',
    'Great content but could use more advanced examples. Overall very satisfied.',
    'Best course I have taken on this topic. The instructor explains concepts brilliantly.',
    'Very comprehensive. I landed a job after completing this course!',
    'Good pacing and well-structured content. Would recommend to beginners.',
    'The quizzes and tests really helped solidify my understanding.',
    'Amazing course. The real-world projects made all the difference.',
    'Solid fundamentals. Wish there were more advanced sections but still great value.',
    'Clear explanations and good examples. Learned a lot!',
    'Worth every rupee. The support in discussions is excellent too.',
  ];
  const ratings = [4, 5, 5, 4, 5, 3, 5, 4, 5, 4];

  let reviewCount = 0;
  const reviewed = new Set();
  for (const enrollment of enrollments) {
    const key = `${enrollment.user}-${enrollment.course}`;
    if (reviewed.has(key)) continue;
    if (Math.random() < 0.75) {
      reviewed.add(key);
      const idx = reviewCount % REVIEW_COMMENTS.length;
      await Review.create({
        user: enrollment.user,
        course: enrollment.course,
        rating: ratings[idx],
        comment: REVIEW_COMMENTS[idx],
        isApproved: true,
        createdAt: daysAgo(rand(1, 30)),
      });
      reviewCount++;
    }
  }

  // Update course average rating
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
  console.log(`   ${reviewCount} reviews created.\n`);

  // ── 10. DISCUSSIONS ───────────────────────────────────────────────────────────
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
          content:
            'Great question! This is a common source of confusion. Let me explain in detail...',
          createdAt: daysAgo(rand(1, 5)),
        },
        {
          user: replier._id,
          content:
            "I had the same doubt! Thanks for asking, the teacher's explanation really helped.",
          createdAt: daysAgo(rand(0, 3)),
        },
      ],
      likes: students.slice(0, rand(2, 6)).map((s) => s._id),
      isResolved: i % 3 === 0,
      createdAt: daysAgo(rand(5, 30)),
    });
    discCount++;
  }
  console.log(`   ${discCount} discussions with replies created.\n`);

  // ── 11. QUIZ ATTEMPTS ─────────────────────────────────────────────────────────
  console.log('🎯 Seeding quiz attempts...');
  let attemptCount = 0;
  for (const quiz of quizzes) {
    if (!quiz.questions?.length) continue;
    const numStudents = Math.min(students.length, rand(3, 8));
    const selectedStudents = students.slice(0, numStudents);

    for (const student of selectedStudents) {
      const correctRate = 0.5 + Math.random() * 0.45;
      const answers = quiz.questions.map((q) => {
        const correctIdx = q.options.findIndex((o) => o.isCorrect);
        const isCorrect = Math.random() < correctRate;
        return {
          questionId: q._id,
          selectedOption: isCorrect ? correctIdx : (correctIdx + 1) % q.options.length,
          isCorrect,
        };
      });
      const correct = answers.filter((a) => a.isCorrect).length;
      const pct = Math.round((correct / quiz.questions.length) * 100);

      await QuizAttempt.create({
        user: student._id,
        quiz: quiz._id,
        course: quiz.course,
        answers,
        score: correct,
        totalQuestions: quiz.questions.length,
        percentage: pct,
        isPassed: pct >= (quiz.passingScore || 60),
        completedAt: daysAgo(rand(1, 14)),
      });
      attemptCount++;
    }
    await Quiz.findByIdAndUpdate(quiz._id, { totalAttempts: numStudents });
  }
  console.log(`   ${attemptCount} quiz attempts created.\n`);

  // ── 12. BLOGS ─────────────────────────────────────────────────────────────────
  console.log('📰 Seeding blog posts...');
  for (const bp of BLOG_POSTS) {
    await Blog.create({
      ...bp,
      author: teacher._id,
      publishedAt: daysAgo(rand(5, 60)),
      views: rand(50, 2000),
    });
  }
  console.log(`   ${BLOG_POSTS.length} blog posts created.\n`);

  // ── SUMMARY ───────────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════');
  console.log('✅  SEED COMPLETE');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Categories   : ${categories.length}`);
  console.log(`  Badges       : ${BADGES_DATA.length}`);
  console.log(
    `  Users        : ${students.length + 3} (1 admin, 2 teachers, ${students.length} students)`
  );
  console.log(`  Courses      : ${courses.length}`);
  console.log(`  Tests        : ${tests.length}`);
  console.log(`  Quizzes      : ${quizzes.length}`);
  console.log(`  Enrollments  : ${enrollments.length}`);
  console.log(`  Payments     : ${payments.length}`);
  console.log(`  Reviews      : ${reviewCount}`);
  console.log(`  Discussions  : ${discCount}`);
  console.log(`  Quiz attempts: ${attemptCount}`);
  console.log(`  Blog posts   : ${BLOG_POSTS.length}`);
  console.log('───────────────────────────────────────────────');
  console.log('  Login credentials');
  console.log('  Admin   : admin@civicshub.com    / Admin@123456');
  console.log('  Teacher : teacher@civicshub.com  / Teacher@123456');
  console.log('  Teacher2: teacher2@civicshub.com / Teacher@123456');
  console.log('  Student : arjun@student.com     / Student@123456');
  console.log('  (all 12 students use Student@123456)');
  console.log('═══════════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('❌ Seed error:', err.message, err.stack);
  process.exit(1);
});
