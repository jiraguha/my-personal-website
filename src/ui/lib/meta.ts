import type { PageMeta, OGImage } from "@shared/schemas/meta.schema";
import type { PostFrontmatter } from "@shared/schemas/site.schema";
import { siteProfile, SITE_URL } from "./site";
import fs from "node:fs";
import path from "node:path";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const DEFAULT_OG_PATH = "/assets/og-default.png";
const MAX_DESCRIPTION_LENGTH = 160;

type PageType = "home" | "post" | "tag" | "404";

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "…";
}

function absUrl(pathname: string): string {
  return `${SITE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

function resolveOgImage(post?: PostFrontmatter): OGImage {
  if (post) {
    const ogPath = `/assets/covers/${post.slug}/og.png`;
    const ogFile = path.resolve(process.cwd(), "public", ogPath.slice(1));
    if (fs.existsSync(ogFile)) {
      return {
        url: absUrl(ogPath),
        width: OG_WIDTH,
        height: OG_HEIGHT,
        alt: `Cover image for ${post.title}`,
        type: "image/png",
      };
    }
  }

  return {
    url: absUrl(DEFAULT_OG_PATH),
    width: OG_WIDTH,
    height: OG_HEIGHT,
    alt: `${siteProfile.name} — ${siteProfile.role}`,
    type: "image/png",
  };
}

function buildArticleJsonLd(post: PostFrontmatter, image: OGImage): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: truncate(post.summary, MAX_DESCRIPTION_LENGTH),
    image: image.url,
    datePublished: post.date,
    ...(post.updated ? { dateModified: post.updated } : {}),
    author: {
      "@type": "Person",
      name: siteProfile.name,
      url: SITE_URL,
    },
    keywords: post.tags,
  };
}

function buildPersonJsonLd(): Record<string, unknown> {
  const sameAs: string[] = [];
  if (siteProfile.socials.github) sameAs.push(siteProfile.socials.github);
  if (siteProfile.socials.linkedin) sameAs.push(siteProfile.socials.linkedin);
  if (siteProfile.socials.twitter) sameAs.push(siteProfile.socials.twitter);

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteProfile.name,
    jobTitle: siteProfile.role,
    url: SITE_URL,
    image: absUrl(siteProfile.avatar),
    sameAs,
  };
}

interface BuildPageMetaOptions {
  page: PageType;
  post?: PostFrontmatter;
  tag?: string;
  tagCount?: number;
}

export function buildPageMeta({ page, post, tag, tagCount }: BuildPageMetaOptions): PageMeta {
  const image = resolveOgImage(post);
  const twitterSite = siteProfile.socials.twitter || undefined;

  switch (page) {
    case "home":
      return {
        title: siteProfile.name,
        description: truncate(siteProfile.bio, MAX_DESCRIPTION_LENGTH),
        url: SITE_URL,
        type: "website",
        image,
        siteName: siteProfile.name,
        locale: "en_US",
        twitterCard: "summary_large_image",
        twitterSite,
        jsonLd: buildPersonJsonLd(),
      };

    case "post": {
      if (!post) throw new Error("buildPageMeta: post required for page type 'post'");
      const description = truncate(post.summary || siteProfile.bio, MAX_DESCRIPTION_LENGTH);
      const urlPath = post.category === "talk" ? `/talks/${post.slug}` : `/posts/${post.slug}`;
      return {
        title: `${post.title} | ${siteProfile.name}`,
        description,
        url: absUrl(urlPath),
        type: "article",
        image,
        siteName: siteProfile.name,
        locale: "en_US",
        twitterCard: "summary_large_image",
        twitterSite,
        article: {
          publishedTime: post.date,
          modifiedTime: post.updated,
          author: siteProfile.name,
          tags: post.tags,
          section: post.category,
        },
        jsonLd: buildArticleJsonLd(post, image),
      };
    }

    case "tag": {
      const tagName = tag || "unknown";
      const count = tagCount ?? 0;
      return {
        title: `#${tagName} | ${siteProfile.name}`,
        description: truncate(
          `${count} post${count !== 1 ? "s" : ""} tagged with "${tagName}"`,
          MAX_DESCRIPTION_LENGTH,
        ),
        url: absUrl(`/tags/${tagName}`),
        type: "website",
        image,
        siteName: siteProfile.name,
        locale: "en_US",
        twitterCard: "summary_large_image",
        twitterSite,
      };
    }

    case "404":
      return {
        title: `Page Not Found | ${siteProfile.name}`,
        description: truncate(siteProfile.bio, MAX_DESCRIPTION_LENGTH),
        url: SITE_URL,
        type: "website",
        image,
        siteName: siteProfile.name,
        locale: "en_US",
        twitterCard: "summary",
        twitterSite,
      };
  }
}
