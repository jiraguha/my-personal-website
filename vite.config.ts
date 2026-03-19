import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";

/** Transforms `.md?raw` (and `?import&raw`) imports into JS modules at dev and build time. */
function markdownRawPlugin(): Plugin {
  const isMarkdownRaw = (id: string) => {
    const [path, query = ""] = id.split("?");
    return path.endsWith(".md") && query.split("&").includes("raw");
  };

  return {
    name: "markdown-raw",
    enforce: "pre",

    // Build-time: handle `.md?raw` and `.md?import&raw` as module loads
    load(id) {
      if (!isMarkdownRaw(id)) return;
      const [filePath] = id.split("?");
      const content = fs.readFileSync(filePath, "utf-8");
      return `export default ${JSON.stringify(content)}`;
    },

    // Dev-time: intercept HTTP requests BEFORE Vite's static file middleware
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        const [pathname, query = ""] = url.split("?");
        if (!pathname.endsWith(".md")) return next();
        if (!query.split("&").includes("raw")) return next();

        const root = server.config.root;
        const filePath = `${root}${pathname}`;
        try {
          const content = fs.readFileSync(filePath, "utf-8");
          const js = `export default ${JSON.stringify(content)}`;
          res.setHeader("Content-Type", "application/javascript");
          res.end(js);
        } catch {
          next();
        }
      });
    },
  };
}

const contentDir = process.env.CONTENT_DIR || "src/content";

export default defineConfig({
  plugins: [markdownRawPlugin(), tailwindcss(), react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@shared": "/src/shared",
      "@content": path.resolve(__dirname, contentDir),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["test/lib/**/*.test.ts"],
  },
});
