import { test, expect } from '@playwright/test';

test.describe('Workshop Booking Flow (End to End)', () => {

  test('User can book an appointment, view in Recent Bookings, and Workshop Owner can Accept it', async ({ page }) => {
    // 1. User logs in
    await page.goto('http://localhost:3001');
    await page.fill('input[type="email"]', 'sara_h@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');

    // Verify user is logged in by checking for Profile tab
    await expect(page.locator('button:has-text("Profile")')).toBeVisible();

    // 2. User goes to Workshop Directory and selects a workshop
    await page.click('button:has-text("Repair") >> nth=0');
    await page.click('text=ProTech AutoWorks');
    
    // 3. User selects a time and books
    await expect(page.locator('h2', { hasText: 'ProTech AutoWorks' })).toBeVisible();
    await page.click('button:has-text("Book Appointment")');
    // Wait for checkout page to load
    await expect(page.locator('h2', { hasText: 'Checkout' })).toBeVisible({ timeout: 10000 });
    // Wait for time slots to finish loading (API fetch for booked slots)
    await expect(page.locator('text=Loading available slots...')).not.toBeVisible({ timeout: 8000 });
    // Select first available time slot (glass-panel button not disabled with AM/PM text)
    const timeSlot = page.locator('button.glass-panel:not([disabled])').filter({ hasText: /AM|PM/ }).first();
    await expect(timeSlot).toBeVisible({ timeout: 5000 });
    await timeSlot.scrollIntoViewIfNeeded();
    await timeSlot.click();
    // Payment is optional — Confirm Booking only requires a selected time slot
    // Click Confirm Booking (enabled once time slot is selected)
    const confirmBtn = page.locator('button:has-text("Confirm Booking")').first();
    await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
    await confirmBtn.scrollIntoViewIfNeeded();
    await confirmBtn.click(); // 4. Verify Success Screen
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
    await page.goto('http://localhost:3001/settings');
    await page.click('button:has-text("Sign Out")');
    await page.goto('http://localhost:3001/login');

    // 7. Workshop Owner Logs in
    await page.fill('input[type="email"]', 'hdhdjdd429@gamil.com'); // ProTech AutoWorks owner
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');

    // 8. Workshop Owner checks Incoming Appointments
    await expect(page.locator('h3:has-text("Incoming Appointments")')).toBeVisible();
    
    // They should see the Pending booking from Sara
    const incomingBooking = page.locator('div.glass-panel').filter({ hasText: 'Sara' }).filter({ hasText: 'Pending' }).first();
    await expect(incomingBooking).toBeVisible();

    // 9. Workshop Owner Clicks Accept
    await incomingBooking.locator('button:has-text("Accept")').click();

    // Wait for the UI to update to Confirmed (the card no longer has 'Pending' class/text, it has 'Confirmed')
    await page.waitForTimeout(2000);
    const confirmedCard = page.locator('div.glass-panel').filter({ hasText: 'Sara' }).filter({ hasText: 'Confirmed' }).first();
    await expect(confirmedCard.locator('button:has-text("Check In")')).toBeVisible();

    // 10. Logout and check User's Recent Bookings again
    await page.goto('http://localhost:3001/settings');
    await page.click('button:has-text("Sign Out")');
    await page.goto('http://localhost:3001/login');

    
    await page.fill('input[type="email"]', 'sara_h@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    
    await page.click('button:has-text("Profile")');
    
    // The booking should now be "Confirmed"
    const confirmedBooking = page.locator('div').filter({ hasText: 'ProTech AutoWorks' }).filter({ hasText: 'Confirmed' }).first();
    await expect(confirmedBooking).toBeVisible();
  });
});
