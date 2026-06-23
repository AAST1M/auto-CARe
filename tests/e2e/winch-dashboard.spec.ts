import { test, expect } from '@playwright/test';

test.describe('Winch Dashboard E2E', () => {
  test('should allow a winch driver to log in and use the dashboard', async ({ page, request }) => {
    const driverEmail = `winch_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`;
    const driverPassword = 'Password123!';

    // 1. Register a WINCH_DRIVER user using the API directly
    const registerRes = await request.post('http://127.0.0.1:5001/api/auth/register', {
      data: {
        name: 'Speedy Winch',
        email: driverEmail,
        password: driverPassword,
        role: 'WINCH_DRIVER'
      }
    });
    
    expect(registerRes.ok()).toBeTruthy();

    // 2. Go to the home page and login
    await page.goto('/');
    
    // Wait for auth to settle and redirect to login if not logged in
    await expect(page.locator('h2', { hasText: 'Welcome Back' })).toBeVisible({ timeout: 10000 });
    
    // Fill out login form
    await page.fill('input[type="email"]', driverEmail);
    await page.fill('input[type="password"]', driverPassword);
    await page.click('button:has-text("Sign In")');

    // 3. Verify Winch Dashboard Loads
    await expect(page.locator('h2', { hasText: 'Winch Command' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('p', { hasText: 'Welcome back, Speedy Winch' })).toBeVisible();

    // 4. Test Online Toggle
    await expect(page.locator('text=Offline')).toBeVisible();
    await expect(page.locator('text=Go online to receive requests')).toBeVisible();
    
    // Click the toggle (it's the first div that is a sibling or parent of the offline text...
    // Actually, we can click the div that contains the toggle. The toggle has a specific structure.
    // Let's click the switch based on its adjacent text.
    await page.locator('div').filter({ has: page.locator('text=Offline') }).locator('.w-14.h-8').click();
    
    await expect(page.locator('text=Online').first()).toBeVisible();
    await expect(page.locator('text=Searching for requests...')).toBeVisible();

    // 5. Test Wallet View
    await expect(page.locator('h3', { hasText: 'Wallet' })).toBeVisible();
    await page.click('button:has-text("View Details")');
    
    // Verify inside wallet view
    await expect(page.locator('p', { hasText: 'Total Balance' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Request Withdrawal' })).toBeVisible();

    // Go back from wallet
    await page.click('button[aria-label="Go Back"]');
    await expect(page.locator('h2', { hasText: 'Winch Command' })).toBeVisible();
  });
});
