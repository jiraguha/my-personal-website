#!/usr/bin/env bun
/**
 * Batch cover generation: bun run covers [--force] [--dry-run]
 * Generates missing covers for all posts across all categories.
 */
import { getAllPosts } from "../src/ui/lib/posts";
import { generateCover } from "../src/ui/lib/cover-generator";
import { readManifest, writeManifest, upsertCover, getCoverBySlug } from "../src/ui/lib/cover-manifest";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const force = args.includes("--force");
const dryRun = args.includes("--dry-run");
const delay = parseInt(process.env.COVER_DELAY_MS ?? "2000", 10);

async function main(): Promise<void> {
  if (!process.env.GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY not set.");
    console.error("Get one at https://aistudio.google.com/apikey");
    process.exit(1);
  }

  const daPath = path.resolve(process.cwd(), "da.md");
  if (!fs.existsSync(daPath)) {
    console.error("Error: Missing da.md — the design aesthetic file is required for cover generation.");
    process.exit(1);
  }

  const posts = getAllPosts();
  let manifest = readManifest();

  console.log(`Found ${posts.length} posts\n`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const post of posts) {
    // Skip manual covers
    if (post.coverManual) {
      console.log(`  SKIP (manual): ${post.slug}`);
      skipped++;
      continue;
    }

    // Skip if autocover is false
    if (post.autocover === false) {
      console.log(`  SKIP (autocover=false): ${post.slug}`);
      skipped++;
      continue;
    }

    // Skip if cover already exists (unless --force)
    const existing = getCoverBySlug(manifest, post.slug);
    const coverFile = path.resolve(process.cwd(), `public/assets/covers/${post.slug}/cover.png`);
    if (!force && existing && fs.existsSync(coverFile)) {
      console.log(`  SKIP (exists): ${post.slug}`);
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`  WOULD GENERATE: ${post.slug}`);
      generated++;
      continue;
    }

    try {
      const cover = await generateCover(post);
      manifest = upsertCover(manifest, cover);
      writeManifest(manifest);
      generated++;

      // Rate limiting between API calls
      if (delay > 0) {
        await new Promise((r) => setTimeout(r, delay));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  FAILED: ${post.slug} — ${msg}`);
      failed++;
    }
  }

  console.log(`\nDone: ${generated} generated, ${skipped} skipped, ${failed} failed`);

  if (dryRun) {
    console.log("(dry run — no files written)");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
