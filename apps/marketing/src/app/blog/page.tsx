import { type Metadata } from "next";

import { PAGE_SEO, SEO_CONFIG } from "@repo/shared";

import { serverApi } from "@app/lib/api/server";
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

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const initialData = await serverApi.pages.getBlog();

  return <BlogPageClient initialData={initialData} />;
}
