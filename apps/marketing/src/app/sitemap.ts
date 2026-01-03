import { type MetadataRoute } from "next";

import { SEO_CONFIG } from "@repo/shared";

import { api } from "@app/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SEO_CONFIG.siteUrl;

  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/programs`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
  ];

  try {
    const blogData = await api.pages.getBlog();

    const blogPages = blogData.posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    return [...staticPages, ...blogPages];
  } catch {
    return staticPages;
  }
}
