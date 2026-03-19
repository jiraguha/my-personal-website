import { useState, useMemo, useCallback } from "react";
import { PostCard } from "./PostCard";
import { PostSearch } from "./PostSearch";
import { CategoryFilter } from "./CategoryFilter";
import { createSearchIndex, searchPosts } from "../lib/search";
import type { PostCard as PostCardType, ContentCategory } from "@shared/schemas/site.schema";

type FilterOption = ContentCategory | "all";

interface ContentGridProps {
  posts: PostCardType[];
}

export function ContentGrid({ posts }: ContentGridProps) {
  const [filter, setFilter] = useState<FilterOption>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const searchIndex = useMemo(() => createSearchIndex(posts), [posts]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const filtered = useMemo(() => {
    let result = filter === "all" ? posts : posts.filter((p) => p.category === filter);

    const trimmed = searchQuery.trim();
    if (trimmed.length >= 2) {
      const matchingSlugs = searchPosts(searchIndex, trimmed);
      result = result.filter((p) => matchingSlugs.has(p.slug));
    }

    return result;
  }, [posts, filter, searchQuery, searchIndex]);

  const isSearchActive = searchQuery.trim().length >= 2;

  const emptyMessage = () => {
    if (isSearchActive && filtered.length === 0) {
      return (
        <div className="text-center py-16 text-gray-500 dark:text-gray-500">
          <p>No posts matching &lsquo;{searchQuery.trim()}&rsquo;</p>
          <button
            onClick={handleClearSearch}
            className="mt-2 text-indigo-500 hover:text-indigo-400 text-sm underline"
          >
            Clear search
          </button>
        </div>
      );
    }
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-500">
        {filter === "short" ? "No shorts yet." : `No ${filter === "all" ? "" : filter + " "}posts yet.`}
      </div>
    );
  };

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <PostSearch
          query={searchQuery}
          onChange={handleSearchChange}
          resultCount={isSearchActive ? filtered.length : null}
        />
        <CategoryFilter active={filter} onChange={setFilter} />
      </div>

      {filtered.length === 0 ? (
        emptyMessage()
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-live="polite">
          {filtered.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}
