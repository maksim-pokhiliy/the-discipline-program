import { Metadata } from "next";

import { BlogPage } from "@app/modules/blog";
import { PAGE_SEO, SEO_CONFIG } from "@app/shared/constants/seo-config";

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

export default BlogPage;
