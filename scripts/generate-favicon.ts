import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const ROOT = join(import.meta.dir, "..");
const PUBLIC = join(ROOT, "public");
const PROFILE_PATH = join(ROOT, "src/content/profile.json");
const HASH_PATH = join(PUBLIC, ".favicon-hash");

const SIZES = [32, 192, 512] as const;

interface Profile {
  faviconLetter: string;
}

function readFaviconLetter(): string {
  const profile: Profile = JSON.parse(readFileSync(PROFILE_PATH, "utf-8"));
  const letter = profile.faviconLetter;

  if (!letter) {
    console.error("❌ faviconLetter is empty in profile.json");
    process.exit(1);
  }

  if (letter.length > 1) {
    console.warn(`⚠ faviconLetter is multi-character ("${letter}"), using first character only`);
    return letter[0];
  }

  return letter;
}

function generateSvg(letter: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="50" fill="#000"/>
  <text x="50" y="50" text-anchor="middle" dominant-baseline="central"
    fill="#fff" font-size="60" font-weight="600"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">${letter}</text>
</svg>`;
}

function svgToPng(svg: string, size: number): Uint8Array {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    font: {
      loadSystemFonts: true,
    },
  });
  const rendered = resvg.render();
  return rendered.asPng();
}

function isCacheValid(letter: string): boolean {
  if (!existsSync(HASH_PATH)) return false;
  const cached = readFileSync(HASH_PATH, "utf-8").trim();
  return cached === letter;
}

function main(): void {
  const letter = readFaviconLetter();

  if (isCacheValid(letter)) {
    console.log(`Favicon up-to-date for letter '${letter}', skipping`);
    return;
  }

  console.log(`Generating favicon for letter '${letter}'...`);

  if (!existsSync(PUBLIC)) {
    mkdirSync(PUBLIC, { recursive: true });
  }

  const svg = generateSvg(letter);
  writeFileSync(join(PUBLIC, "favicon.svg"), svg);

  for (const size of SIZES) {
    const png = svgToPng(svg, size);
    writeFileSync(join(PUBLIC, `favicon-${size}x${size}.png`), png);
  }

  writeFileSync(HASH_PATH, letter);
  console.log(`Favicon generated: SVG + PNG (${SIZES.join(", ")}px)`);
}

main();
