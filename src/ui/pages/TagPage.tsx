import { useParams, Link } from "react-router-dom";
import { getPostsByTag, toPostCard } from "../lib/posts";
import { getTrendingTagSet } from "../lib/trending";
import { PostCard } from "../components/PostCard";

export function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  const posts = tag ? getPostsByTag(tag) : [];
  const isTrending = tag ? getTrendingTagSet().has(tag.toLowerCase()) : false;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors"
      >
        ← Back to home
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          #{tag}
        </h1>
        {isTrending && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
            🔥 Trending
          </span>
        )}
      </div>
      <p className="text-gray-500 dark:text-gray-500 mb-8">
        {posts.length} post{posts.length !== 1 ? "s" : ""}
      </p>

      {posts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-500">No posts with this tag.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((p) => (
            <PostCard key={p.slug} post={toPostCard(p)} />
          ))}
        </div>
      )}
    </div>
  );
}
