/**
 * E2E auth helpers — reusable login/logout across tests.
 */

export async function loginAs(page, email, password) {
  await page.goto('/login');
  await page.getByPlaceholder(/enter your email/i).fill(email);
  await page.getByPlaceholder(/enter your password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  // Wait for redirect away from login page
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

export async function loginAsStudent(page) {
  return loginAs(page, 'arjun@student.com', 'Student@123456');
}

export async function loginAsTeacher(page) {
  return loginAs(page, 'teacher@civicsedu.com', 'Teacher@123456');
}

export async function logout(page) {
  // Try clicking user menu then logout, or just clear storage
  await page.evaluate(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  });
  await page.goto('/login');
}
