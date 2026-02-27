import { type Metadata } from "next";

import { PAGE_SEO, SEO_CONFIG } from "@repo/shared";

import { serverApi } from "@app/lib/api/server";
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

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const initialData = await serverApi.pages.getHome();

  return <HomePageClient initialData={initialData} />;
}
