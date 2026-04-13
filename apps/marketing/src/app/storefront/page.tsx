import { type Metadata } from "next";

import { serverApi } from "@app/lib/api/server";
import { PAGE_SEO, SEO_CONFIG } from "@app/lib/seo";
import { StorefrontProgramsPageContent } from "@app/modules/storefront";

export const metadata: Metadata = {
  title: PAGE_SEO.storefront.title,
  description: PAGE_SEO.storefront.description,
  keywords: PAGE_SEO.storefront.keywords,
  openGraph: {
    title: PAGE_SEO.storefront.title,
    description: PAGE_SEO.storefront.description,
    url: `${SEO_CONFIG.siteUrl}/storefront`,
  },
};

export const dynamic = "force-dynamic";

const StorefrontProgramsPage = async () => {
  const data = await serverApi.pages.getStorefrontPrograms();

  return <StorefrontProgramsPageContent data={data} />;
};

export default StorefrontProgramsPage;
