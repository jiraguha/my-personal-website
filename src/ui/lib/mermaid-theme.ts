import type { MermaidConfig } from "mermaid";

export const mermaidConfig: MermaidConfig = {
  startOnLoad: false,
  theme: "base",
  themeVariables: {
    primaryColor: "#0d9488",        // teal-600
    primaryTextColor: "#e2e8f0",    // slate-200
    primaryBorderColor: "#0f766e",  // teal-700
    lineColor: "#334155",           // slate-700
    secondaryColor: "#134e4a",      // teal-950
    tertiaryColor: "#0b0f19",
    background: "#111827",          // gray-900
    mainBkg: "#111827",
    nodeBorder: "#0f766e",
    clusterBkg: "rgba(13,148,136,0.08)",
    clusterBorder: "#334155",
    titleColor: "#e2e8f0",
    edgeLabelBackground: "#111827",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    fontSize: "14px",
  },
};
