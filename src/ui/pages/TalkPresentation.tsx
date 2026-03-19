import { useEffect, useRef, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import Reveal from "reveal.js";
import type { RevealApi } from "reveal.js";
import Markdown from "reveal.js/plugin/markdown";
import Highlight from "reveal.js/plugin/highlight";
import Notes from "reveal.js/plugin/notes";
import "reveal.js/reveal.css";
import "./talk-presentation.css";
import { getPostBySlug } from "../lib/posts";

export function TalkPresentation() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : undefined;

  const deckRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const revealRef = useRef<RevealApi | null>(null);
  const [backVisible, setBackVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Back-button fade logic
  useEffect(() => {
    const show = () => {
      setBackVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setBackVisible(false), 3000);
    };

    // Hide after initial 3s
    hideTimerRef.current = setTimeout(() => setBackVisible(false), 3000);
    window.addEventListener("mousemove", show);
    window.addEventListener("touchstart", show);

    return () => {
      window.removeEventListener("mousemove", show);
      window.removeEventListener("touchstart", show);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!deckRef.current || !post || !textareaRef.current) return;

    // Set markdown content on textarea before Reveal reads it
    textareaRef.current.textContent = post.content;

    const deck = new Reveal(deckRef.current, {
      plugins: [Markdown, Highlight, Notes],
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
  }, [post?.slug]); // re-init only if slug changes

  if (!post || post.category !== "talk" || post.externalSlides) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#0b0f19", overflow: "hidden" }}>
      <div className="reveal" ref={deckRef}>
        <div className="slides">
          <section
            data-markdown=""
            data-separator="^\r?\n---\r?\n"
            data-separator-vertical="^\r?\n----\r?\n"
            data-separator-notes="^Note:"
          >
            <textarea ref={textareaRef} data-template readOnly style={{ display: "none" }} />
          </section>
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
