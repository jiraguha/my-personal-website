import { useEffect, useRef, useState } from "react";
import { useData } from "vike-react/useData";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import "reveal.js/reveal.css";
import "../../../src/ui/pages/talk-presentation.css";
import { parseSlides, stripNotes } from "../../../src/ui/lib/slides";
import type { MermaidConfig } from "mermaid";
import { mermaidConfig } from "../../../src/ui/lib/mermaid-theme";
import type { Data } from "./+data";

const lightMermaidConfig: MermaidConfig = {
  startOnLoad: false,
  theme: "base",
  themeVariables: {
    primaryColor: "#ccfbf1",
    primaryTextColor: "#0f172a",
    primaryBorderColor: "#0d9488",
    lineColor: "#64748b",
    secondaryColor: "#f0fdf4",
    tertiaryColor: "#f8fafc",
    background: "#ffffff",
    mainBkg: "#f0fdfa",
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
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

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
        containerRef.current.textContent = "Warning: Diagram failed to render";
      }
    });
    return () => {
      cancelled = true;
    };
  }, [code, isDark]);

  return <div ref={containerRef} className="flex justify-center my-4" />;
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

export function Page() {
  const { post } = useData<Data>();
  const deckRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<import("reveal.js").default | null>(null);
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

    let deck: import("reveal.js").default | null = null;

    import("reveal.js").then((Reveal) => {
      import("reveal.js/plugin/notes").then((Notes) => {
        if (!deckRef.current) return;
        deck = new Reveal.default(deckRef.current, {
          plugins: [Notes.default],
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
      });
    });

    return () => {
      revealRef.current?.destroy();
      revealRef.current = null;
    };
  }, [post?.slug]);

  const slides = parseSlides(post.content);

  return (
    <>
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
              ),
            )}
          </div>
        </div>
      </div>

      <a
        href={`/posts/${post.slug}`}
        className={`talk-back-btn${backVisible ? "" : " hidden"}`}
      >
        ← Back to site
      </a>
    </>
  );
}
