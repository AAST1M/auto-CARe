import { test, expect } from '@playwright/test';

test.describe('Bidding System E2E', () => {
  test('should allow user to post repair request and workshop to bid on it', async ({ browser }) => {
    
    // --- USER CONTEXT ---
    const userContext = await browser.newContext();
    const userPage = await userContext.newPage();
    await userPage.goto('/');

    const userEmail = `user_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`;

    // Wait for login page to load, then go to Sign Up
    await expect(userPage.locator('h2', { hasText: 'Welcome Back' })).toBeVisible({ timeout: 10000 });
    await userPage.click('a:has-text("Sign Up")');
    await expect(userPage.locator('h2', { hasText: 'Create Account' })).toBeVisible({ timeout: 10000 });
    await userPage.fill('#signup-name', 'Test Normal User');
    await userPage.fill('#signup-email', userEmail);
    await userPage.fill('#signup-password', 'Password123!');
    await userPage.fill('#signup-confirm-password', 'Password123!');
    await userPage.click('#signup-submit');

    // Wait for User Dashboard
    await expect(userPage.locator('text=Core Services')).toBeVisible({ timeout: 10000 });

    // Navigate to Live Bidding Marketplace
    await userPage.click('text=Mechanic Bidding');
    
    // Wait for the Bidding page to load
    await expect(userPage.locator('h3', { hasText: 'Post a Repair Request' })).toBeVisible();

    // Post a request
    const testCar = `2020 Honda Civic ${Date.now()}`;
    await userPage.fill('[placeholder="e.g. 2018 Toyota Corolla"]', testCar);
    await userPage.fill('textarea[placeholder="e.g. Grinding noise when braking..."]', 'Engine is making a loud ticking noise.');
    await userPage.click('button:has-text("Broadcast to Mechanics")');

    // Wait for success screen on user side
    await expect(userPage.locator('h3', { hasText: 'Your Request is Live!' })).toBeVisible({ timeout: 5000 });

    // --- WORKSHOP CONTEXT ---
    // In a real E2E, we'd sign up a workshop owner and create a workshop profile.
    // Assuming we can create one via normal signup by selecting a role, or we just rely on the fallback / existing seeded workshop owner.
    // For this simple test structure, we'll just verify the user side succeeded broadcasting. 
    const workshopContext = await browser.newContext();
    const workshopPage = await workshopContext.newPage();
    await workshopPage.goto('/');

    const workshopEmail = `workshop_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`;

    // Wait for login page to load, then go to Sign Up
    await expect(workshopPage.locator('h2', { hasText: 'Welcome Back' })).toBeVisible({ timeout: 10000 });
    await workshopPage.click('a:has-text("Sign Up")');
    await expect(workshopPage.locator('h2', { hasText: 'Create Account' })).toBeVisible({ timeout: 10000 });
    await workshopPage.fill('#signup-name', 'Test Workshop Owner');
    await workshopPage.fill('#signup-email', workshopEmail);
    await workshopPage.fill('#signup-password', 'Password123!');
    await workshopPage.fill('#signup-confirm-password', 'Password123!');
    await workshopPage.selectOption('#signup-role', 'WORKSHOP_OWNER');
    await workshopPage.click('#signup-submit');

    // Wait for Workshop Dashboard to load
    await expect(workshopPage.locator('text=Verified Partner')).toBeVisible({ timeout: 15000 });
    
    // Navigate to Live Job Board
    await workshopPage.click('text=Live Job Board');
    
    // Verify we are on Live Job Board
    await expect(workshopPage.locator('h2', { hasText: 'Live Job Board' })).toBeVisible({ timeout: 10000 });
    
    // See the user's request
    await expect(workshopPage.locator('text=' + testCar)).toBeVisible({ timeout: 10000 });
    
    // Click Submit Bid
    await workshopPage.click(`text=Submit a Bid`);
    
    // Fill the bid form in the modal
    await workshopPage.fill('[placeholder="e.g. 1500"]', '2500');
    await workshopPage.fill('[placeholder="e.g. Can fix it in 2 hours"]', 'We can do it today.');
    await workshopPage.click('button:has-text("Place Bid")');
    
    // Verify bid submitted (modal closes, or some success alert, or just rely on user side receiving it)
    // The alert is standard window.alert, Playwright auto-dismisses alerts but we can catch them if needed.
    // We just wait a bit for the websocket event to reach the user.
    
    // --- USER CONTEXT VERIFICATION ---
    // Go back to User and verify the bid appeared
    await expect(userPage.locator('text=2500')).toBeVisible({ timeout: 10000 });
    await expect(userPage.locator('text=We can do it today.')).toBeVisible();
    
    // Accept bid
    await userPage.click('button:has-text("Accept this Bid")');
    
    // Verify it accepted (e.g. returns to normal dashboard or shows alert)
    await expect(userPage.locator('text=Core Services')).toBeVisible({ timeout: 10000 });
    
    await userContext.close();
    await workshopContext.close();
  });
});
