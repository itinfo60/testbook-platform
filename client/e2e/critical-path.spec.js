/**
 * Critical path E2E: Register → Login → Browse Courses → View Profile
 * Requires the dev server + seeded data running at http://localhost:5173.
 */
import { test, expect } from '@playwright/test';

const TIMESTAMP = Date.now();
const TEST_EMAIL = `e2e_${TIMESTAMP}@test.com`;
const TEST_PASSWORD = 'E2eTest@1234';
const TEST_NAME = `E2E User ${TIMESTAMP}`;

test.describe('Critical Path — New User Journey', () => {
  test('step 1: register a new account', async ({ page }) => {
    await page.goto('/register');

    // Fill registration form fields using robust name selectors
    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    await nameInput.fill(TEST_NAME);
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);

    // Handle confirm password
    const confirmInput = page.locator('input[name="confirmPassword"]');
    const confirmCount = await confirmInput.count();
    if (confirmCount > 0) await confirmInput.fill(TEST_PASSWORD);

    await page.getByRole('button', { name: /register|sign up|create account/i }).click();

    // After registration: should redirect or show success (not stay on /register)
    await page.waitForTimeout(3000);
    const url = page.url();
    // Either redirected away or shows a success state
    const bodyText = await page.locator('body').textContent();
    const isSuccess =
      !url.includes('/register') ||
      bodyText.toLowerCase().includes('success') ||
      bodyText.toLowerCase().includes('verify') ||
      bodyText.toLowerCase().includes('check your email');

    expect(isSuccess).toBe(true);
  });

  test('step 2: login with seeded student account', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/enter your email/i).fill('arjun@student.com');
    await page.getByPlaceholder(/enter your password/i).fill('Student@123456');
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
    expect(page.url()).not.toContain('/login');
  });

  test('step 3: navigate to courses catalog', async ({ page }) => {
    // Log in first
    await page.goto('/login');
    await page.getByPlaceholder(/enter your email/i).fill('arjun@student.com');
    await page.getByPlaceholder(/enter your password/i).fill('Student@123456');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    await page.goto('/courses');
    await expect(page).not.toHaveURL(/login/);
    // At minimum the page body renders
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('step 4: view my profile / settings', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/enter your email/i).fill('arjun@student.com');
    await page.getByPlaceholder(/enter your password/i).fill('Student@123456');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    await page.goto('/profile');
    await expect(page).not.toHaveURL(/login/);
  });
});
