import { test, expect } from '@playwright/test';

test.describe('Workshop Dashboard E2E', () => {
  test('should allow workshop owner to manage appointments and view dashboard', async ({ page }) => {
    // Mock appointments list to return Ahmed Ali
    await page.route('**/api/workshops/appointments', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'a1',
            user: { name: 'Ahmed Ali' },
            carDetails: 'BMW 320i',
            serviceType: 'Oil Change',
            time: '10:00 AM',
            status: 'Pending',
            price: 1200
          }
        ])
      });
    });

    // Mock appointment accept status update
    await page.route('**/api/workshops/appointments/a1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'a1',
          status: 'Confirmed'
        })
      });
    });

    await page.goto('/');

    const workshopEmail = `workshop_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`;

    // Wait for login page to load, then go to Sign Up
    await expect(page.locator('h2', { hasText: 'Welcome Back' })).toBeVisible({ timeout: 10000 });
    await page.click('a:has-text("Sign Up")');
    await expect(page.locator('h2', { hasText: 'Create Account' })).toBeVisible({ timeout: 10000 });
    
    // Fill out signup form
    await page.fill('#signup-name', 'Test Workshop Owner');
    await page.fill('#signup-email', workshopEmail);
    await page.fill('#signup-password', 'Password123!');
    await page.fill('#signup-confirm-password', 'Password123!');
    
    // Select Workshop Owner Role
    await page.selectOption('#signup-role', 'WORKSHOP_OWNER');
    
    // Submit
    await page.click('#signup-submit');

    // Wait to reach the Workshop Dashboard (it redirects straight here after successful signup)
    // Note: The backend logic creates the user and token, then the frontend logic redirects to WORKSHOP_DASHBOARD based on user role.
    await expect(page.locator('text=Active Bookings')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Incoming Appointments')).toBeVisible();

    // Verify mock appointments are visible
    await expect(page.locator('text=Ahmed Ali')).toBeVisible();
    await expect(page.locator('text=Pending').first()).toBeVisible();

    // Click Accept for Ahmed Ali (first pending appointment)
    await page.getByRole('button', { name: 'Accept' }).first().click();

    // Verify status changes and "Check In" button is now visible
    // "Ahmed Ali" is the first one, let's verify its Check In button
    // It should now have "Check In" instead of "Accept"
    await expect(page.locator('div').filter({ hasText: 'Ahmed Ali' }).getByRole('button', { name: 'Check In' }).first()).toBeVisible({ timeout: 5000 });

    // Verify "Live Job Board" exists and works
    await page.click('text=Live Job Board');

    // Should navigate to Live Job Board (Bidding Workshop View)
    await expect(page.locator('h2', { hasText: 'Live Job Board' })).toBeVisible();
  });
});
