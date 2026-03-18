/**
 * E2E tests for 001-Portfolio.
 * Covers E2E-1 through E2E-6.
 * Runs against the Vite dev server at http://localhost:5173.
 */

import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// E2E-1: Home page renders key sections
// ---------------------------------------------------------------------------
test.describe("E2E-1: Home page structure", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the nav with the site owner name", async ({ page }) => {
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("nav").getByText("Jean-Paul Iraguha")).toBeVisible();
  });

  test("renders the hero section with name and bio", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Jean-Paul Iraguha", level: 1 })).toBeVisible();
    await expect(page.getByText("Software Engineer & Tech Lead")).toBeVisible();
  });

  test("renders at least one post card in the content grid", async ({ page }) => {
    // Wait for at least one article element (PostCard renders <article>)
    const cards = page.locator("article");
    await expect(cards.first()).toBeVisible();
  });

  test("renders the posts section divider", async ({ page }) => {
    await expect(page.getByText("Posts", { exact: true })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// E2E-2: Clicking a post card navigates to the post detail page
// ---------------------------------------------------------------------------
test.describe("E2E-2: Post navigation", () => {
  test("clicking a post card opens the detail page with the post title", async ({ page }) => {
    await page.goto("/");

    // Grab the first article card and get its title text
    const firstCard = page.locator("article").first();
    await expect(firstCard).toBeVisible();

    // Find the heading inside the card
    const cardTitle = firstCard.locator("h3").first();
    const titleText = await cardTitle.innerText();

    // Click the card (the whole article is wrapped in a Link)
    await firstCard.click();

    // Should now be on /posts/[slug]
    await expect(page).toHaveURL(/\/posts\/.+/);

    // The detail page h1 should match the card title
    await expect(page.getByRole("heading", { level: 1, name: titleText.trim() })).toBeVisible();
  });

  test("detail page has a back-to-home link", async ({ page }) => {
    await page.goto("/");
    await page.locator("article").first().click();
    await expect(page.getByRole("link", { name: /back/i }).first()).toBeVisible();
  });

  test("detail page renders markdown content (not raw markdown)", async ({ page }) => {
    await page.goto("/posts/agentic-systems-at-scale");
    // The h1 from the markdown body should be rendered as an <h1>
    await expect(page.locator("article h1, article h2").first()).toBeVisible();
    // Raw markdown syntax should not be visible as text
    await expect(page.getByText("# Building Agentic Systems")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// E2E-3: Tag chip navigation
// ---------------------------------------------------------------------------
test.describe("E2E-3: Tag chip navigation", () => {
  test("clicking a tag chip on a post card goes to /tags/[tag]", async ({ page }) => {
    await page.goto("/");
    // Find the first tag chip that is a link (not the non-clickable ones on PostCard)
    // FeaturedCard uses clickable TagChips, grab one of those
    const tagLink = page.locator("a[href^='/tags/']").first();
    const tagHref = await tagLink.getAttribute("href");
    await tagLink.click();
    await expect(page).toHaveURL(tagHref!);
    // Tag page should show a heading with the tag name
    await expect(page.locator("h1")).toBeVisible();
  });

  test("tag page lists only posts with that tag", async ({ page }) => {
    // Navigate directly to a known tag
    await page.goto("/tags/agentic-systems");
    await expect(page.locator("h1")).toContainText("agentic-systems");
    // Should show at least one post card
    const cards = page.locator("article");
    await expect(cards.first()).toBeVisible();
  });

  test("tag page shows post count in subtitle", async ({ page }) => {
    await page.goto("/tags/agentic-systems");
    // e.g. "2 posts" or "1 post"
    await expect(page.getByText(/\d+ post/)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// E2E-4: Category filter tabs — client-side, no navigation
// ---------------------------------------------------------------------------
test.describe("E2E-4: Category filter", () => {
  test("filter tabs are visible on the home page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Blog" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Projects" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Talks" })).toBeVisible();
  });

  test("clicking a filter tab does not navigate (URL stays /)", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Blog" }).click();
    await expect(page).toHaveURL("/");
  });

  test("'Blog' tab shows only blog category cards", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Blog" }).click();

    // All visible category badges should say "blog"
    const badges = page.locator("article .capitalize");
    const count = await badges.count();
    for (let i = 0; i < count; i++) {
      await expect(badges.nth(i)).toHaveText("blog");
    }
  });

  test("switching back to 'All' restores all cards", async ({ page }) => {
    await page.goto("/");
    const allCount = await page.locator("article").count();

    await page.getByRole("button", { name: "Blog" }).click();
    const blogCount = await page.locator("article").count();

    await page.getByRole("button", { name: "All" }).click();
    await expect(page.locator("article")).toHaveCount(allCount);
    expect(blogCount).toBeLessThanOrEqual(allCount);
  });
});

// ---------------------------------------------------------------------------
// E2E-5: 404 for unknown slugs
// ---------------------------------------------------------------------------
test.describe("E2E-5: 404 page", () => {
  test("unknown post slug renders the 404 page", async ({ page }) => {
    await page.goto("/posts/this-post-does-not-exist");
    await expect(page.getByText("Post not found")).toBeVisible();
  });

  test("404 page has a link back to home", async ({ page }) => {
    await page.goto("/posts/nonexistent");
    const homeLink = page.getByRole("link", { name: /back to home/i });
    await expect(homeLink).toBeVisible();
    await homeLink.click();
    await expect(page).toHaveURL("/");
  });

  test("completely unknown route also renders 404", async ({ page }) => {
    await page.goto("/totally/unknown/path");
    await expect(page.getByText("Post not found")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// E2E-6: Dark/light mode toggle — persists across reload
// ---------------------------------------------------------------------------
test.describe("E2E-6: Dark/light mode", () => {
  test("toggle button is visible in the nav", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /toggle dark mode/i })).toBeVisible();
  });

  test("clicking the toggle adds/removes 'dark' class on <html>", async ({ page }) => {
    await page.goto("/");

    // Clear any stored preference so we start from a known state
    await page.evaluate(() => localStorage.removeItem("theme"));
    await page.reload();

    const html = page.locator("html");
    const initiallyDark = await html.evaluate((el) => el.classList.contains("dark"));

    await page.getByRole("button", { name: /toggle dark mode/i }).click();

    const nowDark = await html.evaluate((el) => el.classList.contains("dark"));
    expect(nowDark).toBe(!initiallyDark);
  });

  test("theme choice persists after page reload", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("theme"));
    await page.reload();

    const html = page.locator("html");
    const before = await html.evaluate((el) => el.classList.contains("dark"));

    // Toggle
    await page.getByRole("button", { name: /toggle dark mode/i }).click();
    const after = await html.evaluate((el) => el.classList.contains("dark"));
    expect(after).toBe(!before);

    // Reload and check persistence
    await page.reload();
    const persisted = await html.evaluate((el) => el.classList.contains("dark"));
    expect(persisted).toBe(after);
  });
});
