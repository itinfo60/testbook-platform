import { test, expect } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth.js';

test.describe('Platform Super Admin Management Features - Deep Dive', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
  });

  test('super admin dashboard stats render correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /platform dashboard/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /institute health/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /platform growth/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /recently joined institutes/i })).toBeVisible();
  });

  test('super admin can manage institutes (Create, Search, Suspend/Activate)', async ({ page }) => {
    await page.getByRole('link', { name: /institutes/i }).click();
    await page.waitForURL('/institutes');
    await expect(page.getByRole('heading', { name: /institutes/i, exact: true })).toBeVisible();

    // Click "New Institute"
    await page.getByRole('button', { name: /New Institute/i }).click();

    // Fill the modal form fields
    const instituteName = `E2E Academy ${Date.now()}`;
    const subdomain = `e2eacademy-${Date.now()}`;
    const ownerEmail = `owner-${Date.now()}@e2eacademy.com`;

    await page.getByPlaceholder('Sharma Classes').fill(instituteName);
    await page.getByPlaceholder('sharma', { exact: true }).fill(subdomain);
    await page.getByPlaceholder('Ramesh Sharma').fill('E2E Owner');
    await page.getByPlaceholder('owner@example.com').fill(ownerEmail);
    await page.getByPlaceholder('Min 8 characters').fill('Password123456');

    // Select the first subscription plan
    await page.locator('label:has-text("Plan") + select').selectOption({ index: 1 });

    // Set expiration date
    await page.locator('input[type="date"]').fill('2028-12-31');

    // Set Student Limit and Teacher Limit
    await page.locator('label:has-text("Student Limit") + input').fill('200');
    await page.locator('label:has-text("Teacher Limit") + input').fill('15');

    // Wait for subdomain availability check to complete (debounced 600ms async check)
    // The Create button stays disabled while subdomainStatus === 'checking'
    await expect(page.getByText(/Available/i).first())
      .toBeVisible({ timeout: 5000 })
      .catch(() => {});
    // Extra buffer to ensure the button is enabled
    await page.waitForTimeout(800);

    // Submit the form — button should now be enabled
    await page.getByRole('button', { name: 'Create Institute' }).click();

    // Wait for the network request to complete and table to refresh
    await page.waitForLoadState('networkidle');

    // Verify new institute is listed in table
    await expect(page.locator('table')).toContainText(instituteName, { timeout: 10000 });

    // Search for the institute
    await page.getByPlaceholder('Search by name or subdomain...').fill(subdomain);
    await page.waitForTimeout(1000);
    await expect(page.locator('table')).toContainText(instituteName);

    // Find the row for this institute
    const row = page.locator('tr', { hasText: instituteName });

    // Verify status is active
    await expect(row).toContainText(/active/i);

    // Suspend the institute
    await row.getByRole('button', { name: /suspend/i }).click();
    await page.waitForTimeout(1000);

    // Verify status updated to suspended and button is now "Activate"
    await expect(row).toContainText(/suspended/i);
    await expect(row.getByRole('button', { name: /activate/i })).toBeVisible();

    // Activate the institute back
    await row.getByRole('button', { name: /activate/i }).click();
    await page.waitForTimeout(1000);

    // Verify status updated back to active
    await expect(row).toContainText(/active/i);
  });

  test('super admin can ban and unban a user', async ({ page }) => {
    await page.getByRole('link', { name: /all users/i }).click();
    await page.waitForURL('/users');
    await expect(page.getByRole('heading', { name: /all users/i })).toBeVisible();

    // Find a non-super-admin user row in the table (e.g. teacher or student role)
    // Filter to Student role to find a standard user to ban
    await page.locator('select').selectOption('student');
    await page.waitForTimeout(1000);

    // Find the first row that has an Active status (a prior run may have left a user banned)
    const allRows = page.locator('table tbody tr');
    await expect(allRows.first()).toBeVisible();

    // Locate first row that contains an exact 'Ban' button (active users only, not 'Unban')
    const activeUserRow = allRows
      .filter({ has: page.getByRole('button', { name: 'Ban', exact: true }) })
      .first();
    await expect(activeUserRow).toBeVisible();

    const userName = await activeUserRow.locator('td').first().locator('p').first().textContent();
    console.log(`Banning user: ${userName}`);

    // Click exact "Ban" button (not "Unban")
    await activeUserRow.getByRole('button', { name: 'Ban', exact: true }).click();
    await page.waitForTimeout(1500);

    // Verify status changes to Banned and button becomes "Unban"
    await expect(activeUserRow).toContainText(/banned/i);
    await expect(activeUserRow.getByRole('button', { name: 'Unban' })).toBeVisible();

    // Click "Unban" button
    await activeUserRow.getByRole('button', { name: 'Unban', exact: true }).click();
    await page.waitForTimeout(1500);

    // Verify status changes back to Active and button is "Ban"
    await expect(activeUserRow).toContainText(/active/i);
    await expect(activeUserRow.getByRole('button', { name: 'Ban', exact: true })).toBeVisible();
  });
});
