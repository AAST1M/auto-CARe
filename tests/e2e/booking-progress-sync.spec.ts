import { test, expect } from '@playwright/test';

test.describe('Booking and Progress Synchronization', () => {
  test('User books appointment and workshop owner updates progress', async ({ browser }) => {
    // We will use two separate browser contexts to simulate User and Workshop Owner simultaneously
    const userContext = await browser.newContext();
    const workshopContext = await browser.newContext();

    const userPage = await userContext.newPage();
    const workshopPage = await workshopContext.newPage();

    // 1. User logs in
    await userPage.goto('http://localhost:3001/login');
    await userPage.fill('input[type="email"]', 'sara_h@example.com');
    await userPage.fill('input[type="password"]', 'Password123!');
    await userPage.click('button:has-text("Sign In")');
    await expect(userPage.locator('h2:has-text("My Profile")').or(userPage.locator('button:has-text("Repair")').first())).toBeVisible({ timeout: 10000 });

    // Ensure we are on home
    const homeBtn = userPage.locator('button:has-text("Home")').first();
    if (await homeBtn.isVisible()) {
      await homeBtn.click();
    }

    // 2. User books an appointment
    await userPage.click('button:has-text("Repair") >> nth=0'); // Go to directory
    // Find Velocity Car Care (or the one owned by hdhdjdd429@gamil.com)
    await userPage.click('h3:has-text("Velocity Car Care")');
    await userPage.click('button:has-text("Book Appointment")');
    // Select a time
    const timeBtn = userPage.locator('button.glass-panel:not(.cursor-not-allowed)').filter({ hasText: /AM|PM/ }).first();
    await timeBtn.click();
    await userPage.click('button:has-text("Confirm Booking")');
    // Wait for success screen
    await expect(userPage.locator('h2:has-text("Booking Confirmed!")')).toBeVisible({ timeout: 10000 });
    await userPage.click('button:has-text("Back to Home")');

    // 3. Workshop Owner logs in
    await workshopPage.goto('http://localhost:3001/login');
    await workshopPage.fill('input[type="email"]', 'hdhdjdd429@gamil.com');
    await workshopPage.fill('input[type="password"]', 'Password123!');
    await workshopPage.click('button:has-text("Sign In")');
    
    // Wait for workshop dashboard to load
    await expect(workshopPage.locator('h2', { hasText: /Velocity Car Care|My Workshop/ })).toBeVisible({ timeout: 10000 });

    // 4. Workshop Owner accepts and checks in
    // There should be an active booking for Sara H.
    const acceptBtn = workshopPage.locator('button:has-text("Accept")').first();
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
      await workshopPage.waitForTimeout(1000);
    }

    const checkInBtn = workshopPage.locator('button:has-text("Check-In")').first();
    if (await checkInBtn.isVisible()) {
      await checkInBtn.click();
      await workshopPage.waitForTimeout(1000);
    }

    // 5. Workshop Owner updates progress
    const startRepairBtn = workshopPage.locator('button:has-text("Start Repair")').first();
    await expect(startRepairBtn).toBeVisible();
    await startRepairBtn.click();
    await workshopPage.waitForTimeout(2000); // Give it time to patch

    // 6. User verifies progress on their end
    // Log out and log back in to fetch new appointments
    await userPage.click('button:has-text("Profile")');
    await userPage.click('button:has-text("Sign Out")');
    await userPage.fill('input[type="email"]', 'sara_h@example.com');
    await userPage.fill('input[type="password"]', 'Password123!');
    await userPage.click('button:has-text("Sign In")');
    
    // Wait for the app to initialize
    await expect(userPage.locator('h2:has-text("My Profile")').or(userPage.locator('button:has-text("Repair")').first())).toBeVisible({ timeout: 10000 });
    
    // Click Home tab
    const homeBtnEnd = userPage.locator('button:has-text("Home")').first();
    await homeBtnEnd.click();

    try {
      // Verify the "Upcoming Appointment" section has progress
      await expect(userPage.locator('h3:has-text("Upcoming Appointment")')).toBeVisible({ timeout: 10000 });
      
      // Check if progress text "25%" and "Live Progress" is visible
      await expect(userPage.locator('span:has-text("Live Progress")')).toBeVisible();
      await expect(userPage.locator('span:has-text("25%")')).toBeVisible();
    } catch (e) {
      console.log('--- USER PAGE DOM ON FAILURE ---');
      console.log(await userPage.content());
      throw e;
    }

    // Check profile recent bookings as well
    await userPage.click('button:has-text("Profile")');
    await expect(userPage.locator('h4:has-text("Recent Bookings")')).toBeVisible();
    await expect(userPage.locator('span:has-text("Progress")').first()).toBeVisible();
    await expect(userPage.locator('span:has-text("25%")').first()).toBeVisible();

    // Close contexts
    await userContext.close();
    await workshopContext.close();
  });
});
