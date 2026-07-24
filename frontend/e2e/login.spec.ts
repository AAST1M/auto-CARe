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

  await page.goto('/login');

  // Fill in login form
  const emailInput = page.locator('input[type="email"], input[name="email"]');
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await emailInput.fill('test@example.com');

  const passwordInput = page.locator('input[type="password"], input[name="password"]');
  await passwordInput.fill('password123');

  // Click login button
  const submitButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').first();
  await expect(submitButton).toBeVisible();
  await submitButton.click();

  // Expect to be redirected to home page, which is empty path or matching UI
  await expect(page).toHaveURL('/');

  // Expect "3alemni" or "Auto-Care AI" header (depending on which UI rendered)
  const header = page.locator('h1.font-display').first();
  await expect(header).toBeVisible();
});
