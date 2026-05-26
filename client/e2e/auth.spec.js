import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByPlaceholder(/enter your email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/enter your password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows validation errors on empty submit', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/enter a valid email address/i)).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/enter your email/i).fill('nobody@nowhere.com');
    await page.getByPlaceholder(/enter your password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Should show server error message
    await expect(page.locator('[class*="red"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('register page is accessible', async ({ page }) => {
    await page.goto('/register');
    await expect(
      page.getByRole('heading', { name: /create account|register|sign up/i })
    ).toBeVisible();
  });

  test('forgot password page is accessible', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('button', { name: /send|reset/i })).toBeVisible();
  });

  test('navigates from login to register', async ({ page }) => {
    await page.goto('/login');
    await page.getByText(/sign up/i).click();
    await expect(page).toHaveURL(/register/);
  });

  test('navigates from login to forgot password', async ({ page }) => {
    await page.goto('/login');
    await page.getByText(/forgot password/i).click();
    await expect(page).toHaveURL(/forgot-password/);
  });
});
