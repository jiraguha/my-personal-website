/**
 * E2E tests for spec 006 — Reveal.js Talk Presentations.
 * Covers E2E-1 through E2E-6.
 * Runs against the Vite dev server at http://localhost:5173.
 *
 * Relies on:
 *   src/content/posts/securing-agentic-systems.md  (category: talk, no externalSlides)
 *   src/content/posts/external-talk-demo.md        (category: talk, externalSlides set, draft: true)
 */

import { test, expect } from "@playwright/test";
import { gotoAndHydrate } from "./helpers";

const TALK_SLUG = "securing-agentic-systems";
const EXTERNAL_SLUG = "external-talk-demo";

// ---------------------------------------------------------------------------
// E2E-1: Talk card in home grid shows ▶ Slides badge; clicks → landing page
// ---------------------------------------------------------------------------

test.describe("E2E-1: Talk card in home grid", () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndHydrate(page, "/");
  });

  test("talk card shows ▶ Slides badge", async ({ page }) => {
    // Find the talk card by navigating to the article that links to the talk slug
    const talkCard = page.locator(`article`).filter({ hasText: "Securing Agentic" });
    await expect(talkCard).toBeVisible();
    await expect(talkCard).toContainText("▶ Slides");
  });

  test("clicking talk card navigates to landing page at /posts/:slug", async ({ page }) => {
    const talkCard = page.locator(`article`).filter({ hasText: "Securing Agentic" });
    await talkCard.click();
    await expect(page).toHaveURL(`/posts/${TALK_SLUG}`);
  });
});

// ---------------------------------------------------------------------------
// E2E-2: Landing page has "View Slides →" → /talks/:slug
// ---------------------------------------------------------------------------

test.describe("E2E-2: Talk landing page", () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndHydrate(page, `/posts/${TALK_SLUG}`);
  });

  test("renders the talk title", async ({ page }) => {
    await expect(page.locator("header h1")).toContainText("Securing Agentic Systems");
  });

  test("shows View Slides → button", async ({ page }) => {
    await expect(page.getByRole("link", { name: /View Slides/i })).toBeVisible();
  });

  test("View Slides → button links to /talks/:slug", async ({ page }) => {
    const link = page.getByRole("link", { name: /View Slides/i });
    await expect(link).toHaveAttribute("href", `/talks/${TALK_SLUG}`);
  });

  test("clicking View Slides → navigates to /talks/:slug", async ({ page }) => {
    await page.getByRole("link", { name: /View Slides/i }).click();
    await expect(page).toHaveURL(`/talks/${TALK_SLUG}`);
  });

  test("shows event name", async ({ page }) => {
    await expect(page.locator("header").getByText("KubeCon EU 2026")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// E2E-3: Presentation page has no nav or footer
// ---------------------------------------------------------------------------

test.describe("E2E-3: Presentation is full-viewport (no nav/footer)", () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndHydrate(page, `/talks/${TALK_SLUG}`);
  });

  test("nav element is absent from the DOM", async ({ page }) => {
    await expect(page.locator("nav")).toHaveCount(0);
  });

  test("footer element is absent from the DOM", async ({ page }) => {
    await expect(page.locator("footer")).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// E2E-4: Presentation renders multiple slide sections
// ---------------------------------------------------------------------------

test.describe("E2E-4: Presentation has multiple slides", () => {
  test("renders more than one section inside .slides", async ({ page }) => {
    await gotoAndHydrate(page, `/talks/${TALK_SLUG}`);
    // Reveal wraps all content in .slides > section elements
    const sections = page.locator(".reveal .slides > section");
    await expect(sections).toHaveCount(await sections.count());
    const count = await sections.count();
    expect(count).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// E2E-5: "Back to site" link navigates to landing page
// ---------------------------------------------------------------------------

test.describe("E2E-5: Back to site overlay", () => {
  test("back link is visible on load and points to landing page", async ({ page }) => {
    await gotoAndHydrate(page, `/talks/${TALK_SLUG}`);
    const backLink = page.locator(".talk-back-btn");
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", `/posts/${TALK_SLUG}`);
  });

  test("clicking back link navigates to landing page", async ({ page }) => {
    await gotoAndHydrate(page, `/talks/${TALK_SLUG}`);
    await page.locator(".talk-back-btn").click();
    await expect(page).toHaveURL(`/posts/${TALK_SLUG}`);
  });
});

// ---------------------------------------------------------------------------
// E2E-6: Talk with externalSlides → "View External Slides →"; /talks/:slug → 404
// ---------------------------------------------------------------------------

test.describe("E2E-6: External slides talk", () => {
  test("landing page shows 'View External Slides →' button", async ({ page }) => {
    await gotoAndHydrate(page, `/posts/${EXTERNAL_SLUG}`);
    await expect(page.getByRole("link", { name: /View External Slides/i })).toBeVisible();
  });

  test("landing page has no 'View Slides →' (internal deck) button", async ({ page }) => {
    await gotoAndHydrate(page, `/posts/${EXTERNAL_SLUG}`);
    // Should NOT have a link pointing to /talks/...
    const internalLink = page.getByRole("link", { name: /^▶ View Slides →$/ });
    await expect(internalLink).toHaveCount(0);
  });

  test("/talks/:slug for external talk redirects to 404", async ({ page }) => {
    await gotoAndHydrate(page, `/talks/${EXTERNAL_SLUG}`);
    await expect(page).toHaveURL("/404");
  });
});
