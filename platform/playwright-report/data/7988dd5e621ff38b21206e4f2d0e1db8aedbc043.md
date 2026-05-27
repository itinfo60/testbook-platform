# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: platform-management.spec.js >> Platform Super Admin Management Features - Deep Dive >> super admin can ban and unban a user
- Location: e2e/platform-management.spec.js:87:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('table tbody tr').filter({ has: getByRole('button', { name: 'Ban', exact: true }) }).first()
Expected pattern: /banned/i
Received string:  "EE2E User 1779887565767e2e_1779887565767@test.comstudentDemo Academy5/27/2026ActiveBan"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('table tbody tr').filter({ has: getByRole('button', { name: 'Ban', exact: true }) }).first()
    14 × locator resolved to <tr class="border-b border-gray-800/50 hover:bg-gray-800/20">…</tr>
       - unexpected value "EE2E User 1779887565767e2e_1779887565767@test.comstudentDemo Academy5/27/2026ActiveBan"

```

```yaml
- row "E E2E User 1779887565767 e2e_1779887565767@test.com student Demo Academy 5/27/2026 Active Ban":
    - cell "E E2E User 1779887565767 e2e_1779887565767@test.com":
        - text: E
        - paragraph: E2E User 1779887565767
        - paragraph: e2e_1779887565767@test.com
    - cell "student"
    - cell "Demo Academy"
    - cell "5/27/2026"
    - cell "Active"
    - cell "Ban":
        - button "Ban"
```

# Test source

```ts
  13  |     await expect(page.getByRole('heading', { name: /recently joined institutes/i })).toBeVisible();
  14  |   });
  15  |
  16  |   test('super admin can manage institutes (Create, Search, Suspend/Activate)', async ({ page }) => {
  17  |     await page.getByRole('link', { name: /institutes/i }).click();
  18  |     await page.waitForURL('/institutes');
  19  |     await expect(page.getByRole('heading', { name: /institutes/i, exact: true })).toBeVisible();
  20  |
  21  |     // Click "New Institute"
  22  |     await page.getByRole('button', { name: /New Institute/i }).click();
  23  |
  24  |     // Fill the modal form fields
  25  |     const instituteName = `E2E Academy ${Date.now()}`;
  26  |     const subdomain = `e2eacademy-${Date.now()}`;
  27  |     const ownerEmail = `owner-${Date.now()}@e2eacademy.com`;
  28  |
  29  |     await page.getByPlaceholder('Sharma Classes').fill(instituteName);
  30  |     await page.getByPlaceholder('sharma', { exact: true }).fill(subdomain);
  31  |     await page.getByPlaceholder('Ramesh Sharma').fill('E2E Owner');
  32  |     await page.getByPlaceholder('owner@example.com').fill(ownerEmail);
  33  |     await page.getByPlaceholder('Min 8 characters').fill('Password123456');
  34  |
  35  |     // Select the first subscription plan
  36  |     await page.locator('label:has-text("Plan") + select').selectOption({ index: 1 });
  37  |
  38  |     // Set expiration date
  39  |     await page.locator('input[type="date"]').fill('2028-12-31');
  40  |
  41  |     // Set Student Limit and Teacher Limit
  42  |     await page.locator('label:has-text("Student Limit") + input').fill('200');
  43  |     await page.locator('label:has-text("Teacher Limit") + input').fill('15');
  44  |
  45  |     // Wait for subdomain availability check to complete (debounced 600ms async check)
  46  |     // The Create button stays disabled while subdomainStatus === 'checking'
  47  |     await expect(page.getByText(/Available/i).first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  48  |     // Extra buffer to ensure the button is enabled
  49  |     await page.waitForTimeout(800);
  50  |
  51  |     // Submit the form — button should now be enabled
  52  |     await page.getByRole('button', { name: 'Create Institute' }).click();
  53  |
  54  |     // Wait for the network request to complete and table to refresh
  55  |     await page.waitForLoadState('networkidle');
  56  |
  57  |     // Verify new institute is listed in table
  58  |     await expect(page.locator('table')).toContainText(instituteName, { timeout: 10000 });
  59  |
  60  |     // Search for the institute
  61  |     await page.getByPlaceholder('Search by name or subdomain...').fill(subdomain);
  62  |     await page.waitForTimeout(1000);
  63  |     await expect(page.locator('table')).toContainText(instituteName);
  64  |
  65  |     // Find the row for this institute
  66  |     const row = page.locator('tr', { hasText: instituteName });
  67  |
  68  |     // Verify status is active
  69  |     await expect(row).toContainText(/active/i);
  70  |
  71  |     // Suspend the institute
  72  |     await row.getByRole('button', { name: /suspend/i }).click();
  73  |     await page.waitForTimeout(1000);
  74  |
  75  |     // Verify status updated to suspended and button is now "Activate"
  76  |     await expect(row).toContainText(/suspended/i);
  77  |     await expect(row.getByRole('button', { name: /activate/i })).toBeVisible();
  78  |
  79  |     // Activate the institute back
  80  |     await row.getByRole('button', { name: /activate/i }).click();
  81  |     await page.waitForTimeout(1000);
  82  |
  83  |     // Verify status updated back to active
  84  |     await expect(row).toContainText(/active/i);
  85  |   });
  86  |
  87  |   test('super admin can ban and unban a user', async ({ page }) => {
  88  |     await page.getByRole('link', { name: /all users/i }).click();
  89  |     await page.waitForURL('/users');
  90  |     await expect(page.getByRole('heading', { name: /all users/i })).toBeVisible();
  91  |
  92  |     // Find a non-super-admin user row in the table (e.g. teacher or student role)
  93  |     // Filter to Student role to find a standard user to ban
  94  |     await page.locator('select').selectOption('student');
  95  |     await page.waitForTimeout(1000);
  96  |
  97  |     // Find the first row that has an Active status (a prior run may have left a user banned)
  98  |     const allRows = page.locator('table tbody tr');
  99  |     await expect(allRows.first()).toBeVisible();
  100 |
  101 |     // Locate first row that contains an exact 'Ban' button (active users only, not 'Unban')
  102 |     const activeUserRow = allRows.filter({ has: page.getByRole('button', { name: 'Ban', exact: true }) }).first();
  103 |     await expect(activeUserRow).toBeVisible();
  104 |
  105 |     const userName = await activeUserRow.locator('td').first().locator('p').first().textContent();
  106 |     console.log(`Banning user: ${userName}`);
  107 |
  108 |     // Click exact "Ban" button (not "Unban")
  109 |     await activeUserRow.getByRole('button', { name: 'Ban', exact: true }).click();
  110 |     await page.waitForTimeout(1500);
  111 |
  112 |     // Verify status changes to Banned and button becomes "Unban"
> 113 |     await expect(activeUserRow).toContainText(/banned/i);
      |                                 ^ Error: expect(locator).toContainText(expected) failed
  114 |     await expect(activeUserRow.getByRole('button', { name: 'Unban' })).toBeVisible();
  115 |
  116 |     // Click "Unban" button
  117 |     await activeUserRow.getByRole('button', { name: 'Unban', exact: true }).click();
  118 |     await page.waitForTimeout(1500);
  119 |
  120 |     // Verify status changes back to Active and button is "Ban"
  121 |     await expect(activeUserRow).toContainText(/active/i);
  122 |     await expect(activeUserRow.getByRole('button', { name: 'Ban', exact: true })).toBeVisible();
  123 |   });
  124 | });
  125 |
```
