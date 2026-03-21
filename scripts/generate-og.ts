#!/usr/bin/env bun
/**
 * Build-time OG image generation:
 *   bun run scripts/generate-og.ts
 *
 * 1. Generates og-default.png (site-wide fallback)
 * 2. Generates text-card OG images for shorts
 * 3. Composites "▶ SLIDES" badge on talk OG images
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { getAllPosts } from "../src/ui/lib/posts";
import { siteProfile } from "../src/ui/lib/site";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const COVERS_DIR = path.resolve(process.cwd(), "public/assets/covers");
const DEFAULT_OG_PATH = path.resolve(process.cwd(), "public/assets/og-default.png");

// DA palette
const BG_COLOR = "#0B1120";
const PANEL_COLOR = "#1A2744";
const CYAN = "#00E5FF";
const TEXT_COLOR = "#E0E6ED";
const RED = "#FF1744";

function svgEscape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (current.length + word.length + 1 > maxCharsPerLine && current.length > 0) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildDefaultOgSvg(): string {
  const name = svgEscape(siteProfile.name);
  const role = svgEscape(siteProfile.role);

  return `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${BG_COLOR}"/>
  <!-- Grid overlay -->
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${PANEL_COLOR}" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5"/>
  <!-- Circuit traces -->
  <line x1="100" y1="0" x2="100" y2="200" stroke="${CYAN}" stroke-width="1" opacity="0.3"/>
  <line x1="100" y1="200" x2="300" y2="200" stroke="${CYAN}" stroke-width="1" opacity="0.3"/>
  <line x1="1100" y1="630" x2="1100" y2="430" stroke="${CYAN}" stroke-width="1" opacity="0.3"/>
  <line x1="1100" y1="430" x2="900" y2="430" stroke="${CYAN}" stroke-width="1" opacity="0.3"/>
  <!-- Center panel -->
  <rect x="200" y="165" width="800" height="300" rx="8" fill="${PANEL_COLOR}" opacity="0.6"/>
  <rect x="200" y="165" width="800" height="300" rx="8" fill="none" stroke="${CYAN}" stroke-width="1" opacity="0.4"/>
  <!-- Name -->
  <text x="600" y="290" font-family="monospace" font-size="48" font-weight="bold" fill="${TEXT_COLOR}" text-anchor="middle">${name}</text>
  <!-- Role -->
  <text x="600" y="350" font-family="monospace" font-size="24" fill="${CYAN}" text-anchor="middle">${role}</text>
  <!-- Bottom accent -->
  <rect x="400" y="400" width="400" height="2" fill="${CYAN}" opacity="0.6"/>
  <!-- Corner dots -->
  <circle cx="220" cy="185" r="3" fill="${CYAN}" opacity="0.6"/>
  <circle cx="980" cy="185" r="3" fill="${CYAN}" opacity="0.6"/>
  <circle cx="220" cy="445" r="3" fill="${CYAN}" opacity="0.6"/>
  <circle cx="980" cy="445" r="3" fill="${CYAN}" opacity="0.6"/>
</svg>`;
}

function buildShortTextCardSvg(title: string, siteName: string): string {
  const lines = wrapText(title, 35);
  const fontSize = lines.length > 2 ? 36 : 44;
  const lineHeight = fontSize * 1.4;
  const totalHeight = lines.length * lineHeight;
  const startY = (OG_HEIGHT - totalHeight) / 2 + fontSize;

  const titleLines = lines
    .map(
      (line, i) =>
        `<text x="600" y="${startY + i * lineHeight}" font-family="monospace" font-size="${fontSize}" font-weight="bold" fill="${TEXT_COLOR}" text-anchor="middle">${svgEscape(line)}</text>`,
    )
    .join("\n  ");

  return `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${BG_COLOR}"/>
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${PANEL_COLOR}" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5"/>
  <!-- Circuit traces -->
  <line x1="80" y1="0" x2="80" y2="150" stroke="${CYAN}" stroke-width="1" opacity="0.3"/>
  <line x1="80" y1="150" x2="200" y2="150" stroke="${CYAN}" stroke-width="1" opacity="0.3"/>
  <line x1="1120" y1="630" x2="1120" y2="480" stroke="${CYAN}" stroke-width="1" opacity="0.3"/>
  <line x1="1120" y1="480" x2="1000" y2="480" stroke="${CYAN}" stroke-width="1" opacity="0.3"/>
  <!-- Title -->
  ${titleLines}
  <!-- SHORT badge -->
  <rect x="510" y="${startY + lines.length * lineHeight + 10}" width="140" height="32" rx="4" fill="${RED}" opacity="0.9"/>
  <text x="580" y="${startY + lines.length * lineHeight + 32}" font-family="monospace" font-size="16" font-weight="bold" fill="white" text-anchor="middle">⚡ SHORT</text>
  <!-- Site name -->
  <text x="600" y="${OG_HEIGHT - 40}" font-family="monospace" font-size="16" fill="${CYAN}" text-anchor="middle" opacity="0.7">${svgEscape(siteName)}</text>
</svg>`;
}

function buildSlidesBadgeSvg(): string {
  return `<svg width="180" height="44" xmlns="http://www.w3.org/2000/svg">
  <rect width="180" height="44" rx="6" fill="${PANEL_COLOR}" opacity="0.9"/>
  <rect width="180" height="44" rx="6" fill="none" stroke="${CYAN}" stroke-width="1" opacity="0.6"/>
  <text x="90" y="30" font-family="monospace" font-size="20" font-weight="bold" fill="${CYAN}" text-anchor="middle">▶ SLIDES</text>
</svg>`;
}

async function generateDefaultOg(): Promise<void> {
  if (fs.existsSync(DEFAULT_OG_PATH)) {
    console.log("  SKIP og-default.png (already exists)");
    return;
  }
  const svg = buildDefaultOgSvg();
  await sharp(Buffer.from(svg))
    .resize(OG_WIDTH, OG_HEIGHT)
    .png()
    .toFile(DEFAULT_OG_PATH);
  console.log("  CREATED og-default.png");
}

async function generateShortOg(slug: string, title: string): Promise<void> {
  const outputDir = path.join(COVERS_DIR, slug);
  const ogPath = path.join(outputDir, "og.png");

  if (fs.existsSync(ogPath)) {
    console.log(`  SKIP short/${slug} (og.png already exists)`);
    return;
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const svg = buildShortTextCardSvg(title, siteProfile.name);
  await sharp(Buffer.from(svg))
    .resize(OG_WIDTH, OG_HEIGHT)
    .png()
    .toFile(ogPath);
  console.log(`  CREATED short/${slug}/og.png`);
}

async function generateTalkBadgeOg(slug: string): Promise<void> {
  const outputDir = path.join(COVERS_DIR, slug);
  const ogPath = path.join(outputDir, "og.png");
  const basePath = path.join(outputDir, "cover.png");

  if (!fs.existsSync(basePath)) {
    console.log(`  SKIP talk/${slug} (no cover.png to overlay)`);
    return;
  }

  // Read the base cover and resize to OG dimensions
  const base = sharp(basePath).resize(OG_WIDTH, OG_HEIGHT, { fit: "cover" });
  const badgeSvg = buildSlidesBadgeSvg();
  const badgeBuffer = await sharp(Buffer.from(badgeSvg)).png().toBuffer();

  await base
    .composite([
      {
        input: badgeBuffer,
        gravity: "southeast",
        top: OG_HEIGHT - 44 - 20,
        left: OG_WIDTH - 180 - 20,
      },
    ])
    .png()
    .toFile(ogPath);
  console.log(`  CREATED talk/${slug}/og.png (with ▶ SLIDES badge)`);
}

async function main(): Promise<void> {
  console.log("Generating OG images...\n");

  // 1. Site-wide default
  console.log("[1/3] Site-wide default OG:");
  await generateDefaultOg();

  // 2. Short text-cards
  const posts = getAllPosts();
  const shorts = posts.filter((p) => p.category === "short");
  console.log(`\n[2/3] Short text-cards (${shorts.length} posts):`);
  for (const post of shorts) {
    await generateShortOg(post.slug, post.title);
  }

  // 3. Talk badge overlays (only for talks without externalSlides)
  const talks = posts.filter((p) => p.category === "talk" && !p.externalSlides);
  console.log(`\n[3/3] Talk badge overlays (${talks.length} talks):`);
  for (const post of talks) {
    await generateTalkBadgeOg(post.slug);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Error generating OG images:", err);
  process.exit(1);
});
