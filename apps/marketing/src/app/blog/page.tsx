import { Metadata } from "next";

import { PAGE_SEO, SEO_CONFIG } from "@app/shared/constants";

export { BlogPage as default } from "@app/modules/blog";

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
