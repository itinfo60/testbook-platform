import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Enrollment from '../src/modules/enrollment/enrollment.model.js';
import Test from '../src/modules/test/test.model.js';

dotenv.config({ path: '.env' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const result = await Enrollment.paginate({ test: { $exists: true } }, {
    populate: [
      { path: 'test', select: 'title slug thumbnail description price isFree duration totalMarks questionsCount' },
    ],
  });
  console.log(JSON.stringify(result.docs, null, 2));
  process.exit(0);
});
