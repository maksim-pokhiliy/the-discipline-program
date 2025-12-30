import { pagesApi } from "@repo/api/server";
import { PAGE_SEO, SEO_CONFIG } from "@repo/shared";
import { Metadata } from "next";

import { HomePageClient } from "@app/modules/home";

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

export default async function HomePage() {
  const initialData = await pagesApi.getHomePage();

  return <HomePageClient initialData={initialData} />;
}
