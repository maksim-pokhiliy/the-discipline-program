import { type Metadata } from "next";

import { serverApi } from "@app/lib/api/server";
import { PAGE_SEO, SEO_CONFIG } from "@app/lib/seo";
import { FaqPageContent } from "@app/modules/faq";

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

const FaqPage = async () => {
  const data = await serverApi.pages.getFaq();

  return <FaqPageContent data={data} />;
};

export default FaqPage;
