import { type Metadata } from "next";

import { serverApi } from "@app/lib/api/server";
import { PAGE_SEO, SEO_CONFIG } from "@app/lib/seo";
import { HomePageContent } from "@app/modules/home";

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

const HomePage = async () => {
  const data = await serverApi.pages.getHome();

  return <HomePageContent data={data} />;
};

export default HomePage;
