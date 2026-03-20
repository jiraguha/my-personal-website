import { getAllPosts, getFeaturedPost, toPostCard } from "../../src/ui/lib/posts";
import { computeTrendingTags } from "../../src/ui/lib/trending";
import { siteProfile } from "../../src/ui/lib/site";
import type { PostCard } from "@shared/schemas/site.schema";
import type { TrendingTag } from "@shared/schemas/tags.schema";
import type { SiteProfile } from "@shared/schemas/site.schema";

export type Data = {
  featuredPost: PostCard | null;
  gridPosts: PostCard[];
  trendingTags: TrendingTag[];
  profile: SiteProfile;
};

export function data(): Data {
  const featured = getFeaturedPost();
  const allPosts = getAllPosts();
  const gridPosts = allPosts.filter((p) => !p.featured).map(toPostCard);
  const trendingTags = computeTrendingTags(5);

  return {
    featuredPost: featured ? toPostCard(featured) : null,
    gridPosts,
    trendingTags,
    profile: siteProfile,
  };
}
