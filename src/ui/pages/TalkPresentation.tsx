import { useEffect, useRef, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import Reveal from "reveal.js";
import type { RevealApi } from "reveal.js";
import Notes from "reveal.js/plugin/notes";
import "reveal.js/reveal.css";
import "./talk-presentation.css";
import { getPostBySlug } from "../lib/posts";
import type { MermaidConfig } from "mermaid";
import { mermaidConfig } from "../lib/mermaid-theme";

const lightMermaidConfig: MermaidConfig = {
  startOnLoad: false,
  theme: "base",
  themeVariables: {
    primaryColor: "#ccfbf1",        // teal-100 — soft fill
    primaryTextColor: "#0f172a",    // slate-900
    primaryBorderColor: "#0d9488",  // teal-600
    lineColor: "#64748b",           // slate-500
    secondaryColor: "#f0fdf4",      // green-50
    tertiaryColor: "#f8fafc",       // slate-50
    background: "#ffffff",
    mainBkg: "#f0fdfa",             // teal-50
    nodeBorder: "#0d9488",
    clusterBkg: "rgba(13,148,136,0.06)",
    clusterBorder: "#94a3b8",
    titleColor: "#0f172a",
    edgeLabelBackground: "#f8fafc",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    fontSize: "14px",
  },
};

function SlideMermaid({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = document.documentElement.classList.contains("dark");

  useEffect(() => {
    let cancelled = false;
    import("mermaid").then(async ({ default: mermaid }) => {
      if (cancelled || !containerRef.current) return;
      mermaid.initialize(isDark ? mermaidConfig : lightMermaidConfig);
      const id = `slide-mermaid-${Math.random().toString(36).slice(2)}`;
      try {
        const { svg } = await mermaid.render(id, code.trim());
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = svg;
      } catch {
        if (cancelled || !containerRef.current) return;
        containerRef.current.textContent = "⚠ Diagram failed to render";
      }
    });
    return () => { cancelled = true; };
  }, [code, isDark]);

  return <div ref={containerRef} className="flex justify-center my-4" />;
}

/** Split raw markdown into [horizontal][vertical] slide groups. */
function parseSlides(content: string): string[][] {
  return content
    .split(/\n---\n/)
    .map((hSlide) => hSlide.split(/\n----\n/));
}

/** Strip speaker notes (everything from a line that starts with "Note:"). */
function stripNotes(slide: string): string {
  return slide.replace(/\nNote:[\s\S]*$/, "").trim();
}

function extractText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(extractText).join("");
  return "";
}

const slideComponents: Components = {
  code({ className, children }) {
    const language = /language-(\w+)/.exec(className ?? "")?.[1];
    if (language === "mermaid") {
      return <SlideMermaid code={String(children)} />;
    }
    return <code className={className}>{children}</code>;
  },
  p({ children }) {
    const isLong = extractText(children).length > 60;
    return <p className={isLong ? "long-text" : ""}>{children}</p>;
  },
};

function Slide({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={slideComponents}
    >
      {stripNotes(markdown)}
    </ReactMarkdown>
  );
}

export function TalkPresentation() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : undefined;

  const deckRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<RevealApi | null>(null);
  const [backVisible, setBackVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fade the back-button after 3s of inactivity
  useEffect(() => {
    const show = () => {
      setBackVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setBackVisible(false), 3000);
    };
    hideTimerRef.current = setTimeout(() => setBackVisible(false), 3000);
    window.addEventListener("mousemove", show);
    window.addEventListener("touchstart", show);
    return () => {
      window.removeEventListener("mousemove", show);
      window.removeEventListener("touchstart", show);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // Initialize Reveal after React has rendered all <section> slides
  useEffect(() => {
    if (!deckRef.current || !post) return;

    const deck = new Reveal(deckRef.current, {
      plugins: [Notes],
      hash: true,
      slideNumber: "c/t",
      progress: true,
      transition: "slide",
      backgroundTransition: "fade",
      width: 1280,
      height: 720,
      margin: 0.06,
      controls: true,
      center: true,
    });

    deck.initialize();
    revealRef.current = deck;

    return () => {
      revealRef.current?.destroy();
      revealRef.current = null;
    };
  }, [post?.slug]);

  if (!post || post.category !== "talk" || post.externalSlides) {
    return <Navigate to="/404" replace />;
  }

  const slides = parseSlides(post.content);

  return (
    <div className="talk-deck-wrapper">
      <div className="reveal" ref={deckRef}>
        <div className="slides">
          {slides.map((hGroup, hIdx) =>
            hGroup.length === 1 ? (
              <section key={hIdx}>
                <Slide markdown={hGroup[0]} />
              </section>
            ) : (
              <section key={hIdx}>
                {hGroup.map((vSlide, vIdx) => (
                  <section key={vIdx}>
                    <Slide markdown={vSlide} />
                  </section>
                ))}
              </section>
            )
          )}
        </div>
      </div>

      <Link
        to={`/posts/${post.slug}`}
        className={`talk-back-btn${backVisible ? "" : " hidden"}`}
      >
        ← Back to site
      </Link>
    </div>
  );
}
