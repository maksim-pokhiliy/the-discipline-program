import { pagesApi } from "@repo/api/server";
import { PAGE_SEO, SEO_CONFIG } from "@repo/shared";
import { Metadata } from "next";

import { ContactPageClient } from "@app/modules/contact";

export const metadata: Metadata = {
  title: PAGE_SEO.contact.title,
  description: PAGE_SEO.contact.description,
  keywords: PAGE_SEO.contact.keywords,
  openGraph: {
    title: PAGE_SEO.contact.title,
    description: PAGE_SEO.contact.description,
    url: `${SEO_CONFIG.siteUrl}/contact`,
  },
};

export default async function ContactPage() {
  const initialData = await pagesApi.getContactPage();

  return <ContactPageClient initialData={initialData} />;
}
