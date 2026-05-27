export async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill('institute@demo.com');
  await page.locator('input[type="password"]').fill('Admin@123456');
  await page.getByRole('button', { name: /sign in/i }).click();
  // Wait for redirect to dashboard
  await page.waitForURL((url) => url.pathname === '/' || !url.pathname.includes('/login'), {
    timeout: 10000,
  });
}
