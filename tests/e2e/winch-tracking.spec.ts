import { test, expect } from '@playwright/test';

test.describe('Winch Tracking E2E', () => {
  test('should allow customer to request winch, driver to accept, negotiate, track live locations, cancel/complete sequential steps, pay, and view details', async ({ browser, request }) => {
    
    // --- 1. PROVISION TEST ACCOUNTS ---
    const driverEmail = `winch_driver_${Date.now()}@test.com`;
    const userEmail = `winch_user_${Date.now()}@test.com`;
    const password = 'Password123!';

    // Register Winch Driver
    const regDriver = await request.post('http://127.0.0.1:5001/api/auth/register', {
      data: {
        name: 'Super Towing',
        email: driverEmail,
        password: password,
        role: 'WINCH_DRIVER'
      }
    });
    expect(regDriver.ok()).toBeTruthy();

    // Register Normal User
    const regUser = await request.post('http://127.0.0.1:5001/api/auth/register', {
      data: {
        name: 'Stuck Customer',
        email: userEmail,
        password: password,
        role: 'USER'
      }
    });
    expect(regUser.ok()).toBeTruthy();

    // --- 2. DRIVER CONTEXT ---
    const driverContext = await browser.newContext();
    const driverPage = await driverContext.newPage();
    
    // Setup mock geolocation for the driver (Cairo Center)
    await driverContext.setGeolocation({ latitude: 30.0500, longitude: 31.2400 });
    await driverContext.grantPermissions(['geolocation']);

    await driverPage.goto('/');
    await expect(driverPage.locator('h2', { hasText: 'Welcome Back' })).toBeVisible({ timeout: 10000 });
    
    await driverPage.fill('input[type="email"]', driverEmail);
    await driverPage.fill('input[type="password"]', password);
    await driverPage.click('button:has-text("Sign In")');

    // Verify driver dashboard loads
    await expect(driverPage.locator('h2', { hasText: 'Winch Command' })).toBeVisible({ timeout: 10000 });
    
    // Go Online
    await driverPage.locator('div').filter({ has: driverPage.locator('text=Offline') }).locator('.w-14.h-8').click();
    await expect(driverPage.locator('text=Online').first()).toBeVisible();
    await expect(driverPage.locator('text=Searching for requests...')).toBeVisible();

    // --- 3. CUSTOMER CONTEXT ---
    const userContext = await browser.newContext();
    const userPage = await userContext.newPage();

    // Setup mock geolocation for the customer (Cairo outskirts - 500m away)
    await userContext.setGeolocation({ latitude: 30.0450, longitude: 31.2350 });
    await userContext.grantPermissions(['geolocation']);

    await userPage.goto('/');
    await expect(userPage.locator('h2', { hasText: 'Welcome Back' })).toBeVisible({ timeout: 10000 });

    await userPage.fill('input[type="email"]', userEmail);
    await userPage.fill('input[type="password"]', password);
    await userPage.click('button:has-text("Sign In")');

    // Verify user dashboard loads
    await expect(userPage.locator('text=Core Services')).toBeVisible({ timeout: 10000 });

    // Click Winch service
    await userPage.click('text=Winch');

    // Wait for negotiation/map setup page
    await expect(userPage.locator('h3', { hasText: 'Request Winch' })).toBeVisible({ timeout: 10000 });

    // Select locations
    // Click auto-detect button to set Pickup Location
    await userPage.click('button[aria-label="Auto-detect current location"]');
    
    // Select Dropoff Location
    await userPage.click('text=Dropoff Location');
    
    // Click auto-detect button again to set Dropoff Location
    await userPage.click('button[aria-label="Auto-detect current location"]');

    // Locate driver
    await userPage.click('button:has-text("Find Winch Drivers")');

    // Verify driver appears in customer active list
    await expect(userPage.locator('text=Super Towing')).toBeVisible({ timeout: 10000 });

    // Click Accept on customer side
    await userPage.click('button:has-text("Accept")');

    // --- 4. DRIVER REVIEW AND PRICE NEGOTIATION ---
    // Bring driver back to focus, check request review screen with interactive map
    await expect(driverPage.locator('h2', { hasText: 'Incoming Request' })).toBeVisible({ timeout: 15000 });
    
    // Increase price by clicking '+'
    const initialPriceText = await driverPage.locator('span.text-cyber-primary.text-lg').innerText();
    const initialPrice = parseInt(initialPriceText.split(' ')[0]);
    await driverPage.click('button:has-text("+")');
    
    const increasedPriceText = await driverPage.locator('span.text-cyber-primary.text-lg').innerText();
    const increasedPrice = parseInt(increasedPriceText.split(' ')[0]);
    expect(increasedPrice).toBe(initialPrice + 50);

    // Accept request at the negotiated price
    await driverPage.click('button:has-text("Accept")');

    // --- 5. VERIFY LIVE NAVIGATION & CANCELLATION BUTTON STATE ---
    // Both pages should transition to live navigation map
    await expect(driverPage.locator('h2', { hasText: 'Live Navigation' })).toBeVisible({ timeout: 15000 });
    await expect(userPage.locator('h2', { hasText: 'Live Tracking' })).toBeVisible({ timeout: 15000 });

    // Customer cancellation button is active
    await expect(userPage.locator('button:has-text("Cancel Booking")')).toBeVisible();

    // --- 6. SEQUENTIAL CONFIRMATION STEPS ---
    // Driver: Arrived at Customer (Point A)
    await driverPage.click('button:has-text("Arrived at Customer")');
    await expect(driverPage.locator('p.text-cyber-primary', { hasText: 'Arrived' })).toBeVisible();

    // Driver: Pickup Done
    await driverPage.click('button:has-text("Pickup Done")');
    await expect(driverPage.locator('p.text-cyber-primary', { hasText: 'In Progress' })).toBeVisible();

    // Customer cancel button should be hidden because status is now In Progress
    await expect(userPage.locator('button:has-text("Cancel Booking")')).not.toBeVisible();

    // Driver: Complete Trip
    await driverPage.click('button:has-text("Complete Trip")');
    await expect(driverPage.locator('text=Waiting for customer payment to complete booking').first()).toBeVisible();

    // --- 7. PAYMENT FLOW & INVOICE ---
    // Customer sees Trip Invoice modal
    await expect(userPage.locator('h3', { hasText: 'Trip Invoice' })).toBeVisible({ timeout: 10000 });
    
    // Select Cash payment
    await userPage.click('text=Cash payment');
    await userPage.click('button:has-text("Confirm and Pay")');

    // Customer sees success receipt details
    await expect(userPage.locator('h3', { hasText: 'Tow Completed' })).toBeVisible({ timeout: 10000 });
    await userPage.click('button:has-text("Done")');

    // Driver sees trip earnings summary
    await expect(driverPage.locator('h3', { hasText: 'Trip Completed!' })).toBeVisible({ timeout: 10000 });
    await driverPage.click('button:has-text("Back to Dashboard")');

    // Both should safely return to their dashboards
    await expect(driverPage.locator('h2', { hasText: 'Winch Command' })).toBeVisible({ timeout: 10000 });
    await expect(userPage.locator('text=Core Services')).toBeVisible({ timeout: 10000 });

    // Close sessions
    await userContext.close();
    await driverContext.close();
  });
});
