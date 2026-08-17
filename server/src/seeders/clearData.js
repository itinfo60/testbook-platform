import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Course from '../modules/course/course.model.js';
import TestSeries from '../modules/test/models/test-series.model.js';
import Test from '../modules/test/models/test.model.js';
import Blog from '../modules/blog/blog.model.js';
import LibraryResource from '../modules/library/library-resource.model.js';
import Enrollment from '../modules/enrollment/enrollment.model.js';

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

    console.log('All requested data successfully cleared!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to clear data:', err);
    process.exit(1);
  }
}

clearData();
