import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard E2E', () => {
  test('should allow an admin to log in and view the dashboard', async ({ page, request }) => {
    const adminEmail = `admin_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`;
    const adminPassword = 'Password123!';

    // 1. Register an ADMIN user using the API directly
    const registerRes = await request.post('http://localhost:5001/api/auth/register', {
      data: {
        name: 'Super Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'ADMIN'
      }
    });
    
    expect(registerRes.ok()).toBeTruthy();

    // 2. Go to the home page and login
    await page.goto('/');
    
    // Wait for auth to settle and redirect to login if not logged in
    await expect(page.locator('h2', { hasText: 'Welcome Back' })).toBeVisible({ timeout: 10000 });
    
    // Fill out login form
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button:has-text("Sign In")');

    // 3. Verify Admin Dashboard Loads
    await expect(page.locator('text=Control Panel')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();

    // 4. Verify Overview Tab Key Metrics
    await expect(page.locator('text=Total Volume')).toBeVisible();
    await expect(page.locator('text=Platform Users')).toBeVisible();

    // 5. Navigate to Users Tab
    await page.click('button:has-text("Users")');
    // Verify our admin user is listed
    await expect(page.locator('text=' + adminEmail).first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h4', { hasText: 'Super Admin' }).first()).toBeVisible();
    await expect(page.locator('span', { hasText: 'ADMIN' }).first()).toBeVisible();

    // 6. Navigate to Transactions Tab
    await page.click('button:has-text("Transactions")');
    // Verify filter buttons load
    await expect(page.locator('button', { hasText: 'Workshops' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button', { hasText: 'Winch Rides' })).toBeVisible();
    
    // Note: there might not be any transactions depending on DB state, 
    // but we verify the view renders correctly.
  });
});
