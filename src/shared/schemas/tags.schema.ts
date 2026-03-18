import { z } from "zod";

export const TrendingTagSchema = z.object({
  tag: z.string(),
  displayName: z.string(),
  count: z.number().int().min(1),
  score: z.number().min(0).max(100),
  rank: z.number().int().min(1),
});
export type TrendingTag = z.infer<typeof TrendingTagSchema>;
