/**
 * Seeds dummy quiz attempts so teacher quiz analytics show real data.
 * Run: node scripts/seedQuizAttempts.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../src/modules/user/user.model.js';
import Quiz from '../src/modules/quiz/quiz.model.js';
import QuizAttempt from '../src/modules/quiz/quizAttempt.model.js';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const teacher = await User.findOne({ role: 'teacher' });
  const students = await User.find({ role: 'student' });

  if (!teacher || students.length === 0) {
    console.error('❌ Need teacher and student users'); process.exit(1);
  }
  console.log(`👨‍🏫 Teacher: ${teacher.name}`);
  console.log(`👨‍🎓 Students: ${students.map(s => s.name).join(', ')}\n`);

  const quizzes = await Quiz.find({ teacher: teacher._id });
  if (quizzes.length === 0) {
    console.error('❌ No quizzes found for teacher'); process.exit(1);
  }
  console.log(`🧩 Found ${quizzes.length} quizzes\n`);

  let totalCreated = 0;

  for (const quiz of quizzes) {
    if (!quiz.questions || quiz.questions.length === 0) continue;

    const numStudents = Math.min(students.length, 2 + Math.floor(Math.random() * 3));
    const selectedStudents = students.slice(0, numStudents);

    for (const student of selectedStudents) {
      const exists = await QuizAttempt.findOne({ user: student._id, quiz: quiz._id });
      if (exists) {
        console.log(`   ⏭️  Attempt exists: ${student.name} → ${quiz.title.slice(0, 35)}`);
        continue;
      }

      // Generate answers — get ~60-80% correct
      const correctRate = 0.6 + Math.random() * 0.2;
      const answers = quiz.questions.map(q => {
        const correctIdx = q.options.findIndex(o => o.isCorrect);
        const isCorrect = Math.random() < correctRate;
        const selectedOption = isCorrect ? correctIdx : (correctIdx + 1) % q.options.length;
        return {
          questionId: q._id,
          selectedOption,
          isCorrect,
        };
      });

      const correctCount = answers.filter(a => a.isCorrect).length;
      const totalQ = quiz.questions.length;
      const percentage = Math.round((correctCount / totalQ) * 100);
      const isPassed = percentage >= (quiz.passingScore || 60);

      const daysAgo = Math.floor(Math.random() * 14) + 1;
      const completedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      await QuizAttempt.create({
        user: student._id,
        quiz: quiz._id,
        course: quiz.course,
        answers,
        score: correctCount,
        totalQuestions: totalQ,
        percentage,
        isPassed,
        completedAt,
        createdAt: completedAt,
      });

      // Update quiz stats
      await Quiz.findByIdAndUpdate(quiz._id, { $inc: { totalAttempts: 1 } });

      totalCreated++;
      console.log(`   ✅ ${student.name} → ${quiz.title.slice(0, 35)} (${percentage}% — ${isPassed ? 'PASS' : 'FAIL'})`);
    }
  }

  console.log(`\n✅ Done! ${totalCreated} quiz attempts created.\n`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
