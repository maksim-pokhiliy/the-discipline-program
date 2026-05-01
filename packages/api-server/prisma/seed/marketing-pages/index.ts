import { type PrismaClient } from "@prisma/client";

import { ABOUT_SECTIONS } from "./about-sections";
import { BLOG_SECTIONS } from "./blog-sections";
import { CONTACT_SECTIONS } from "./contact-sections";
import { FAQ_SECTIONS } from "./faq-sections";
import { HOME_SECTIONS } from "./home-sections";
import { PAGES } from "./pages";
import { STOREFRONT_SECTIONS } from "./storefront-sections";
import { type SectionSeed } from "./types";

const ALL_SECTIONS: readonly SectionSeed[] = [
  ...HOME_SECTIONS,
  ...ABOUT_SECTIONS,
  ...STOREFRONT_SECTIONS,
  ...BLOG_SECTIONS,
  ...CONTACT_SECTIONS,
  ...FAQ_SECTIONS,
];

export const seedMarketingPages = async (db: PrismaClient): Promise<void> => {
  for (const page of PAGES) {
    await db.marketingPage.create({ data: page });
  }

  for (const s of ALL_SECTIONS) {
    await db.marketingPageSection.create({
      data: {
        pageSlug: s.pageSlug,
        section: s.section,
        data: structuredClone(s.data),
        isActive: true,
      },
    });
  }

  console.log(`  Pages: ${PAGES.length} with ${ALL_SECTIONS.length} sections`);
};
