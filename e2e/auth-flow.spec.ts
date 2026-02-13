import { test, expect } from '@playwright/test';

// Placeholder E2E auth flow tests
// These require a running Supabase instance and will be fleshed out
// when the E2E test infrastructure is configured.

test.describe('Auth Flow', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('signup page renders with COPPA date field', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
  });

  test('unauthenticated user is redirected from /settings to /login', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login/);
  });
});
