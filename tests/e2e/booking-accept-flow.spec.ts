import { test, expect } from '@playwright/test';

test.describe('Workshop Booking Flow (End to End)', () => {

  test('User can book an appointment, view in Recent Bookings, and Workshop Owner can Accept it', async ({ page }) => {
    // 1. User logs in
    await page.goto('http://localhost:3001');
    await page.fill('input[type="email"]', 'sara_h@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');

    // Verify user is logged in by checking for Profile tab
    await expect(page.locator('button:has-text("Profile")')).toBeVisible();

    // 2. User goes to Workshop Directory and selects a workshop
    await page.click('button:has-text("Workshops")');
    await page.click('h3:has-text("ProTech AutoWorks")');
    
    // 3. User selects a time and books
    await expect(page.locator('h2:has-text("ProTech AutoWorks")')).toBeVisible();
    await page.locator('button:not([disabled])').filter({ hasText: /AM|PM/ }).first().click();
    
    // Select Visa payment
    await page.locator('div:has-text("Visa / Mastercard")').last().click();
    
    // Click Confirm Booking
    await page.click('button:has-text("Confirm Booking")');

    // 4. Verify Success Screen
    await expect(page.locator('h2:has-text("Booking Confirmed!")')).toBeVisible({ timeout: 10000 });
    
    // 5. User checks Recent Bookings
    await page.click('button:has-text("View My Bookings")');
    await expect(page.locator('h4:has-text("Recent Bookings")')).toBeVisible();
    
    // Wait for the booking list to update
    await page.waitForTimeout(2000);
    
    // There should be a "Pending" booking for ProTech AutoWorks
    const pendingBooking = page.locator('div').filter({ hasText: 'ProTech AutoWorks' }).filter({ hasText: 'Pending' }).first();
    await expect(pendingBooking).toBeVisible();

    // 6. User Logs out
    await page.click('button:has-text("Logout")');

    // 7. Workshop Owner Logs in
    await page.fill('input[type="email"]', 'hdhdjdd429@gamil.com'); // ProTech AutoWorks owner
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');

    // 8. Workshop Owner checks Incoming Appointments
    await expect(page.locator('h3:has-text("Incoming Appointments")')).toBeVisible();
    
    // They should see the Pending booking from Sara
    const incomingBooking = page.locator('div.glass-panel').filter({ hasText: 'Sara' }).filter({ hasText: 'Pending' }).first();
    await expect(incomingBooking).toBeVisible();

    // 9. Workshop Owner Clicks Accept
    await incomingBooking.locator('button:has-text("Accept")').click();

    // Wait for the UI to update to Confirmed
    await page.waitForTimeout(2000);
    await expect(incomingBooking.locator('button:has-text("Check In")')).toBeVisible();

    // 10. Logout and check User's Recent Bookings again
    await page.click('button:has-text("Account")');
    await page.click('button:has-text("Logout")');
    
    await page.fill('input[type="email"]', 'sara_h@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    
    await page.click('button:has-text("Profile")');
    
    // The booking should now be "Confirmed"
    const confirmedBooking = page.locator('div').filter({ hasText: 'ProTech AutoWorks' }).filter({ hasText: 'Confirmed' }).first();
    await expect(confirmedBooking).toBeVisible();
  });
});
