import { Metadata } from "next";

import { HomePage } from "@app/modules/home";
import { PAGE_SEO, SEO_CONFIG } from "@app/shared/constants/seo-config";

export const metadata: Metadata = {
  title: PAGE_SEO.home.title,
  description: PAGE_SEO.home.description,
  keywords: PAGE_SEO.home.keywords,
  openGraph: {
    title: PAGE_SEO.home.title,
    description: PAGE_SEO.home.description,
    url: SEO_CONFIG.siteUrl,
  },
};

export default HomePage;
