import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import type { PostFrontmatter } from "@shared/schemas/site.schema";
import type { GeneratedCover } from "@shared/schemas/cover-manifest.schema";
import { loadDa } from "./cover-da";

const MODEL = process.env.COVER_MODEL ?? "gemini-3-pro-image-preview";
const COVER_WIDTH = parseInt(process.env.COVER_WIDTH ?? "1200", 10);
const COVER_HEIGHT = parseInt(process.env.COVER_HEIGHT ?? "675", 10);
const OG_WIDTH = parseInt(process.env.OG_WIDTH ?? "1200", 10);
const OG_HEIGHT = parseInt(process.env.OG_HEIGHT ?? "630", 10);

const TEXT_LEVEL_INSTRUCTIONS: Record<string, string> = {
  none: "TEXT DENSITY: No text whatsoever — purely visual, no labels, no titles, no status bars. The image communicates entirely through shapes, colors, and composition.",
  minimal: "TEXT DENSITY: At most 1-3 very short labels (1-2 words each), no title rendered in the image. Let the visuals do the talking.",
  moderate: "TEXT DENSITY: Short labels plus an optional brief title, maximum 5 text elements total. Text supports the visual, not the other way around.",
  heavy: "TEXT DENSITY: Title, labels, and status bar text are all welcome — text is a key visual element of this cover. Think full HUD with readouts.",
};

const DEFAULT_TEXT_LEVEL = "minimal";

function buildPrompt(post: PostFrontmatter): string {
  const keywords = post.coverKeywords?.length
    ? post.coverKeywords
    : post.tags?.length
      ? post.tags
      : post.title.split(/\s+/).filter((w) => w.length > 3).slice(0, 5);

  const keywordsStr = keywords.join(", ");
  const textLevel = post.coverText ?? DEFAULT_TEXT_LEVEL;
  const textInstruction = TEXT_LEVEL_INSTRUCTIONS[textLevel];

  if (post.coverHint) {
    return [
      `Generate a cover image for a ${post.category} post.`,
      `Title: "${post.title.slice(0, 120)}"`,
      `Keywords to visualize: ${keywordsStr}`,
      `Diagram hint: ${post.coverHint}`,
      textInstruction,
    ].join("\n");
  }

  return [
    `Generate a cover image for a ${post.category} post.`,
    `Title: "${post.title.slice(0, 120)}"`,
    `Summary: "${post.summary}"`,
    `Keywords to visualize: ${keywordsStr}`,
    textInstruction,
  ].join("\n");
}

function getOutputDir(slug: string): string {
  return path.resolve(process.cwd(), "public/assets/covers", slug);
}

export function buildFullPrompt(post: PostFrontmatter): string {
  const da = loadDa(post.coverDa);
  const userPrompt = buildPrompt(post);
  return `${da}\n\n---\n\n${userPrompt}`;
}

export function hashPrompt(prompt: string): string {
  return crypto.createHash("sha256").update(prompt).digest("hex").slice(0, 16);
}

export async function generateCover(post: PostFrontmatter): Promise<GeneratedCover> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY not set. Get one at https://aistudio.google.com/apikey"
    );
  }

  const fullPrompt = buildFullPrompt(post);

  const genai = new GoogleGenAI({ apiKey });

  console.log(`  Generating cover for "${post.slug}"...`);

  const response = await genai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    config: {
      responseModalities: ["image", "text"],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) {
    throw new Error(`No response parts for "${post.slug}"`);
  }

  const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith("image/"));
  if (!imagePart?.inlineData?.data) {
    throw new Error(`No image data in response for "${post.slug}"`);
  }

  const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");

  const outputDir = getOutputDir(post.slug);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const coverPath = path.join(outputDir, "cover.png");
  const coverWebpPath = path.join(outputDir, "cover.webp");
  const ogPath = path.join(outputDir, "og.png");

  // Save cover at target dimensions (PNG + WebP)
  const resizedCover = sharp(imageBuffer).resize(COVER_WIDTH, COVER_HEIGHT, { fit: "cover" });
  await resizedCover.clone().png().toFile(coverPath);
  await resizedCover.clone().webp({ quality: 80 }).toFile(coverWebpPath);

  // Save OG image at 1200x630 (PNG only — social platforms need PNG)
  await sharp(imageBuffer)
    .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover" })
    .png()
    .toFile(ogPath);

  console.log(`  Saved: ${coverPath}`);
  console.log(`  Saved: ${coverWebpPath}`);
  console.log(`  Saved: ${ogPath}`);

  return {
    slug: post.slug,
    category: post.category,
    imagePath: `public/assets/covers/${post.slug}/cover.png`,
    ogImagePath: `public/assets/covers/${post.slug}/og.png`,
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    prompt: fullPrompt,
    promptHash: hashPrompt(fullPrompt),
    model: MODEL,
    generatedAt: new Date().toISOString(),
    seed: post.coverSeed,
  };
}

export { buildPrompt, getOutputDir };
