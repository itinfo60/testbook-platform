import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb+srv://itinfo60:hHWTKq5QzG.ciJ7@cluster0.st80uui.mongodb.net/Test-Book?appName=Cluster0';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Helper: safely drop a unique index if it exists
async function safeDropIndex(collection, indexName) {
  try {
    await collection.dropIndex(indexName);
    console.log(`🗑️  Dropped ${indexName} index on ${collection.collectionName}`);
  } catch (e) {
    // Index doesn't exist — that's fine
  }
}

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('📦 Connected to MongoDB:', MONGO_URI);

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Existing collections:', collections.map(c => c.name).join(', '));

    const db = mongoose.connection.db;

    // ══════════════════════════════════════════════════
    // 1. USERS
    // ══════════════════════════════════════════════════
    const usersCol = db.collection('users');

    let teacher = await usersCol.findOne({ email: 'teacher@testbook.com' });
    let student = await usersCol.findOne({ email: 'student@testbook.com' });
    let admin = await usersCol.findOne({ email: 'admin@testbook.com' });

    const hashedPass = await bcrypt.hash('Teacher@123456', 10);
    const hashedStudentPass = await bcrypt.hash('Student@123456', 10);
    const hashedAdminPass = await bcrypt.hash('Admin@123456', 10);

    if (!teacher) {
      const res = await usersCol.insertOne({
        name: 'Rajesh Kumar',
        email: 'teacher@testbook.com',
        password: hashedPass,
        role: 'teacher',
        isVerified: true,
        isActive: true,
        bio: 'Expert educator with 10+ years of experience in competitive exam preparation.',
        phone: '+91 98765 43210',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      teacher = await usersCol.findOne({ _id: res.insertedId });
      console.log('✅ Created teacher user');
    } else {
      console.log('⏭️  Teacher exists:', teacher.name);
    }

    if (!student) {
      const res = await usersCol.insertOne({
        name: 'Priya Sharma',
        email: 'student@testbook.com',
        password: hashedStudentPass,
        role: 'student',
        isVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      student = await usersCol.findOne({ _id: res.insertedId });
      console.log('✅ Created student user');
    } else {
      console.log('⏭️  Student exists:', student.name);
    }

    if (!admin) {
      await usersCol.insertOne({
        name: 'Admin User',
        email: 'admin@testbook.com',
        password: hashedAdminPass,
        role: 'admin',
        isVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('✅ Created admin user');
    } else {
      console.log('⏭️  Admin exists:', admin.name);
    }

    const teacherId = teacher._id;
    const studentId = student._id;

    // ══════════════════════════════════════════════════
    // 2. EXAM CATEGORIES
    // ══════════════════════════════════════════════════
    const catCol = db.collection('examcategories');
    const catCount = await catCol.countDocuments();

    if (catCount === 0) {
      await catCol.insertMany([
        { name: 'Banking', slug: 'banking', description: 'Banking & Insurance exams', icon: '🏦', courseCount: 3, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { name: 'SSC', slug: 'ssc', description: 'Staff Selection Commission', icon: '🏛️', courseCount: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { name: 'Railways', slug: 'railways', description: 'Railway Recruitment Board', icon: '🚂', courseCount: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { name: 'UPSC', slug: 'upsc', description: 'Union Public Service Commission', icon: '📜', courseCount: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { name: 'State PSC', slug: 'state-psc', description: 'State Public Service Commissions', icon: '🏢', courseCount: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { name: 'Teaching', slug: 'teaching', description: 'Teaching exams - CTET, TET', icon: '📖', courseCount: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { name: 'Defence', slug: 'defence', description: 'NDA, CDS, AFCAT', icon: '🎖️', courseCount: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { name: 'Programming', slug: 'programming', description: 'Coding & Software Development', icon: '💻', courseCount: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      ]);
      console.log('✅ Seeded 8 exam categories');
    } else {
      console.log('⏭️  Categories exist:', catCount);
    }

    // ══════════════════════════════════════════════════
    // 🔑 BUILD CATEGORY LOOKUP MAP (name → ObjectId)
    // ══════════════════════════════════════════════════
    const allCategories = await catCol.find({}).toArray();
    const categoryMap = {};
    allCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });
    console.log('🗂️  Category map built:', Object.keys(categoryMap).join(', '));

    // ══════════════════════════════════════════════════
    // 3. COURSES
    // ══════════════════════════════════════════════════
    const courseCol = db.collection('courses');
    const courseCount = await courseCol.countDocuments();

    if (courseCount === 0) {
      await safeDropIndex(courseCol, 'slug_1');

      const courses = [
        {
          title: 'Complete Banking Exam Preparation 2024',
          slug: slugify('Complete Banking Exam Preparation 2024'),
          description: 'Master all banking exams including SBI PO, IBPS PO, RBI Grade B, and IBPS Clerk with comprehensive study material, practice tests, and expert guidance.',
          instructor: teacherId,
          category: categoryMap['Banking'],
          price: 999,
          originalPrice: 2999,
          level: 'beginner',
          duration: '45 hours',
          language: 'English',
          isPublished: true,
          isFeatured: true,
          rating: 4.7,
          reviewCount: 234,
          studentsEnrolled: 1520,
          thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop',
          whatYouWillLearn: ['Quantitative Aptitude shortcuts', 'Logical Reasoning', 'English Grammar', 'Banking Awareness', 'Computer Knowledge', 'Time management'],
          requirements: ['Basic math knowledge', '10+2 passed', 'Dedication to study daily'],
          lessons: [
            { title: 'Introduction to Banking Exams', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '15 min', order: 1 },
            { title: 'Number System - Basics & Tricks', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '30 min', order: 2 },
            { title: 'Percentage & Profit Loss', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '25 min', order: 3 },
            { title: 'Simple & Compound Interest', type: 'text', content: '<h2>Interest Formulas</h2><p>SI = PRT/100, CI = P(1+R/100)^T - P</p>', duration: '20 min', order: 4 },
            { title: 'Ratio, Proportion & Partnership', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '22 min', order: 5 },
            { title: 'Data Interpretation Masterclass', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '35 min', order: 6 },
            { title: 'Syllogism & Coding-Decoding', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '28 min', order: 7 },
            { title: 'Reading Comprehension Strategies', type: 'text', content: '<h2>RC Strategies</h2><ol><li>Skim first</li><li>Read questions</li><li>Look for keywords</li></ol>', duration: '20 min', order: 8 },
          ],
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date(),
        },
        {
          title: 'SSC CGL Complete Guide - Tier 1 & Tier 2',
          slug: slugify('SSC CGL Complete Guide Tier 1 Tier 2'),
          description: 'Complete preparation package for SSC CGL examination.',
          instructor: teacherId,
          category: categoryMap['SSC'],
          price: 799,
          originalPrice: 1999,
          level: 'intermediate',
          duration: '60 hours',
          language: 'Hindi',
          isPublished: true,
          isFeatured: true,
          rating: 4.5,
          reviewCount: 189,
          studentsEnrolled: 980,
          thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=250&fit=crop',
          whatYouWillLearn: ['SSC CGL exam pattern', 'Tier 1 prep', 'Tier 2 advanced', 'Previous year analysis'],
          requirements: ['Graduation or equivalent'],
          lessons: [
            { title: 'SSC CGL Exam Pattern 2024', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '20 min', order: 1 },
            { title: 'Quantitative Aptitude - Advanced', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '45 min', order: 2 },
            { title: 'General Intelligence & Reasoning', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '40 min', order: 3 },
            { title: 'English Comprehension', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '35 min', order: 4 },
            { title: 'General Awareness Notes', type: 'text', content: '<h2>Key Topics</h2><ul><li>History</li><li>Geography</li><li>Polity</li><li>Economics</li><li>Science</li></ul>', duration: '30 min', order: 5 },
          ],
          createdAt: new Date('2024-02-10'),
          updatedAt: new Date(),
        },
        {
          title: 'UPSC Prelims - Indian Polity & Governance',
          slug: slugify('UPSC Prelims Indian Polity Governance'),
          description: 'Deep dive into Indian Constitution for UPSC CSE Prelims.',
          instructor: teacherId,
          category: categoryMap['UPSC'],
          price: 1499,
          originalPrice: 3999,
          level: 'advanced',
          duration: '80 hours',
          language: 'English',
          isPublished: true,
          isFeatured: true,
          rating: 4.8,
          reviewCount: 312,
          studentsEnrolled: 2100,
          thumbnail: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=250&fit=crop',
          whatYouWillLearn: ['Indian Constitution', 'Parliamentary System', 'Judiciary', 'Governance'],
          requirements: ['Graduation in any stream'],
          lessons: [
            { title: 'Introduction to Indian Constitution', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '30 min', order: 1 },
            { title: 'Fundamental Rights (Art. 12-35)', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '45 min', order: 2 },
            { title: 'Directive Principles', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '35 min', order: 3 },
            { title: 'Parliament - Structure & Functions', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '50 min', order: 4 },
            { title: 'Supreme Court & High Courts', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '40 min', order: 5 },
          ],
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date(),
        },
        {
          title: 'JavaScript Full Stack Development',
          slug: slugify('JavaScript Full Stack Development'),
          description: 'Learn modern JavaScript from basics to advanced.',
          instructor: teacherId,
          category: categoryMap['Programming'],
          price: 0,
          originalPrice: 0,
          level: 'beginner',
          duration: '40 hours',
          language: 'English',
          isPublished: true,
          isFeatured: true,
          rating: 4.6,
          reviewCount: 156,
          studentsEnrolled: 3200,
          thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop',
          whatYouWillLearn: ['JavaScript ES6+', 'React.js', 'Node.js & Express', 'MongoDB', 'REST API'],
          requirements: ['Basic HTML/CSS knowledge'],
          lessons: [
            { title: 'JavaScript Basics - Variables & Types', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '25 min', order: 1 },
            { title: 'Functions, Closures & Scope', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '30 min', order: 2 },
            { title: 'Async JavaScript - Promises & Await', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '35 min', order: 3 },
            { title: 'Introduction to React', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '40 min', order: 4 },
            { title: 'State Management with Redux', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '45 min', order: 5 },
            { title: 'Node.js & Express REST API', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '50 min', order: 6 },
          ],
          createdAt: new Date('2024-03-01'),
          updatedAt: new Date(),
        },
        {
          title: 'Railway Group D Complete Preparation',
          slug: slugify('Railway Group D Complete Preparation'),
          description: 'Everything you need to crack RRB Group D.',
          instructor: teacherId,
          category: categoryMap['Railways'],
          price: 499,
          originalPrice: 1499,
          level: 'beginner',
          duration: '35 hours',
          language: 'Hindi',
          isPublished: true,
          isFeatured: false,
          rating: 4.3,
          reviewCount: 98,
          studentsEnrolled: 750,
          thumbnail: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&h=250&fit=crop',
          whatYouWillLearn: ['Mathematics', 'General Science', 'Reasoning', 'Current Affairs'],
          requirements: ['10th pass'],
          lessons: [
            { title: 'RRB Group D Syllabus Overview', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '15 min', order: 1 },
            { title: 'Mathematics - Speed, Time & Distance', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '30 min', order: 2 },
            { title: 'General Science - Physics Basics', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '35 min', order: 3 },
            { title: 'Reasoning - Analogy & Series', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '25 min', order: 4 },
          ],
          createdAt: new Date('2024-02-20'),
          updatedAt: new Date(),
        },
        {
          title: 'Python for Data Science & Machine Learning',
          slug: slugify('Python for Data Science Machine Learning'),
          description: 'Complete Python course for Data Science and ML.',
          instructor: teacherId,
          category: categoryMap['Programming'],
          price: 1299,
          originalPrice: 3499,
          level: 'intermediate',
          duration: '55 hours',
          language: 'English',
          isPublished: true,
          isFeatured: true,
          rating: 4.9,
          reviewCount: 421,
          studentsEnrolled: 4500,
          thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=250&fit=crop',
          whatYouWillLearn: ['Python from scratch', 'NumPy & Pandas', 'ML with scikit-learn', 'Deep Learning', 'Data Visualization'],
          requirements: ['No prior coding needed'],
          lessons: [
            { title: 'Python Setup & Basics', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '20 min', order: 1 },
            { title: 'Data Structures in Python', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '35 min', order: 2 },
            { title: 'NumPy Fundamentals', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '40 min', order: 3 },
            { title: 'Pandas DataFrames & Analysis', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '45 min', order: 4 },
            { title: 'Linear Regression from Scratch', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '50 min', order: 5 },
          ],
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date(),
        },
        {
          title: 'SBI Clerk Pre + Mains Complete Course',
          slug: slugify('SBI Clerk Pre Mains Complete Course'),
          description: 'Comprehensive SBI Clerk examination preparation.',
          instructor: teacherId,
          category: categoryMap['Banking'],
          price: 699,
          originalPrice: 1799,
          level: 'beginner',
          duration: '38 hours',
          language: 'Both',
          isPublished: true,
          isFeatured: false,
          rating: 4.4,
          reviewCount: 167,
          studentsEnrolled: 890,
          thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=250&fit=crop',
          whatYouWillLearn: ['SBI Clerk syllabus', 'Prelims strategy', 'Mains prep', 'Mock tests'],
          requirements: ['Graduation completed or pursuing'],
          lessons: [
            { title: 'SBI Clerk Exam Overview', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '18 min', order: 1 },
            { title: 'Numerical Ability Shortcuts', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '35 min', order: 2 },
            { title: 'English Language - Grammar', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '30 min', order: 3 },
          ],
          createdAt: new Date('2024-03-10'),
          updatedAt: new Date(),
        },
        {
          title: 'CTET Paper 1 & 2 - Complete Teaching Course',
          slug: slugify('CTET Paper 1 2 Complete Teaching Course'),
          description: 'Prepare for CTET with comprehensive lessons.',
          instructor: teacherId,
          category: categoryMap['Teaching'],
          price: 599,
          originalPrice: 1299,
          level: 'intermediate',
          duration: '42 hours',
          language: 'Hindi',
          isPublished: true,
          isFeatured: false,
          rating: 4.2,
          reviewCount: 89,
          studentsEnrolled: 560,
          thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=250&fit=crop',
          whatYouWillLearn: ['Child Development', 'Teaching methodologies', 'Subject-specific prep', 'Previous year analysis'],
          requirements: ['B.Ed or D.El.Ed'],
          lessons: [
            { title: 'Child Development Theories', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '40 min', order: 1 },
            { title: 'Piaget & Vygotsky', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '35 min', order: 2 },
            { title: 'Inclusive Education', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: '25 min', order: 3 },
          ],
          createdAt: new Date('2024-02-05'),
          updatedAt: new Date(),
        },
      ];

      await courseCol.insertMany(courses);
      console.log('✅ Seeded', courses.length, 'courses');
    } else {
      console.log('⏭️  Courses exist:', courseCount);
    }

    // ══════════════════════════════════════════════════
    // 4. TESTS (with slug fix!)
    // ══════════════════════════════════════════════════
    const testCol = db.collection('tests');
    const testCount = await testCol.countDocuments();

    if (testCount === 0) {
      // ⬇️ FIX: Drop the stale slug_1 unique index on tests too
      await safeDropIndex(testCol, 'slug_1');

      const tests = [
        {
          title: 'SBI PO Prelims Mock Test 1',
          slug: slugify('SBI PO Prelims Mock Test 1'),             // ✅ ADDED
          description: 'Full-length mock test based on latest SBI PO Prelims pattern.',
          instructor: teacherId,
          category: categoryMap['Banking'],
          difficulty: 'medium',
          duration: 60,
          totalMarks: 100,
          negativeMarking: true,
          negativeMarks: 0.25,
          isFree: true,
          price: 0,
          isPublished: true,
          attemptCount: 5420,
          questions: [
            { question: 'What is 15% of 200?', options: ['25', '30', '35', '40'], correctAnswer: 1, explanation: '15/100 × 200 = 30', marks: 1 },
            { question: 'If A:B = 2:3 and B:C = 4:5, then A:C = ?', options: ['8:15', '2:5', '6:10', '4:15'], correctAnswer: 0, explanation: 'A:B:C = 8:12:15, so A:C = 8:15', marks: 1 },
            { question: 'Find the next: 2, 6, 12, 20, 30, ?', options: ['40', '42', '44', '46'], correctAnswer: 1, explanation: 'Differences: 4,6,8,10,12', marks: 1 },
            { question: 'Synonym of "Abundant"?', options: ['Scarce', 'Plentiful', 'Meager', 'Rare'], correctAnswer: 1, explanation: 'Abundant = plentiful', marks: 1 },
            { question: 'RBI was established in which year?', options: ['1935', '1947', '1950', '1969'], correctAnswer: 0, explanation: 'April 1, 1935', marks: 1 },
            { question: 'A train travels 360 km in 4 hours. Speed?', options: ['80 km/h', '90 km/h', '100 km/h', '85 km/h'], correctAnswer: 1, explanation: '360/4 = 90', marks: 1 },
            { question: 'Largest bank in India by assets?', options: ['HDFC', 'ICICI', 'SBI', 'PNB'], correctAnswer: 2, explanation: 'SBI', marks: 1 },
            { question: 'Odd one out: 3, 5, 11, 14, 17, 21', options: ['3', '14', '17', '21'], correctAnswer: 1, explanation: '14 is even', marks: 1 },
            { question: 'NEFT stands for?', options: ['National Electronic Fund Transfer', 'New Electronic Fund Transfer', 'National Express Fund Transfer', 'None'], correctAnswer: 0, explanation: 'National Electronic Funds Transfer', marks: 1 },
            { question: 'SI on ₹5000 at 10% for 2 years?', options: ['₹500', '₹1000', '₹1500', '₹750'], correctAnswer: 1, explanation: '5000×10×2/100 = 1000', marks: 1 },
          ],
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date(),
        },
        {
          title: 'SSC CGL Tier 1 Practice Set',
          slug: slugify('SSC CGL Tier 1 Practice Set'),            // ✅ ADDED
          description: 'Practice test for SSC CGL Tier 1.',
          instructor: teacherId,
          category: categoryMap['SSC'],
          difficulty: 'medium',
          duration: 60,
          totalMarks: 200,
          negativeMarking: true,
          negativeMarks: 0.5,
          isFree: true,
          price: 0,
          isPublished: true,
          attemptCount: 3210,
          questions: [
            { question: 'Capital of Arunachal Pradesh?', options: ['Itanagar', 'Dispur', 'Kohima', 'Imphal'], correctAnswer: 0, explanation: 'Itanagar', marks: 2 },
            { question: 'HCF of 12 and 18?', options: ['6', '12', '3', '36'], correctAnswer: 0, explanation: 'HCF = 6', marks: 2 },
            { question: 'Correct spelling?', options: ['Accomodation', 'Accommodation', 'Acomodation', 'Acommodation'], correctAnswer: 1, explanation: 'Double c, double m', marks: 2 },
            { question: 'Who wrote the National Anthem?', options: ['Bankim Chandra', 'Rabindranath Tagore', 'Sarojini Naidu', 'Subramania Bharati'], correctAnswer: 1, explanation: 'Tagore', marks: 2 },
            { question: '"Sorrow of Bihar" river?', options: ['Ganga', 'Kosi', 'Son', 'Gandak'], correctAnswer: 1, explanation: 'Kosi', marks: 2 },
            { question: 'If x+y=10, xy=21, find x²+y²', options: ['58', '52', '48', '62'], correctAnswer: 0, explanation: '100-42 = 58', marks: 2 },
            { question: 'Photosynthesis occurs in?', options: ['Root', 'Stem', 'Leaves', 'Flower'], correctAnswer: 2, explanation: 'Chloroplasts in leaves', marks: 2 },
            { question: 'Series: A, C, F, J, ?', options: ['O', 'N', 'M', 'P'], correctAnswer: 0, explanation: '+2,+3,+4,+5 → O', marks: 2 },
          ],
          createdAt: new Date('2024-02-15'),
          updatedAt: new Date(),
        },
        {
          title: 'JavaScript Fundamentals Quiz',
          slug: slugify('JavaScript Fundamentals Quiz'),            // ✅ ADDED
          description: 'Test your JavaScript knowledge.',
          instructor: teacherId,
          category: categoryMap['Programming'],
          difficulty: 'easy',
          duration: 20,
          totalMarks: 20,
          negativeMarking: false,
          isFree: true,
          price: 0,
          isPublished: true,
          attemptCount: 8750,
          questions: [
            { question: 'Block-scoped variable keyword?', options: ['var', 'let', 'function', 'declare'], correctAnswer: 1, explanation: 'let is block-scoped', marks: 2 },
            { question: '"===" checks?', options: ['Value only', 'Type only', 'Value and type', 'Reference'], correctAnswer: 2, explanation: 'Strict equality', marks: 2 },
            { question: 'typeof null?', options: ['"null"', '"undefined"', '"object"', '"boolean"'], correctAnswer: 2, explanation: 'Known JS quirk', marks: 2 },
            { question: 'JSON string → object?', options: ['JSON.stringify()', 'JSON.parse()', 'JSON.convert()', 'JSON.toObject()'], correctAnswer: 1, explanation: 'JSON.parse()', marks: 2 },
            { question: 'Spread operator?', options: ['**', '...', '&&', '||'], correctAnswer: 1, explanation: 'Three dots', marks: 2 },
            { question: 'NOT a JS data type?', options: ['Symbol', 'BigInt', 'Float', 'Undefined'], correctAnswer: 2, explanation: 'No Float type', marks: 2 },
            { question: 'async/await helps with?', options: ['Styling', 'Async code', 'Loops', 'Variables'], correctAnswer: 1, explanation: 'Async operations', marks: 2 },
            { question: 'What is a closure?', options: ['A loop', 'Function with outer scope access', 'An error', 'A data type'], correctAnswer: 1, explanation: 'Function remembers outer scope', marks: 2 },
          ],
          createdAt: new Date('2024-03-01'),
          updatedAt: new Date(),
        },
        {
          title: 'UPSC Prelims - Indian History',
          slug: slugify('UPSC Prelims Indian History'),             // ✅ ADDED
          description: 'Practice test covering Indian History for UPSC.',
          instructor: teacherId,
          category: categoryMap['UPSC'],
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
            { question: 'Indus Valley Civilization discovered in?', options: ['1921', '1922', '1920', '1925'], correctAnswer: 0, explanation: '1921 at Harappa', marks: 2 },
            { question: 'Founder of Maurya Empire?', options: ['Ashoka', 'Bindusara', 'Chandragupta Maurya', 'Brihadratha'], correctAnswer: 2, explanation: 'Chandragupta Maurya', marks: 2 },
            { question: 'Battle of Plassey year?', options: ['1757', '1764', '1857', '1761'], correctAnswer: 0, explanation: '1757', marks: 2 },
            { question: 'Who started Quit India Movement?', options: ['Nehru', 'Gandhi', 'Bose', 'Patel'], correctAnswer: 1, explanation: 'Gandhi, 1942', marks: 2 },
            { question: 'Akbar\'s Din-i-Ilahi year?', options: ['1582', '1575', '1580', '1585'], correctAnswer: 0, explanation: '1582', marks: 2 },
          ],
          createdAt: new Date('2024-01-25'),
          updatedAt: new Date(),
        },
        {
          title: 'RRB NTPC General Awareness',
          slug: slugify('RRB NTPC General Awareness'),              // ✅ ADDED
          description: 'General Awareness for Railway NTPC.',
          instructor: teacherId,
          category: categoryMap['Railways'],
          difficulty: 'easy',
          duration: 30,
          totalMarks: 30,
          negativeMarking: false,
          isFree: true,
          price: 0,
          isPublished: true,
          attemptCount: 4320,
          questions: [
            { question: 'Indian Railways nationalized in?', options: ['1951', '1947', '1950', '1953'], correctAnswer: 2, explanation: 'April 1, 1950', marks: 1 },
            { question: 'Longest railway platform in India?', options: ['Gorakhpur', 'Kharagpur', 'Kollam', 'Bilaspur'], correctAnswer: 0, explanation: 'Gorakhpur', marks: 1 },
            { question: 'Father of Indian Railways?', options: ['Lord Dalhousie', 'Lord Curzon', 'Lord Ripon', 'Lord Canning'], correctAnswer: 0, explanation: 'Lord Dalhousie', marks: 1 },
            { question: 'First train route in India?', options: ['Delhi-Agra', 'Bombay-Thane', 'Calcutta-Delhi', 'Madras-Bangalore'], correctAnswer: 1, explanation: 'Bombay to Thane, 1853', marks: 1 },
            { question: 'Railway Budget merged with Union Budget in?', options: ['2016', '2017', '2018', '2015'], correctAnswer: 1, explanation: '2017-18', marks: 1 },
          ],
          createdAt: new Date('2024-02-28'),
          updatedAt: new Date(),
        },
        {
          title: 'IBPS PO Reasoning Ability Test',
          slug: slugify('IBPS PO Reasoning Ability Test'),          // ✅ ADDED
          description: 'Comprehensive reasoning test for IBPS PO.',
          instructor: teacherId,
          category: categoryMap['Banking'],
          difficulty: 'hard',
          duration: 45,
          totalMarks: 50,
          negativeMarking: true,
          negativeMarks: 0.25,
          isFree: true,
          price: 0,
          isPublished: true,
          attemptCount: 2150,
          questions: [
            { question: 'If APPLE = 50, then ORANGE = ?', options: ['60', '65', '70', '75'], correctAnswer: 2, explanation: 'Letter sum = 70', marks: 2 },
            { question: 'All cats are dogs. All dogs are birds. ∴ All cats are birds.', options: ['True', 'False', 'Cannot determine', 'Partially true'], correctAnswer: 0, explanation: 'Valid syllogism', marks: 2 },
            { question: 'Find missing: 1, 4, 9, 16, 25, ?', options: ['30', '36', '49', '35'], correctAnswer: 1, explanation: '6²=36', marks: 2 },
            { question: 'Mirror image of AMBULANCE?', options: ['ECNALUBMA', 'AMBULANCE (reversed)', 'ƎƆNⱯ˥∩qW∀', 'None'], correctAnswer: 0, explanation: 'Mirror reverses', marks: 2 },
            { question: 'If Monday = 1, Wednesday = 3, then Saturday = ?', options: ['5', '6', '7', '4'], correctAnswer: 1, explanation: 'Saturday = 6', marks: 2 },
          ],
          createdAt: new Date('2024-03-05'),
          updatedAt: new Date(),
        },
      ];

      await testCol.insertMany(tests);
      console.log('✅ Seeded', tests.length, 'tests');
    } else {
      console.log('⏭️  Tests exist:', testCount);
    }

    // ══════════════════════════════════════════════════
    // 5. BADGES
    // ══════════════════════════════════════════════════
    const badgeCol = db.collection('badges');
    const badgeCount = await badgeCol.countDocuments();

    if (badgeCount === 0) {
      await badgeCol.insertMany([
        { name: 'First Steps', description: 'Complete your first lesson', icon: '🎯', criteria: 'lessons_completed', requirement: 1, createdAt: new Date() },
        { name: 'Quick Learner', description: 'Complete 10 lessons', icon: '📚', criteria: 'lessons_completed', requirement: 10, createdAt: new Date() },
        { name: 'Test Taker', description: 'Complete your first test', icon: '📝', criteria: 'tests_completed', requirement: 1, createdAt: new Date() },
        { name: 'Test Champion', description: 'Complete 10 tests', icon: '🏆', criteria: 'tests_completed', requirement: 10, createdAt: new Date() },
        { name: 'Perfect Score', description: 'Score 100% in any test', icon: '💯', criteria: 'perfect_score', requirement: 1, createdAt: new Date() },
        { name: 'Bookworm', description: 'Enroll in 5 courses', icon: '🐛', criteria: 'courses_enrolled', requirement: 5, createdAt: new Date() },
        { name: 'Streak Master', description: '7 day learning streak', icon: '🔥', criteria: 'streak_days', requirement: 7, createdAt: new Date() },
        { name: 'Social Learner', description: 'Post 5 discussions', icon: '💬', criteria: 'discussions_posted', requirement: 5, createdAt: new Date() },
        { name: 'Note Taker', description: 'Create 10 notes', icon: '📒', criteria: 'notes_created', requirement: 10, createdAt: new Date() },
        { name: 'Course Graduate', description: 'Complete a full course', icon: '🎓', criteria: 'courses_completed', requirement: 1, createdAt: new Date() },
        { name: 'Rising Star', description: 'Top 100 on leaderboard', icon: '⭐', criteria: 'leaderboard_rank', requirement: 100, createdAt: new Date() },
        { name: 'Elite Learner', description: 'Complete 50 lessons', icon: '👑', criteria: 'lessons_completed', requirement: 50, createdAt: new Date() },
      ]);
      console.log('✅ Seeded 12 badges');
    } else {
      console.log('⏭️  Badges exist:', badgeCount);
    }

    // ══════════════════════════════════════════════════
    // 6. ENROLLMENTS
    // ══════════════════════════════════════════════════
    const enrollCol = db.collection('enrollments');
    const enrollCount = await enrollCol.countDocuments({ user: studentId });

    if (enrollCount === 0) {
      const courses = await courseCol.find({}).limit(3).toArray();
      if (courses.length > 0) {
        const enrollments = courses.map((course, i) => ({
          user: studentId,
          course: course._id,
          progress: [25, 60, 10][i] || 0,
          completedLessons: [],
          isCompleted: false,
          enrolledAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        await enrollCol.insertMany(enrollments);
        console.log('✅ Enrolled student in', enrollments.length, 'courses');
      }
    } else {
      console.log('⏭️  Student enrollments exist:', enrollCount);
    }

    // ── Summary ───────────────────────────────────────
    console.log('\n🎉 ══════════════════════════════════════');
    console.log('   SEED COMPLETE!');
    console.log('   ──────────────────────────────────────');
    console.log('   Users:       ', await usersCol.countDocuments());
    console.log('   Courses:     ', await courseCol.countDocuments());
    console.log('   Tests:       ', await testCol.countDocuments());
    console.log('   Categories:  ', await catCol.countDocuments());
    console.log('   Badges:      ', await badgeCol.countDocuments());
    console.log('   Enrollments: ', await enrollCol.countDocuments());
    console.log('══════════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();