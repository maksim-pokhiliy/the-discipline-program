import { pagesApi } from "@repo/api/server";
import { PAGE_SEO, SEO_CONFIG } from "@repo/shared";
import { Metadata } from "next";

import { BlogPageClient } from "@app/modules/blog";

export const metadata: Metadata = {
  title: PAGE_SEO.blog.title,
  description: PAGE_SEO.blog.description,
  keywords: PAGE_SEO.blog.keywords,
  openGraph: {
    title: PAGE_SEO.blog.title,
    description: PAGE_SEO.blog.description,
    url: `${SEO_CONFIG.siteUrl}/blog`,
  },
};

export default async function BlogPage() {
  const initialData = await pagesApi.getBlogPage();

  return <BlogPageClient initialData={initialData} />;
}
