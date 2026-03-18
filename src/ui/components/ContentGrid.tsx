import { useState } from "react";
import { PostCard } from "./PostCard";
import { CategoryFilter } from "./CategoryFilter";
import type { PostCard as PostCardType, ContentCategory } from "@shared/schemas/site.schema";

type FilterOption = ContentCategory | "all";

interface ContentGridProps {
  posts: PostCardType[];
}

export function ContentGrid({ posts }: ContentGridProps) {
  const [filter, setFilter] = useState<FilterOption>("all");

  const filtered = filter === "all" ? posts : posts.filter((p) => p.category === filter);

  return (
    <section>
      <div className="flex justify-end mb-6">
        <CategoryFilter active={filter} onChange={setFilter} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-500">
          {filter === "short" ? "No shorts yet." : `No ${filter === "all" ? "" : filter + " "}posts yet.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}
