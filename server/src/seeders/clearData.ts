import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Course from '../modules/course/course.model.ts';
import Test from '../modules/test/test.model.ts';
import TestSeries from '../modules/test-series/testSeries.model.js';
import Blog from '../modules/blog/blog.model.js';
import LibraryResource from '../modules/library/library.model.ts';
import Enrollment from '../modules/enrollment/enrollment.model.js';
import TestAttempt from '../modules/test/testAttempt.model.ts';

async function clearData() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eduportal';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);

    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected.');

    console.log('Deleting Courses...');
    await Course.deleteMany({});

    console.log('Deleting Test Series...');
    await TestSeries.deleteMany({});

    console.log('Deleting Tests...');
    await Test.deleteMany({});

    console.log('Deleting Free Resources (Library)...');
    await LibraryResource.deleteMany({});

    console.log('Deleting Blogs and Job Alerts...');
    await Blog.deleteMany({});

    console.log('Deleting Enrollments...');
    await Enrollment.deleteMany({});

    console.log('Deleting Test Attempts...');
    await TestAttempt.deleteMany({});

    console.log('All requested data successfully cleared!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to clear data:', err);
    process.exit(1);
  }
}

clearData();
