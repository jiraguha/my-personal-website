import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import type { PostFrontmatter } from "@shared/schemas/site.schema";
import type { GeneratedCover } from "@shared/schemas/cover-manifest.schema";
import { loadDa } from "./cover-da";

const MODEL = "gemini-3-pro-image-preview";
const COVER_WIDTH = 1200;
const COVER_HEIGHT = 675;
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

function buildPrompt(post: PostFrontmatter): string {
  const keywords = post.coverKeywords?.length
    ? post.coverKeywords
    : post.tags?.length
      ? post.tags
      : post.title.split(/\s+/).filter((w) => w.length > 3).slice(0, 5);

  const keywordsStr = keywords.join(", ");

  if (post.coverHint) {
    return [
      `Generate a cover image for a ${post.category} post.`,
      `Title: "${post.title.slice(0, 120)}"`,
      `Keywords to visualize: ${keywordsStr}`,
      `Diagram hint: ${post.coverHint}`,
    ].join("\n");
  }

  return [
    `Generate a cover image for a ${post.category} post.`,
    `Title: "${post.title.slice(0, 120)}"`,
    `Summary: "${post.summary}"`,
    `Keywords to visualize: ${keywordsStr}`,
  ].join("\n");
}

function getOutputDir(slug: string): string {
  return path.resolve(process.cwd(), "public/assets/covers", slug);
}

export async function generateCover(post: PostFrontmatter): Promise<GeneratedCover> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY not set. Get one at https://aistudio.google.com/apikey"
    );
  }

  const da = loadDa(post.coverDa);
  const userPrompt = buildPrompt(post);
  const fullPrompt = `${da}\n\n---\n\n${userPrompt}`;

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
  const ogPath = path.join(outputDir, "og.png");

  // Save cover at target dimensions
  await sharp(imageBuffer)
    .resize(COVER_WIDTH, COVER_HEIGHT, { fit: "cover" })
    .png()
    .toFile(coverPath);

  // Save OG image at 1200x630
  await sharp(imageBuffer)
    .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover" })
    .png()
    .toFile(ogPath);

  console.log(`  Saved: ${coverPath}`);
  console.log(`  Saved: ${ogPath}`);

  return {
    slug: post.slug,
    category: post.category,
    imagePath: `public/assets/covers/${post.slug}/cover.png`,
    ogImagePath: `public/assets/covers/${post.slug}/og.png`,
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    prompt: fullPrompt,
    model: MODEL,
    generatedAt: new Date().toISOString(),
    seed: post.coverSeed,
  };
}

export { buildPrompt, getOutputDir };
