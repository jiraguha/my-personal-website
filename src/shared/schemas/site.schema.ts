import { z } from "zod";

export const ContentCategorySchema = z.enum(["blog", "project", "talk", "short"]);
export type ContentCategory = z.infer<typeof ContentCategorySchema>;

export const PostFrontmatterSchema = z.object({
  title: z.string(),
  slug: z.string(),
  date: z.string(),
  updated: z.string().optional(),
  summary: z.string(),
  cover: z.string().optional().default(""),
  tags: z.array(z.string()).default([]),
  category: ContentCategorySchema,
  featured: z.boolean().optional().default(false),
  draft: z.boolean().optional().default(false),
  externalUrl: z.string().optional(),
  // Talk-specific fields
  event: z.string().optional(),
  eventUrl: z.string().optional(),
  eventDate: z.string().optional(),
  videoUrl: z.string().optional(),
  externalSlides: z.string().optional(),
});
export type PostFrontmatter = z.infer<typeof PostFrontmatterSchema>;

export const PostCardSchema = PostFrontmatterSchema.pick({
  title: true,
  slug: true,
  date: true,
  summary: true,
  cover: true,
  tags: true,
  category: true,
  featured: true,
  externalUrl: true,
  externalSlides: true,
});
export type PostCard = z.infer<typeof PostCardSchema>;

export const SiteProfileSchema = z.object({
  name: z.string(),
  role: z.string(),
  org: z.string(),
  bio: z.string(),
  avatar: z.string(),
  socials: z.object({
    github: z.string().optional(),
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    email: z.string().optional(),
    resume: z.string().startsWith("/assets/").optional(),
  }),
});
export type SiteProfile = z.infer<typeof SiteProfileSchema>;
