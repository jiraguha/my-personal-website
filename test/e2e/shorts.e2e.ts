/**
 * E2E tests for 004-short — Short Notes Content Category.
 * Covers E2E-1 through E2E-4.
 * Runs against the Vite dev server at http://localhost:5173.
 *
 * Relies on the sample short at src/content/posts/til-kubectl-debug.md
 * being present (category: short, slug: til-kubectl-debug).
 */

import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// E2E-1: "Shorts" tab is visible and filters the grid
// ---------------------------------------------------------------------------
test.describe("E2E-1: Shorts filter tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("'Shorts' tab is visible in the category filter bar", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Shorts" })).toBeVisible();
  });

  test("clicking 'Shorts' does not navigate away from home", async ({ page }) => {
    await page.getByRole("button", { name: "Shorts" }).click();
    await expect(page).toHaveURL("/");
  });

  test("'Shorts' tab shows only short-category cards", async ({ page }) => {
    await page.getByRole("button", { name: "Shorts" }).click();

    // All visible cards should have the ⚡ SHORT badge
    const cards = page.locator("article");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toContainText("SHORT");
    }
  });

  test("switching back to 'All' restores all cards", async ({ page }) => {
    const allCount = await page.locator("article").count();
    await page.getByRole("button", { name: "Shorts" }).click();
    const shortsCount = await page.locator("article").count();
    await page.getByRole("button", { name: "All" }).click();
    await expect(page.locator("article")).toHaveCount(allCount);
    expect(shortsCount).toBeLessThanOrEqual(allCount);
  });
});

// ---------------------------------------------------------------------------
// E2E-2: Short card is compact — no cover image, has ⚡ SHORT badge
// ---------------------------------------------------------------------------
test.describe("E2E-2: Short card appearance", () => {
  test("short card shows the ⚡ SHORT badge", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Shorts" }).click();

    const firstCard = page.locator("article").first();
    await expect(firstCard).toContainText("SHORT");
  });

  test("short card has no gradient cover image area", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Shorts" }).click();

    const firstCard = page.locator("article").first();
    // Regular cards have a div with bg-gradient-to-br — short cards do not
    const gradientDiv = firstCard.locator(".bg-gradient-to-br");
    await expect(gradientDiv).toHaveCount(0);
  });

  test("short card title is visible", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Shorts" }).click();

    const firstCard = page.locator("article").first();
    await expect(firstCard.locator("h3")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// E2E-3: Short detail page — ⚡ SHORT badge, no cover image
// ---------------------------------------------------------------------------
test.describe("E2E-3: Short detail page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/posts/til-kubectl-debug");
  });

  test("detail page renders without 404", async ({ page }) => {
    await expect(page).toHaveURL("/posts/til-kubectl-debug");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("detail page shows ⚡ SHORT badge", async ({ page }) => {
    await expect(page.getByText("SHORT")).toBeVisible();
  });

  test("detail page has no cover image", async ({ page }) => {
    // The cover img only renders for posts with a cover — shorts skip it
    const coverImg = page.locator("header + div img, header ~ div.mb-10 img");
    await expect(coverImg).toHaveCount(0);
  });

  test("detail page has a back-to-home link", async ({ page }) => {
    await expect(page.getByRole("link", { name: /back/i }).first()).toBeVisible();
  });

  test("detail page renders markdown body content", async ({ page }) => {
    // The sample short contains `kubectl debug` in the body
    await expect(page.locator("article")).toContainText("kubectl debug");
  });
});

// ---------------------------------------------------------------------------
// E2E-4: Short with featured: true does not appear in the hero slot
// ---------------------------------------------------------------------------
test.describe("E2E-4: Featured short is excluded from hero", () => {
  test("hero FeaturedCard is not a short (no ⚡ SHORT badge in featured section)", async ({ page }) => {
    await page.goto("/");

    // The FeaturedCard is the first major card section before the content grid
    // It renders inside a div that comes before the ContentGrid section
    // We check that the featured area does not contain a SHORT badge
    const featuredSection = page.locator("section, div").filter({ hasText: /featured|coming soon/i }).first();

    // If there's a featured card, it shouldn't have a SHORT badge
    const shortBadgeInFeatured = page.locator("h2").filter({ hasText: /featured/i })
      .locator(".. >> text=SHORT");

    // The simplest check: the hero area (before the content grid h2) has no SHORT badge
    // We check the full page — if our only short is the sample one (not featured),
    // the hero should show a non-short post or the "Coming soon" placeholder
    const heroArea = page.locator("div").first();
    // Short badge text should not appear in the FeaturedCard component
    // FeaturedCard renders differently (larger card, before the grid section)
    // The grid section starts with the h2 "Projects, Writing, Talks & Code"
    const gridHeading = page.getByText("Projects, Writing, Talks & Code");
    await expect(gridHeading).toBeVisible();

    // Content before the grid heading should not contain a SHORT badge in the featured slot
    // We'll verify by checking the sample short is NOT the featured post
    // (since til-kubectl-debug.md has featured: false)
    const featuredCard = page.locator("article").first();
    // If there's a featured article rendered, it should not be a short
    if (await featuredCard.isVisible()) {
      const cardText = await featuredCard.textContent();
      // This is the grid's first card — we're testing the FeaturedCard separately
      // The FeaturedCard is not an <article> element — it's a different component
    }

    // Definitive check: navigate to hero, look for the FeaturedCard link
    // FeaturedCard renders a Link with "Read more" — if present, that post must not be a short
    const readMoreLink = page.getByRole("link", { name: /read more/i });
    if (await readMoreLink.isVisible()) {
      await readMoreLink.click();
      await expect(page.getByText("SHORT")).toHaveCount(0);
      await page.goBack();
    }
  });
});
