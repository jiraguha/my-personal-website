import type { Post } from "./posts";

export type SkipReason = "coverNone" | "hasCover" | null;

/**
 * Decides whether cover generation should be skipped for a post.
 *
 * Decision tree:
 *   coverNone: true                          → SKIP (explicit opt-out)
 *   cover set in frontmatter (not auto-resolved) → SKIP (already has a cover)
 *   cover empty or auto-resolved             → GENERATE
 */
export function shouldSkipCover(post: Post): SkipReason {
  if (post.coverNone) return "coverNone";
  // Only skip if cover was explicitly set in frontmatter, not auto-resolved
  if (post.cover && !post.coverAutoResolved) return "hasCover";
  return null;
}

export function skipReasonLabel(reason: SkipReason): string {
  switch (reason) {
    case "coverNone": return "coverNone=true";
    case "hasCover": return "cover already set";
    default: return "";
  }
}
