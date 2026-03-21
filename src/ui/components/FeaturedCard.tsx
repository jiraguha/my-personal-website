import { TagChip } from "./TagChip";
import type { PostCard } from "@shared/schemas/site.schema";

interface FeaturedCardProps {
  post: PostCard;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function categoryLabel(cat: string) {
  return { blog: "Blog", project: "Project", talk: "Talk" }[cat] ?? cat;
}

export function FeaturedCard({ post }: FeaturedCardProps) {
  const href = post.externalUrl || `/posts/${post.slug}`;
  const isExternal = !!post.externalUrl;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group">
      {/* Cover */}
      <div className="h-48 sm:h-64 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 relative overflow-hidden">
        {post.cover && (
          <img src={post.cover} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-indigo-700 uppercase tracking-wide">
            Latest · {categoryLabel(post.category)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.map((t) => (
            <TagChip key={t} tag={t} />
          ))}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
          {post.title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4 line-clamp-3">
          {post.summary}
        </p>
        <div className="flex items-center justify-between">
          <time className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(post.date)}
          </time>
          {isExternal ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 font-medium text-sm hover:underline"
            >
              Read →
            </a>
          ) : (
            <a
              href={href}
              className="text-indigo-600 dark:text-indigo-400 font-medium text-sm hover:underline"
            >
              Read →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
