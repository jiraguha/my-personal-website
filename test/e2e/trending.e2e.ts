/**
 * E2E tests for 005-trending-tags.
 * Covers E2E-1 through E2E-4.
 * Runs against the Vite dev server at http://localhost:5173.
 *
 * Relies on the sample content in src/content/posts/ having ≥ 3 unique tags.
 */

import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// E2E-1: — TRENDING — section is visible on the home page
// ---------------------------------------------------------------------------
test.describe("E2E-1: Trending section visible", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("the TRENDING divider label is visible", async ({ page }) => {
    await expect(page.getByText("Trending")).toBeVisible();
  });

  test("trending section contains at least one chip", async ({ page }) => {
    const chips = page.locator("section[aria-label='Trending tags'] a");
    await expect(chips.first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// E2E-2: Chips show # prefix and ×N count
// ---------------------------------------------------------------------------
test.describe("E2E-2: Chip content format", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("each chip starts with #", async ({ page }) => {
    const chips = page.locator("section[aria-label='Trending tags'] a");
    const count = await chips.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const text = await chips.nth(i).textContent();
      expect(text).toMatch(/^#/);
    }
  });

  test("each chip contains a ×N count badge", async ({ page }) => {
    const chips = page.locator("section[aria-label='Trending tags'] a");
    const count = await chips.count();

    for (let i = 0; i < count; i++) {
      const text = await chips.nth(i).textContent();
      expect(text).toMatch(/×\d+/);
    }
  });

  test("trending section renders at most 5 chips", async ({ page }) => {
    const chips = page.locator("section[aria-label='Trending tags'] a");
    const count = await chips.count();
    expect(count).toBeLessThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------------
// E2E-3: Clicking a chip navigates to /tags/[tag]
// ---------------------------------------------------------------------------
test.describe("E2E-3: Chip navigation", () => {
  test("clicking a trending chip navigates to the correct tag page", async ({ page }) => {
    await page.goto("/");

    const firstChip = page.locator("section[aria-label='Trending tags'] a").first();
    await expect(firstChip).toBeVisible();

    const href = await firstChip.getAttribute("href");
    expect(href).toMatch(/^\/tags\/.+/);

    await firstChip.click();
    await expect(page).toHaveURL(href!);

    // Tag page shows the tag heading
    await expect(page.locator("h1")).toBeVisible();
  });

  test("tag page reached via chip shows post count", async ({ page }) => {
    await page.goto("/");

    const firstChip = page.locator("section[aria-label='Trending tags'] a").first();
    const href = await firstChip.getAttribute("href");
    await firstChip.click();

    await expect(page).toHaveURL(href!);
    await expect(page.getByText(/\d+ post/)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// E2E-4: Tag page shows 🔥 Trending badge for a trending tag
// ---------------------------------------------------------------------------
test.describe("E2E-4: Trending badge on tag page", () => {
  test("a trending tag's detail page shows the 🔥 Trending badge", async ({ page }) => {
    await page.goto("/");

    // Navigate to the first trending chip's tag page
    const firstChip = page.locator("section[aria-label='Trending tags'] a").first();
    await firstChip.click();

    // The 🔥 Trending badge should be visible
    await expect(page.getByText(/Trending/)).toBeVisible();
  });

  test("the trending badge appears next to the tag heading", async ({ page }) => {
    await page.goto("/");

    const firstChip = page.locator("section[aria-label='Trending tags'] a").first();
    const href = await firstChip.getAttribute("href");
    await page.goto(href!);

    const heading = page.locator("h1");
    await expect(heading).toBeVisible();

    // Badge is in the same row as the heading
    const badgeNearHeading = page.locator("h1 ~ span, h1 + span").filter({ hasText: "Trending" });
    await expect(badgeNearHeading).toBeVisible();
  });
});
