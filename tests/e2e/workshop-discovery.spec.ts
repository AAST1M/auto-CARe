import { test, expect } from '@playwright/test';

test.describe('Workshop Discovery', () => {
  test('should allow user to view and filter workshops', async ({ page }) => {
    await page.goto('/');

    // Assuming there's a switch to login or signup. 
    // We'll mock the login or just navigate if it's open.
    // If there is an Email input, fill it.
    // Actually we can create a new user or use existing.
    // Let's create a test user first:
    const testEmail = `testuser_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`;
    
    // Wait for login page to load, then go to Sign Up
    await expect(page.locator('h2', { hasText: 'Welcome Back' })).toBeVisible({ timeout: 10000 });
    await page.click('a:has-text("Sign Up")');
    await expect(page.locator('h2', { hasText: 'Create Account' })).toBeVisible({ timeout: 10000 });
    await page.fill('input[placeholder="Full Name"]', 'Test Normal User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[placeholder^="Password"]', 'Password123!');
    await page.fill('input[placeholder="Confirm Password"]', 'Password123!');
    await page.click('button:has-text("Continue")');

    // Wait to reach the Dashboard
    await expect(page.locator('text=Core Services')).toBeVisible({ timeout: 10000 });

    // Navigate to Workshop Discovery
    await page.getByTestId('repair-btn').click();

    // Wait for Workshop List page
    await expect(page.locator('h2', { hasText: 'Find Workshop' })).toBeVisible();

    // Verify some workshops are rendered (either dummy or real)
    // The list has img tags, so let's wait for at least one image or a specific workshop name
    await expect(page.locator('img').first()).toBeVisible();

    // Test Search Filter
    await page.fill('[placeholder="Search name or service..."]', 'Al-Ahlia');
    
    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Click on the first workshop card
    await page.locator('img').first().click();

    // Should open Workshop Detail
    await expect(page.locator('button[aria-label="Go Back"]')).toBeVisible();

    // Click on Book Appointment
    await page.getByRole('button', { name: 'Book Appointment' }).click({ force: true });

    // Expect to be on Checkout view
    await expect(page.locator('h2', { hasText: 'Checkout' })).toBeVisible();

    // Select Date (e.g. index 2 -> Wed 14)
    await page.locator('button:has-text("14")').click();

    // Assert Confirm Booking is disabled before time is selected
    const confirmBtn = page.getByRole('button', { name: 'Confirm Booking' });
    await expect(confirmBtn).toBeDisabled();

    // Select Time Slot (First available)
    await page.locator('button:not([disabled])').filter({ hasText: /AM|PM/ }).first().click();

    // Assert Confirm Booking is now enabled
    await expect(confirmBtn).toBeEnabled();

    // Select Payment Method Visa
    // The Visa radio button might just be clicked via its text
    await page.locator('div:has-text("Visa")').last().click();

    // Confirm Booking
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    // Verify Success View
    await expect(page.locator('h2', { hasText: 'Booking Confirmed!' })).toBeVisible({ timeout: 10000 });

    // Verify we can go to Profile (View My Bookings)
    await page.getByRole('button', { name: 'View My Bookings' }).click();

    // Verify we are on Profile view
    await expect(page.locator('h2', { hasText: 'My Profile' })).toBeVisible({ timeout: 5000 });
  });
});
