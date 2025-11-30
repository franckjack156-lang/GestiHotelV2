import { test, expect } from '@playwright/test';

/**
 * Smoke tests - Basic health checks for the application
 */

test.describe('Smoke Tests', () => {
  test('app should load successfully', async ({ page }) => {
    await page.goto('/');

    // The page should load without errors
    await expect(page).toHaveTitle(/GestiHotel/i);
  });

  test('login page should be accessible', async ({ page }) => {
    await page.goto('/login');

    // Should see login form elements
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({
      timeout: 10000,
    });
  });
});
