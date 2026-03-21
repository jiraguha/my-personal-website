---
title: "Why I Replaced Node.js with Bun for Every New Project"
slug: "bun-for-backend"
date: "2025-12-05"
summary: "Bun is fast, ships native TypeScript, and has a test runner built in. Here's why it's my default runtime for new backend projects."
cover: ""
coverText: "none"
tags: [bun, typescript, dx]
category: blog
featured: false
draft: false
---

# Why I Replaced Node.js with Bun

I switched every new backend project to Bun six months ago. Here's an honest take on what's better, what's worse, and whether it's worth it.

## What's Actually Better

**Native TypeScript** — no ts-node, tsx, esbuild wrapper, or transpilation step. You just run the file. This alone saves 10+ minutes of setup per project.

**Speed** — startup time is genuinely faster. For serverless functions and CLIs, this is meaningful. For long-running servers, less so.

**Built-in test runner** — `bun test` is Jest-compatible and fast. One less dependency, one less config file.

**`Bun.file()` and `Bun.serve()`** — the built-in HTTP server and file APIs are pleasant to use and cover most use cases without reaching for external packages.

## What's Not Better (Yet)

**Ecosystem compatibility** — most packages work, but a few native Node.js addons don't. Check before committing.

**Debugging** — the `bun --inspect` workflow is improving but not as polished as the Node.js/Chrome DevTools experience yet.

**Documentation** — Bun's docs are good but not as comprehensive as Node.js's. Stack Overflow has 15 years of Node.js answers; Bun answers are sparse.

## My Decision Rule

If it's a new project and I'm writing TypeScript anyway: **Bun**. The DX gains are real and the ecosystem gaps haven't bitten me.

If I'm maintaining an existing Node.js codebase or relying on specific native addons: **stick with Node.js**.

## A Minimal Bun Server

```typescript
const server = Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/health") {
      return Response.json({ status: "ok" });
    }
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Listening on http://localhost:${server.port}`);
```

That's a full HTTP server. No imports, no boilerplate. I'll take it.
