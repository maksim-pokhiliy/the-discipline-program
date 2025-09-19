import { Metadata } from "next";

import { ContactPage } from "@app/modules/contact";
import { PAGE_SEO, SEO_CONFIG } from "@app/shared/constants";

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

export default ContactPage;
