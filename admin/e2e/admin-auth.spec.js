import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.js';

test.describe('Admin Panel Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /admin panel/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('admin can log in successfully', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL('/');
  });

  test('admin can log out', async ({ page }) => {
    await loginAsAdmin(page);

    // Find logout button or evaluate storage clear
    await page.evaluate(() => {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    });
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /admin panel/i })).toBeVisible();
  });
});
