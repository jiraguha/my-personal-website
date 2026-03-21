import fs from "node:fs";
import path from "node:path";
import {
  CoverManifestSchema,
  type CoverManifest,
  type GeneratedCover,
} from "@shared/schemas/cover-manifest.schema";

const MANIFEST_PATH = path.resolve(process.cwd(), "public/assets/covers.manifest.json");

export function readManifest(): CoverManifest {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return { generatedAt: new Date().toISOString(), covers: [] };
  }
  const raw = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  return CoverManifestSchema.parse(raw);
}

export function writeManifest(manifest: CoverManifest): void {
  const dir = path.dirname(MANIFEST_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
}

export function upsertCover(manifest: CoverManifest, cover: GeneratedCover): CoverManifest {
  const existing = manifest.covers.findIndex((c) => c.slug === cover.slug);
  const covers = [...manifest.covers];
  if (existing >= 0) {
    covers[existing] = cover;
  } else {
    covers.push(cover);
  }
  return { generatedAt: new Date().toISOString(), covers };
}

export function getCoverBySlug(manifest: CoverManifest, slug: string): GeneratedCover | undefined {
  return manifest.covers.find((c) => c.slug === slug);
}
