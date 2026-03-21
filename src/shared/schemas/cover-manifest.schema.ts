import { z } from "zod";

export const GeneratedCoverSchema = z.object({
  slug: z.string(),
  category: z.string(),
  imagePath: z.string(),
  ogImagePath: z.string(),
  width: z.number(),
  height: z.number(),
  prompt: z.string(),
  model: z.string(),
  promptHash: z.string().optional(),
  generatedAt: z.string(),
  seed: z.number().optional(),
});
export type GeneratedCover = z.infer<typeof GeneratedCoverSchema>;

export const CoverManifestSchema = z.object({
  generatedAt: z.string(),
  covers: z.array(GeneratedCoverSchema),
});
export type CoverManifest = z.infer<typeof CoverManifestSchema>;
