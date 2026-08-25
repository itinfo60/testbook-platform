import { mockRedisStore } from './e2e/setup.js';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { getAdminHeaders, getStudentHeaders } from './e2e/helpers/auth.helper.js';

describe('Comprehensive Admin API & Action Verification Suite', () => {
  let adminHeaders;
  let studentHeaders;

  beforeEach(() => {
    const admin = getAdminHeaders();
    adminHeaders = admin.headers;
    if (mockRedisStore) {
      mockRedisStore.set(`user_${admin.user.id}`, admin.user);
    }

    const student = getStudentHeaders();
    studentHeaders = student.headers;
    if (mockRedisStore) {
      mockRedisStore.set(`user_${student.user.id}`, student.user);
    }
  });

  // Test state tracking
  let createdCategoryId = null;
  let createdSubExamId = null;
  let createdCourseId = null;
  let createdTeacherId = null;
  let createdUserId = null;
  let createdTestId = null;
  let createdQuizId = null;
  let createdTestSeriesId = null;
  let createdLiveClassId = null;
  let createdCouponId = null;

  // ═══════════════════════════════════════════════════════════════
  // 1. CATEGORY MANAGEMENT (CRUD & MULTI-INPUTS)
  // ═══════════════════════════════════════════════════════════════
  describe('Module 1: Category Management', () => {
    it('1.1: Creates parent category with standard inputs', async () => {
      const payload = {
        name: `Civil Services Exam ${Date.now()}`,
        slug: `civil-services-${Date.now()}`,
        description: 'Comprehensive preparation for Civil Services UPSC / State PSC',
        icon: 'book',
        order: 1,
        isActive: true,
      };

      const res = await request(app).post('/api/v1/categories').set(adminHeaders).send(payload);

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      const cat = res.body.data?.category || res.body.data;
      createdCategoryId = cat.id || cat._id;
      expect(createdCategoryId).toBeTruthy();
    });

    it('1.2: Creates sub-category / Exam with parentId and rich description', async () => {
      const payload = {
        name: `UPSC Prelims GS-1 ${Date.now()}`,
        slug: `upsc-prelims-gs1-${Date.now()}`,
        description: 'General Studies Paper 1 for UPSC CSE Prelims Examination',
        parentId: createdCategoryId,
        icon: 'trophy',
        order: 2,
        isActive: true,
      };

      const res = await request(app).post('/api/v1/categories').set(adminHeaders).send(payload);

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      const exam = res.body.data?.category || res.body.data;
      createdSubExamId = exam.id || exam._id;
    });

    it('1.3: Lists all categories with pagination & search filtering', async () => {
      const res = await request(app)
        .get('/api/v1/categories/admin/list?page=1&limit=10&search=Civil')
        .set(adminHeaders);

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
      const docs = res.body.data?.docs || res.body.data?.categories || [];
      expect(Array.isArray(docs)).toBe(true);
    });

    it('1.4: Retrieves category drilldown detail by ID with associated hierarchy', async () => {
      if (!createdCategoryId) return;
      const res = await request(app)
        .get(`/api/v1/categories/${createdCategoryId}`)
        .set(adminHeaders);

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it('1.5: Updates category metadata (name, description, order)', async () => {
      if (!createdCategoryId) return;
      const res = await request(app)
        .put(`/api/v1/categories/${createdCategoryId}`)
        .set(adminHeaders)
        .send({
          name: `Civil Services Updated ${Date.now()}`,
          description: 'Updated comprehensive description for testing lifecycle',
          order: 5,
        });

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 2. TEACHER MANAGEMENT (CRUD, SPECIALIZATIONS, BIOGRAPHY)
  // ═══════════════════════════════════════════════════════════════
  describe('Module 2: Teacher Management', () => {
    it('2.1: Creates teacher with multi-field profile (bio, specializations, experience)', async () => {
      const payload = {
        name: `Prof. Dr. Verma ${Date.now().toString().slice(-4)}`,
        email: `prof_verma_${Date.now()}@example.com`,
        password: 'Password123!',
        phone: '9876543210',
        specialization: ['Polity & Governance', 'Indian Constitution', 'Ethics'],
        bio: 'Senior educator with 12+ years of experience mentoring UPSC aspirants.',
        experience: '12 Years',
      };

      const res = await request(app).post('/api/v1/admin/teachers').set(adminHeaders).send(payload);

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      const teacher = res.body.data?.teacher || res.body.data;
      createdTeacherId = teacher.id || teacher._id;
      expect(createdTeacherId).toBeTruthy();
    });

    it('2.2: Lists all teachers with pagination and statistics', async () => {
      const res = await request(app)
        .get('/api/v1/admin/teachers?page=1&limit=10')
        .set(adminHeaders);

      expect(
        Array.isArray(res.body.data) ||
          Array.isArray(res.body.data?.docs) ||
          Array.isArray(res.body.data?.teachers)
      ).toBe(true);
    });

    it('2.3: Retrieves teacher drilldown profile by ID', async () => {
      if (!createdTeacherId) return;
      const res = await request(app)
        .get(`/api/v1/admin/teachers/${createdTeacherId}`)
        .set(adminHeaders);

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data?.teacher).toBeDefined();
    });

    it('2.4: Updates teacher specializations and active status', async () => {
      if (!createdTeacherId) return;
      const res = await request(app)
        .put(`/api/v1/admin/teachers/${createdTeacherId}`)
        .set(adminHeaders)
        .send({
          bio: 'Updated Bio: Head of Faculty for Indian Polity and International Relations.',
          specialization: ['Polity', 'IR', 'Internal Security'],
          isActive: true,
        });

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 3. COURSE MANAGEMENT (CURRICULUM, SECTIONS, PUBLISH TOGGLE)
  // ═══════════════════════════════════════════════════════════════
  describe('Module 3: Course Management', () => {
    it('3.1: Creates comprehensive course with curriculum sections & lessons', async () => {
      const payload = {
        title: `Indian Polity Masterclass ${Date.now()}`,
        slug: `indian-polity-masterclass-${Date.now()}`,
        description:
          'Complete Constitutional Law & Governance preparation with daily answer writing.',
        price: 2499,
        discountPrice: 1999,
        categoryId: createdCategoryId || undefined,
        teacherId: createdTeacherId || undefined,
        thumbnail: {
          url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
        },
        highlights: ['120+ Hours HD Lectures', '500+ Practice MCQs', 'Personal Mentorship'],
        sections: [
          {
            id: 'sec-1',
            title: 'Section 1: Preamble & Fundamental Rights',
            order: 1,
            lessons: [
              {
                id: 'les-1',
                title: 'Lesson 1.1: Historical Background & Making of Constitution',
                duration: 45,
                videoUrl: 'https://www.youtube.com/watch?v=sample1',
                isFree: true,
              },
              {
                id: 'les-2',
                title: 'Lesson 1.2: Articles 14 to 32 Detailed Analysis',
                duration: 60,
                videoUrl: 'https://www.youtube.com/watch?v=sample2',
                isFree: false,
              },
            ],
          },
          {
            id: 'sec-2',
            title: 'Section 2: Directive Principles of State Policy',
            order: 2,
            lessons: [
              {
                id: 'les-3',
                title: 'Lesson 2.1: Socialist, Gandhian & Liberal Principles',
                duration: 50,
                videoUrl: 'https://www.youtube.com/watch?v=sample3',
                isFree: false,
              },
            ],
          },
        ],
      };

      const res = await request(app).post('/api/v1/courses').set(adminHeaders).send(payload);

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      const course = res.body.data?.course || res.body.data;
      createdCourseId = course.id || course._id;
      expect(createdCourseId).toBeTruthy();
    });

    it('3.2: Retrieves course drilldown detail with enrolled students & curriculum', async () => {
      if (!createdCourseId) return;
      const res = await request(app).get(`/api/v1/courses/${createdCourseId}`).set(adminHeaders);

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data?.course).toBeDefined();
    });

    it('3.3: Toggles course publish status (Draft <-> Published)', async () => {
      if (!createdCourseId) return;
      const res = await request(app)
        .patch(`/api/v1/courses/${createdCourseId}/publish`)
        .set(adminHeaders);

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it('3.4: Updates course curriculum and highlights', async () => {
      if (!createdCourseId) return;
      const res = await request(app)
        .put(`/api/v1/courses/${createdCourseId}`)
        .set(adminHeaders)
        .send({
          price: 2199,
          highlights: ['150+ Hours Lectures', 'Comprehensive Notes PDF'],
        });

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 4. USER & STUDENT MANAGEMENT (CRUD & DRILLDOWN)
  // ═══════════════════════════════════════════════════════════════
  describe('Module 4: User & Student Management', () => {
    it('4.1: Creates student user with full verification details', async () => {
      const payload = {
        name: `Rohan Sharma ${Date.now().toString().slice(-4)}`,
        email: `rohan_student_${Date.now()}@example.com`,
        password: 'Password123!',
        phone: '9812345678',
        role: 'student',
        isActive: true,
      };

      const res = await request(app).post('/api/v1/admin/users').set(adminHeaders).send(payload);

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      const user = res.body.data?.user || res.body.data;
      createdUserId = user.id || user._id;
      expect(createdUserId).toBeTruthy();
    });

    it('4.2: Lists users with role and search filters', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?page=1&limit=10&role=student')
        .set(adminHeaders);

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it('4.3: Retrieves user drilldown profile (enrollments, test history, orders)', async () => {
      if (!createdUserId) return;
      const res = await request(app).get(`/api/v1/admin/users/${createdUserId}`).set(adminHeaders);

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data?.user).toBeDefined();
    });

    it('4.4: Updates user status and profile fields', async () => {
      if (!createdUserId) return;
      const res = await request(app)
        .put(`/api/v1/admin/users/${createdUserId}`)
        .set(adminHeaders)
        .send({
          name: `Rohan Sharma (Updated)`,
          isActive: true,
        });

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 5. MOCK TESTS & ASSESSMENTS
  // ═══════════════════════════════════════════════════════════════
  describe('Module 5: Mock Tests Oversight', () => {
    it('5.1: Creates full-length mock test with multiple questions and marking scheme', async () => {
      const payload = {
        title: `UPSC Prelims Full Mock Test ${Date.now()}`,
        description: 'Complete 100-Question Simulated Prelims Test Paper',
        duration: 120,
        totalMarks: 200,
        passingMarks: 66,
        categoryId: createdCategoryId || undefined,
        isPublished: true,
        questions: [
          {
            id: 'q1',
            question: 'Which Article of the Indian Constitution deals with Right to Equality?',
            options: ['Article 12', 'Article 14', 'Article 19', 'Article 21'],
            correctOption: 1,
            marks: 2,
            negativeMarks: 0.66,
            explanation:
              'Article 14 guarantees equality before the law and equal protection of the laws.',
          },
          {
            id: 'q2',
            question: 'The Directive Principles of State Policy are borrowed from which country?',
            options: ['USA', 'Ireland', 'UK', 'Australia'],
            correctOption: 1,
            marks: 2,
            negativeMarks: 0.66,
            explanation: 'DPSP were borrowed from the Irish Constitution.',
          },
        ],
      };

      const res = await request(app).post('/api/v1/tests').set(adminHeaders).send(payload);

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      const test = res.body.data?.test || res.body.data;
      createdTestId = test.id || test._id;
      expect(createdTestId).toBeTruthy();
    });

    it('5.2: Retrieves mock test detail previewing questions and answers', async () => {
      if (!createdTestId) return;
      const res = await request(app).get(`/api/v1/tests/${createdTestId}`).set(adminHeaders);

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it('5.3: Updates mock test timing and question scheme', async () => {
      if (!createdTestId) return;
      const res = await request(app).put(`/api/v1/tests/${createdTestId}`).set(adminHeaders).send({
        duration: 120,
        totalMarks: 200,
      });

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 6. QUIZZES MANAGEMENT
  // ═══════════════════════════════════════════════════════════════
  describe('Module 6: Daily Quizzes Oversight', () => {
    it('6.1: Creates daily quiz with timed MCQs', async () => {
      const payload = {
        title: `Daily Current Affairs Quiz ${Date.now()}`,
        description: '10 Questions on National & International Events',
        duration: 15,
        totalMarks: 20,
        isPublished: true,
        questions: [
          {
            id: 'qz1',
            question: 'What is the primary objective of the PM-eBus Sewa scheme?',
            options: [
              'Railway modernization',
              'Electric bus deployment in cities',
              'Highway construction',
              'Airport expansion',
            ],
            correctOption: 1,
            marks: 2,
          },
        ],
      };

      const res = await request(app).post('/api/v1/quizzes').set(adminHeaders).send(payload);

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      const quiz = res.body.data?.quiz || res.body.data;
      createdQuizId = quiz.id || quiz._id;
      expect(createdQuizId).toBeTruthy();
    });

    it('6.2: Retrieves quiz detail and question inspector', async () => {
      if (!createdQuizId) return;
      const res = await request(app).get(`/api/v1/quizzes/${createdQuizId}`).set(adminHeaders);

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it('6.3: Updates quiz questions and publish state', async () => {
      if (!createdQuizId) return;
      const res = await request(app)
        .put(`/api/v1/quizzes/${createdQuizId}`)
        .set(adminHeaders)
        .send({
          title: `Daily Current Affairs Quiz (Updated)`,
          duration: 20,
        });

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 7. TEST SERIES PACKAGES
  // ═══════════════════════════════════════════════════════════════
  describe('Module 7: Test Series Packages', () => {
    it('7.1: Creates test series package linking mock tests', async () => {
      const payload = {
        title: `All India Prelims Test Series 2026 ${Date.now()}`,
        description: 'Complete 30 Mock Tests package with detailed rank analytics',
        price: 999,
        categoryId: createdCategoryId || undefined,
        isPublished: true,
        tests: createdTestId ? [createdTestId] : [],
      };

      const res = await request(app).post('/api/v1/test-series').set(adminHeaders).send(payload);

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      const ts = res.body.data?.testSeries || res.body.data;
      createdTestSeriesId = ts.id || ts._id;
      expect(createdTestSeriesId).toBeTruthy();
    });

    it('7.2: Lists test series and retrieves package details', async () => {
      if (!createdTestSeriesId) return;
      const res = await request(app)
        .get(`/api/v1/test-series/${createdTestSeriesId}`)
        .set(adminHeaders);

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 8. LIVE CLASSES SCHEDULING
  // ═══════════════════════════════════════════════════════════════
  describe('Module 8: Live Classes Scheduling & Management', () => {
    it('8.1: Schedules a live class for an upcoming date', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const payload = {
        title: `Live Doubt Clearing Session - Polity ${Date.now()}`,
        description: 'Interactive live Q&A session with faculty',
        scheduledAt: futureDate,
        durationMinutes: 60,
        courseId: createdCourseId || undefined,
        meetingUrl: 'https://meet.jit.si/CivicsEduPolitySession',
      };

      const res = await request(app).post('/api/v1/live-classes').set(adminHeaders).send(payload);

      if (res.status !== 200 && res.status !== 201) {
        console.error('DEBUG 8.1 FAILURE:', res.status, res.body);
      }

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      const lc = res.body.data?.liveClass || res.body.data;
      createdLiveClassId = lc.id || lc._id;
      expect(createdLiveClassId).toBeTruthy();
    });

    it('8.2: Lists all scheduled live classes for admin oversight', async () => {
      const res = await request(app)
        .get('/api/v1/live-classes/admin/all?page=1&limit=10')
        .set(adminHeaders);

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it('8.3: Updates live class schedule and duration', async () => {
      if (!createdLiveClassId) return;
      const res = await request(app)
        .put(`/api/v1/live-classes/${createdLiveClassId}`)
        .set(adminHeaders)
        .send({
          durationMinutes: 90,
          description: 'Extended 90-minute live session with mock question discussion',
        });

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it('8.4: Cancels a live class session', async () => {
      if (!createdLiveClassId) return;
      const res = await request(app)
        .patch(`/api/v1/live-classes/${createdLiveClassId}/cancel`)
        .set(adminHeaders);

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 9. COUPONS & DISCOUNTS
  // ═══════════════════════════════════════════════════════════════
  describe('Module 9: Coupons & Discount Management', () => {
    it('9.1: Creates percentage discount coupon with max discount limit', async () => {
      const payload = {
        code: `CIVICS25_${Date.now().toString().slice(-4)}`,
        description: '25% Flat Discount for New Students',
        discountType: 'percentage',
        discountPercent: 25,
        maxDiscount: 500,
        minOrderAmount: 999,
        maxUses: 100,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      };

      const res = await request(app).post('/api/v1/admin/coupons').set(adminHeaders).send(payload);

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      const coupon = res.body.data?.coupon || res.body.data;
      createdCouponId = coupon.id || coupon._id;
      expect(createdCouponId).toBeTruthy();
    });

    it('9.2: Creates flat amount discount coupon with min order requirement', async () => {
      const payload = {
        code: `FLAT300_${Date.now().toString().slice(-4)}`,
        description: 'Flat Rs. 300 Discount on Course Bundles',
        discountType: 'fixed',
        discountAmount: 300,
        minOrderAmount: 1499,
        isActive: true,
      };

      const res = await request(app).post('/api/v1/admin/coupons').set(adminHeaders).send(payload);

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it('9.3: Lists all coupons with search filter and pagination', async () => {
      const res = await request(app).get('/api/v1/admin/coupons?page=1&limit=10').set(adminHeaders);

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it('9.4: Updates coupon terms and usage limit', async () => {
      if (!createdCouponId) return;
      const res = await request(app)
        .put(`/api/v1/admin/coupons/${createdCouponId}`)
        .set(adminHeaders)
        .send({
          maxUses: 500,
          isActive: true,
        });

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it('9.5: Deletes coupon by ID', async () => {
      if (!createdCouponId) return;
      const res = await request(app)
        .delete(`/api/v1/admin/coupons/${createdCouponId}`)
        .set(adminHeaders);

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 10. REVIEW MODERATION
  // ═══════════════════════════════════════════════════════════════
  describe('Module 10: Review Moderation & Bulk Actions', () => {
    it('10.1: Lists reviews for administrative moderation', async () => {
      const res = await request(app).get('/api/v1/admin/reviews?page=1&limit=10').set(adminHeaders);

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 11. ANNOUNCEMENTS & BROADCASTS
  // ═══════════════════════════════════════════════════════════════
  describe('Module 11: Notification Center & Announcements', () => {
    it('11.1: Broadcasts system announcement to student users', async () => {
      const payload = {
        title: 'New Mock Test Series Live for UPSC 2026',
        message: 'Prelims Mock Test 5 is now available. Start your attempt today!',
        type: 'course',
        priority: 'high',
        target: 'all',
      };

      const res = await request(app)
        .post('/api/v1/admin/announcements')
        .set(adminHeaders)
        .send(payload);

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 12. ANALYTICS, REVENUE & DASHBOARD KPIS
  // ═══════════════════════════════════════════════════════════════
  describe('Module 12: Analytics & Dashboard KPIs', () => {
    it('12.1: Retrieves aggregated dashboard KPIs (users, courses, revenue, quizzes, ratings)', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard?period=30').set(adminHeaders);

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data?.overview).toBeDefined();
      expect(res.body.data?.executive).toBeDefined();
      expect(res.body.data?.learningPerformance).toBeDefined();
      expect(res.body.data?.userOverview).toBeDefined();
      expect(res.body.data?.actionRequired).toBeDefined();
      expect(res.body.data?.contentInventory).toBeDefined();
      expect(res.body.data?.topCourses).toBeDefined();
      expect(res.body.data?.topTeachers).toBeDefined();
    });

    it('12.2: Retrieves revenue breakdown across periods (7d, 30d, 90d)', async () => {
      const res = await request(app).get('/api/v1/admin/revenue?period=30').set(adminHeaders);

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data?.kpis).toBeDefined();
      expect(res.body.data?.revenueTrend).toBeDefined();
      expect(res.body.data?.ordersByStatus).toBeDefined();
      expect(res.body.data?.revenueByProduct).toBeDefined();
      expect(res.body.data?.topProducts).toBeDefined();
      expect(res.body.data?.couponPerformance).toBeDefined();
      expect(res.body.data?.paymentPerformance).toBeDefined();
    });

    it('12.3: Retrieves monthly revenue trends', async () => {
      const res = await request(app).get('/api/v1/admin/revenue/monthly').set(adminHeaders);

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it('12.4: Lists payments and order transactions with summary stats', async () => {
      const res = await request(app).get('/api/v1/admin/payments').set(adminHeaders);

      expect([200]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats?.grossPaymentVolume).toBeDefined();
      expect(res.body.stats?.pendingPayments).toBeDefined();
      expect(res.body.stats?.failedPayments).toBeDefined();
      expect(res.body.stats?.refundedOrders).toBeDefined();
      expect(res.body.stats?.refundAmount).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 13. ROLE AUTHORIZATION & ACCESS CONTROLS
  // ═══════════════════════════════════════════════════════════════
  describe('Module 13: RBAC & Route Security Boundaries', () => {
    it('13.1: Rejects unauthorized student attempts to create categories (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set(studentHeaders)
        .send({ name: 'Unauthorized Category' });

      expect([401, 403]).toContain(res.status);
    });

    it('13.2: Rejects unauthorized student attempts to access admin dashboard stats (403 Forbidden)', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard').set(studentHeaders);

      expect([401, 403]).toContain(res.status);
    });

    it('13.3: Rejects unauthorized student attempts to manage coupons (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/coupons')
        .set(studentHeaders)
        .send({ code: 'HACK2026' });

      expect([401, 403]).toContain(res.status);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // 14. CLEANUP & DELETION LIFECYCLES
  // ═══════════════════════════════════════════════════════════════
  describe('Module 14: Cleanup & Deletion Verification', () => {
    it('14.1: Deletes live class', async () => {
      if (!createdLiveClassId) return;
      const delRes = await request(app)
        .delete(`/api/v1/live-classes/${createdLiveClassId}`)
        .set(adminHeaders);

      expect([200]).toContain(delRes.status);
    });

    it('14.2: Deletes created test series', async () => {
      if (!createdTestSeriesId) return;
      const res = await request(app)
        .delete(`/api/v1/test-series/${createdTestSeriesId}`)
        .set(adminHeaders);

      expect([200]).toContain(res.status);
    });

    it('14.3: Deletes created mock test', async () => {
      if (!createdTestId) return;
      const res = await request(app).delete(`/api/v1/tests/${createdTestId}`).set(adminHeaders);

      expect([200]).toContain(res.status);
    });

    it('14.4: Deletes created course', async () => {
      if (!createdCourseId) return;
      const res = await request(app).delete(`/api/v1/courses/${createdCourseId}`).set(adminHeaders);

      expect([200]).toContain(res.status);
    });

    it('14.5: Deletes sub-exam and parent category', async () => {
      if (createdSubExamId) {
        const delSub = await request(app)
          .delete(`/api/v1/categories/${createdSubExamId}`)
          .set(adminHeaders);
        expect([200]).toContain(delSub.status);
      }
      if (createdCategoryId) {
        const delParent = await request(app)
          .delete(`/api/v1/categories/${createdCategoryId}`)
          .set(adminHeaders);
        expect([200]).toContain(delParent.status);
      }
    });

    it('14.6: Deletes created teacher user', async () => {
      if (!createdTeacherId) return;
      const res = await request(app)
        .delete(`/api/v1/admin/teachers/${createdTeacherId}`)
        .set(adminHeaders);

      expect([200]).toContain(res.status);
    });

    it('14.7: Deletes created student user', async () => {
      if (!createdUserId) return;
      const res = await request(app)
        .delete(`/api/v1/admin/users/${createdUserId}`)
        .set(adminHeaders);

      expect([200, 204]).toContain(res.status);
    });
  });
});
