import { Hero } from "../components/Hero";
import { FeaturedCard } from "../components/FeaturedCard";
import { ContentGrid } from "../components/ContentGrid";
import { TrendingTags } from "../components/TrendingTags";
import { siteProfile } from "../lib/site";
import { getAllPosts, getFeaturedPost, toPostCard } from "../lib/posts";
import { computeTrendingTags } from "../lib/trending";

export function Home() {
  const featured = getFeaturedPost();
  const allPosts = getAllPosts();
  const gridPosts = allPosts
    .filter((p) => !p.featured)
    .map(toPostCard);
  const trendingTags = computeTrendingTags();

  return (
    <div>
      <Hero profile={siteProfile} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 space-y-12">
        <TrendingTags tags={trendingTags} />

        {featured ? (
          <FeaturedCard post={toPostCard(featured)} />
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-500">
            Coming soon — stay tuned.
          </div>
        )}

        {gridPosts.length > 0 && <ContentGrid posts={gridPosts} />}
      </div>
    </div>
  );
}
