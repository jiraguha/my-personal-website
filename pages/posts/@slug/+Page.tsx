import { useData } from "vike-react/useData";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { TagChip } from "../../../src/ui/components/TagChip";
import { ShortBadge } from "../../../src/ui/components/ShortBadge";
import { MermaidDiagram } from "../../../src/ui/components/MermaidDiagram";
import type { Data } from "./+data";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const language = /language-(\w+)/.exec(className ?? "")?.[1];
    if (language === "mermaid") {
      return <MermaidDiagram code={String(children)} />;
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

function TalkLanding({
  post,
}: {
  post: Data["post"];
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <a
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors"
      >
        ← Back to home
      </a>

      {post.cover && (
        <div className="mb-8 rounded-xl overflow-hidden">
          <img src={post.cover} alt="" className="w-full" />
        </div>
      )}

      <header className="mb-8">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.map((t: string) => (
            <TagChip key={t} tag={t} />
          ))}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-3">
          {post.title}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
          {post.summary}
        </p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
          <time>{formatDate(post.date)}</time>
          {post.event &&
            (post.eventUrl ? (
              <a
                href={post.eventUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-600 dark:text-violet-400 hover:underline"
              >
                {post.event}
              </a>
            ) : (
              <span className="text-violet-600 dark:text-violet-400">
                {post.event}
              </span>
            ))}
          <span className="px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 text-xs font-medium">
            talk
          </span>
        </div>
      </header>

      <div className="flex flex-wrap gap-3 mb-10">
        {post.externalSlides ? (
          <a
            href={post.externalSlides}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
          >
            ▶ View External Slides →
          </a>
        ) : (
          <a
            href={`/talks/${post.slug}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
          >
            ▶ View Slides →
          </a>
        )}
        {post.videoUrl && (
          <a
            href={post.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            ▷ Watch Recording →
          </a>
        )}
      </div>

      {post.content.trim() && (
        <article className="prose prose-gray dark:prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent prose-code:before:content-none prose-code:after:content-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={markdownComponents}
          >
            {post.content}
          </ReactMarkdown>
        </article>
      )}

      <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
        <a
          href="/"
          className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline"
        >
          ← Back to all posts
        </a>
      </div>
    </div>
  );
}

export function Page() {
  const { post } = useData<Data>();

  if (post.category === "talk") {
    return <TalkLanding post={post} />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <a
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors"
      >
        ← Back to home
      </a>

      <header className="mb-10">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.map((t) => (
            <TagChip key={t} tag={t} />
          ))}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-4">
          {post.title}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
          {post.summary}
        </p>
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
          <time>{formatDate(post.date)}</time>
          {post.updated && <span>Updated {formatDate(post.updated)}</span>}
          {post.category === "short" ? (
            <ShortBadge />
          ) : (
            <span className="capitalize px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium">
              {post.category}
            </span>
          )}
        </div>

        {post.externalUrl && (
          <a
            href={post.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            View original →
          </a>
        )}
      </header>

      {post.cover && post.category !== "short" && (
        <div className="mb-10 rounded-xl overflow-hidden">
          <img src={post.cover} alt="" className="w-full" />
        </div>
      )}

      <article className="prose prose-gray dark:prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent prose-code:before:content-none prose-code:after:content-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={markdownComponents}
        >
          {post.content}
        </ReactMarkdown>
      </article>

      <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
        <a
          href="/"
          className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline"
        >
          ← Back to all posts
        </a>
      </div>
    </div>
  );
}
