import { test, expect } from '@playwright/test';
import { loginAsTeacher } from './helpers/auth.js';

test.describe('Teacher Features Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test('teacher dashboard loads correctly', async ({ page }) => {
    await page.goto('/teacher');
    await expect(page.getByRole('heading', { name: /teacher dashboard|dashboard/i })).toBeVisible();
    await expect(page.getByText('Total Students').first()).toBeVisible();
    await expect(page.getByText('Total Revenue').first()).toBeVisible();
  });

  test('teacher can view and create courses', async ({ page }) => {
    await page.goto('/teacher/courses');
    await expect(
      page.getByRole('button', { name: /create|new course/i }).or(page.getByText(/create/i))
    ).toBeVisible();
  });

  test('teacher can view quizzes', async ({ page }) => {
    await page.goto('/teacher/quizzes');
    await expect(page.locator('body')).toContainText(/quiz/i);
  });

  test('teacher can view student list', async ({ page }) => {
    await page.goto('/teacher/students');
    await expect(page.locator('body')).toContainText(/student/i);
  });

  test('teacher can view revenue panel', async ({ page }) => {
    await page.goto('/teacher/revenue');
    await expect(page.locator('body')).toContainText(/earnings|revenue/i);
  });

  test('teacher can manage attendance', async ({ page }) => {
    await page.goto('/teacher/attendance');
    await expect(page.locator('body')).toContainText(/attendance/i);
  });
});
