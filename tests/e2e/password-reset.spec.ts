import { test, expect } from '@playwright/test';

test.describe('Password Reset Flow E2E', () => {
  test('should allow a user to reset their password via UI and then sign in with the new password', async ({ page, request }) => {
    const email = `pwd_reset_${Date.now()}@test.com`;
    const oldPassword = 'OldPassword123!';
    const newPassword = 'NewPassword123!';

    // 1. Register a test account using the API
    const regRes = await request.post('http://127.0.0.1:5001/api/auth/register', {
      data: {
        name: 'Reset Test User',
        email: email,
        password: oldPassword,
        role: 'USER'
      }
    });
    expect(regRes.ok()).toBeTruthy();

    // 2. Go to Forgot Password page
    await page.goto('/login');
    await expect(page.locator('h2', { hasText: 'Welcome Back' })).toBeVisible({ timeout: 10000 });
    await page.click('text=Forgot Password?');

    // Verify Forgot Password view
    await expect(page.locator('h2', { hasText: 'Forgot Password' })).toBeVisible({ timeout: 10000 });

    // Fill in email and submit
    await page.fill('input[type="email"]', email);
    await page.click('button:has-text("Send Reset Link")');

    // Verify success/acknowledgement message
    await expect(page.locator('text=If an account exists, a password reset link has been sent.')).toBeVisible({ timeout: 10000 });

    // 3. Call our test helper endpoint to retrieve the raw reset token
    const tokenRes = await request.get(`http://127.0.0.1:5001/api/auth/test/reset-token/${email}`);
    expect(tokenRes.ok()).toBeTruthy();
    const tokenData = await tokenRes.json();
    const resetToken = tokenData.token;
    expect(resetToken).toBeDefined();

    // 4. Navigate directly to the reset-password URL with the token and email params
    await page.goto(`/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`);

    // Verify Reset Password view loads
    await expect(page.locator('h2', { hasText: 'Create New Password' })).toBeVisible({ timeout: 10000 });

    // Fill new password details using robust position-based locators
    await page.locator('input[type="password"]').first().fill(newPassword);
    await page.locator('input[type="password"]').last().fill(newPassword);
    await page.click('button:has-text("Reset Password")');

    // Verify reset success view
    await expect(page.locator('text=Password Reset!')).toBeVisible({ timeout: 15000 });

    // Click Go to Login
    await page.click('button:has-text("Go to Login")');

    // 5. Verify we can sign in with the new password
    await expect(page.locator('h2', { hasText: 'Welcome Back' })).toBeVisible({ timeout: 10000 });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', newPassword);
    await page.click('button:has-text("Sign In")');

    // Verify successful login redirects to core services dashboard
    await expect(page.locator('text=Core Services')).toBeVisible({ timeout: 15000 });
  });
});
