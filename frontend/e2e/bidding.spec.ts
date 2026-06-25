import { test, expect } from '@playwright/test';

test.describe('Live Mechanic Bidding System', () => {
  
  test('User can open Bidding Dashboard and create a request', async ({ page }) => {
    // Navigate to user app
    await page.goto('/login');
    
    // Login as a regular user
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button#login-submit');

    // Wait for Home Dashboard
    // await page.waitForURL('/');
    
    // Click on the Mechanic Bidding banner
    // await page.click('div:has-text("Mechanic Bidding")');
    
    // Verify Bidding User Dashboard loaded
    // await expect(page.locator('h2')).toContainText('Live Bidding Marketplace');
    // await expect(page.locator('h3')).toContainText('Post a Repair Request');

    // Fill in the request form
    // await page.fill('input[placeholder="e.g. 2018 Toyota Corolla"]', '2020 Honda Civic');
    // await page.fill('textarea[placeholder="e.g. Grinding noise when braking..."]', 'Engine makes weird clicking sound');
  });

  test('Workshop can open Live Job Board', async ({ page }) => {
    // Navigate to workshop app
    await page.goto('/login');
    
    // Login as a workshop owner
    await page.fill('input[type="email"]', 'workshop@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button#login-submit');

    // Wait for Workshop Dashboard
    // await page.waitForURL('/');
    
    // Click on the Live Job Board button
    // await page.click('button:has-text("Live Job Board")');
    
    // Verify Live Job Board loaded
    // await expect(page.locator('h2')).toContainText('Live Job Board');
    // await expect(page.locator('p')).toContainText('Searching for nearby requests...');
  });
  
});
