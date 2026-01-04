import { test, expect } from "@playwright/test";

/**
 * Smoke Tests
 *
 * Quick health checks that run after every staging deployment.
 * These should be fast (<30s total) and verify critical paths work.
 */

test.describe("Smoke Tests", () => {
  test("homepage loads successfully", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });

  test("homepage has correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/PropOwl/i);
  });

  test("login page is accessible", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response?.status()).toBe(200);
  });

  test("signup page is accessible", async ({ page }) => {
    const response = await page.goto("/signup");
    expect(response?.status()).toBe(200);
  });

  test("API health check", async ({ request, baseURL }) => {
    // Basic API availability check
    const response = await request.get(`${baseURL}/api/auth/providers`);
    expect(response.status()).toBe(200);
  });
});
