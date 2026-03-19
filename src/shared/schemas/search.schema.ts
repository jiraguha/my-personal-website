import { z } from "zod";
import { ContentCategorySchema } from "./site.schema";

/** Lightweight search index entry — one per post, built at load time */
export const SearchEntrySchema = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  tags: z.array(z.string()),
  category: ContentCategorySchema,
  date: z.string(),
});

export type SearchEntry = z.infer<typeof SearchEntrySchema>;
