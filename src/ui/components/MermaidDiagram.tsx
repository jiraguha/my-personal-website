import { useEffect, useRef, useState } from "react";
import { mermaidConfig } from "../lib/mermaid-theme";

interface MermaidDiagramProps {
  code: string;
}

let mermaidInitialized = false;

async function getMermaid() {
  const { default: mermaid } = await import("mermaid");
  if (!mermaidInitialized) {
    mermaid.initialize(mermaidConfig);
    mermaidInitialized = true;
  }
  return mermaid;
}

export function MermaidDiagram({ code }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setRendered(false);

    getMermaid()
      .then(async (mermaid) => {
        if (cancelled || !containerRef.current) return;
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        try {
          const { svg } = await mermaid.render(id, code.trim());
          if (cancelled || !containerRef.current) return;
          containerRef.current.innerHTML = svg;
          setRendered(true);
        } catch (err) {
          if (cancelled) return;
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <figure className="my-6">
        <div className="rounded-lg border border-slate-700 bg-gray-900 p-4">
          <p className="text-sm font-semibold text-amber-400 mb-2">⚠ Diagram render error</p>
          <pre className="text-xs text-slate-400 whitespace-pre-wrap break-words">{error}</pre>
        </div>
      </figure>
    );
  }

  return (
    <figure className="my-6 overflow-x-auto">
      {!rendered && (
        <div className="h-24 rounded-lg bg-gray-800 animate-pulse" aria-label="Loading diagram" />
      )}
      <div
        ref={containerRef}
        className={rendered ? "flex justify-center" : "hidden"}
        aria-label="Mermaid diagram"
      />
    </figure>
  );
}
