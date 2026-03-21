import type { Page } from "@playwright/test";

/** Navigate to a URL and wait for Vike hydration to complete */
export async function gotoAndHydrate(page: Page, url: string) {
  await page.goto(url);
  await page.waitForSelector("html[data-hydrated]", { timeout: 10000 });
}
