import { SEO_CONFIG } from "./seo";
import { PAGE_SEO, type PageSeoKey } from "./seo-page";

export type SEOData = {
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  siteUrl: string;
  ogType: string;
  ogImage: string;
  siteName: string;
  twitterHandle?: string;
  noIndex?: boolean;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
};

export const generateSEOData = (pageSeoKey: PageSeoKey): SEOData => {
  const pageSeo = PAGE_SEO[pageSeoKey];

  return {
    title: pageSeo.title,
    description: pageSeo.description,
    keywords: pageSeo.keywords,
    canonical: SEO_CONFIG.siteUrl,
    siteUrl: SEO_CONFIG.siteUrl,
    ogType: "website",
    ogImage: SEO_CONFIG.defaultOgImage,
    siteName: SEO_CONFIG.siteName,
    twitterHandle: SEO_CONFIG.twitterHandle,
    noIndex: false,
  };
};
