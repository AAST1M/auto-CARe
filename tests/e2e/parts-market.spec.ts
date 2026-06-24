import { test, expect } from '@playwright/test';

test.describe('Spare Parts Market E2E', () => {
  test('should allow workshop owner to add a spare part with compatibility, and user to find and purchase it', async ({ browser }) => {
    
    // --- WORKSHOP OWNER CONTEXT ---
    const workshopContext = await browser.newContext();
    const workshopPage = await workshopContext.newPage();
    
    // Log console messages from browser
    workshopPage.on('console', msg => {
      console.log(`[WORKSHOP BROWSER]: ${msg.type().toUpperCase()}: ${msg.text()}`);
    });
    
    workshopPage.on('pageerror', err => {
      console.log(`[WORKSHOP ERROR]: ${err.message}`);
    });

    await workshopPage.goto('/');

    const workshopEmail = `workshop_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`;

    // Wait for login page, then go to Sign Up
    await expect(workshopPage.locator('h2', { hasText: 'Welcome Back' })).toBeVisible({ timeout: 10000 });
    await workshopPage.click('a:has-text("Sign Up")');
    await expect(workshopPage.locator('h2', { hasText: 'Create Account' })).toBeVisible({ timeout: 10000 });
    
    // Fill signup details using exact IDs
    await workshopPage.fill('#signup-name', 'E2E Workshop Owner');
    await workshopPage.fill('#signup-email', workshopEmail);
    await workshopPage.fill('#signup-password', 'Password123!');
    await workshopPage.fill('#signup-confirm-password', 'Password123!');
    await workshopPage.selectOption('#signup-role', 'WORKSHOP_OWNER');
    await workshopPage.click('#signup-submit');

    // Wait for Workshop Dashboard
    await expect(workshopPage.locator('text=Active Bookings')).toBeVisible({ timeout: 15000 });
    await expect(workshopPage.locator('text=Spare Parts Inventory')).toBeVisible({ timeout: 10000 });

    // Open add spare part modal
    await workshopPage.click('#open-add-part-modal-btn');
    await expect(workshopPage.locator('#add-part-modal')).toBeVisible({ timeout: 5000 });

    // Fill spare part form
    const partName = `E2E Brake Pads ${Date.now()}`;
    await workshopPage.fill('#new-part-name', partName);
    await workshopPage.selectOption('#new-part-category', 'Brakes');
    await workshopPage.fill('#new-part-price', '150');
    await workshopPage.fill('#new-part-stock', '10');
    await workshopPage.fill('#new-part-model', 'Honda Civic');
    await workshopPage.fill('#new-part-year-start', '2019');
    await workshopPage.fill('#new-part-year-end', '2022');

    // Submit form and wait for modal to close
    await workshopPage.click('#submit-new-part-btn');
    await expect(workshopPage.locator('#add-part-modal')).not.toBeVisible({ timeout: 10000 });

    // Close workshop owner session
    await workshopContext.close();

    // --- CUSTOMER CONTEXT ---
    const userContext = await browser.newContext();
    const userPage = await userContext.newPage();
    
    userPage.on('console', msg => {
      console.log(`[USER BROWSER]: ${msg.type().toUpperCase()}: ${msg.text()}`);
    });
    
    userPage.on('pageerror', err => {
      console.log(`[USER ERROR]: ${err.message}`);
    });

    await userPage.goto('/');

    const userEmail = `user_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`;

    // Wait for login page, then go to Sign Up
    await expect(userPage.locator('h2', { hasText: 'Welcome Back' })).toBeVisible({ timeout: 10000 });
    await userPage.click('a:has-text("Sign Up")');
    await expect(userPage.locator('h2', { hasText: 'Create Account' })).toBeVisible({ timeout: 10000 });
    
    // Fill signup details using exact IDs
    await userPage.fill('#signup-name', 'E2E Customer');
    await userPage.fill('#signup-email', userEmail);
    await userPage.fill('#signup-password', 'Password123!');
    await userPage.fill('#signup-confirm-password', 'Password123!');
    await userPage.selectOption('#signup-role', 'USER');
    await userPage.click('#signup-submit');

    // Wait for User Dashboard
    await expect(userPage.locator('text=Core Services')).toBeVisible({ timeout: 15000 });

    // Top up wallet balance of E2E Customer to 1000 EGP so they can afford the purchase
    await userPage.evaluate(async () => {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5001/api/auth/wallet/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: 1000 })
      });
    });

    // Reload user page to fetch updated user wallet details
    await userPage.reload();
    await expect(userPage.locator('text=Core Services')).toBeVisible({ timeout: 15000 });

    // Navigate to Spare Parts Market
    await userPage.click('text=Spare Parts Market');

    // Search and filter parts compatibility
    await userPage.fill('#part-search-input', partName);
    await userPage.fill('#part-model-filter', 'Honda Civic');
    await userPage.fill('#part-year-filter', '2020');

    // Verify the listed compatible part is visible
    await expect(userPage.locator(`text=${partName}`)).toBeVisible({ timeout: 10000 });
    await expect(userPage.locator('text=Fits: Honda Civic (2019-2022)').first()).toBeVisible();

    // Click Buy button on the part card
    await userPage.locator('button[aria-label="Buy"]').first().click();
    await expect(userPage.locator('#purchase-modal')).toBeVisible({ timeout: 5000 });

    // Adjust quantity to 2
    await userPage.click('#increase-qty-btn');
    await expect(userPage.locator('#order-qty-display')).toHaveText('2');
    await expect(userPage.locator('#total-price-display')).toHaveText('300 EGP');

    // Confirm purchase
    await userPage.click('#confirm-purchase-btn');

    // Wait for the modal to disappear after successful order
    await expect(userPage.locator('#purchase-modal')).not.toBeVisible({ timeout: 10000 });

    // Verify user wallet balance deducted (1000 - 300 = 700 EGP)
    await expect(userPage.locator('#user-wallet-display')).toHaveText('Wallet: 700 EGP', { timeout: 10000 });

    await userContext.close();
  });
});
