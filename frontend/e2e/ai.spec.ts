import { test, expect } from '@playwright/test';

test('User can use AI Chat and trigger actions', async ({ page }) => {
  // Mock login so we don't get kicked out
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      json: {
        token: 'fake-jwt',
        user: { id: '1', email: 'test@example.com', role: 'USER', name: 'Test' }
      }
    });
  });

  // Mock initial dashboard requests
  await page.route('**/api/admin/dashboard', async (route) => {
    await route.fulfill({ json: { totalUsers: 0 } });
  });

  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'pass');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('http://localhost:5173/');

  // Open AI Chat
  await page.click('button[aria-label="AI Diagnostic"]');

  // Wait for the chat to be visible
  await expect(page.locator('.chat-messages')).toBeVisible();

  // Mock Gemini Response
  await page.route('**/api/gemini/diagnose', async (route) => {
    await route.fulfill({
      json: {
        reply: "It looks like your car has a dead battery. I can dispatch a winch for you.",
        action: "WINCH"
      }
    });
  });

  // Type message
  await page.fill('input[type="text"]', 'My car won\'t start');
  await page.click('button[aria-label="Send Message"]');

  // Verify the AI responds with the mocked text
  await expect(page.locator('text=It looks like your car has a dead battery. I can dispatch a winch for you.')).toBeVisible();

  // It should also have requested a winch, triggering a success notification or rendering the Winch UI
  await expect(page.locator('text=Requesting Winch...')).toBeVisible();
});
