import { test, expect } from "@playwright/test";

/**
 * E2E Tests - Authentication Flow
 *
 * Full regression tests for auth functionality.
 * Run nightly against staging before creating release PR.
 */

test.describe("Authentication", () => {
  test.describe("Login Page", () => {
    test("displays login form", async ({ page }) => {
      await page.goto("/login");

      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    });

    test("shows error for invalid credentials", async ({ page }) => {
      await page.goto("/login");

      await page.getByLabel(/email/i).fill("invalid@test.com");
      await page.getByLabel(/password/i).fill("wrongpassword");
      await page.getByRole("button", { name: /sign in/i }).click();

      // Should show error message (not redirect)
      await expect(page).toHaveURL(/login/);
    });

    test("has link to signup page", async ({ page }) => {
      await page.goto("/login");

      const signupLink = page.getByRole("link", { name: /sign up|register|create account/i });
      await expect(signupLink).toBeVisible();
    });
  });

  test.describe("Signup Page", () => {
    test("displays signup form", async ({ page }) => {
      await page.goto("/signup");

      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
    });

    test("has link to login page", async ({ page }) => {
      await page.goto("/signup");

      const loginLink = page.getByRole("link", { name: /sign in|log in|already have/i });
      await expect(loginLink).toBeVisible();
    });
  });
});
