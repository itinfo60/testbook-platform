import request from 'supertest';
import path from 'path';
import app from '../src/app.js';
import mongoose from 'mongoose';

(async () => {
  const TEST_TENANT_ID = new mongoose.Types.ObjectId().toString();
  console.log('Tenant ID', TEST_TENANT_ID);
  try {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('X-Tenant-Id', TEST_TENANT_ID)
      .send({
        name: 'Test Student',
        email: 'student@test.com',
        password: 'Password123!',
        role: 'student',
      });
    console.log('Status', res.status);
    console.log('Body', res.body);
  } catch (err) {
    console.error('Error', err);
  }
  process.exit();
})();
