import { test, expect } from '@playwright/test';

test('User can login and is redirected to home', async ({ page }) => {
  // We mock the API request to avoid needing a running backend during E2E UI testing
  await page.route('**/api/auth/login', async (route) => {
    const json = {
      token: 'fake-jwt-token',
      user: {
        id: '1',
        email: 'test@example.com',
        role: 'USER',
        name: 'Test User'
      }
    };
    await route.fulfill({ json });
  });

  // Mock admin data fetch that happens on Home
  await page.route('**/api/admin/dashboard', async (route) => {
    await route.fulfill({ json: { totalUsers: 0 } });
  });

  await page.goto('http://localhost:5173/login');

  // Fill in login form
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');

  // Click login button
  await page.click('button[type="submit"]');

  // Expect to be redirected to home page, which is empty path or matching UI
  await expect(page).toHaveURL('http://localhost:5173/');

  // Expect "3alemni" or "Auto-Care AI" header (depending on which UI rendered)
  const header = page.locator('h1.font-display').first();
  await expect(header).toBeVisible();
});
