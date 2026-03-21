import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  readFaviconLetter,
  generateSvg,
  svgToPng,
  isCacheValid,
  generateFavicon,
  SIZES,
} from "../../scripts/generate-favicon";

const TMP = join(import.meta.dirname, "..", ".tmp-favicon-test");
const PROFILE = join(TMP, "profile.json");
const OUTPUT = join(TMP, "output");
const HASH = join(OUTPUT, ".favicon-hash");

function writeProfile(data: Record<string, unknown>): void {
  writeFileSync(PROFILE, JSON.stringify(data));
}

beforeEach(() => {
  mkdirSync(OUTPUT, { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

// --- BUILD-1: reads faviconLetter from profile.json ---
describe("readFaviconLetter", () => {
  it("reads a single-character faviconLetter", () => {
    writeProfile({ faviconLetter: "J" });
    expect(readFaviconLetter(PROFILE)).toBe("J");
  });

  // Edge case: empty string
  it("throws when faviconLetter is empty", () => {
    writeProfile({ faviconLetter: "" });
    expect(() => readFaviconLetter(PROFILE)).toThrow("faviconLetter is empty in profile.json");
  });

  // Edge case: missing field
  it("throws when faviconLetter is missing", () => {
    writeProfile({ name: "Test" });
    expect(() => readFaviconLetter(PROFILE)).toThrow("faviconLetter is empty in profile.json");
  });

  // Edge case: multi-character
  it("uses first character when faviconLetter is multi-character", () => {
    writeProfile({ faviconLetter: "JP" });
    expect(readFaviconLetter(PROFILE)).toBe("J");
  });

  // Edge case: emoji
  it("handles emoji characters", () => {
    writeProfile({ faviconLetter: "🚀" });
    expect(readFaviconLetter(PROFILE)).toBe("🚀");
  });
});

// --- BUILD-2: generates SVG ---
describe("generateSvg", () => {
  it("produces valid SVG with the letter", () => {
    const svg = generateSvg("I");
    expect(svg).toContain("<svg");
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain(">I</text>");
  });

  it("uses round black background", () => {
    const svg = generateSvg("A");
    expect(svg).toContain('<circle cx="50" cy="50" r="50" fill="#000"');
  });

  it("uses white text with system font stack", () => {
    const svg = generateSvg("A");
    expect(svg).toContain('fill="#fff"');
    expect(svg).toContain("-apple-system");
    expect(svg).toContain("BlinkMacSystemFont");
    expect(svg).toContain("Helvetica");
  });
});

// --- BUILD-3: converts SVG to PNG ---
describe("svgToPng", () => {
  it("produces a valid PNG buffer", () => {
    const svg = generateSvg("I");
    const png = svgToPng(svg, 32);
    // PNG magic bytes: 137 80 78 71
    expect(png[0]).toBe(137);
    expect(png[1]).toBe(80);
    expect(png[2]).toBe(78);
    expect(png[3]).toBe(71);
  });

  it("produces PNGs at all required sizes", () => {
    const svg = generateSvg("I");
    for (const size of SIZES) {
      const png = svgToPng(svg, size);
      expect(png.length).toBeGreaterThan(0);
    }
  });
});

// --- BUILD-4: cache strategy ---
describe("isCacheValid", () => {
  it("returns false when hash file does not exist", () => {
    expect(isCacheValid("I", HASH)).toBe(false);
  });

  it("returns true when hash matches", () => {
    writeFileSync(HASH, "I");
    expect(isCacheValid("I", HASH)).toBe(true);
  });

  it("returns false when hash differs", () => {
    writeFileSync(HASH, "J");
    expect(isCacheValid("I", HASH)).toBe(false);
  });
});

// --- E2E-1 to E2E-4: full generation flow ---
describe("generateFavicon", () => {
  it("generates SVG with correct letter (E2E-1)", () => {
    writeProfile({ faviconLetter: "X" });
    generateFavicon(OUTPUT, PROFILE, HASH);

    const svg = readFileSync(join(OUTPUT, "favicon.svg"), "utf-8");
    expect(svg).toContain(">X</text>");
  });

  it("generates all three PNG files (E2E-2)", () => {
    writeProfile({ faviconLetter: "A" });
    generateFavicon(OUTPUT, PROFILE, HASH);

    for (const size of SIZES) {
      const path = join(OUTPUT, `favicon-${size}x${size}.png`);
      expect(existsSync(path)).toBe(true);
      const png = readFileSync(path);
      // Verify PNG magic bytes
      expect(png[0]).toBe(137);
      expect(png[1]).toBe(80);
    }
  });

  it("skips regeneration on cache hit (E2E-3)", () => {
    writeProfile({ faviconLetter: "B" });
    generateFavicon(OUTPUT, PROFILE, HASH);

    const svgBefore = readFileSync(join(OUTPUT, "favicon.svg"), "utf-8");

    // Run again — should be a cache hit
    generateFavicon(OUTPUT, PROFILE, HASH);

    const svgAfter = readFileSync(join(OUTPUT, "favicon.svg"), "utf-8");
    expect(svgAfter).toBe(svgBefore);
  });

  it("regenerates on letter change (E2E-4)", () => {
    writeProfile({ faviconLetter: "C" });
    generateFavicon(OUTPUT, PROFILE, HASH);

    const svgBefore = readFileSync(join(OUTPUT, "favicon.svg"), "utf-8");
    expect(svgBefore).toContain(">C</text>");

    // Change letter
    writeProfile({ faviconLetter: "D" });
    generateFavicon(OUTPUT, PROFILE, HASH);

    const svgAfter = readFileSync(join(OUTPUT, "favicon.svg"), "utf-8");
    expect(svgAfter).toContain(">D</text>");
    expect(svgAfter).not.toContain(">C</text>");
  });

  it("creates output directory if it does not exist", () => {
    const nested = join(TMP, "nested", "out");
    writeProfile({ faviconLetter: "Z" });
    generateFavicon(nested, PROFILE, join(nested, ".favicon-hash"));
    expect(existsSync(join(nested, "favicon.svg"))).toBe(true);
  });
});

// --- UI-1 to UI-5: Head and manifest ---
describe("Head and manifest integration", () => {
  const headPath = join(import.meta.dirname, "..", "..", "pages", "+Head.tsx");
  const manifestPath = join(import.meta.dirname, "..", "..", "public", "site.webmanifest");
  let headContent: string;
  let manifest: { icons: Array<{ src: string; sizes: string; type: string }> };

  beforeEach(() => {
    headContent = readFileSync(headPath, "utf-8");
    manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  });

  it("UI-1: Head includes SVG favicon link", () => {
    expect(headContent).toContain('rel="icon" type="image/svg+xml" href="/favicon.svg"');
  });

  it("UI-2: Head includes PNG favicon link", () => {
    expect(headContent).toContain('rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"');
  });

  it("UI-3: Head includes apple-touch-icon", () => {
    expect(headContent).toContain('rel="apple-touch-icon" sizes="192x192" href="/favicon-192x192.png"');
  });

  it("UI-4: manifest has 192 and 512 icons", () => {
    const sizes = manifest.icons.map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    for (const icon of manifest.icons) {
      expect(icon.type).toBe("image/png");
    }
  });

  it("UI-5: Head includes manifest link", () => {
    expect(headContent).toContain('rel="manifest" href="/site.webmanifest"');
  });
});

// --- BUILD-6: build script integration ---
describe("build script integration", () => {
  it("BUILD-6: package.json build script runs favicon generation before vite", () => {
    const pkgPath = join(import.meta.dirname, "..", "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    expect(pkg.scripts.build).toContain("generate-favicon.ts");
    expect(pkg.scripts.build).toMatch(/generate-favicon\.ts\s*&&\s*vite build/);
  });
});
