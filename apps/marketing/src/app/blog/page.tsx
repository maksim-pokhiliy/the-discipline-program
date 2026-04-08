import { type Metadata } from "next";

import { serverApi } from "@app/lib/api/server";
import { PAGE_SEO, SEO_CONFIG } from "@app/lib/seo";
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

const BlogPage = async () => {
  const initialData = await serverApi.pages.getBlog();

  return <BlogPageClient initialData={initialData} />;
};

export default BlogPage;
