/**
 * E2E tests for 007-Post-Search.
 * Covers E2E-1 through E2E-5.
 * Runs against the Vite dev server at http://localhost:5173.
 */

import { test, expect } from "@playwright/test";
import { gotoAndHydrate } from "./helpers";

// Helper to expand the search bar and type a query
async function openSearchAndType(page: import("@playwright/test").Page, query: string) {
  // Click the search icon button to expand
  const searchButton = page.getByRole("button", { name: "Open search" });
  await searchButton.click();

  // Wait for the searchbox to appear
  const searchInput = page.getByRole("searchbox", { name: "Search posts" });
  await expect(searchInput).toBeVisible();

  // Type the query
  await searchInput.fill(query);

  // Wait for debounce (150ms) + rendering
  await page.waitForTimeout(300);
}

// ---------------------------------------------------------------------------
// E2E-1: Search filters grid by title, summary, or tags
// ---------------------------------------------------------------------------
test.describe("E2E-1: Search filtering", () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndHydrate(page, "/");
  });

  test("search icon button is visible on the home page", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Open search" })).toBeVisible();
  });

  test("clicking search icon expands the input", async ({ page }) => {
    await page.getByRole("button", { name: "Open search" }).click();
    await expect(page.getByRole("searchbox", { name: "Search posts" })).toBeVisible();
  });

  test("typing 'kubernetes' filters to posts with that tag", async ({ page }) => {
    const allCardsBefore = await page.locator("article").count();

    await openSearchAndType(page, "kubernetes");

    const filteredCards = await page.locator("article").count();
    expect(filteredCards).toBeLessThan(allCardsBefore);
    expect(filteredCards).toBeGreaterThanOrEqual(1);
  });

  test("result count label is visible during search", async ({ page }) => {
    await openSearchAndType(page, "kubernetes");

    // Should show result count like "1 result" or "2 results"
    await expect(page.getByText(/\d+ results?/)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// E2E-2: Search combined with category filter
// ---------------------------------------------------------------------------
test.describe("E2E-2: Search + category filter", () => {
  test("typing a query while 'Talks' is selected filters only within talks", async ({ page }) => {
    await gotoAndHydrate(page, "/");

    // Select the Talks category
    await page.getByRole("button", { name: "Talks" }).click();
    const talksCount = await page.locator("article").count();

    // Now search within talks
    await openSearchAndType(page, "safety");

    const filteredCount = await page.locator("article").count();
    expect(filteredCount).toBeLessThanOrEqual(talksCount);
    expect(filteredCount).toBeGreaterThanOrEqual(1);

    // All visible cards should be talks (check category badge)
    const badges = page.locator("article .capitalize");
    const badgeCount = await badges.count();
    for (let i = 0; i < badgeCount; i++) {
      await expect(badges.nth(i)).toHaveText("talk");
    }
  });
});

// ---------------------------------------------------------------------------
// E2E-3: Clearing search restores the grid
// ---------------------------------------------------------------------------
test.describe("E2E-3: Clear search", () => {
  test("clicking the clear button restores the full grid", async ({ page }) => {
    await gotoAndHydrate(page, "/");

    const allCardsBefore = await page.locator("article").count();

    await openSearchAndType(page, "kubernetes");

    const filteredCards = await page.locator("article").count();
    expect(filteredCards).toBeLessThan(allCardsBefore);

    // Click the clear button
    await page.getByRole("button", { name: "Clear search" }).click();
    await page.waitForTimeout(200);

    const allCardsAfter = await page.locator("article").count();
    expect(allCardsAfter).toBe(allCardsBefore);
  });

  test("clearing search while category is active restores that category's grid", async ({ page }) => {
    await gotoAndHydrate(page, "/");

    // Select Blog category
    await page.getByRole("button", { name: "Blog" }).click();
    const blogCount = await page.locator("article").count();

    // Search to filter further
    await openSearchAndType(page, "agentic");
    const filteredCount = await page.locator("article").count();
    expect(filteredCount).toBeLessThanOrEqual(blogCount);

    // Clear search via the X button in the input (use aria-label to disambiguate)
    await page.getByLabel("Clear search").click();
    await page.waitForTimeout(200);

    // Should restore to blog count (category still active)
    const restoredCount = await page.locator("article").count();
    expect(restoredCount).toBe(blogCount);
  });
});

// ---------------------------------------------------------------------------
// E2E-4: Keyboard shortcuts (/ and Escape)
// ---------------------------------------------------------------------------
test.describe("E2E-4: Keyboard shortcuts", () => {
  test("pressing / expands and focuses the search bar", async ({ page }) => {
    await gotoAndHydrate(page, "/");

    // Ensure no input is focused by clicking on the body
    await page.locator("body").click();
    await page.waitForTimeout(100);

    // Press / (Slash key)
    await page.keyboard.press("Slash");

    const searchInput = page.getByRole("searchbox", { name: "Search posts" });
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeFocused();
  });

  test("pressing Escape clears and collapses the search bar", async ({ page }) => {
    await gotoAndHydrate(page, "/");

    // Expand and type
    await openSearchAndType(page, "kubernetes");
    const searchInput = page.getByRole("searchbox", { name: "Search posts" });
    await expect(searchInput).toBeVisible();

    // Press Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // Search bar should collapse (searchbox gone, icon button back)
    await expect(page.getByRole("button", { name: "Open search" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// E2E-5: Empty state for zero matches
// ---------------------------------------------------------------------------
test.describe("E2E-5: No results empty state", () => {
  test("shows 'No posts matching' message for zero matches", async ({ page }) => {
    await gotoAndHydrate(page, "/");

    await openSearchAndType(page, "xyzzyplugh");

    await expect(page.getByText(/No posts matching/)).toBeVisible();
  });

  test("shows 'Clear search' link in empty state", async ({ page }) => {
    await gotoAndHydrate(page, "/");

    await openSearchAndType(page, "xyzzyplugh");

    // The empty state "Clear search" is a text button (not the X icon which has aria-label)
    await expect(page.getByText("Clear search")).toBeVisible();
  });

  test("clicking 'Clear search' in empty state restores the grid", async ({ page }) => {
    await gotoAndHydrate(page, "/");

    const allCardsBefore = await page.locator("article").count();

    await openSearchAndType(page, "xyzzyplugh");
    await expect(page.getByText(/No posts matching/)).toBeVisible();

    // Click the "Clear search" text button in the empty state (not the X icon)
    await page.getByText("Clear search").click();
    await page.waitForTimeout(200);

    const allCardsAfter = await page.locator("article").count();
    expect(allCardsAfter).toBe(allCardsBefore);
  });
});
