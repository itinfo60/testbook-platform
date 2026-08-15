import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../src/app.js';
import PlatformSettings from '../../../src/models/settings.model.js';
import User from '../../../src/modules/user/user.model.js';
import jwt from 'jsonwebtoken';
import config from '../../../src/config/index.js';

describe('Platform Settings Module API', () => {
  let adminToken: string;
  let studentToken: string;
  const mockAdminId = new mongoose.Types.ObjectId().toString();
  const mockStudentId = new mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    await PlatformSettings.deleteMany({});
    await User.deleteMany({});

    await User.create({
      _id: mockAdminId,
      name: 'Super Admin',
      email: 'admin@testbook.com',
      password: 'Password123!',
      role: 'super_admin',
      isEmailVerified: true,
    });

    await User.create({
      _id: mockStudentId,
      name: 'Student User',
      email: 'student@testbook.com',
      password: 'Password123!',
      role: 'student',
      isEmailVerified: true,
    });

    adminToken = jwt.sign(
      { id: mockAdminId, email: 'admin@testbook.com', role: 'super_admin' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    studentToken = jwt.sign(
      { id: mockStudentId, email: 'student@testbook.com', role: 'student' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  it('GET /api/v1/settings returns default public platform settings', async () => {
    const res = await request(app).get('/api/v1/settings');
    if (res.status !== 200) console.log('ERROR BODY:', res.status, res.body);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.siteName).toBe('Testbook Platform');
    expect(res.body.data.allowMockPayments).toBe(true);
  });

  it('PUT /api/v1/settings/admin allows admin to update settings', async () => {
    const res = await request(app)
      .put('/api/v1/settings/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        siteName: 'Updated Testbook Portal',
        supportEmail: 'contact@testbook.com',
        maintenanceMode: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.siteName).toBe('Updated Testbook Portal');
  });

  it('PUT /api/v1/settings/admin rejects non-admin users with 403', async () => {
    const res = await request(app)
      .put('/api/v1/settings/admin')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        siteName: 'Hacked Portal',
      });

    expect(res.status).toBe(403);
  });

  it('PUT /api/v1/settings/admin/banners allows admin to update banners slider', async () => {
    const banners = [
      {
        title: 'Monsoon Special Offer',
        imageUrl: 'https://example.com/banner.jpg',
        isActive: true,
        order: 1,
      },
    ];

    const res = await request(app)
      .put('/api/v1/settings/admin/banners')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ banners });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Monsoon Special Offer');
  });
});
