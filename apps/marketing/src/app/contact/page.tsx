import { type Metadata } from "next";

import { serverApi } from "@app/lib/api/server";
import { PAGE_SEO, SEO_CONFIG } from "@app/lib/seo";
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

const ContactPage = async () => {
  const initialData = await serverApi.pages.getContact();

  return <ContactPageClient initialData={initialData} />;
};

export default ContactPage;
