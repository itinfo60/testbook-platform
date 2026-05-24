import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const enrollments = await db.collection('enrollments').find({ test: { $exists: true, $ne: null } }).toArray();
  console.log(JSON.stringify(enrollments, null, 2));
  process.exit(0);
});
