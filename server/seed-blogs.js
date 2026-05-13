import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Blog from './src/modules/blog/blog.model.js';
import User from './src/modules/user/user.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const blogs = [
  {
    title: 'Top 10 Tips to Crack Competitive Exams in 2026',
    slug: 'top-10-tips-competitive-exams-2026',
    content: `
      <p>Competitive exams can be daunting, but with the right strategy, anyone can succeed. Here are our top 10 tips for 2026:</p>
      <h2>1. Understand the Syllabus Thoroughly</h2>
      <p>Before you dive into your books, make sure you know exactly what topics are covered. Don't waste time on irrelevant subjects.</p>
      <h2>2. Create a Realistic Study Schedule</h2>
      <p>Consistency is key. A balanced schedule that allows for breaks will keep you from burning out.</p>
      <h2>3. Practice with Mock Tests</h2>
      <p>TestBook offers a wide range of mock tests that simulate the real exam environment. Use them frequently!</p>
      <p>... and more! Stay tuned for our full guide coming soon.</p>
    `,
    excerpt: 'Master your preparation with these proven strategies for upcoming competitive examinations in 2026.',
    tags: ['Education', 'Tips', 'Tests'],
    status: 'published',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    },
  },
  {
    title: 'How AI is Transforming the Education Landscape',
    slug: 'ai-transforming-education-landscape',
    content: `
      <p>Artificial Intelligence is no longer a futuristic concept; it's here and it's changing how we learn.</p>
      <h2>Personalized Learning Paths</h2>
      <p>AI can analyze a student's performance and recommend specific topics they need to focus on, making learning more efficient.</p>
      <h2>Interactive Tutors</h2>
      <p>Imagine having a tutor available 24/7. That's what AI-powered chatbots are doing today.</p>
    `,
    excerpt: 'Explore the revolutionary changes AI is bringing to classrooms and online learning platforms worldwide.',
    tags: ['Tech', 'Learning'],
    status: 'published',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    },
  },
  {
    title: 'The Importance of Mental Health During Exam Season',
    slug: 'importance-mental-health-exam-season',
    content: `
      <p>Exam stress is real, and it's important to take care of your mind as much as your notes.</p>
      <h2>Recognizing the Signs of Stress</h2>
      <p>Anxiety, lack of sleep, and loss of appetite are common signs that you might be pushing too hard.</p>
      <h2>Techniques for Relaxation</h2>
      <p>Meditation, regular exercise, and maintaining a healthy diet can significantly improve your mental well-being.</p>
    `,
    excerpt: 'Learn how to balance your academic goals with your emotional well-being during high-pressure exam periods.',
    tags: ['Learning', 'Career'],
    status: 'published',
    coverImage: {
      url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    },
  }
];

async function seedBlogs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get an admin user to assign as author
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('No admin user found to assign as author. Please run the main seeder first.');
      process.exit(1);
    }

    // Clear existing blogs
    await Blog.deleteMany({});
    console.log('Cleared existing blogs');

    // Add author ID to blogs
    const blogsToSeed = blogs.map(b => ({ ...b, author: admin._id }));

    await Blog.insertMany(blogsToSeed);
    console.log('Successfully seeded blogs');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding blogs:', error);
    process.exit(1);
  }
}

seedBlogs();
