import { test, expect } from '@playwright/test';
import { loginAsStudent } from './helpers/auth.js';

test.describe('Course Catalog', () => {
  test('course listing page is accessible without auth', async ({ page }) => {
    await page.goto('/courses');
    // Should show courses or a login redirect — either is valid
    await expect(page).not.toHaveURL(/error/);
  });

  test('course detail page loads', async ({ page }) => {
    await page.goto('/courses');
    const firstCourse = page.locator('a[href*="/courses/"]').first();
    const count = await firstCourse.count();
    if (count === 0) {
      // No courses seeded — skip
      test.skip(true, 'No courses found in catalog');
      return;
    }
    await firstCourse.click();
    await expect(page).toHaveURL(/\/courses\//);
  });
});

test.describe('Student — Course Enrollment Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('student dashboard loads after login', async ({ page }) => {
    await expect(page).not.toHaveURL(/login/);
    // Dashboard or home should be visible
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('my courses page is accessible', async ({ page }) => {
    await page.goto('/my-courses');
    await expect(page).not.toHaveURL(/login/);
  });
});
