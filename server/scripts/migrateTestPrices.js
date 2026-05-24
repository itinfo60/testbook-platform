import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import Test from '../src/modules/test/test.model.js';

const priceByDifficulty = {
  beginner: 199,
  intermediate: 299,
  advanced: 499,
  medium: 299,
  hard: 499,
  easy: 199,
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const tests = await Test.find({ isFree: true });
  console.log(`Found ${tests.length} free tests to update`);

  for (const test of tests) {
    const price = priceByDifficulty[test.difficulty] || 199;
    test.isFree = false;
    test.price = price;
    await test.save();
    console.log(`✅ Updated "${test.title}" → ₹${price}`);
  }

  console.log('\nDone! All tests now have prices.');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
