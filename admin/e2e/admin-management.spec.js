import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.js';

test.describe('Admin Panel Management Features - Deep Dive', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('admin dashboard stats render correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Verify dashboard metrics cards are visible
    await expect(page.locator('body')).toContainText(/Dashboard/i);
    await expect(page.locator('body')).toContainText(/revenue|students|courses|teachers/i);
  });

  test('admin can manage users (Create, Search, Delete)', async ({ page }) => {
    await page.goto('/users');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();

    // Click "Add User" button
    await page.getByRole('button', { name: /Add User/i }).click();
    await page.waitForURL('/users/create');
    await page.waitForLoadState('networkidle');

    const uniqueEmail = `e2e-user-${Date.now()}@testbook.com`;
    const uniqueName = `E2E Test Student ${Date.now()}`;

    // Fill the user form
    await page.locator('label:has-text("Name *") + input').fill(uniqueName);
    await page.locator('label:has-text("Email *") + input').fill(uniqueEmail);
    await page.locator('label:has-text("Password") + input').fill('Student@123456');
    await page.locator('label:has-text("Role") + select').selectOption('student');
    await page.locator('label:has-text("Status") + select').selectOption('active');

    // Submit user form
    await page.getByRole('button', { name: /Create User/i }).click();
    await page.waitForURL('/users');
    await page.waitForLoadState('networkidle');

    // Search for the newly created user
    await page.getByPlaceholder('Search users...').fill(uniqueName);
    // Wait for the debounced search to filter results
    await page.waitForTimeout(1500);

    // Verify user is in list and active
    const userRow = page.locator('tr', { hasText: uniqueName });
    await expect(userRow).toContainText('active');

    // Click delete button for the row (sets user status to inactive/deactivated in backend)
    await userRow.locator('button[title="Delete"]').click();

    // Confirm delete in modal dialog
    await page.locator('button:has-text("Delete")').last().click();

    // Wait for delete operation to sync
    await page.waitForTimeout(1500);

    // Verify user status is now inactive
    await expect(userRow).toContainText('inactive');
  });

  test('admin can manage coupons (Create, List)', async ({ page }) => {
    await page.goto('/coupons');
    await page.waitForLoadState('networkidle');

    // Navigate to create coupon
    await page.getByRole('button', { name: /Create Coupon/i }).click();
    await page.waitForURL('/coupons/create');
    await page.waitForLoadState('networkidle');

    const couponCode = `E2ECOUPON${Math.floor(Math.random() * 1000)}`;

    // Fill coupon details
    await page.getByPlaceholder('SAVE20').fill(couponCode);
    await page.getByPlaceholder('20% off on all courses').fill('50% E2E Discount');
    await page.locator('select').first().selectOption('percentage');
    await page.locator('label:has-text("Discount Value *") + input').fill('50');

    // Submit form
    await page.getByRole('button', { name: /Create/i }).click();
    await page.waitForURL('/coupons');
    await page.waitForLoadState('networkidle');

    // Check that new coupon is listed
    await expect(page.locator('table')).toContainText(couponCode);
  });

  test('admin can manage Digital Library resources (Create, List, Delete)', async ({ page }) => {
    await page.goto('/library');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Digital Library Admin' })).toBeVisible();

    const resourceTitle = `E2E Resource ${Date.now()}`;

    // Fill library resource form
    await page.getByPlaceholder('Title').fill(resourceTitle);
    await page.getByPlaceholder('Category').fill('Reference');
    await page.getByPlaceholder('Tags (comma separated)').fill('e2e, testing, cypress');
    await page.locator('select').selectOption('all');
    await page.getByPlaceholder('Description').fill('E2E testing reference documentation.');

    // Upload a mock file (as backend validation requires fileUrl via req.file)
    await page.locator('input[type="file"]').setInputFiles({
      name: 'e2e_document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock pdf content'),
    });

    // Submit form
    await page.getByRole('button', { name: 'Create Resource' }).click();
    await page.waitForTimeout(2000); // Give time to complete creation request and reload list

    // Verify new resource is listed in the table
    await expect(page.locator('table')).toContainText(resourceTitle);

    // Set up window.confirm dialog handler
    page.once('dialog', (dialog) => dialog.accept());

    // Click Delete button on the newly created resource
    const row = page.locator('tr', { hasText: resourceTitle });
    await row.locator('button:has-text("Delete")').click();

    // Verify it is removed
    await expect(page.locator('table')).not.toContainText(resourceTitle);
  });
});
