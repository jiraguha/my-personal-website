#!/usr/bin/env bun
/**
 * Single-post cover generation: bun run cover <slug>
 * Generates (or regenerates) the cover for one specific post.
 *
 * Skips if coverNone: true or cover is explicitly set in frontmatter.
 * Use --force to regenerate even if a generated cover already exists.
 */
import { getPostBySlug } from "../src/ui/lib/posts";
import { generateCover } from "../src/ui/lib/cover-generator";
import { readManifest, writeManifest, upsertCover } from "../src/ui/lib/cover-manifest";
import { shouldSkipCover, skipReasonLabel } from "../src/ui/lib/cover-skip";

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const slug = args[0];

  if (!slug) {
    console.error("Usage: bun run cover <slug>");
    console.error("Example: bun run cover bun-for-backend");
    process.exit(1);
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY not set.");
    console.error("Get one at https://aistudio.google.com/apikey");
    process.exit(1);
  }

  const post = getPostBySlug(slug);
  if (!post) {
    console.error(`Error: No post found with slug "${slug}"`);
    process.exit(1);
  }

  const skipReason = shouldSkipCover(post);
  if (skipReason) {
    console.log(`SKIP (${skipReasonLabel(skipReason)}): ${post.slug}`);
    return;
  }

  console.log(`Generating cover for "${post.title}" (${post.category})\n`);

  const cover = await generateCover(post);
  const manifest = readManifest();
  const updated = upsertCover(manifest, cover);
  writeManifest(updated);

  console.log(`\nDone. Cover saved for "${slug}".`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
