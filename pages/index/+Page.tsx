import { useData } from "vike-react/useData";
import { Hero } from "../../src/ui/components/Hero";
import { FeaturedCard } from "../../src/ui/components/FeaturedCard";
import { ContentGrid } from "../../src/ui/components/ContentGrid";
import { TrendingTags } from "../../src/ui/components/TrendingTags";
import { SectionDivider } from "../../src/ui/components/SectionDivider";
import type { Data } from "./+data";

export function Page() {
  const { featuredPost, gridPosts, trendingTags, profile } = useData<Data>();

  return (
    <div>
      <Hero profile={profile} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 space-y-12">
        <section className="space-y-6">
          <SectionDivider label="Featured Article" />
          {featuredPost ? (
            <FeaturedCard post={featuredPost} />
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-500">
              Coming soon — stay tuned.
            </div>
          )}
        </section>

        <TrendingTags tags={trendingTags} />

        {gridPosts.length > 0 && (
          <section className="space-y-6">
            <SectionDivider label="Latest Posts" />
            <ContentGrid posts={gridPosts} />
          </section>
        )}
      </div>
    </div>
  );
}
