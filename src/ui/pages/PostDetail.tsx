import { useParams, Link, Navigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { getPostBySlug } from "../lib/posts";
import { TagChip } from "../components/TagChip";
import { ShortBadge } from "../components/ShortBadge";
import { MermaidDiagram } from "../components/MermaidDiagram";

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
    return <code className={className} {...props}>{children}</code>;
  },
};

export function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : undefined;

  if (!post) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-8 transition-colors"
      >
        ← Back to home
      </Link>

      {/* Header */}
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

      {/* Cover — skipped for shorts */}
      {post.cover && post.category !== "short" && (
        <div className="mb-10 rounded-xl overflow-hidden">
          <img src={post.cover} alt="" className="w-full" />
        </div>
      )}

      {/* Content */}
      <article className="prose prose-gray dark:prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent prose-code:before:content-none prose-code:after:content-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={markdownComponents}
        >
          {post.content}
        </ReactMarkdown>
      </article>

      {/* Footer nav */}
      <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
        <Link
          to="/"
          className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline"
        >
          ← Back to all posts
        </Link>
      </div>
    </div>
  );
}
