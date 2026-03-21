#!/usr/bin/env bun
/**
 * Generates sitemap.xml and robots.txt in dist/ after Vite build.
 * Reads posts from the content directory to build URL list.
 */
import fs from "node:fs";
import path from "node:path";
import { getAllPosts, getAllTags } from "../src/ui/lib/posts";

const SITE_URL = (process.env.SITE_URL ?? "http://localhost:4173").replace(/\/$/, "");
const DIST = path.resolve(process.cwd(), "dist/client");

function generateSitemapXml(): string {
  const posts = getAllPosts();
  const tags = getAllTags();

  const urls: Array<{ loc: string; lastmod?: string; changefreq: string }> = [];

  // Home page
  urls.push({ loc: "/", changefreq: "daily" });

  // All published posts
  for (const post of posts) {
    urls.push({
      loc: `/posts/${post.slug}`,
      lastmod: post.updated ?? post.date,
      changefreq: "weekly",
    });
  }

  // All tag pages
  for (const tag of tags) {
    urls.push({
      loc: `/tags/${tag}`,
      changefreq: "weekly",
    });
  }

  const urlEntries = urls
    .map((u) => {
      const lastmod = u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : "";
      return `  <url>
    <loc>${SITE_URL}${u.loc}</loc>${lastmod}
    <changefreq>${u.changefreq}</changefreq>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;
}

function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /
Sitemap: ${SITE_URL}/sitemap.xml
`;
}

function main(): void {
  if (!fs.existsSync(DIST)) {
    console.error(`Error: dist/client/ not found. Run "vite build" first.`);
    process.exit(1);
  }

  const sitemapPath = path.join(DIST, "sitemap.xml");
  const robotsPath = path.join(DIST, "robots.txt");

  fs.writeFileSync(sitemapPath, generateSitemapXml());
  console.log(`Generated: ${sitemapPath}`);

  fs.writeFileSync(robotsPath, generateRobotsTxt());
  console.log(`Generated: ${robotsPath}`);

  const posts = getAllPosts();
  const tags = getAllTags();
  console.log(`Sitemap: ${posts.length} posts, ${tags.length} tags, 1 home = ${posts.length + tags.length + 1} URLs`);
}

main();
