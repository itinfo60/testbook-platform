/**
 * Adds dummy enrollments + payments so the teacher dashboard shows real data.
 * Run: node scripts/seedDummyData.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../src/modules/user/user.model.js';
import Course from '../src/modules/course/course.model.js';
import Enrollment from '../src/modules/enrollment/enrollment.model.js';
import Payment from '../src/modules/payment/payment.model.js';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const teacher = await User.findOne({ role: 'teacher' });
  if (!teacher) { console.error('❌ No teacher found'); process.exit(1); }
  console.log(`👨‍🏫 Teacher: ${teacher.name} (${teacher.email})`);

  const student = await User.findOne({ role: 'student' });
  if (!student) { console.error('❌ No student found'); process.exit(1); }
  console.log(`👨‍🎓 Student: ${student.name} (${student.email})\n`);

  const courses = await Course.find({ teacher: teacher._id }).lean();
  if (courses.length === 0) { console.error('❌ No courses found for teacher'); process.exit(1); }
  console.log(`📚 Found ${courses.length} teacher courses\n`);

  // Create dummy students (extra users)
  const dummyStudents = [
    { name: 'Rahul Sharma', email: 'rahul@example.com' },
    { name: 'Priya Patel', email: 'priya@example.com' },
    { name: 'Amit Kumar', email: 'amit@example.com' },
    { name: 'Sneha Gupta', email: 'sneha@example.com' },
  ];

  const studentUsers = [student];
  for (const s of dummyStudents) {
    let u = await User.findOne({ email: s.email });
    if (!u) {
      u = await User.create({
        name: s.name,
        email: s.email,
        password: 'Password@123',
        role: 'student',
        isEmailVerified: true,
      });
      console.log(`   ✅ Created student: ${s.name}`);
    } else {
      console.log(`   ⏭️  Student exists: ${s.name}`);
    }
    studentUsers.push(u);
  }

  console.log('');

  // Enroll students in courses + create payments
  let enrollCount = 0;
  let paymentCount = 0;

  for (let ci = 0; ci < courses.length; ci++) {
    const course = courses[ci];
    // Pick 2-4 students per course
    const enrolled = studentUsers.slice(0, 2 + (ci % 3));

    for (const student of enrolled) {
      // Skip if already enrolled
      const exists = await Enrollment.findOne({ user: student._id, course: course._id });
      if (exists) {
        console.log(`   ⏭️  Already enrolled: ${student.name} → ${course.title.slice(0, 30)}`);
        continue;
      }

      const amount = course.effectivePrice || course.price || 299;
      const daysAgo = Math.floor(Math.random() * 30) + 1;
      const enrolledAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      // Create payment
      const payment = await Payment.create({
        user: student._id,
        course: course._id,
        orderId: `DEMO_${Date.now()}_${student._id}`,
        amount,
        status: 'completed',
        provider: 'demo',
        createdAt: enrolledAt,
      });
      paymentCount++;

      // Create enrollment
      await Enrollment.create({
        user: student._id,
        course: course._id,
        amountPaid: amount,
        paymentId: payment._id,
        status: 'active',
        progressPercentage: Math.floor(Math.random() * 80),
        enrolledAt,
        lastAccessedAt: new Date(enrolledAt.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000),
      });
      enrollCount++;

      // Update course enrollment count
      await Course.findByIdAndUpdate(course._id, { $inc: { enrollmentCount: 1 } });

      console.log(`   ✅ Enrolled: ${student.name} → ${course.title.slice(0, 35)} (₹${amount})`);
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`   📋 ${enrollCount} enrollments created`);
  console.log(`   💰 ${paymentCount} payments created`);
  console.log(`\nRefresh your teacher dashboard to see the data.\n`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
