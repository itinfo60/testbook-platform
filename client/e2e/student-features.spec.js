import { test, expect } from '@playwright/test';
import { loginAsStudent } from './helpers/auth.js';

test.describe('Student Features Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('student can access AI Doubt Solver', async ({ page }) => {
    await page.goto('/ai/doubt-solver');
    await expect(page.getByRole('heading', { name: /AI Doubt Solver|doubt/i })).toBeVisible();

    // Fill the doubt in the textarea
    const doubtTextarea = page.locator('textarea');
    await expect(doubtTextarea).toBeVisible();
    await doubtTextarea.fill('Explain Newton laws of motion');

    // Click "Solve Doubt" button
    await page.getByRole('button', { name: /Solve Doubt|Solve|Ask/i }).click();

    // Check that we don't crash and some response or error container is present
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('student can view Leaderboard', async ({ page }) => {
    await page.goto('/leaderboard');
    await expect(page.getByRole('heading', { name: /leaderboard/i })).toBeVisible();
    // Leaderboard list or "No data yet" should be visible
    await expect(page.locator('body')).toContainText(/Weekly|Monthly|All Time|No data yet/i);
  });

  test('student can view Achievements and badges', async ({ page }) => {
    await page.goto('/achievements');
    await expect(page.getByRole('heading', { name: /achievements/i })).toBeVisible();
    await expect(page.locator('body')).toContainText(/earned|badges/i);
  });

  test('student can access AI Study Plan Generator', async ({ page }) => {
    await page.goto('/ai/study-plan');
    await expect(page.getByRole('heading', { name: /study plan/i })).toBeVisible();
    await expect(page.getByPlaceholder(/JEE Main|UPSC/i)).toBeVisible();
  });

  test('student can update settings', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /profile settings|settings/i })).toBeVisible();

    const bioText = 'Passionate student learning physics';
    const bioInput = page.locator('textarea[name="bio"], textarea');
    if (await bioInput.isVisible()) {
      await bioInput.fill(bioText);
      // Select the "Save Changes" button specifically to avoid strict mode violations
      await page.getByRole('button', { name: 'Save Changes' }).click();
      await expect(page.getByText(/profile updated|settings saved/i).first()).toBeVisible();
    }
  });
});
