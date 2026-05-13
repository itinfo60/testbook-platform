import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://itinfo60:hHWTKq5QzG.ciJ7@cluster0.st80uui.mongodb.net/Test-Book?appName=Cluster0';

// Inline schemas to avoid import issues
const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  price: { type: Number, default: 0 },
  originalPrice: Number,
  thumbnail: String,
  category: String,
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  duration: String,
  language: { type: String, default: 'English' },
  isPublished: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  studentsEnrolled: { type: Number, default: 0 },
  lessons: [{
    title: String,
    type: { type: String, enum: ['video', 'text'], default: 'video' },
    videoUrl: String,
    content: String,
    duration: String,
    order: Number,
  }],
  whatYouWillLearn: [String],
  requirements: [String],
}, { timestamps: true });

const testSchema = new mongoose.Schema({
  title: String,
  description: String,
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  duration: { type: Number, default: 60 },
  totalMarks: Number,
  negativeMarking: { type: Boolean, default: false },
  negativeMarks: { type: Number, default: 0 },
  isFree: { type: Boolean, default: true },
  price: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true },
  attemptCount: { type: Number, default: 0 },
  questions: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    explanation: String,
    marks: { type: Number, default: 1 },
  }],
}, { timestamps: true });

const examCategorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  description: String,
  icon: String,
  courseCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const badgeSchema = new mongoose.Schema({
  name: String,
  description: String,
  icon: String,
  criteria: String,
  requirement: Number,
}, { timestamps: true });

// Use existing models or create new ones
const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);
const Test = mongoose.models.Test || mongoose.model('Test', testSchema);
const ExamCategory = mongoose.models.ExamCategory || mongoose.model('ExamCategory', examCategorySchema);
const Badge = mongoose.models.Badge || mongoose.model('Badge', badgeSchema);
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
  name: String, email: String, role: String
}));

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Find teacher user
    const teacher = await User.findOne({ role: 'teacher' });
    if (!teacher) {
      console.log('❌ No teacher found. Run server first to create default accounts.');
      process.exit(1);
    }
    console.log('👨‍🏫 Using teacher:', teacher.name, teacher._id);

    // ── Seed Exam Categories ───────────────────────
    const existingCategories = await ExamCategory.countDocuments();
    if (existingCategories === 0) {
      const categories = [
        { name: 'Banking', slug: 'banking', description: 'Banking exam preparation', icon: '🏦' },
        { name: 'SSC', slug: 'ssc', description: 'SSC exam preparation', icon: '🏛️' },
        { name: 'Railways', slug: 'railways', description: 'Railway recruitment', icon: '🚂' },
        { name: 'UPSC', slug: 'upsc', description: 'Civil services preparation', icon: '📜' },
        { name: 'State PSC', slug: 'state-psc', description: 'State level exams', icon: '🏢' },
        { name: 'Teaching', slug: 'teaching', description: 'Teaching exams', icon: '📖' },
        { name: 'Defence', slug: 'defence', description: 'Defence exam prep', icon: '🎖️' },
        { name: 'Programming', slug: 'programming', description: 'Coding & development', icon: '💻' },
      ];
      await ExamCategory.insertMany(categories);
      console.log('✅ Seeded', categories.length, 'exam categories');
    } else {
      console.log('⏭️  Exam categories already exist:', existingCategories);
    }

    // ── Seed Courses ─────────────────────────────────
    const existingCourses = await Course.countDocuments();
    if (existingCourses === 0) {
      const courses = [
        {
          title: 'Complete Banking Exam Preparation 2024',
          description: 'Master all banking exams including SBI PO, IBPS PO, and RBI Grade B with comprehensive study material, practice tests, and expert guidance. This course covers Quantitative Aptitude, Reasoning, English, General Awareness, and Computer Knowledge.',
          instructor: teacher._id,
          price: 999,
          originalPrice: 2999,
          category: 'Banking',
          level: 'beginner',
          duration: '45 hours',
          isPublished: true,
          isFeatured: true,
          rating: 4.7,
          reviewCount: 234,
          studentsEnrolled: 1520,
          thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop',
          whatYouWillLearn: [
            'Quantitative Aptitude shortcuts and tricks',
            'Logical Reasoning problem solving',
            'English Grammar and Comprehension',
            'Banking Awareness and Current Affairs',
            'Computer Knowledge fundamentals',
            'Time management strategies for exams'
          ],
          requirements: ['Basic math knowledge', '10+2 passed', 'Dedication to study daily'],
          lessons: [
            { title: 'Introduction to Banking Exams', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '15 min', order: 1 },
            { title: 'Number System Basics', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '30 min', order: 2 },
            { title: 'Percentage & Profit Loss', type: 'video', videoUrl: '', duration: '25 min', order: 3 },
            { title: 'Simple & Compound Interest', type: 'text', content: '<h2>Interest Formulas</h2><p>Simple Interest = PRT/100</p><p>Compound Interest = P(1+R/100)^T - P</p>', duration: '20 min', order: 4 },
            { title: 'Ratio and Proportion', type: 'video', videoUrl: '', duration: '22 min', order: 5 },
            { title: 'Data Interpretation', type: 'video', videoUrl: '', duration: '35 min', order: 6 },
            { title: 'Syllogism & Coding-Decoding', type: 'video', videoUrl: '', duration: '28 min', order: 7 },
            { title: 'Reading Comprehension', type: 'text', content: '<h2>RC Strategies</h2><p>1. Skim the passage first</p><p>2. Read questions before deep reading</p><p>3. Look for keywords</p>', duration: '20 min', order: 8 },
          ],
        },
        {
          title: 'SSC CGL Complete Guide - Tier 1 & 2',
          description: 'Complete preparation package for SSC CGL examination covering all four subjects with 200+ practice sessions and mock tests.',
          instructor: teacher._id,
          price: 799,
          originalPrice: 1999,
          category: 'SSC',
          level: 'intermediate',
          duration: '60 hours',
          isPublished: true,
          isFeatured: true,
          rating: 4.5,
          reviewCount: 189,
          studentsEnrolled: 980,
          thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=250&fit=crop',
          whatYouWillLearn: ['SSC CGL exam pattern mastery', 'Tier 1 complete preparation', 'Tier 2 advanced topics', 'Previous year paper analysis'],
          requirements: ['Graduation or equivalent', 'Basic aptitude knowledge'],
          lessons: [
            { title: 'SSC CGL Exam Pattern 2024', type: 'video', duration: '20 min', order: 1 },
            { title: 'Quantitative Aptitude - Advanced', type: 'video', duration: '45 min', order: 2 },
            { title: 'General Intelligence & Reasoning', type: 'video', duration: '40 min', order: 3 },
            { title: 'English Comprehension', type: 'video', duration: '35 min', order: 4 },
            { title: 'General Awareness', type: 'text', content: '<h2>Important Topics</h2><ul><li>Indian History</li><li>Geography</li><li>Polity</li><li>Economics</li><li>Science</li></ul>', duration: '30 min', order: 5 },
          ],
        },
        {
          title: 'UPSC Prelims - Indian Polity & Governance',
          description: 'Deep dive into Indian Constitution, Governance, and Political System for UPSC Civil Services Preliminary Examination.',
          instructor: teacher._id,
          price: 1499,
          originalPrice: 3999,
          category: 'UPSC',
          level: 'advanced',
          duration: '80 hours',
          isPublished: true,
          isFeatured: true,
          rating: 4.8,
          reviewCount: 312,
          studentsEnrolled: 2100,
          thumbnail: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=250&fit=crop',
          whatYouWillLearn: ['Indian Constitution in depth', 'Parliamentary System', 'Judiciary & Legal Framework', 'Governance & Public Policy'],
          requirements: ['Graduation in any stream', 'Familiarity with current affairs'],
          lessons: [
            { title: 'Introduction to Indian Constitution', type: 'video', duration: '30 min', order: 1 },
            { title: 'Fundamental Rights', type: 'video', duration: '45 min', order: 2 },
            { title: 'Directive Principles', type: 'video', duration: '35 min', order: 3 },
            { title: 'Parliament & State Legislature', type: 'video', duration: '50 min', order: 4 },
          ],
        },
        {
          title: 'JavaScript Full Stack Development',
          description: 'Learn modern JavaScript from basics to advanced, including Node.js, React, and MongoDB. Build real-world projects.',
          instructor: teacher._id,
          price: 0,
          category: 'Programming',
          level: 'beginner',
          duration: '40 hours',
          isPublished: true,
          isFeatured: true,
          rating: 4.6,
          reviewCount: 156,
          studentsEnrolled: 3200,
          thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop',
          whatYouWillLearn: ['JavaScript ES6+ features', 'React.js fundamentals', 'Node.js & Express', 'MongoDB database', 'REST API design'],
          requirements: ['Basic HTML/CSS knowledge', 'A computer with internet'],
          lessons: [
            { title: 'JavaScript Basics', type: 'video', duration: '25 min', order: 1 },
            { title: 'Functions & Closures', type: 'video', duration: '30 min', order: 2 },
            { title: 'Async JavaScript', type: 'video', duration: '35 min', order: 3 },
            { title: 'Introduction to React', type: 'video', duration: '40 min', order: 4 },
            { title: 'State Management with Redux', type: 'video', duration: '45 min', order: 5 },
          ],
        },
        {
          title: 'Railway Group D Complete Preparation',
          description: 'Everything you need to crack RRB Group D examination with comprehensive study material and mock tests.',
          instructor: teacher._id,
          price: 499,
          originalPrice: 1499,
          category: 'Railways',
          level: 'beginner',
          duration: '35 hours',
          isPublished: true,
          isFeatured: false,
          rating: 4.3,
          reviewCount: 98,
          studentsEnrolled: 750,
          thumbnail: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&h=250&fit=crop',
          whatYouWillLearn: ['Mathematics for Railway exams', 'General Science', 'Reasoning Ability', 'Current Affairs'],
          lessons: [
            { title: 'RRB Group D Syllabus Overview', type: 'video', duration: '15 min', order: 1 },
            { title: 'Mathematics - Speed & Time', type: 'video', duration: '30 min', order: 2 },
            { title: 'General Science - Physics', type: 'video', duration: '35 min', order: 3 },
          ],
        },
        {
          title: 'Python for Data Science & Machine Learning',
          description: 'Complete Python programming course focused on Data Science, ML algorithms, and hands-on projects with real datasets.',
          instructor: teacher._id,
          price: 1299,
          originalPrice: 3499,
          category: 'Programming',
          level: 'intermediate',
          duration: '55 hours',
          isPublished: true,
          isFeatured: true,
          rating: 4.9,
          reviewCount: 421,
          studentsEnrolled: 4500,
          thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=250&fit=crop',
          whatYouWillLearn: ['Python programming', 'NumPy & Pandas', 'Machine Learning with scikit-learn', 'Deep Learning basics', 'Data Visualization'],
          lessons: [
            { title: 'Python Setup & Basics', type: 'video', duration: '20 min', order: 1 },
            { title: 'Data Structures in Python', type: 'video', duration: '35 min', order: 2 },
            { title: 'NumPy Fundamentals', type: 'video', duration: '40 min', order: 3 },
            { title: 'Pandas DataFrames', type: 'video', duration: '45 min', order: 4 },
          ],
        },
      ];

      await Course.insertMany(courses);
      console.log('✅ Seeded', courses.length, 'courses');
    } else {
      console.log('⏭️  Courses already exist:', existingCourses);
    }

    // ── Seed Tests ───────────────────────────────────
    const existingTests = await Test.countDocuments();
    if (existingTests === 0) {
      const tests = [
        {
          title: 'SBI PO Prelims Mock Test 1',
          description: 'Full-length mock test based on latest SBI PO Prelims pattern with 100 questions across 3 sections.',
          instructor: teacher._id,
          category: 'Banking',
          difficulty: 'medium',
          duration: 60,
          totalMarks: 100,
          negativeMarking: true,
          negativeMarks: 0.25,
          isFree: true,
          isPublished: true,
          attemptCount: 5420,
          questions: [
            { question: 'What is 15% of 200?', options: ['25', '30', '35', '40'], correctAnswer: 1, explanation: '15/100 × 200 = 30', marks: 1 },
            { question: 'If A:B = 2:3 and B:C = 4:5, then A:C = ?', options: ['8:15', '2:5', '6:10', '4:15'], correctAnswer: 0, explanation: 'A:B:C = 8:12:15, so A:C = 8:15', marks: 1 },
            { question: 'Find the next number: 2, 6, 12, 20, 30, ?', options: ['40', '42', '44', '46'], correctAnswer: 1, explanation: 'Differences: 4, 6, 8, 10, 12. Next = 30 + 12 = 42', marks: 1 },
            { question: 'Choose the synonym of "Abundant"', options: ['Scarce', 'Plentiful', 'Meager', 'Rare'], correctAnswer: 1, explanation: 'Abundant means plentiful or in great quantity', marks: 1 },
            { question: 'RBI was established in which year?', options: ['1935', '1947', '1950', '1969'], correctAnswer: 0, explanation: 'RBI was established on April 1, 1935', marks: 1 },
            { question: 'A train travels 360 km in 4 hours. What is its speed?', options: ['80 km/h', '90 km/h', '100 km/h', '85 km/h'], correctAnswer: 1, explanation: 'Speed = Distance/Time = 360/4 = 90 km/h', marks: 1 },
            { question: 'Which is the largest bank in India by assets?', options: ['HDFC Bank', 'ICICI Bank', 'SBI', 'PNB'], correctAnswer: 2, explanation: 'SBI is the largest commercial bank in India', marks: 1 },
            { question: 'Find the odd one out: 3, 5, 11, 14, 17, 21', options: ['3', '14', '17', '21'], correctAnswer: 1, explanation: '14 is even, all others are odd', marks: 1 },
            { question: 'What does NEFT stand for?', options: ['National Electronic Fund Transfer', 'New Electronic Fund Transfer', 'National Express Fund Transfer', 'None'], correctAnswer: 0, explanation: 'NEFT = National Electronic Funds Transfer', marks: 1 },
            { question: 'Simple Interest on Rs 5000 at 10% for 2 years?', options: ['Rs 500', 'Rs 1000', 'Rs 1500', 'Rs 750'], correctAnswer: 1, explanation: 'SI = 5000 × 10 × 2 / 100 = 1000', marks: 1 },
          ],
        },
        {
          title: 'SSC CGL Tier 1 Mock Test',
          description: 'Complete mock test for SSC CGL Tier 1 with questions from all four sections.',
          instructor: teacher._id,
          category: 'SSC',
          difficulty: 'medium',
          duration: 60,
          totalMarks: 50,
          negativeMarking: true,
          negativeMarks: 0.5,
          isFree: true,
          isPublished: true,
          attemptCount: 3210,
          questions: [
            { question: 'What is the capital of Arunachal Pradesh?', options: ['Itanagar', 'Dispur', 'Kohima', 'Imphal'], correctAnswer: 0, explanation: 'Itanagar is the capital of Arunachal Pradesh', marks: 2 },
            { question: 'HCF of 12 and 18 is?', options: ['6', '12', '3', '36'], correctAnswer: 0, explanation: 'HCF(12,18) = 6', marks: 2 },
            { question: 'Choose the correct spelling', options: ['Accomodation', 'Accommodation', 'Acomodation', 'Accomodatoin'], correctAnswer: 1, explanation: 'Accommodation is correct (double c, double m)', marks: 2 },
            { question: 'Who wrote the Indian National Anthem?', options: ['Bankim Chandra', 'Rabindranath Tagore', 'Sarojini Naidu', 'Subramania Bharati'], correctAnswer: 1, explanation: 'Jana Gana Mana was written by Rabindranath Tagore', marks: 2 },
            { question: 'Which river is called the Sorrow of Bihar?', options: ['Ganga', 'Kosi', 'Son', 'Gandak'], correctAnswer: 1, explanation: 'River Kosi is called the Sorrow of Bihar due to frequent floods', marks: 2 },
            { question: 'If x + y = 10 and xy = 21, find x² + y²', options: ['58', '52', '48', '62'], correctAnswer: 0, explanation: 'x²+y² = (x+y)² - 2xy = 100 - 42 = 58', marks: 2 },
            { question: 'Photosynthesis takes place in which part of the plant?', options: ['Root', 'Stem', 'Leaves', 'Flower'], correctAnswer: 2, explanation: 'Photosynthesis primarily occurs in leaves (chloroplasts)', marks: 2 },
            { question: 'Complete the series: A, C, F, J, ?', options: ['O', 'N', 'M', 'P'], correctAnswer: 0, explanation: 'Gaps: +2, +3, +4, +5 → J+5 = O', marks: 2 },
          ],
        },
        {
          title: 'UPSC Prelims - Indian History',
          description: 'Practice test covering Ancient, Medieval, and Modern Indian History for UPSC CSE Prelims.',
          instructor: teacher._id,
          category: 'UPSC',
          difficulty: 'hard',
          duration: 30,
          totalMarks: 40,
          negativeMarking: true,
          negativeMarks: 0.33,
          isFree: false,
          price: 99,
          isPublished: true,
          attemptCount: 1890,
          questions: [
            { question: 'The Indus Valley Civilization was discovered in which year?', options: ['1921', '1922', '1920', '1925'], correctAnswer: 0, explanation: 'IVC was discovered in 1921 at Harappa by Daya Ram Sahni', marks: 2 },
            { question: 'Who was the founder of the Maurya Empire?', options: ['Ashoka', 'Bindusara', 'Chandragupta Maurya', 'Brihadratha'], correctAnswer: 2, explanation: 'Chandragupta Maurya founded the Maurya Empire in 322 BCE', marks: 2 },
            { question: 'The Battle of Plassey was fought in?', options: ['1757', '1764', '1857', '1761'], correctAnswer: 0, explanation: 'Battle of Plassey (1757) - British vs Siraj ud-Daulah', marks: 2 },
            { question: 'Who started the Quit India Movement?', options: ['Nehru', 'Gandhi', 'Subhash Chandra Bose', 'Sardar Patel'], correctAnswer: 1, explanation: 'Mahatma Gandhi launched the Quit India Movement on August 8, 1942', marks: 2 },
            { question: 'Akbar founded Din-i-Ilahi in which year?', options: ['1582', '1575', '1580', '1585'], correctAnswer: 0, explanation: 'Din-i-Ilahi was founded by Akbar in 1582', marks: 2 },
          ],
        },
        {
          title: 'JavaScript Fundamentals Quiz',
          description: 'Test your JavaScript knowledge with this comprehensive quiz covering ES6+, async programming, and DOM manipulation.',
          instructor: teacher._id,
          category: 'Programming',
          difficulty: 'easy',
          duration: 20,
          totalMarks: 20,
          isFree: true,
          isPublished: true,
          attemptCount: 8750,
          questions: [
            { question: 'Which keyword declares a block-scoped variable in JavaScript?', options: ['var', 'let', 'function', 'declare'], correctAnswer: 1, explanation: 'let and const are block-scoped. var is function-scoped.', marks: 2 },
            { question: 'What does "===" operator check?', options: ['Value only', 'Type only', 'Value and type', 'Reference'], correctAnswer: 2, explanation: '=== is the strict equality operator checking both value and type', marks: 2 },
            { question: 'What is the output of typeof null?', options: ['"null"', '"undefined"', '"object"', '"boolean"'], correctAnswer: 2, explanation: 'typeof null returns "object" - this is a known JavaScript quirk', marks: 2 },
            { question: 'Which method converts JSON string to JavaScript object?', options: ['JSON.stringify()', 'JSON.parse()', 'JSON.convert()', 'JSON.toObject()'], correctAnswer: 1, explanation: 'JSON.parse() converts a JSON string to a JavaScript object', marks: 2 },
            { question: 'What does the spread operator look like?', options: ['**', '...', '&&', '||'], correctAnswer: 1, explanation: 'The spread operator is represented by three dots (...)', marks: 2 },
            { question: 'Which is NOT a JavaScript data type?', options: ['Symbol', 'BigInt', 'Float', 'Undefined'], correctAnswer: 2, explanation: 'JavaScript has Number (no separate Float type)', marks: 2 },
            { question: 'What does async/await help with?', options: ['Styling', 'Asynchronous code', 'Loops', 'Variables'], correctAnswer: 1, explanation: 'async/await makes asynchronous code look synchronous', marks: 2 },
            { question: 'What is a closure in JavaScript?', options: ['A loop', 'A function with access to outer scope', 'An error type', 'A data type'], correctAnswer: 1, explanation: 'A closure is a function that remembers its outer scope even after the outer function has returned', marks: 2 },
          ],
        },
        {
          title: 'RRB NTPC General Awareness',
          description: 'General Awareness practice test for Railway NTPC examination.',
          instructor: teacher._id,
          category: 'Railways',
          difficulty: 'easy',
          duration: 30,
          totalMarks: 30,
          isFree: true,
          isPublished: true,
          attemptCount: 4320,
          questions: [
            { question: 'Indian Railways was nationalized in which year?', options: ['1951', '1947', '1950', '1953'], correctAnswer: 2, explanation: 'Indian Railways was nationalized on April 1, 1950', marks: 1 },
            { question: 'Which is the longest railway platform in India?', options: ['Gorakhpur', 'Kharagpur', 'Kollam', 'Bilaspur'], correctAnswer: 0, explanation: 'Gorakhpur has the longest railway platform (1,366.33 meters)', marks: 1 },
            { question: 'Who is known as the Father of Indian Railways?', options: ['Lord Dalhousie', 'Lord Curzon', 'Lord Ripon', 'Lord Canning'], correctAnswer: 0, explanation: 'Lord Dalhousie introduced railways in India in 1853', marks: 1 },
            { question: 'First train in India ran between which stations?', options: ['Delhi-Agra', 'Bombay-Thane', 'Calcutta-Delhi', 'Madras-Bangalore'], correctAnswer: 1, explanation: 'First train ran from Bombay (Bori Bunder) to Thane on April 16, 1853', marks: 1 },
            { question: 'Railway Budget was merged with Union Budget in which year?', options: ['2016', '2017', '2018', '2015'], correctAnswer: 1, explanation: 'Railway Budget was merged with Union Budget from 2017-18', marks: 1 },
          ],
        },
      ];

      await Test.insertMany(tests);
      console.log('✅ Seeded', tests.length, 'tests');
    } else {
      console.log('⏭️  Tests already exist:', existingTests);
    }

    // ── Seed Badges ──────────────────────────────────
    const existingBadges = await Badge.countDocuments();
    if (existingBadges === 0) {
      const badges = [
        { name: 'First Steps', description: 'Complete your first lesson', icon: '🎯', criteria: 'lessons_completed', requirement: 1 },
        { name: 'Quick Learner', description: 'Complete 10 lessons', icon: '📚', criteria: 'lessons_completed', requirement: 10 },
        { name: 'Test Taker', description: 'Complete your first test', icon: '📝', criteria: 'tests_completed', requirement: 1 },
        { name: 'Test Champion', description: 'Complete 10 tests', icon: '🏆', criteria: 'tests_completed', requirement: 10 },
        { name: 'Perfect Score', description: 'Score 100% in any test', icon: '💯', criteria: 'perfect_score', requirement: 1 },
        { name: 'Bookworm', description: 'Enroll in 5 courses', icon: '🐛', criteria: 'courses_enrolled', requirement: 5 },
        { name: 'Streak Master', description: '7 day learning streak', icon: '🔥', criteria: 'streak_days', requirement: 7 },
        { name: 'Social Learner', description: 'Post 5 discussions', icon: '💬', criteria: 'discussions_posted', requirement: 5 },
        { name: 'Note Taker', description: 'Create 10 notes', icon: '📒', criteria: 'notes_created', requirement: 10 },
        { name: 'Course Graduate', description: 'Complete a full course', icon: '🎓', criteria: 'courses_completed', requirement: 1 },
        { name: 'Rising Star', description: 'Reach top 100 on leaderboard', icon: '⭐', criteria: 'leaderboard_rank', requirement: 100 },
        { name: 'Elite Learner', description: 'Complete 50 lessons', icon: '👑', criteria: 'lessons_completed', requirement: 50 },
      ];
      await Badge.insertMany(badges);
      console.log('✅ Seeded', badges.length, 'badges');
    } else {
      console.log('⏭️  Badges already exist:', existingBadges);
    }

    console.log('\n🎉 Seed complete!');
    console.log('   Courses:', await Course.countDocuments());
    console.log('   Tests:', await Test.countDocuments());
    console.log('   Categories:', await ExamCategory.countDocuments());
    console.log('   Badges:', await Badge.countDocuments());

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
