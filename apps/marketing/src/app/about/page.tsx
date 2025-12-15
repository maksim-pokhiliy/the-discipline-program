import { Metadata } from "next";

import { PAGE_SEO, SEO_CONFIG } from "@app/shared/constants";

export { AboutPage as default } from "@app/modules/about";

export const metadata: Metadata = {
  title: PAGE_SEO.about.title,
  description: PAGE_SEO.about.description,
  keywords: PAGE_SEO.about.keywords,
  openGraph: {
    title: PAGE_SEO.about.title,
    description: PAGE_SEO.about.description,
    url: `${SEO_CONFIG.siteUrl}/about`,
  },
};
