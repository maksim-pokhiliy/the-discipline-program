import { generateSEOData, PageSeoKey } from "@repo/shared";
import Head from "next/head";

export const SEOHead = (props: PageSeoKey) => {
  const seoData = generateSEOData(props);

  return (
    <Head>
      <title>{seoData.title}</title>
      <meta name="description" content={seoData.description} />
      <meta name="keywords" content={seoData.keywords.join(",")} />

      {seoData.canonical && <link rel="canonical" href={seoData.canonical} />}

      <meta name="robots" content={seoData.noIndex ? "noindex,nofollow" : "index,follow"} />

      <meta property="og:type" content={seoData.ogType} />
      <meta property="og:title" content={seoData.title} />
      <meta property="og:description" content={seoData.description} />
      <meta property="og:image" content={seoData.ogImage} />
      <meta property="og:url" content={seoData.canonical || seoData.siteUrl} />
      <meta property="og:site_name" content={seoData.siteName} />

      {seoData.article && (
        <>
          <meta property="article:published_time" content={seoData.article.publishedTime} />

          {seoData.article.modifiedTime && (
            <meta property="article:modified_time" content={seoData.article.modifiedTime} />
          )}

          {seoData.article.author && (
            <meta property="article:author" content={seoData.article.author} />
          )}

          {seoData.article.section && (
            <meta property="article:section" content={seoData.article.section} />
          )}

          {seoData.article.tags?.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={seoData.twitterHandle} />
      <meta name="twitter:title" content={seoData.title} />
      <meta name="twitter:description" content={seoData.description} />
      <meta name="twitter:image" content={seoData.ogImage} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#FF4B4B" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
};
