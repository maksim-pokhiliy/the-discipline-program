import { type Metadata } from "next";

import { PAGE_SEO, SEO_CONFIG } from "@repo/shared";

import { api } from "@app/lib/api";
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

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const initialData = await api.pages.getContact();

  return <ContactPageClient initialData={initialData} />;
}
