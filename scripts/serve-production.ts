#!/usr/bin/env bun
/**
 * Minimal production SSR server for the Vike build.
 * Serves static assets from dist/client/ and renders pages via Vike's renderPage.
 *
 * Usage: bun run scripts/serve-production.ts
 * Port: SEO_PORT env var (default: 4174)
 */
import { renderPage } from "vike/server";
import { join } from "node:path";

const PORT = parseInt(process.env.SEO_PORT ?? "4174", 10);
const CLIENT_DIR = join(import.meta.dirname, "..", "dist", "client");

const server = Bun.serve({
  port: PORT,

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // Serve static assets from dist/client/
    const staticFile = Bun.file(join(CLIENT_DIR, url.pathname));
    if (await staticFile.exists()) {
      return new Response(staticFile);
    }

    // SSR: render page via Vike
    const pageContext = await renderPage({ urlOriginal: req.url });
    const { httpResponse } = pageContext;

    if (!httpResponse) {
      return new Response("Not Found", { status: 404 });
    }

    const headers = new Headers();
    for (const [name, value] of httpResponse.headers) {
      headers.set(name, value);
    }

    return new Response(httpResponse.body, {
      status: httpResponse.statusCode,
      headers,
    });
  },
});

console.log(`Production server listening on http://localhost:${server.port}`);
