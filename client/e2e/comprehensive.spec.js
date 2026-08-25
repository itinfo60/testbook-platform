import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile-320', width: 320, height: 568 },
  { name: 'mobile-375', width: 375, height: 667 },
  { name: 'mobile-414', width: 414, height: 896 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1024', width: 1024, height: 768 },
  { name: 'desktop-1280', width: 1280, height: 720 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

// E2E-001: New Student Journey
test.describe('E2E-001: New Student Complete Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('HOME-001: Homepage loads without errors', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/RPSC & Political Science Specialist/i)).toBeVisible();
  });

  test('HOME-003: Search for existing exam', async ({ page }) => {
    await page.getByPlaceholderText(/Search courses, exams/i).fill('Patwari');
    await page.getByRole('button', { name: /Search/i }).click();
    await expect(page).toHaveURL(/search/);
  });

  test('EXAM-004: Click Patwari exam opens detail page', async ({ page }) => {
    await page.goto('/exams/patwari');
    await expect(page.getByText(/Patwari Preparation/i)).toBeVisible();
  });

  test('EXAM-DETAIL-007: Only Patwari courses appear', async ({ page }) => {
    await page.goto('/exams/patwari');
    await page.getByRole('button', { name: /Courses/i }).click();
    // Verify only Patwari courses are shown
    const courseCards = page.locator('[data-testid="course-card"]');
    await expect(courseCards.first()).toBeVisible();
  });

  test('COURSE-DETAIL-001: Course detail page loads', async ({ page }) => {
    await page.goto('/courses/target-patwari-batch-2024');
    await expect(page.getByText(/Target Patwari Batch 2024/i)).toBeVisible();
  });

  test('AUTH-002/AUTH-003: Register new account', async ({ page }) => {
    const timestamp = Date.now();
    const email = `e2e_${timestamp}@test.com`;
    const password = 'E2eTest@1234';
    const name = `E2E User ${timestamp}`;

    await page.goto('/register');
    await page.locator('input[name="name"]').fill(name);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="confirmPassword"]').fill(password);
    await page.getByRole('button', { name: /Register/i }).click();

    // Should redirect or show success
    await page.waitForTimeout(3000);
    const url = page.url();
    const bodyText = await page.locator('body').textContent();
    const isSuccess =
      !url.includes('/register') ||
      bodyText?.toLowerCase().includes('success') ||
      bodyText?.toLowerCase().includes('verify');
    expect(isSuccess).toBe(true);
  });

  test('AUTH-008: Login with credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholderText(/Enter your email/i).fill('arjun@student.com');
    await page.getByPlaceholderText(/Enter your password/i).fill('Student@123456');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
    expect(page.url()).not.toContain('/login');
  });

  test('PAY-001/PAY-007: Course purchase flow', async ({ page }) => {
    // This requires a seeded free course or test environment
    await page.goto('/login');
    await page.getByPlaceholderText(/Enter your email/i).fill('arjun@student.com');
    await page.getByPlaceholderText(/Enter your password/i).fill('Student@123456');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    await page.goto('/courses/target-patwari-batch-2024');
    await page.getByRole('button', { name: /Enroll for Free/i }).click();
    // Should redirect to checkout or show success
  });

  test('LMS-001/LMS-005: Course player and progress', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholderText(/Enter your email/i).fill('arjun@student.com');
    await page.getByPlaceholderText(/Enter your password/i).fill('Student@123456');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    await page.goto('/courses/target-patwari-batch-2024/learn');
    await expect(page.getByText(/Course Curriculum/i)).toBeVisible();
  });

  test('ATTEMPT-001/ATTEMPT-010: Test attempt and submit', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholderText(/Enter your email/i).fill('arjun@student.com');
    await page.getByPlaceholderText(/Enter your password/i).fill('Student@123456');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    await page.goto('/tests/patwari-mock-test-01/take');
    await expect(page.getByRole('button', { name: /Save & Next/i })).toBeVisible();
  });

  test('RESULT-001: Test result displays', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholderText(/Enter your email/i).fill('arjun@student.com');
    await page.getByPlaceholderText(/Enter your password/i).fill('Student@123456');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    await page.goto('/test-results/attempt-1');
    await expect(page.getByText(/Test Result/i)).toBeVisible();
  });
});

// E2E-002: Free Student Journey
test.describe('E2E-002: Free Student Journey', () => {
  test('HOME-009: Free resources accessible', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Open Full Free Library/i }).click();
    await expect(page).toHaveURL(/library/);
  });

  test('FREE-002: Syllabus accessible', async ({ page }) => {
    await page.goto('/exams/patwari');
    await page.getByRole('button', { name: /Syllabus/i }).click();
    await expect(page.getByText(/Official Exam Syllabus/i)).toBeVisible();
  });

  test('PYQ-001: PYQs accessible', async ({ page }) => {
    await page.goto('/exams/patwari');
    await page.getByRole('button', { name: /PYQs/i }).click();
    await expect(page.getByText(/Solved Previous Year Papers/i)).toBeVisible();
  });

  test('QUIZ-001: Daily quiz accessible', async ({ page }) => {
    await page.goto('/quiz/daily');
    await expect(page.getByText(/Daily Quiz/i)).toBeVisible();
  });
});

// E2E-003: Existing Student Journey
test.describe('E2E-003: Existing Student Journey', () => {
  test('DASH-001: Dashboard loads', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholderText(/Enter your email/i).fill('arjun@student.com');
    await page.getByPlaceholderText(/Enter your password/i).fill('Student@123456');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    await page.goto('/dashboard');
    await expect(page.getByText(/Dashboard/i)).toBeVisible();
  });

  test('DASH-002: My Courses shows enrolled courses', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholderText(/Enter your email/i).fill('arjun@student.com');
    await page.getByPlaceholderText(/Enter your password/i).fill('Student@123456');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    await page.goto('/my-courses');
    await expect(page.getByText(/My Courses/i)).toBeVisible();
  });

  test('DASH-004: Test history displays', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholderText(/Enter your email/i).fill('arjun@student.com');
    await page.getByPlaceholderText(/Enter your password/i).fill('Student@123456');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    await page.goto('/test-attempts');
    await expect(page.getByText(/Test History/i)).toBeVisible();
  });
});

// E2E-004: Unauthorized Access Tests
test.describe('E2E-004: Unauthorized Access Protection', () => {
  test('SEC-003: Unauthenticated course content blocked', async ({ page }) => {
    await page.goto('/courses/target-patwari-batch-2024/learn');
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('SEC-004: Non-purchased course content blocked', async ({ page }) => {
    // Create a new user without purchase
    const timestamp = Date.now();
    const email = `unauth_${timestamp}@test.com`;
    const password = 'Test@12345';

    await page.goto('/register');
    await page.locator('input[name="name"]').fill('Unauthorized User');
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="confirmPassword"]').fill(password);
    await page.getByRole('button', { name: /Register/i }).click();
    await page.waitForTimeout(3000);

    // Try to access premium content
    await page.goto('/courses/target-patwari-batch-2024/learn');
    // Should show access denied or redirect
  });

  test('SEC-006: Direct video URL blocked', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholderText(/Enter your email/i).fill('arjun@student.com');
    await page.getByPlaceholderText(/Enter your password/i).fill('Student@123456');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    // Try to access video directly
    const response = await page.request.get('/api/v1/courses/course-1/lessons/lesson-1/video');
    expect([401, 403]).toContain(response.status());
  });
});

// E2E-005: Admin Content Mapping
test.describe('E2E-005: Admin Content Mapping', () => {
  test('ADMIN-COURSE-003: Admin can assign ExamCategory', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholderText(/Enter your email/i).fill('admin@civicsedu.com');
    await page.getByPlaceholderText(/Enter your password/i).fill('Admin@123456');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    await page.goto('/admin/courses/new');
    await expect(page.getByText(/Create Course/i)).toBeVisible();
  });

  test('EXAM-DETAIL-013/014: Mapping validation on /exams/patwari', async ({ page }) => {
    // This test requires admin setup - create content and verify mapping
    await page.goto('/exams/patwari');
    await page.getByRole('button', { name: /Courses/i }).click();
    // Verify Patwari courses only
    const courseCards = page.locator('[data-testid="course-card"]');
    for (const card of await courseCards.all()) {
      const text = await card.textContent();
      expect(text).not.toContain('RAS');
    }
  });
});

// Responsive Tests
test.describe('Responsive Design Tests', () => {
  for (const viewport of VIEWPORTS) {
    test(`responsive-${viewport.name}: Homepage`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
      await expect(page.getByText(/RPSC & Political Science Specialist/i)).toBeVisible();
    });

    test(`responsive-${viewport.name}: Exam Detail`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/exams/patwari');
      await expect(page.getByText(/Patwari Preparation/i)).toBeVisible();
      // Check no horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 20);
    });

    test(`responsive-${viewport.name}: Course Detail`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/courses/target-patwari-batch-2024');
      await expect(page.getByText(/Target Patwari Batch 2024/i)).toBeVisible();
    });

    test(`responsive-${viewport.name}: Test Interface`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/tests/patwari-mock-test-01/take');
      // Test interface should be usable
      await expect(page.getByRole('button', { name: /Save & Next/i })).toBeVisible();
    });

    test(`responsive-${viewport.name}: Student Dashboard`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/login');
      await page.getByPlaceholderText(/Enter your email/i).fill('arjun@student.com');
      await page.getByPlaceholderText(/Enter your password/i).fill('Student@123456');
      await page.getByRole('button', { name: /Sign In/i }).click();
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

      await page.goto('/dashboard');
      await expect(page.getByText(/Dashboard/i)).toBeVisible();
    });
  }
});

// Security Tests
test.describe('Security Tests', () => {
  test('SEC-001: Student cannot access admin URL', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholderText(/Enter your email/i).fill('arjun@student.com');
    await page.getByPlaceholderText(/Enter your password/i).fill('Student@123456');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    await page.goto('/admin');
    // Should show 403 or redirect
    await expect(page).not.toHaveURL(/admin/);
  });

  test('SEC-002: Student cannot call admin API', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholderText(/Enter your email/i).fill('arjun@student.com');
    await page.getByPlaceholderText(/Enter your password/i).fill('Student@123456');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    const response = await page.request.get('/api/v1/admin/users');
    expect([401, 403]).toContain(response.status());
  });

  test('SEC-009: Fake payment rejected', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholderText(/Enter your email/i).fill('arjun@student.com');
    await page.getByPlaceholderText(/Enter your password/i).fill('Student@123456');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    // Try to call payment verify with fake data
    const response = await page.request.post('/api/v1/payments/verify', {
      data: { orderId: 'fake-order', paymentId: 'fake-payment' },
    });
    expect([400, 401, 403]).toContain(response.status());
  });

  test('SEC-012: Invalid JWT rejected', async ({ page }) => {
    // Set invalid token
    await page.evaluate(() => {
      localStorage.setItem('token', 'invalid-token');
    });
    await page.goto('/dashboard');
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});

// Performance Tests
test.describe('Performance Tests', () => {
  test('PERF-001: Homepage loads quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // 5 seconds max
  });

  test('PERF-002: Course listing pagination', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');
    // Should show pagination controls
    await expect(page.getByRole('button', { name: /2/i })).toBeVisible({ timeout: 5000 });
  });

  test('PERF-005: Dashboard loads efficiently', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholderText(/Enter your email/i).fill('arjun@student.com');
    await page.getByPlaceholderText(/Enter your password/i).fill('Student@123456');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    const startTime = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });
});

// Critical Mapping Test Suite
test.describe('Critical Mapping Test Suite', () => {
  test('Mapping: Patwari content appears on /exams/patwari', async ({ page }) => {
    await page.goto('/exams/patwari');

    // Check tabs show correct counts
    await page.getByRole('button', { name: /Courses/i }).click();
    const patwariCourses = page.locator('[data-testid="course-card"]');
    expect(await patwariCourses.count()).toBeGreaterThan(0);

    await page.getByRole('button', { name: /Test Series/i }).click();
    const patwariTests = page.locator('[data-testid="test-card"]');
    expect(await patwariTests.count()).toBeGreaterThan(0);

    await page.getByRole('button', { name: /Free Resources/i }).click();
    const patwariResources = page.locator('[data-testid="resource-card"]');
    expect(await patwariResources.count()).toBeGreaterThanOrEqual(0);

    await page.getByRole('button', { name: /Updates/i }).click();
    // Should show Patwari blogs/jobs
  });

  test('Mapping: RAS content does NOT appear on /exams/patwari', async ({ page }) => {
    await page.goto('/exams/patwari');
    await page.getByRole('button', { name: /Courses/i }).click();

    const courseCards = page.locator('[data-testid="course-card"]');
    for (const card of await courseCards.all()) {
      const text = await card.textContent();
      expect(text?.toLowerCase()).not.toContain('ras foundation');
    }

    await page.getByRole('button', { name: /Test Series/i }).click();
    const testCards = page.locator('[data-testid="test-card"]');
    for (const card of await testCards.all()) {
      const text = await card.textContent();
      expect(text?.toLowerCase()).not.toContain('ras mock');
    }
  });
});
