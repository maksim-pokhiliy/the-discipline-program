import { type MetadataRoute } from "next";

import { logger } from "@repo/shared";

import { serverApi } from "@app/lib/api/server";
import { SEO_CONFIG } from "@app/lib/seo";

const baseUrl = SEO_CONFIG.siteUrl;

const SITE_LAUNCH_DATE = new Date("2025-01-01");

const staticPages: MetadataRoute.Sitemap = [
  {
    url: baseUrl,
    lastModified: SITE_LAUNCH_DATE,
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    url: `${baseUrl}/storefront`,
    lastModified: SITE_LAUNCH_DATE,
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    url: `${baseUrl}/about`,
    lastModified: SITE_LAUNCH_DATE,
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    url: `${baseUrl}/blog`,
    lastModified: SITE_LAUNCH_DATE,
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    url: `${baseUrl}/contact`,
    lastModified: SITE_LAUNCH_DATE,
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    url: `${baseUrl}/faq`,
    lastModified: SITE_LAUNCH_DATE,
    changeFrequency: "monthly",
    priority: 0.6,
  },
];

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  try {
    const blogData = await serverApi.pages.getBlog();

    const blogPages = blogData.posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    return [...staticPages, ...blogPages];
  } catch (error) {
    logger.warn("marketing.sitemap.blog_fetch_failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    return staticPages;
  }
};

export default sitemap;
