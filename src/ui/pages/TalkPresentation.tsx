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
import { MermaidDiagram } from "../components/MermaidDiagram";

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
      return <MermaidDiagram code={String(children)} />;
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
    <div style={{ width: "100vw", height: "100vh", background: "#0b0f19", overflow: "hidden" }}>
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
