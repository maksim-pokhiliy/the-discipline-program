import { type Metadata } from "next";

import { PAGE_SEO, SEO_CONFIG } from "@repo/shared";

import { serverApi } from "@app/lib/api/server";
import { StorefrontProgramsPageClient } from "@app/modules/storefront";

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

export default async function StorefrontProgramsPage() {
  const initialData = await serverApi.pages.getStorefrontPrograms();

  return <StorefrontProgramsPageClient initialData={initialData} />;
}
