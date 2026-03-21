import type { PageMeta } from "@shared/schemas/meta.schema";

interface MetaTagsProps {
  meta: PageMeta;
}

export function MetaTags({ meta }: MetaTagsProps) {
  return (
    <>
      {/* Primary */}
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={meta.url} />

      {/* Open Graph */}
      <meta property="og:type" content={meta.type} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:image" content={meta.image.url} />
      <meta property="og:image:width" content={String(meta.image.width)} />
      <meta property="og:image:height" content={String(meta.image.height)} />
      <meta property="og:image:alt" content={meta.image.alt} />
      <meta property="og:url" content={meta.url} />
      <meta property="og:site_name" content={meta.siteName} />
      <meta property="og:locale" content={meta.locale} />

      {/* Twitter */}
      <meta name="twitter:card" content={meta.twitterCard} />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={meta.image.url} />
      <meta name="twitter:image:alt" content={meta.image.alt} />
      {meta.twitterSite && <meta name="twitter:site" content={meta.twitterSite} />}

      {/* Article (posts only) */}
      {meta.article && (
        <>
          <meta property="article:published_time" content={meta.article.publishedTime} />
          <meta property="article:author" content={meta.article.author} />
          <meta property="article:section" content={meta.article.section} />
          {meta.article.modifiedTime && (
            <meta property="article:modified_time" content={meta.article.modifiedTime} />
          )}
          {meta.article.tags.map((tag) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* JSON-LD */}
      {meta.jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(meta.jsonLd) }}
        />
      )}
    </>
  );
}
