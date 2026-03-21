import { TagChip } from "./TagChip";
import { ShortBadge } from "./ShortBadge";
import type { PostCard as PostCardType } from "@shared/schemas/site.schema";

interface PostCardProps {
  post: PostCardType;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const categoryColors: Record<string, string> = {
  blog: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  project: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  talk: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
};

export function PostCard({ post }: PostCardProps) {
  const href = post.externalUrl || `/posts/${post.slug}`;
  const isExternal = !!post.externalUrl;
  const isShort = post.category === "short";

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    isExternal ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block group">
        {children}
      </a>
    ) : (
      <a href={href} className="block group">
        {children}
      </a>
    );

  if (isShort) {
    return (
      <Wrapper>
        <article className="rounded-xl border border-violet-200 dark:border-violet-900/50 bg-white dark:bg-gray-900/80 hover:border-violet-400 dark:hover:border-violet-700 transition-colors flex flex-col p-4">
          <div className="flex items-center justify-between mb-2">
            <ShortBadge />
            <time className="text-xs text-gray-500 dark:text-gray-400">{formatDate(post.date)}</time>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1.5 text-sm sm:text-base line-clamp-2">
            {post.title}
          </h3>
          {post.summary && (
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2 flex-1">
              {post.summary}
            </p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            {post.tags.slice(0, 3).map((t) => (
              <TagChip key={t} tag={t} clickable={false} />
            ))}
          </div>
        </article>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <article className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors h-full flex flex-col">
        {/* Cover */}
        <div className="h-32 bg-gradient-to-br from-indigo-400 via-violet-400 to-purple-500 relative overflow-hidden">
          {post.cover && (
            <picture>
              <source srcSet={post.cover.replace(/\.png$/, ".webp")} type="image/webp" />
              <img src={post.cover} alt={`Cover image for ${post.title}`} className="w-full h-full object-cover" />
            </picture>
          )}
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${categoryColors[post.category] ?? ""}`}>
              {post.category}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex flex-wrap gap-1 mb-2">
            {post.tags.slice(0, 3).map((t) => (
              <TagChip key={t} tag={t} clickable={false} />
            ))}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1 line-clamp-2 text-sm sm:text-base">
            {post.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2 flex-1">
            {post.summary}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <time className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(post.date)}
            </time>
            <div className="flex items-center gap-2">
              {post.category === "talk" && !post.externalSlides && (
                <span className="text-xs font-medium text-violet-500 dark:text-violet-400">▶ Slides</span>
              )}
              <span className="text-indigo-500 dark:text-indigo-400 text-sm font-medium">→</span>
            </div>
          </div>
        </div>
      </article>
    </Wrapper>
  );
}
