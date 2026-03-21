/**
 * E2E tests for 002-Resume_Download.
 * Covers UI-1, UI-3, UI-4, UI-6, UI-7, E2E-1, E2E-3.
 * Runs against the Vite dev server at http://localhost:5173.
 *
 * Note: E2E-2 (actual file download) requires a real PDF at
 * public/assets/resume/jean-paul-iraguha-resume.pdf — skipped if absent.
 */

import { test, expect } from "@playwright/test";
import { gotoAndHydrate } from "./helpers";
import { existsSync } from "fs";
import { join } from "path";

const RESUME_PATH = join(process.cwd(), "public/assets/resume/jean-paul-iraguha-resume.pdf");
const hasPdf = existsSync(RESUME_PATH);

// ---------------------------------------------------------------------------
// UI-1, E2E-1: Resume link visible in hero when path is set
// ---------------------------------------------------------------------------
test.describe("UI-1 / E2E-1: resume link in hero", () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndHydrate(page, "/");
  });

  test("resume link is visible in the hero social row", async ({ page }) => {
    const link = page.getByRole("link", { name: /download resume/i });
    await expect(link).toBeVisible();
  });

  // UI-3: download attribute
  test("resume link has the correct download attribute", async ({ page }) => {
    const link = page.getByRole("link", { name: /download resume/i });
    await expect(link).toHaveAttribute("download", "jean-paul-iraguha-resume.pdf");
  });

  // UI-4: tooltip via title
  test("resume link has title tooltip", async ({ page }) => {
    const link = page.getByRole("link", { name: /download resume/i });
    await expect(link).toHaveAttribute("title", "Download resume");
  });

  // UI-6: aria-label
  test("resume link has aria-label", async ({ page }) => {
    const link = page.getByRole("link", { name: /download resume/i });
    await expect(link).toHaveAttribute("aria-label", "Download resume as PDF");
  });

  // UI-6: icon is aria-hidden
  test("resume icon svg is aria-hidden", async ({ page }) => {
    const icon = page.locator('a[aria-label="Download resume as PDF"] svg');
    await expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  // Resume link is in the hero, not the nav
  test("resume link is inside the hero section", async ({ page }) => {
    const heroLink = page.locator("section a[aria-label='Download resume as PDF']");
    await expect(heroLink).toBeVisible();
  });

  test("resume link is NOT in the nav bar", async ({ page }) => {
    const navResumeLink = page.locator("nav a[aria-label='Download resume as PDF']");
    await expect(navResumeLink).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// E2E-2: Actual download (only when PDF exists)
// ---------------------------------------------------------------------------
test.describe("E2E-2: resume file download", () => {
  test(`download initiates when PDF exists ${hasPdf ? "" : "(SKIP — no PDF)"}`, async ({ page }) => {
    test.skip(!hasPdf, "No PDF at public/assets/resume/ — drop one to enable this test");

    await gotoAndHydrate(page, "/");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: /download resume/i }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("jean-paul-iraguha-resume.pdf");
  });
});
