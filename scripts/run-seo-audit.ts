#!/usr/bin/env bun
/**
 * SEO audit runner: builds the site (for sitemap), extracts URLs,
 * then runs Lighthouse CI against the dev server (SSR).
 *
 * Usage: bun run test:seo
 * With test content: CONTENT_DIR=test/content bun run test:seo
 */
import { execSync } from "node:child_process";
import { getAllPosts, getAllTags } from "../src/ui/lib/posts";

const PORT = 4174;
const BASE_URL = `http://localhost:${PORT}`;

function buildUrls(): string[] {
  const posts = getAllPosts();
  const tags = getAllTags();
  const urls: string[] = [];

  // Home
  urls.push(`${BASE_URL}/`);

  // All post pages
  for (const post of posts) {
    urls.push(`${BASE_URL}/posts/${post.slug}`);
  }

  // All tag pages
  for (const tag of tags) {
    urls.push(`${BASE_URL}/tags/${encodeURIComponent(tag)}`);
  }

  return urls;
}

function main(): void {
  // Step 1: Build (generates sitemap + robots.txt)
  console.log("Building site (sitemap + robots.txt)...\n");
  execSync("bun run build", { stdio: "inherit", env: { ...process.env } });

  // Step 2: Build URL list from post loader
  const urls = buildUrls();
  console.log(`\nAuditing ${urls.length} URLs:\n`);
  urls.forEach((u) => console.log(`  ${u}`));

  // Step 3: Run Lighthouse CI with URLs
  const urlArgs = urls.map((u) => `--collect.url=${u}`).join(" ");
  const cmd = `bunx @lhci/cli autorun ${urlArgs}`;

  console.log(`\nRunning Lighthouse CI (dev server on port ${PORT})...\n`);

  try {
    execSync(cmd, { stdio: "inherit", env: { ...process.env } });
  } catch {
    console.error("\nLighthouse CI failed — check the report above.");
    process.exit(1);
  }
}

main();
