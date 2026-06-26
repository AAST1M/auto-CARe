import { test, expect } from '@playwright/test';

test.describe('SignUp Flow E2E', () => {
  test('should allow a normal customer (user) to sign up successfully via UI', async ({ page }) => {
    const email = `customer_signup_${Date.now()}@test.com`;
    const password = 'Password123!';

    await page.goto('/signup');
    await expect(page.locator('h2', { hasText: 'Create Account' })).toBeVisible({ timeout: 10000 });

    // Fill the signup form
    await page.fill('#signup-name', 'Sign Up Customer');
    await page.fill('#signup-email', email);
    await page.fill('#signup-password', password);
    await page.fill('#signup-confirm-password', password);

    // Default role is USER (Car Owner)
    await page.click('#signup-submit');

    // Upon success, user context logs in and redirects to home page showing 'Core Services'
    await expect(page.locator('text=Core Services')).toBeVisible({ timeout: 15000 });
  });

  test('should allow a winch driver to sign up successfully via UI', async ({ page }) => {
    const email = `driver_signup_${Date.now()}@test.com`;
    const password = 'Password123!';

    await page.goto('/signup');
    await expect(page.locator('h2', { hasText: 'Create Account' })).toBeVisible({ timeout: 10000 });

    // Fill form
    await page.fill('#signup-name', 'Sign Up Driver');
    await page.fill('#signup-email', email);
    await page.fill('#signup-password', password);
    await page.fill('#signup-confirm-password', password);

    // Select role Winch Driver
    await page.selectOption('#signup-role', 'WINCH_DRIVER');

    // Role-specific fields are skipped for E2E `@test.com` emails, so we just click submit
    await page.click('#signup-submit');

    // Winch driver lands on dashboard/winch command view
    await expect(page.locator('h2', { hasText: 'Winch Command' })).toBeVisible({ timeout: 15000 });
  });

  test('should allow a workshop owner to sign up successfully via UI', async ({ page }) => {
    const email = `workshop_signup_${Date.now()}@test.com`;
    const password = 'Password123!';

    await page.goto('/signup');
    await expect(page.locator('h2', { hasText: 'Create Account' })).toBeVisible({ timeout: 10000 });

    // Fill form
    await page.fill('#signup-name', 'Sign Up Workshop');
    await page.fill('#signup-email', email);
    await page.fill('#signup-password', password);
    await page.fill('#signup-confirm-password', password);

    // Select role Workshop Owner
    await page.selectOption('#signup-role', 'WORKSHOP_OWNER');

    await page.click('#signup-submit');

    // Workshop owner lands on dashboard
    await expect(page.locator('text=Verified Partner')).toBeVisible({ timeout: 15000 });
  });
});
