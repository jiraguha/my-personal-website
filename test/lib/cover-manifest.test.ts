import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  readManifest,
  writeManifest,
  upsertCover,
  getCoverBySlug,
} from "../../src/ui/lib/cover-manifest";
import type { GeneratedCover, CoverManifest } from "../../src/shared/schemas/cover-manifest.schema";

const MANIFEST_PATH = path.resolve(process.cwd(), "public/assets/covers.manifest.json");
let hadManifest = false;
let originalManifest: string | null = null;

beforeEach(() => {
  hadManifest = fs.existsSync(MANIFEST_PATH);
  if (hadManifest) {
    originalManifest = fs.readFileSync(MANIFEST_PATH, "utf-8");
  }
});

afterEach(() => {
  if (hadManifest && originalManifest) {
    fs.writeFileSync(MANIFEST_PATH, originalManifest);
  } else if (!hadManifest && fs.existsSync(MANIFEST_PATH)) {
    fs.unlinkSync(MANIFEST_PATH);
  }
});

const fakeCover: GeneratedCover = {
  slug: "test-post",
  category: "blog",
  imagePath: "public/assets/covers/test-post/cover.png",
  ogImagePath: "public/assets/covers/test-post/og.png",
  width: 1200,
  height: 675,
  prompt: "test prompt",
  promptHash: "abc123",
  model: "gemini-3-pro-image-preview",
  generatedAt: "2026-03-21T00:00:00.000Z",
};

describe("cover-manifest", () => {
  it("returns empty manifest when file does not exist", () => {
    if (fs.existsSync(MANIFEST_PATH)) fs.unlinkSync(MANIFEST_PATH);
    const manifest = readManifest();
    expect(manifest.covers).toEqual([]);
    expect(manifest.generatedAt).toBeDefined();
  });

  it("writes and reads manifest round-trip", () => {
    const manifest: CoverManifest = {
      generatedAt: "2026-03-21T00:00:00.000Z",
      covers: [fakeCover],
    };
    writeManifest(manifest);
    const read = readManifest();
    expect(read.covers).toHaveLength(1);
    expect(read.covers[0].slug).toBe("test-post");
    expect(read.covers[0].promptHash).toBe("abc123");
  });

  it("upserts a new cover into the manifest", () => {
    const manifest: CoverManifest = { generatedAt: "", covers: [] };
    const updated = upsertCover(manifest, fakeCover);
    expect(updated.covers).toHaveLength(1);
    expect(updated.covers[0].slug).toBe("test-post");
  });

  it("upserts an existing cover by slug (replaces)", () => {
    const manifest: CoverManifest = {
      generatedAt: "",
      covers: [fakeCover],
    };
    const updatedCover = { ...fakeCover, prompt: "updated prompt", promptHash: "xyz789" };
    const updated = upsertCover(manifest, updatedCover);
    expect(updated.covers).toHaveLength(1);
    expect(updated.covers[0].prompt).toBe("updated prompt");
    expect(updated.covers[0].promptHash).toBe("xyz789");
  });

  it("getCoverBySlug finds existing cover", () => {
    const manifest: CoverManifest = {
      generatedAt: "",
      covers: [fakeCover],
    };
    const found = getCoverBySlug(manifest, "test-post");
    expect(found?.slug).toBe("test-post");
  });

  it("getCoverBySlug returns undefined for missing slug", () => {
    const manifest: CoverManifest = { generatedAt: "", covers: [] };
    expect(getCoverBySlug(manifest, "nonexistent")).toBeUndefined();
  });
});
