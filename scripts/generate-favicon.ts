import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC = join(ROOT, "public");
const PROFILE_PATH = join(ROOT, "src/content/profile.json");
const HASH_PATH = join(PUBLIC, ".favicon-hash");

export const SIZES = [32, 48, 192, 512] as const;

interface Profile {
  faviconLetter: string;
}

export function readFaviconLetter(profilePath: string = PROFILE_PATH): string {
  const profile: Profile = JSON.parse(readFileSync(profilePath, "utf-8"));
  const letter = profile.faviconLetter;

  if (!letter) {
    throw new Error("faviconLetter is empty in profile.json");
  }

  const chars = [...letter];
  if (chars.length > 1) {
    console.warn(`⚠ faviconLetter is multi-character ("${letter}"), using first character only`);
    return chars[0];
  }

  return letter;
}

export function generateSvg(letter: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="50" fill="#000"/>
  <text x="50" y="50" text-anchor="middle" dominant-baseline="central"
    fill="#fff" font-size="60" font-weight="600"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">${letter}</text>
</svg>`;
}

export function svgToPng(svg: string, size: number): Uint8Array {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    font: {
      loadSystemFonts: true,
    },
  });
  const rendered = resvg.render();
  return rendered.asPng();
}

export function isCacheValid(letter: string, hashPath: string = HASH_PATH): boolean {
  if (!existsSync(hashPath)) return false;
  const cached = readFileSync(hashPath, "utf-8").trim();
  return cached === letter;
}

export function generateFavicon(
  outputDir: string = PUBLIC,
  profilePath: string = PROFILE_PATH,
  hashPath: string = join(outputDir, ".favicon-hash"),
): void {
  const letter = readFaviconLetter(profilePath);

  if (isCacheValid(letter, hashPath)) {
    console.log(`Favicon up-to-date for letter '${letter}', skipping`);
    return;
  }

  console.log(`Generating favicon for letter '${letter}'...`);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const svg = generateSvg(letter);
  writeFileSync(join(outputDir, "favicon.svg"), svg);

  for (const size of SIZES) {
    const png = svgToPng(svg, size);
    writeFileSync(join(outputDir, `favicon-${size}x${size}.png`), png);
  }

  writeFileSync(hashPath, letter);
  console.log(`Favicon generated: SVG + PNG (${SIZES.join(", ")}px)`);
}

// Run when executed directly
const isDirectExecution = import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("generate-favicon.ts");

if (isDirectExecution) {
  generateFavicon();
}
