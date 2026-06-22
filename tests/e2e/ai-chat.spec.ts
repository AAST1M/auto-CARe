import { test, expect } from '@playwright/test';

test.describe('AI Chat Diagnoses E2E', () => {
  test('should allow user to chat with AI and receive diagnosis and emergency prompt', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for login page to load, then go to Sign Up
    await expect(page.locator('h2', { hasText: 'Welcome Back' })).toBeVisible({ timeout: 10000 });
    await page.click('a:has-text("Sign Up")');
    await expect(page.locator('h2', { hasText: 'Create Account' })).toBeVisible({ timeout: 10000 });

    const testEmail = `testuser_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`;
    await page.fill('input[placeholder="Full Name"]', 'Test Normal User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[placeholder^="Password"]', 'Password123!');
    await page.fill('input[placeholder="Confirm Password"]', 'Password123!');
    
    // Click Continue (Signup)
    await page.click('button:has-text("Continue")');

    // Wait for Dashboard
    await expect(page.locator('text=Core Services')).toBeVisible({ timeout: 10000 });

    // Open AI Chat
    await page.getByTestId('ai-chat-btn').click();

    // Verify AI Chat view is rendered
    await expect(page.getByPlaceholder('Describe the issue...')).toBeVisible();

    // ----------------------------------------------------
    // Scenario 1: Normal diagnostic without 'not moving'
    // ----------------------------------------------------
    const testMessage1 = 'My engine is making a strange clicking noise.';
    await page.getByPlaceholder('Describe the issue...').fill(testMessage1);
    await page.getByRole('button', { name: 'Send Message' }).click();

    // Wait for the user message to appear
    await expect(page.locator('text=' + testMessage1)).toBeVisible();

    // Wait for the simulated or real AI response to appear
    await expect(page.locator('div.glass-panel.text-slate-800').last()).toBeVisible({ timeout: 15000 });
    
    // Ensure "Request Emergency Winch" is NOT visible for this message
    await expect(page.getByRole('button', { name: 'Request Emergency Winch' })).not.toBeVisible();

    // ----------------------------------------------------
    // Scenario 2: Emergency diagnostic with 'not moving'
    // ----------------------------------------------------
    const testMessage2 = 'My car is not moving, I am stuck on the highway.';
    await page.getByPlaceholder('Describe the issue...').fill(testMessage2);
    await page.getByRole('button', { name: 'Send Message' }).click();

    // Wait for the user message to appear
    await expect(page.locator('text=' + testMessage2)).toBeVisible();

    // Wait for the simulated or real AI response to appear
    // We just wait for any new chat bubble to appear that is not from the user
    await expect(page.locator('div.glass-panel.text-slate-800').last()).toBeVisible({ timeout: 15000 });

    // Verify that the Winch emergency button DOES appear
    await expect(page.getByRole('button', { name: 'Request Emergency Winch' })).toBeVisible({ timeout: 10000 });

    // Click it to see if it correctly routes or opens the winch negotiation UI
    await page.getByRole('button', { name: 'Request Emergency Winch' }).click();

    await expect(page.locator('text=Locating drivers nearby...').or(page.locator('text=Request Winch'))).toBeVisible({ timeout: 10000 });
  });
});
