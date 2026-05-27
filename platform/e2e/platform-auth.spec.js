import { test, expect } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth.js';

test.describe('Platform Super Admin Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /platform admin/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('super admin can log in successfully', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await expect(page).toHaveURL('/');
  });

  test('super admin can log out', async ({ page }) => {
    await loginAsSuperAdmin(page);

    // Perform log out by clicking the sign out button
    await page.getByRole('button', { name: /sign out/i }).click();
    await page.waitForURL('/login');
    await expect(page.getByRole('heading', { name: /platform admin/i })).toBeVisible();
  });
});
