import { z } from "zod";

export const OGTypeSchema = z.enum(["website", "article", "profile"]);
export type OGType = z.infer<typeof OGTypeSchema>;

export const OGImageSchema = z.object({
  url: z.string(),
  width: z.number(),
  height: z.number(),
  alt: z.string(),
  type: z.string(),
});
export type OGImage = z.infer<typeof OGImageSchema>;

export const ArticleMetaSchema = z.object({
  publishedTime: z.string(),
  modifiedTime: z.string().optional(),
  author: z.string(),
  tags: z.array(z.string()),
  section: z.string(),
});
export type ArticleMeta = z.infer<typeof ArticleMetaSchema>;

export const PageMetaSchema = z.object({
  title: z.string(),
  description: z.string(),
  url: z.string(),
  type: OGTypeSchema,
  image: OGImageSchema,
  siteName: z.string(),
  locale: z.string(),
  twitterCard: z.enum(["summary_large_image", "summary"]),
  twitterSite: z.string().optional(),
  article: ArticleMetaSchema.optional(),
  jsonLd: z.record(z.unknown()).optional(),
});
export type PageMeta = z.infer<typeof PageMetaSchema>;
