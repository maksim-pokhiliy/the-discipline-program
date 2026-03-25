import { type Metadata } from "next";

import { PAGE_SEO, SEO_CONFIG } from "@repo/shared";

import { serverApi } from "@app/lib/api/server";
import { FaqPageClient } from "@app/modules/faq";

export const metadata: Metadata = {
  title: PAGE_SEO.faq.title,
  description: PAGE_SEO.faq.description,
  keywords: PAGE_SEO.faq.keywords,
  openGraph: {
    title: PAGE_SEO.faq.title,
    description: PAGE_SEO.faq.description,
    url: `${SEO_CONFIG.siteUrl}/faq`,
  },
};

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const initialData = await serverApi.pages.getFaq();

  return <FaqPageClient initialData={initialData} />;
}
