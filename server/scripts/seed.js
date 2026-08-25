import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../src/models/User.js';
import ExamCategory from '../src/models/ExamCategory.js';
import Badge from '../src/models/Badge.js';

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([User.deleteMany({}), ExamCategory.deleteMany({}), Badge.deleteMany({})]);

    // Seed Admin
    console.log('👤 Creating admin user...');
    await User.create({
      name: 'Super Admin',
      email: 'admin@civicshub.com',
      password: 'Admin@123456',
      role: 'super_admin',
      isEmailVerified: true,
      isActive: true,
    });

    // Seed Teacher
    console.log('👨‍🏫 Creating teacher...');
    await User.create({
      name: 'Demo Teacher',
      email: 'teacher@civicshub.com',
      password: 'Teacher@123456',
      role: 'teacher',
      isEmailVerified: true,
      isActive: true,
      teacherProfile: {
        qualification: 'PhD Computer Science',
        experience: '10 years',
        specialization: ['Web Development', 'Data Science'],
        isVerified: true,
      },
    });

    // Seed Student
    console.log('🎓 Creating student...');
    await User.create({
      name: 'Demo Student',
      email: 'student@civicshub.com',
      password: 'Student@123456',
      role: 'student',
      isEmailVerified: true,
      isActive: true,
    });

    // Seed Categories
    console.log('📂 Creating categories...');
    const categories = [
      {
        name: 'Web Development',
        slug: 'web-development',
        icon: '🌐',
        description: 'Learn modern web technologies',
        order: 1,
      },
      {
        name: 'Data Science',
        slug: 'data-science',
        icon: '📊',
        description: 'Master data analysis and ML',
        order: 2,
      },
      {
        name: 'Mobile Development',
        slug: 'mobile-development',
        icon: '📱',
        description: 'Build mobile applications',
        order: 3,
      },
      {
        name: 'Cloud Computing',
        slug: 'cloud-computing',
        icon: '☁️',
        description: 'AWS, GCP, Azure certifications',
        order: 4,
      },
      {
        name: 'Cyber Security',
        slug: 'cyber-security',
        icon: '🔒',
        description: 'Security and ethical hacking',
        order: 5,
      },
      {
        name: 'DevOps',
        slug: 'devops',
        icon: '⚙️',
        description: 'CI/CD, Docker, Kubernetes',
        order: 6,
      },
      {
        name: 'Programming Languages',
        slug: 'programming-languages',
        icon: '💻',
        description: 'Python, Java, C++, Go',
        order: 7,
      },
      {
        name: 'Database',
        slug: 'database',
        icon: '🗃️',
        description: 'SQL, NoSQL, PostgreSQL, MongoDB',
        order: 8,
      },
    ];

    await ExamCategory.insertMany(categories);

    // Seed Badges
    console.log('🏆 Creating badges...');
    const badges = [
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
        description: 'Take 10 tests',
        icon: '📝',
        category: 'achievement',
        criteria: { type: 'tests_taken', value: 10 },
        points: 30,
        rarity: 'common',
      },
      {
        name: 'Test Master',
        slug: 'test-master',
        description: 'Take 50 tests',
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
    ];

    await Badge.insertMany(badges);

    console.log('');
    console.log('✅ Database seeded successfully!');
    console.log('');
    console.log('📧 Login credentials:');
    console.log('   Admin:   admin@civicshub.com / Admin@123456');
    console.log('   Teacher: teacher@civicshub.com / Teacher@123456');
    console.log('   Student: student@civicshub.com / Student@123456');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();
