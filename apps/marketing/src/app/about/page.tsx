import { pagesApi } from "@repo/api/server";
import { PAGE_SEO, SEO_CONFIG } from "@repo/shared";
import { Metadata } from "next";

import { AboutPageClient } from "@app/modules/about";

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

export default async function AboutPage() {
  const initialData = await pagesApi.getAboutPage();

  return <AboutPageClient initialData={initialData} />;
}
