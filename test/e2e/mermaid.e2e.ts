/**
 * E2E tests for 003-mermaid.
 * Covers E2E-1 through E2E-4, UI-3, UI-5, UI-6.
 * Requires Vite dev server at http://localhost:5173.
 * Uses the mermaid-demo post which has valid + invalid blocks.
 */

import { test, expect } from "@playwright/test";
import { gotoAndHydrate } from "./helpers";

test.describe("003-mermaid: mermaid-demo post", () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndHydrate(page, "/posts/mermaid-demo");
    // Wait for mermaid to finish — all figures must settle (SVG or error card)
    await page.waitForSelector("figure", { timeout: 10000 });
    await page.waitForTimeout(2000); // allow async renders to complete
  });

  // E2E-1: at least one valid SVG rendered
  test("E2E-1: renders at least one SVG diagram", async ({ page }) => {
    const svgs = page.locator("figure svg");
    await expect(svgs.first()).toBeVisible();
  });

  // E2E-2: multiple valid blocks render independently
  test("E2E-2: renders multiple SVG diagrams", async ({ page }) => {
    const svgs = page.locator("figure svg");
    const count = await svgs.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  // E2E-4: invalid block shows error card, rest of post intact
  test("E2E-4: invalid block renders error card without breaking page", async ({ page }) => {
    const errorCard = page.getByText(/diagram render error/i);
    await expect(errorCard).toBeVisible();
    // Post title still renders — page not broken
    await expect(page.getByRole("heading", { name: /Mermaid Diagrams/i })).toBeVisible();
  });

  // UI-3: figures have overflow-x-auto
  test("UI-3: diagram figures have overflow-x-auto", async ({ page }) => {
    const figure = page.locator("figure").first();
    const overflow = await figure.evaluate((el) =>
      window.getComputedStyle(el).overflowX
    );
    expect(overflow).toBe("auto");
  });

  // UI-6: error card has warning text and monospace error detail
  test("UI-6: error card contains warning heading and error detail", async ({ page }) => {
    const errorCard = page.getByText(/diagram render error/i);
    await expect(errorCard).toBeVisible();
    const pre = page.locator("figure pre");
    await expect(pre.first()).toBeVisible();
  });
});

// E2E-3: post with no mermaid blocks is unaffected
test.describe("003-mermaid: non-mermaid post regression", () => {
  test("E2E-3: post without mermaid blocks renders normally", async ({ page }) => {
    await gotoAndHydrate(page, "/posts/spec-driven-development");
    await expect(page.locator("h1").first()).toBeVisible();
    const mermaidFigures = page.locator("figure svg");
    await expect(mermaidFigures).toHaveCount(0);
  });
});
