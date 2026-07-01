import { test, expect } from '@playwright/test';

test.describe('Upcoming Appointment Card on Home View', () => {

  test('User can see their upcoming appointment on the Home screen after booking', async ({ page }) => {
    // 1. Log in as test user
    await page.goto('http://localhost:3001');
    await page.fill('input[type="email"]', 'sara_h@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');

    // Wait for the Profile view (default landing for users)
    await expect(page.locator('button:has-text("Profile")')).toBeVisible();

    // 2. Go to Workshops and book an appointment
    await page.click('button:has-text("Repair")');
    await page.click('h3:has-text("Al-Ahlia Mechanics")');
    
    // Open booking modal
    await expect(page.locator('h2:has-text("Al-Ahlia Mechanics")')).toBeVisible();
    await page.click('button:has-text("Book Appointment")');
    await page.locator('button:not([disabled])').filter({ hasText: /AM|PM/ }).first().click();
    
    // Select Visa payment and Confirm
    await page.locator('div:has-text("Visa **** 4242")').last().click();
    await page.click('button:has-text("Confirm Booking")');

    // Wait for success screen
    await expect(page.locator('h2:has-text("Booking Confirmed!")')).toBeVisible({ timeout: 10000 });
    
    // 3. Navigate to Home
    // From Success screen, click "Back to Home"
    await page.click('button:has-text("Back to Home")');
    
    // Refresh the page to sync the frontend state with the newly created booking
    await page.reload();

    // 4. Verify the Upcoming Appointment card is visible
    await expect(page.locator('h3:has-text("Upcoming Appointment")')).toBeVisible();
    
    // The workshop name should be visible inside the card
    await expect(page.locator('h4:has-text("Al-Ahlia Mechanics")').first()).toBeVisible();

    // 5. Click "View Details" and verify the modal opens
    await page.click('button:has-text("View Details")');
    
    // The modal should display the booking details title
    await expect(page.locator('h2:has-text("Booking Details")')).toBeVisible();
    
    // And it should mention Al-Ahlia Mechanics
    await expect(page.locator('h3:has-text("Al-Ahlia Mechanics")').last()).toBeVisible();
    
    // Close the modal
    await page.click('button[aria-label="Close"]');
    
    // Verify the modal is closed
    await expect(page.locator('h2:has-text("Booking Details")')).toBeHidden();
  });
});
